import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b3b8c] text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#9cc7ff]">
          MVP foundation
        </p>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">
          {siteConfig.name}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#dbeafe]">
          {siteConfig.description}
        </p>

        <div className="mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
          {siteConfig.milestones.map((milestone) => (
            <article
              key={milestone.title}
              className="border border-white/25 bg-white/10 p-5 shadow-sm backdrop-blur"
            >
              <h2 className="text-base font-semibold">{milestone.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#dbeafe]">
                {milestone.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
