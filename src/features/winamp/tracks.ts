import type { Track } from "webamp";

const musicBaseUrl = "/winamp/music";

const urlFor = (fileName: string) => encodeURI(`${musicBaseUrl}/${fileName}`);

export const winampTracks: Track[] = [
    {
        defaultName: "Avril Lavigne - Sk8er Boi",
        metaData: { artist: "Avril Lavigne", title: "Sk8er Boi" },
        url: urlFor("Avril Lavigne - Sk8er Boi.mp3"),
    },
    {
        defaultName: "Blink-182 - I Miss You",
        metaData: { artist: "Blink-182", title: "I Miss You" },
        url: urlFor("Blink-182 - I Miss You.mp3"),
    },
    {
        defaultName: "Evanescence - Bring Me To Life",
        metaData: { artist: "Evanescence", title: "Bring Me To Life" },
        url: urlFor("Evanescence - Bring Me To Life.mp3"),
    },
    {
        defaultName: "Linkin Park - Numb",
        metaData: { artist: "Linkin Park", title: "Numb" },
        url: urlFor("linkin park - numb.mp3"),
    },
    {
        defaultName: "My Chemical Romance - Helena",
        metaData: { artist: "My Chemical Romance", title: "Helena" },
        url: urlFor("My Chemical Romance - Helena.mp3"),
    },
    {
        defaultName: "Simple Plan - Welcome to My Life",
        metaData: { artist: "Simple Plan", title: "Welcome to My Life" },
        url: urlFor("Simple Plan - Welcome to My Life.mp3"),
    },
    {
        defaultName: "System of a Down - Chop Suey",
        metaData: { artist: "System of a Down", title: "Chop Suey" },
        url: urlFor("System of a Down - Chop Suey.mp3"),
    },
    {
        defaultName: "System of a Down - Toxicity",
        metaData: { artist: "System of a Down", title: "Toxicity" },
        url: urlFor("System of a Down - Toxicity.mp3"),
    },
];
