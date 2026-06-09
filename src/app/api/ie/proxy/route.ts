import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 2_000_000;

const isPrivateIp = (address: string) => {
    if (address === "::1") return true;

    if (address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80")) return true;

    const parts = address.split(".").map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

    const [a, b] = parts;
    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
    );
};

const validatePublicHttpUrl = async (rawUrl: string) => {
    const targetUrl = new URL(rawUrl);

    if (!["http:", "https:"].includes(targetUrl.protocol)) {
        throw new Error("Unsupported protocol");
    }

    const hostname = targetUrl.hostname.toLowerCase();
    if (hostname === "localhost" || hostname.endsWith(".local")) {
        throw new Error("Blocked host");
    }

    if (isIP(hostname)) {
        if (isPrivateIp(hostname)) throw new Error("Blocked address");
        return targetUrl;
    }

    const addresses = await lookup(hostname, { all: true, verbatim: false });
    if (addresses.some((entry) => isPrivateIp(entry.address))) {
        throw new Error("Blocked address");
    }

    return targetUrl;
};

const injectIeCompatHelpers = (html: string, finalUrl: string) => {
    const baseTag = `<base href="${finalUrl}">`;
    const navigationScript = `
<script>
(() => {
  const toProxyUrl = (value) => {
    try {
      const nextUrl = new URL(value, document.baseURI || location.href);
      if (!/^https?:$/.test(nextUrl.protocol)) return value;
      return "/api/ie/proxy?url=" + encodeURIComponent(nextUrl.href);
    } catch {
      return value;
    }
  };

  document.addEventListener("click", (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
    event.preventDefault();
    location.href = toProxyUrl(href);
  }, true);
})();
</script>`;

    const withoutMetaCsp = html.replace(/<meta[^>]+http-equiv=["']content-security-policy["'][^>]*>/gi, "");

    if (/<head[^>]*>/i.test(withoutMetaCsp)) {
        return withoutMetaCsp.replace(/<head([^>]*)>/i, `<head$1>${baseTag}${navigationScript}`);
    }

    return `${baseTag}${navigationScript}${withoutMetaCsp}`;
};

export async function GET(request: NextRequest) {
    const rawUrl = request.nextUrl.searchParams.get("url");

    if (!rawUrl) {
        return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let targetUrl: URL;
    try {
        targetUrl = await validatePublicHttpUrl(rawUrl);
    } catch {
        return NextResponse.json({ error: "Blocked url" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const upstream = await fetch(targetUrl, {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "user-agent": "Mozilla/5.0 (Windows NT 5.1; rv:45.0) Gecko/20100101 Firefox/45.0",
            },
            redirect: "follow",
            signal: controller.signal,
        });

        const contentType = upstream.headers.get("content-type") || "application/octet-stream";

        if (!contentType.includes("text/html")) {
            const body = await upstream.arrayBuffer();
            return new NextResponse(body, {
                status: upstream.status,
                headers: {
                    "cache-control": "public, max-age=300",
                    "content-type": contentType,
                },
            });
        }

        const contentLength = Number(upstream.headers.get("content-length") || 0);
        if (contentLength > MAX_HTML_BYTES) {
            return NextResponse.json({ error: "Page too large" }, { status: 413 });
        }

        const html = await upstream.text();
        const proxiedHtml = injectIeCompatHelpers(html.slice(0, MAX_HTML_BYTES), upstream.url || targetUrl.href);

        return new NextResponse(proxiedHtml, {
            status: upstream.status,
            headers: {
                "cache-control": "no-store",
                "content-type": "text/html; charset=utf-8",
            },
        });
    } catch {
        return NextResponse.json({ error: "Unable to load page" }, { status: 502 });
    } finally {
        clearTimeout(timeout);
    }
}
