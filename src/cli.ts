#!/usr/bin/env node

import { load } from './loadStream';
import { play } from './playStream';
import { collateTracks, Station, STATIONS } from "./collateTracks";
import chalk from 'chalk';

async function main() {
    const [stationArg] = process.argv.slice(2);
    const station = stationArg && stationArg in STATIONS ? (stationArg as Station) : "lofi";
    const allTracks = await collateTracks(station);

    console.log(chalk.white.bold.bgBlue("RADIO PLAYLIST "));
    console.log(chalk.cyan(`Station:`), chalk.bold(station));
    console.log(chalk.gray("----------------------------------------"));

    for (const track of allTracks) {
        const trackInfo = `Track: ${chalk.bold(track.name)}\nAlbum: ${chalk.italic(track.album_name)}\nArtist: ${chalk.underline(track.artist_name)}`;
        console.log(chalk.green.bold("NOW PLAYING"));
        console.log(trackInfo);
        console.log(chalk.gray("----------------------------------------"));

        try {
            const stream = await load(track.audio);
            await play(stream, track.name);
        } catch (error) {
            continue;
        }
    }
}

main().then(() => {
    console.log(chalk.white.bold.bgGreen("DONE PLAYING THE TRACKS, RESTART TO PLAY MORE"));
}).catch((_) => {
    console.log(chalk.red("CALL THE AMBULANCE, ERROR PLAYING THE TRACKS"));
});