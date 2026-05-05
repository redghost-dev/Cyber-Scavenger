const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const AiGenerator = require('../services/AiGenerator');

// Simple Test Script
(async () => {
    console.log("--- STARTING AI GENERATION TEST ---");
    
    // 1. Connect to DB (for saving later)
    await connectDB();
    
    try {
        // 2. Request Generation
        console.log("Requesting Boss from Gemini...");
        const bossData = await AiGenerator.generateBossPrototype("void machine swarm");
        
        console.log("\n--- GENERATION SUCCESS ---");
        console.log("ID:", bossData.id);
        console.log("Name:", bossData.name);
        console.log("Desc:", bossData.description);
        console.log("AI Flag:", bossData.generatedByAI);
        
        // 3. Save to DB (Optional test)
        // await AiGenerator.saveGeneratedBoss(bossData);
        // console.log("Saved to DB!");

    } catch (e) {
        console.error("--- TEST FAILED ---", e);
    }

    console.log("--- TEST COMPLETE ---");
    process.exit(0);
})();
