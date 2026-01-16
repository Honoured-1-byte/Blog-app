require('dotenv').config();
console.log("Diag: Starting...");
console.log("Diag: PWD =", process.cwd());
console.log("Diag: GEMINI_API_KEY type =", typeof process.env.GEMINI_API_KEY);
console.log("Diag: GEMINI_API_KEY length =", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
console.log("Diag: MONGO_URL type =", typeof process.env.MONGO_URL);

try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    console.log("Diag: @google/generative-ai loaded.");
} catch (e) {
    console.error("Diag: Failed to load @google/generative-ai", e.message);
}

try {
    const mongoose = require('mongoose');
    console.log("Diag: mongoose loaded.");
} catch (e) {
    console.error("Diag: Failed to load mongoose", e.message);
}

console.log("Diag: Finished.");
