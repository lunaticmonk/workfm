import { Readable } from "node:stream";


export async function load(track: string) {
    const audioResponse = await fetch(track);
    if (!audioResponse.body) {
        throw new Error("Error fetching the audio track");
    }

    return Readable.fromWeb(audioResponse.body as any);
}