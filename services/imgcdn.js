const IMGCDN_API_KEY = "5386e05a3562c7a8f984e73401540836";
const IMGCDN_URL = "https://imgcdn.dev/api/1/upload";

/**
 * Uploads an image buffer to IMGCDN.
 * @param {Buffer} buffer - The image file buffer.
 * @param {string} filename - The original filename.
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
async function uploadToImgCDN(buffer, filename) {
    try {
        const formData = new FormData();
        formData.append("key", IMGCDN_API_KEY);
        // Create a Blob from the buffer (requires Node.js 18+)
        const blob = new Blob([buffer], { type: "image/png" }); // Type guess or just generic
        formData.append("source", blob, filename);
        formData.append("format", "json");

        const response = await fetch(IMGCDN_URL, {
            method: "POST",
            headers: {
                "Accept": "application/json",
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`IMGCDN upload failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (data.status_code === 200 && data.success) {
            return data.image.url;
        } else {
            throw new Error(`IMGCDN API Error: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        console.error("Error uploading to IMGCDN:", error);
        throw error;
    }
}

module.exports = { uploadToImgCDN };
