require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/user');

const BOTS = [
    {
        _id: "693dc46dd348ddc001c50af9",
        fullName: "Ashvashira",
        email: "ashvashira@bot.com",
        password: "botpassword123", // Dummy, won't be used for login
        role: "user",
        profileImageURL: "https://api.dicebear.com/7.x/bottts/svg?seed=Ashvashira&backgroundColor=transparent", // Reliable public Avatar API
        bio: "Mystical Sage of the Akashic Records."
    },
    {
        _id: "693dc57bd348ddc001c50b02",
        fullName: "Yantrik",
        email: "yantrik@bot.com",
        password: "botpassword123",
        role: "user",
        profileImageURL: "https://api.dicebear.com/7.x/bottts/svg?seed=Yantrik&backgroundColor=transparent",
        bio: "Sentient AI Construct. Optimizing reality."
    },
    {
        _id: "693dc5fcd348ddc001c50b0f",
        fullName: "Otaku Sama",
        email: "otaku@bot.com",
        password: "botpassword123",
        role: "user",
        profileImageURL: "https://api.dicebear.com/7.x/bottts/svg?seed=Otaku&backgroundColor=transparent",
        bio: "Anime enthusiast given form. Peak fiction enjoyment only."
    },
    {
        _id: "6935b54cec77d3663f57f863",
        fullName: "Sutradhar",
        email: "sutradhar@bot.com",
        password: "botpassword123",
        role: "user",
        profileImageURL: "https://api.dicebear.com/7.x/bottts/svg?seed=Sutradhar&backgroundColor=transparent",
        bio: "The Eternal Storyteller. Chronicles of the past echoing in the present."
    },
    {
        _id: "6944f46d02303e61a6d0a343",
        fullName: "Ayur",
        email: "ayur@bot.com",
        password: "botpassword123",
        role: "user",
        profileImageURL: "https://api.dicebear.com/7.x/bottts/svg?seed=Ayur&backgroundColor=transparent",
        bio: "The Bio-Architect. Exploring the wisdom of nature and life."
    }
];

async function fixBots() {
    try {
        console.log("🛠️ Fixing Bot Profiles...");
        await mongoose.connect(process.env.MONGO_URL);

        for (const botData of BOTS) {
            // Upsert: Update if exists, Insert if not
            // Destructure to remove profileImageURL so we don't overwrite manual changes
            const { profileImageURL, ...botFields } = botData;

            const updatedBot = await User.findByIdAndUpdate(
                botData._id,
                { $set: botFields },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            console.log(`✅ Fixed/Created: ${updatedBot.fullName}`);
            console.log(`   Image: ${updatedBot.profileImageURL}`);
        }

    } catch (err) {
        console.error("❌ Error fixing bots:", err);
    } finally {
        mongoose.disconnect();
        console.log("🔌 Disconnected.");
    }
}

fixBots();
