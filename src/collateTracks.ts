import chalk from 'chalk';

export const STATIONS = {
    lofi: "lofi study chill",
    cafe: "coffee jazz cafe",
    rain: "ambient rain calm",
    focus: "focus instrumental",
};

export async function collateTracks(station: Station) {
    const FETCH_TRACKS_REQUEST_URL = `https://api.jamendo.com/v3.0/tracks/?client_id=${process.env.JAMENDO_API_KEY}&search=${encodeURIComponent(STATIONS[station])}&durationbetween=0_40&format=json&limit=10`;

    const response = await fetch(FETCH_TRACKS_REQUEST_URL);
    const data: FetchTracksResp = await response.json();

    if (!data) {
        console.log(chalk.red("No tracks available for the requested genre"));
        throw new Error("No tracks available for the requested genre");
    }

    const tracks = data.results.map(r => ({
        album_name: r.album_name,
        artist_name: r.artist_name,
        audio: r.audio,
        name: r.name,
    }));

    return shuffled<Track>(tracks);
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
    results: Array<Track>
};