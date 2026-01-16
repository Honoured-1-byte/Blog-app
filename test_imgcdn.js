const fs = require('fs');
const path = require('path');
const { uploadToImgCDN } = require('./services/imgcdn');

async function testUpload() {
    try {
        const filePath = path.join(__dirname, 'public', 'images', 'default.jpeg');
        if (!fs.existsSync(filePath)) {
            console.error("Test image not found at:", filePath);
            return;
        }

        const buffer = fs.readFileSync(filePath);
        console.log("Attempting to upload default.jpeg to IMGCDN...");

        const url = await uploadToImgCDN(buffer, 'default.jpeg');
        console.log("✅ Success! Image uploaded to:", url);
    } catch (error) {
        console.error("❌ Upload failed:", error.message);
    }
}

testUpload();
