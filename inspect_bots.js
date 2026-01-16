require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/user');

const BOT_IDS = [
    "693dc46dd348ddc001c50af9", // Ashvashira
    "693dc57bd348ddc001c50b02", // Yantrik
    "693dc5fcd348ddc001c50b0f"  // Otaku
];

async function inspectBots() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URL);

        for (const id of BOT_IDS) {
            // Check if ID is valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                console.log(`❌ Invalid ObjectId: ${id}`);
                continue;
            }

            const user = await User.findById(id);
            if (user) {
                console.log(`✅ Found Bot: ${user.fullName} (${id})`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Profile Image: ${user.profileImageURL}`);
            } else {
                console.log(`❌ Bot NOT FOUND: ${id}`);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        mongoose.disconnect();
    }
}

inspectBots();
