require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // For v1beta/v1 the method is usually on the generaAI instance or client
        // But the SDK exposes a way to get the model. 
        // Actually, currently the Node SDK doesn't have a direct 'listModels' helper exposed on the main class in all versions
        // But we can try to just use a known stable model if this fails.
        // Let's try to just run a generation with 'gemini-pro' as a fallback test or 'gemini-1.5-flash-001'

        // Changing strategy: The error was specific about 'gemini-1.5-flash'.
        // Let's try 'gemini-1.5-flash-001' which is the specific version.

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Test");
        console.log("Success with gemini-1.5-flash-001");
    } catch (error) {
        console.error("Error with -001:", error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Test");
        console.log("Success with gemini-1.5-flash-latest");
    } catch (error) {
        console.error("Error with -latest:", error.message);
    }
}

listModels();
