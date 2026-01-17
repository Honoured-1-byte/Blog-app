const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const logFile = 'debug_output.txt';

function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
}

log('Starting debug script...');
log('MONGO_URL exists: ' + (!!process.env.MONGO_URL));

if (!process.env.MONGO_URL) {
    log('MONGO_URL is missing!');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        log('DB Connection Successful!');
        mongoose.connection.close();
    })
    .catch(err => {
        log('DB Connection Failed: ' + err.message);
    });
