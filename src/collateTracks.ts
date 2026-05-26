import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import chalk from 'chalk';

export const STATIONS = {
    lofi: "lofi study chill",
    cafe: "coffee jazz cafe",
    rain: "ambient rain calm",
    focus: "focus instrumental",
};

export async function collateTracks(station: Station, override: string | undefined) {
    const FETCH_TRACKS_REQUEST_URL = `https://api.jamendo.com/v3.0/tracks/?client_id=${getClientId()}&search=${encodeURIComponent(override || STATIONS[station])}&durationbetween=0_300&format=json&limit=20`;
    const response = await fetch(FETCH_TRACKS_REQUEST_URL);
    const data: FetchTracksResp = await response.json();

    if (data.headers.status === "failed") {
        throw new Error("Error fetching the tracks from Jamendo API. Please check your API key set in config and try again.");
    }

    const tracks = data.results.map(r => ({
        album_name: r.album_name,
        artist_name: r.artist_name,
        audio: r.audio,
        name: r.name,
    }));

    return shuffled<Track>(tracks);
}


function getClientId() {
    if (process.env.JAMENDO_CLIENT_ID) {
        return process.env.JAMENDO_CLIENT_ID;
    }

    const configPath = path.join(os.homedir(), ".workfm", "config.json");

    try {
        const config = fs.readFileSync(configPath, "utf-8");
        const parsed = JSON.parse(config);
        return parsed.JAMENDO_CLIENT_ID;
    } catch (error) {
        console.log(chalk.red("API KEY NOT SET. PLEASE SET IT USING THE `workfm config set <JAMENDO_CLIENT_ID>` COMMAND"));
        throw error;
    }
}

function shuffled<T>(array: T[]) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

export type Station = keyof typeof STATIONS;

type Track = {
    album_name: string,
    artist_name: string,
    audio: string;
    name: string;
}

type FetchTracksResp = {
    headers: {
        status: "success" | "failed";
    };
    results: Array<Track>
};