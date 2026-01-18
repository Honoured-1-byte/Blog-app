const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// Import the bot writer logic (Assuming I can require it, or I will copy the core logic)
// Since bot_writer.js executes immediately upon require, we can't just require it multiple times in a loop easily
// without modifiying it.
// Instead, I will spawn it as a child process which is safer and cleaner for "running a script" multiple times.

const { spawn } = require('child_process');
const path = require('path');

const TOTAL_RUNS = 10;
const INTERVAL_MS = 15000; // 15 seconds between runs to be safe with APIs

console.log(`🚀 Starting Bot Marathon: ${TOTAL_RUNS} runs with ${INTERVAL_MS / 1000}s intervals.`);

function runBotScript(runCount) {
    return new Promise((resolve, reject) => {
        console.log(`\n▶️  [Run ${runCount}/${TOTAL_RUNS}] Launching bot_writer.js...`);

        const botProcess = spawn('node', ['bot_writer.js'], {
            cwd: __dirname,
            stdio: 'inherit' // Pipe output directly to console so user can see it
        });

        botProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ [Run ${runCount}] Completed successfully.`);
                resolve();
            } else {
                console.error(`❌ [Run ${runCount}] Failed with code ${code}`);
                resolve(); // Resolve anyway to keep the loop going
            }
        });
    });
}

async function startMarathon() {
    for (let i = 1; i <= TOTAL_RUNS; i++) {
        await runBotScript(i);

        if (i < TOTAL_RUNS) {
            console.log(`⏳ Waiting ${INTERVAL_MS / 1000}s before next run...`);
            await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
        }
    }
    console.log("\n🏁 Bot Marathon Completed!");
}

startMarathon();
