require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('./models/blog'); // Ensure this path matches your model location

// 1. CONFIGURATION
const MONGO_URI = process.env.MONGO_URL; // Make sure your .env has this
const POLLINATIONS_TOKEN = process.env.POLLINATIONS_TOKEN; // Make sure your .env has this

if (!POLLINATIONS_TOKEN) {
    console.error("❌ Error: POLLINATIONS_TOKEN is missing from .env file.");
    process.exit(1);
}

const fixImages = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB.");

        // 2. FIND ALL BLOGS WITH POLLINATIONS IMAGES
        const blogs = await Blog.find({ coverImageURL: { $regex: 'pollinations.ai' } });
        console.log(`🔍 Found ${blogs.length} blogs with AI images.`);

        let fixedCount = 0;

        for (const blog of blogs) {
            let url = blog.coverImageURL;

            // 3. CHECK IF TOKEN IS MISSING
            if (!url.includes('token=')) {
                // Append the token to the URL
                if (url.includes('?')) {
                    blog.coverImageURL = `${url}&token=${POLLINATIONS_TOKEN}`;
                } else {
                    blog.coverImageURL = `${url}?token=${POLLINATIONS_TOKEN}`;
                }

                // 4. SAVE THE FIX
                await blog.save();
                process.stdout.write('.'); // Show progress
                fixedCount++;
            }
        }

        console.log(`\n\n🎉 SUCCESS! Rescued ${fixedCount} images.`);
        console.log("👉 The 'Rate Limit' QR codes should now turn back into real art.");

    } catch (err) {
        console.error("❌ Script Error:", err);
    } finally {
        mongoose.connection.close();
    }
};

fixImages();