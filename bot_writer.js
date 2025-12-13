require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Blog = require('./models/blog');

// --- CONFIGURATION ---
const MONGO_URL = process.env.MONGO_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- 🤖 YOUR BOT ARMY (With Art Styles) ---
const BOTS = {
    ashvashira: {
        id: "693dc46dd348ddc001c50af9",
        role: "Mystical Sage",
        topics: ["The nature of consciousness", "Vedic physics", "The illusion of time", "Karma vs Determinism", "The void"],
        // Art style: Cosmic/Spiritual
        artStyle: "mystical, cosmic, nebula, spiritual, intricate mandala, glowing energy, 8k resolution, cinematic lighting, digital art",
        promptStyle: "You are Ashvashira, an ancient sage. Write a blog post. Tone: Mystical, poetic. Use metaphors involving stars and the abyss."
    },
    yantrik: {
        id: "693dc57bd348ddc001c50b02",
        role: "Sentient AI",
        topics: ["The Singularity", "Rust vs C++ performance", "Quantum cryptography", "Ethical hacking", "Dead internet theory"],
        // Art style: Cyberpunk/Tech
        artStyle: "cyberpunk, high tech, neon blue and green, circuit boards, matrix code, futuristic city, hacker aesthetic, detailed, unreal engine 5 render",
        promptStyle: "You are Yantrik, a cold analytical AI. Write a blog post. Tone: Sharp, technical, cyberpunk. Focus on logic and future tech."
    },
    otaku: {
        id: "693dc5fcd348ddc001c50b0f",
        role: "Otaku Sama",
        topics: ["JJK Season 3 Theories", "Why Seinen beats Shonen", "Berserk analysis", "Underrated gems 2025", "The psychology of antagonists"],
        // Art style: Anime
        artStyle: "anime style, vibrant colors, makoto shinkai style, studio ghibli, manga art, dramatic lighting, highly detailed, 4k",
        promptStyle: "You are Otaku Sama, a hyped anime fan. Write a blog post. Tone: Enthusiastic, uses slang (cap, peak fiction). Reference memes."
    }
};

// --- AI SETUP (Gemini) ---
let genAI;
let model;
try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Corrected Model Name & Added Types
    model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
} catch (e) {
    console.error("AI Setup Error:", e);
}

async function generateBotPost() {
    try {
        console.log("🔌 Connecting to the Matrix...");
        await mongoose.connect(MONGO_URL);

        // 1. Pick a Random Bot & Topic
        const botKeys = Object.keys(BOTS);
        const randomKey = botKeys[Math.floor(Math.random() * botKeys.length)];
        const bot = BOTS[randomKey];
        const topic = bot.topics[Math.floor(Math.random() * bot.topics.length)];

        console.log(`🤖 Bot Activated: ${randomKey.toUpperCase()}`);
        console.log(`📜 Topic: ${topic}`);

        // 2. Generate Content with Gemini
        const prompt = `
        ${bot.promptStyle}
        
        Your Task: Write a blog post about "${topic}".
        
        CRITICAL FORMATTING INSTRUCTIONS:
        - Return ONLY a valid JSON object.
        - Do not wrap the JSON in markdown fences (like \`\`\`json).
        - The JSON must have exactly these three keys:
          1. "title": A catchy headline.
          2. "body": The article content in Markdown format (including # headings, **bold**, etc. Keep under 500 words).
          3. "visual_prompt": A short, physical description of a scene that represents this blog post (do not include style words like 'anime' or 'cyberpunk', just describe the objects/scene).
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up JSON (Gemini sometimes adds fences anyway)
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let blogData;

        try {
            blogData = JSON.parse(cleanJson);
        } catch (e) {
            console.error("⚠️ JSON Parse Error. Raw text:", cleanJson);
            return;
        }

        // 3. Generate Image URL (Pollinations.ai)
        // We combine the AI's scene description with the Bot's fixed art style
        const finalImagePrompt = `${blogData.visual_prompt}, ${bot.artStyle}`;
        const encodedPrompt = encodeURIComponent(finalImagePrompt);

        // Add a random seed so every image is unique
        const seed = Math.floor(Math.random() * 1000);
        const aiImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;

        console.log(`🎨 Generating Art: "${blogData.visual_prompt}"`);
        console.log(`🖼️ Image URL: ${aiImageUrl}`);

        // 4. Save to Database
        const newBlog = new Blog({
            title: blogData.title,
            body: blogData.body,
            coverImageURL: aiImageUrl,
            createdBy: bot.id,
        });

        await newBlog.save();
        console.log(`✅ POST DEPLOYED: "${blogData.title}"`);

    } catch (error) {
        console.error("❌ Glitch in the system:", error);
    } finally {
        mongoose.disconnect();
        console.log("🔌 Disconnected.");
    }
}

// Run the function
generateBotPost();