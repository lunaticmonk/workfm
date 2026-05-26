import { spawn } from "node:child_process";
import { Readable } from "node:stream";

export async function play(readStream: Readable, track: string) {
    return new Promise<void>((resolve, reject) => {
        const player = spawn("ffplay", [
            "-nodisp",
            "-autoexit",
            "-i",
            "pipe:0"
        ], {
            stdio: ["pipe", "ignore", "ignore"],
        });

        const cleanup = () => {
            if (!player.killed) {
                player.kill("SIGKILL");
            }
        };

        const handleError = (error: Error) => {
            cleanup();
            reject(error);
        };

        player.on("error", handleError);
        player.stdin.on("error", handleError);
        readStream.on("error", handleError);

        player.on("close", (code) => {
            if (code !== 0) {
                return reject(new Error(`ffplay exited with code ${code}`));
            }
            resolve();
        });

        readStream.pipe(player.stdin);
    });
}