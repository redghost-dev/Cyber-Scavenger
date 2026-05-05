const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Boss = require('../models/Boss');
const connectDB = require('../config/db');

(async () => {
    try {
        await connectDB();
        
        console.log("\n--- CHECKING BOSS DATABASE ---");
        
        const allBosses = await Boss.find({});
        console.log(`Total Bosses Found: ${allBosses.length}`);
        
        const aiBosses = await Boss.find({ generatedByAI: true });
        console.log(`AI Generated Bosses: ${aiBosses.length}`);
        
        if (aiBosses.length > 0) {
            console.log("\nAI Boss Details:");
            aiBosses.forEach(b => {
                console.log(`- [${b.id}] ${b.name} (Created: ${b.createdAt})`);
            });
        } else {
            console.log("\nNo AI generated bosses found. Did you click the button?");
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
