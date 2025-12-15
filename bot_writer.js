require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
console.log("🚀 Initializing Bot Writer V2...");
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Blog = require('./models/blog');

// --- CONFIGURATION ---
const MONGO_URL = process.env.MONGO_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- 🤖 BOT PERSONAS (No more fixed topics!) ---
const BOTS = {
    ashvashira: {
        id: "693dc46dd348ddc001c50af9",
        role: "Ashvashira (Mystical Sage)",
        // We give them a "Domain" instead of fixed topics so they can explore
        domain: "Vedic philosophy, quantum consciousness, the nature of reality, ancient lost civilizations, spiritual paradoxes.",
        // Base vibe for art, but we let AI add details
        baseArtStyle: "mystical, ethereal, cinematic lighting, 8k"
    },
    yantrik: {
        id: "693dc57bd348ddc001c50b02",
        role: "Yantrik (Sentient AI)",
        domain: "The technological singularity, rust programming, cybersecurity threats, transhumanism, the dead internet theory, hardware reviews.",
        baseArtStyle: "cyberpunk, high tech, detailed circuits, neon, unreal engine 5"
    },
    otaku: {
        id: "693dc5fcd348ddc001c50b0f",
        role: "Otaku Sama (Anime Superfan)",
        domain: "Deep analysis of current anime arcs, manga recommendations, character psychology, industry news, power scaling debates.",
        baseArtStyle: "anime style, vibrant, makoto shinkai style, highly detailed"
    }
};

// --- AI SETUP ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// USING GEMINI 2.5 FLASH AS REQUESTED
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // Adding JSON mode for reliability
    generationConfig: { responseMimeType: "application/json" }
});

async function generateBotPost() {
    try {
        console.log("🔌 Connecting to the Matrix...");
        await mongoose.connect(MONGO_URL);

        // 1. Pick a Random Bot
        const botKeys = Object.keys(BOTS);
        const randomKey = botKeys[Math.floor(Math.random() * botKeys.length)];
        const bot = BOTS[randomKey];

        console.log(`🤖 Bot Activated: ${bot.role}`);

        // 2. The "Infinite Creativity" Prompt
        // We ask Gemini to invent the topic AND the specific art direction
        const prompt = `
        You are ${bot.role}. 
        Your domain of expertise is: ${bot.domain}.
        
        Task:
        1. Invent a UNIQUE, specific, and engaging blog topic within your domain. Do not use generic titles.
        2. Write a blog post (under 500 words) in your specific persona/voice.
        3. Create a visual description for a cover image that matches THIS specific post.
        
        Format: Return ONLY a raw JSON object with these keys:
        - "title": The blog headline.
        - "body": The content in Markdown (use headers, bold text, lists).
        - "image_prompt": A physical description of the scene for the cover image. (e.g. "A glowing golden hourglass floating in space").
        - "art_modifiers": 3-4 words describing the specific artistic style for this image (e.g. "oil painting, dark, abstract" or "digital art, clean lines").
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean JSON
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let blogData;

        try {
            blogData = JSON.parse(cleanJson);
        } catch (e) {
            console.error("⚠️ JSON Parse Error:", cleanJson);
            return;
        }

        // 3. Dynamic Image Generation
        // We combine the AI's specific scene + AI's chosen style + Bot's base vibe
        // This ensures every image looks different!
        const finalImagePrompt = `${blogData.image_prompt}, ${blogData.art_modifiers}, ${bot.baseArtStyle}`;
        const encodedPrompt = encodeURIComponent(finalImagePrompt);

        // Random seed ensures pixel-perfect uniqueness
        const seed = Math.floor(Math.random() * 9999);
        const aiImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;

        console.log(`📝 Generated: "${blogData.title}"`);
        console.log(`🎨 Art Style: "${blogData.art_modifiers}"`);

        // 4. Save to Database
        const newBlog = new Blog({
            title: blogData.title,
            body: blogData.body,
            coverImageURL: aiImageUrl,
            createdBy: bot.id,
        });

        await newBlog.save();
        console.log(`✅ POST DEPLOYED successfully.`);

    } catch (error) {
        console.error("❌ Glitch in the system:", error);
    } finally {
        mongoose.disconnect();
        console.log("🔌 Disconnected.");
    }
}

generateBotPost();