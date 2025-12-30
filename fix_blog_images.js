require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Blog = require('./models/blog');

const MONGO_URL = process.env.MONGO_URL;
const POLLINATIONS_TOKEN = process.env.POLLINATIONS_TOKEN;

async function fixBlogImages() {
    try {
        console.log("🔌 Connecting to DB...");
        await mongoose.connect(MONGO_URL);

        if (!POLLINATIONS_TOKEN) {
            console.error("❌ NO POLLINATIONS_TOKEN FOUND IN .env! Cannot fix images.");
            return;
        }

        console.log("🔍 Scanning for broken blog images...");
        const blogs = await Blog.find({ coverImageURL: { $regex: 'pollinations.ai' } });

        let fixedCount = 0;
        for (const blog of blogs) {
            // Check if token is already present
            if (!blog.coverImageURL.includes('&token=')) {

                // Append the token
                const newUrl = `${blog.coverImageURL}&token=${POLLINATIONS_TOKEN}`;

                // Update and Save
                blog.coverImageURL = newUrl;
                await blog.save();

                console.log(`✅ Fixed: "${blog.title}"`);
                fixedCount++;
            }
        }

        if (fixedCount === 0) {
            console.log("✨ All Pollinations images already have tokens (or no Pollinations images found).");
        } else {
            console.log(`🎉 Successfully fixed ${fixedCount} blog images!`);
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected.");
    }
}

fixBlogImages();
