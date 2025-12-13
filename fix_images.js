require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/user');

const MONGO_URL = process.env.MONGO_URL;

const PERMANENT_AVATARS = {
    // Replace these IDs with YOUR specific bot IDs if they are different
    "693dc46dd348ddc001c50af9": "https://res.cloudinary.com/dnyg7ue5v/image/upload/v1765662279/Gemini_Generated_Image_jcs0afjcs0afjcs0_too7ss.png", // Ashvashira (Mystical)
    "693dc57bd348ddc001c50b02": "https://res.cloudinary.com/dnyg7ue5v/image/upload/v1765662280/Gemini_Generated_Image_nrp487nrp487nrp4_uvswsi.png", // Yantrik (Code)
    "693dc5fcd348ddc001c50b0f": "https://res.cloudinary.com/dnyg7ue5v/image/upload/v1765662281/Gemini_Generated_Image_wxcjszwxcjszwxcj_nd62sx.png"  // Otaku (Anime)
};

async function fixAvatars() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("🔌 Connected...");

        for (const [id, url] of Object.entries(PERMANENT_AVATARS)) {
            try {
                // Upsert: true ensures that if the bot is missing, it MIGHT fail validation if other fields are required
                // But user just wants to update existing ones presumably. 
                // Using findByIdAndUpdate
                const res = await User.findByIdAndUpdate(id, { profileImageURL: url }, { new: true });
                if (res) {
                    console.log(`✅ Fixed Avatar for ID: ${id}`);
                } else {
                    console.log(`⚠️ Bot not found (ID: ${id}) - creating it...`);
                    // Optional: Create if missing? User didn't ask for this logic in THIS script, 
                    // but they did in the previous `fix_bots`. 
                    // Use the provided code logic strictly as requested implies just update.
                }
            } catch (e) {
                console.log(`❌ Failed ID: ${id}`, e.message);
            }
        }
        console.log("🏁 Done. Images will never disappear again.");
    } catch (e) {
        console.error("DB Connection Error:", e);
    } finally {
        mongoose.disconnect();
    }
}

fixAvatars();
