#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import chalk from 'chalk';
import sade from 'sade';

import { collateTracks } from "./collateTracks";
import { STATIONS, DEFAULT_STATION } from './constants';
import { load } from './loadStream';
import { play } from './playStream';

// Define the CLI
const prog = sade('workfm');
prog
    .command('config set <JAMENDO_CLIENT_ID>')
    .describe('Sets the Jamendo Client ID in the global configs (to be run only once)')
    .action((JAMENDO_CLIENT_ID: string) => {
        const configPath = path.resolve(os.homedir(), ".workfm", 'config.json');

        if (!fs.existsSync(configPath)) {
            fs.mkdirSync(path.dirname(configPath), { recursive: true });
        } else {
            console.log(chalk.bold("CONFIG SEEMS TO BE ALREADY PRESENT, OVERWRITING IT."));
        }

        fs.writeFileSync(configPath, JSON.stringify({ JAMENDO_CLIENT_ID: JAMENDO_CLIENT_ID }));
        console.log(chalk.bold("WOOHOO. API KEY IS SET!"));
    });
prog
    .command('play [station]', 'Play a radio station of your choice', { default: true })
    .option('-s, --search', 'Search for any music based on the keywords')
    .example('workfm cafe')
    .example('workfm -s "jazz music"')
    .action(async (station: string | undefined, opts: { search?: string }) => {
        assertApiKey();
        try {
            await handlePlay(station, opts?.search);
            console.log(chalk.white.bold.bgGreen("DONE PLAYING THE TRACKS, RESTART TO PLAY MORE"));
        } catch (err) {
            console.log(chalk.red("CALL THE AMBULANCE: ", err instanceof Error ? err.message : "UNKNOWN ERROR"));
        }
    });
prog
    .command('show stations', 'Show available radio stations', { default: true })
    .action(() => {
        console.log(chalk.white.bold.bgBlue("AVAILABLE STATIONS:"));
        STATIONS.forEach((key) => {
            console.log(`- ${chalk.bold(key)}`);
        });
    });
prog.parse(process.argv);

async function handlePlay(stationArg: string | undefined, search: string | undefined) {
    const isStationValid = stationArg && STATIONS.includes(stationArg);
    if (!isStationValid && !search) {
        console.log(chalk.yellow(`Provided station ${stationArg} not found, playing the fallback default station: ${DEFAULT_STATION}`));
    }

    const station = !isStationValid ? DEFAULT_STATION : stationArg;
    const allTracks = await collateTracks(station, search);

    console.log(chalk.white.bold.bgBlue("WORKFM PLAYLIST "));
    console.log(chalk.cyan(`Station:`), chalk.bold(station));
    console.log(chalk.gray("----------------------------------------"));

    for (let i = 0; i < allTracks.length; i++) {
        const track = allTracks[i];
        const next = allTracks[i + 1];
        const trackInfo = `Track: ${chalk.bold(track.name)}\nArtist: ${chalk.bold(track.artist_name)}\nAlbum: ${chalk.bold(track.album_name)}`;
        console.log(chalk.green.bold("NOW PLAYING"));
        console.log(trackInfo);
        if (next) {
            console.log(chalk.gray(`Up next: ${chalk.bold(next.name)} — ${next.artist_name}`));
        }
        console.log(chalk.gray("----------------------------------------"));

        try {
            const stream = await load(track.audio);
            await play(stream, track.name);
        } catch (error) {
            continue;
        }
    }
}

function assertApiKey() {
    const configPath = path.join(os.homedir(), ".workfm", "config.json");
    try {
        const config = fs.readFileSync(configPath, "utf-8");
        const parsed = JSON.parse(config);
        if (!parsed?.JAMENDO_CLIENT_ID) {
            throw new Error("API KEY NOT SET PROPERLY. PLEASE CHECK THE CONFIG IN ~/.workfm/config.json");
        }
    } catch (error) {
        const err = error as NodeJS.ErrnoException | undefined;
        if (err?.code === "ENOENT") {
            console.log(chalk.red("CONFIG NOT FOUND. PLEASE SET YOUR JAMENDO API KEY USING `workfm config set <JAMENDO_CLIENT_ID>`"));
            process.exit(1);
        }
        throw error;
    }
}
