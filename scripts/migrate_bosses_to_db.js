const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Boss = require('../models/Boss');

// Load Config
const configPath = path.resolve(__dirname, '../config/db');
// Mocking connect since we want to run this standalone, or imply connection depending on usage.
// Better to rely on existing connection logic or plain Mongoose connect.
const mongoURI = 'mongodb://127.0.0.1:27017/cyber-scavenger'; // Default local

const BOSS_DIR = path.join(__dirname, '../public/data/bosses');

const migrate = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected for Migration...');

        const files = fs.readdirSync(BOSS_DIR);
        
        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(BOSS_DIR, file);
            const rawData = fs.readFileSync(filePath, 'utf-8');
            const bossData = JSON.parse(rawData);

            console.log(`Processing ${bossData.name} (${bossData.id})...`);

            // Prepare object for DB (Ensure strict matching)
            const dbPayload = {
                id: bossData.id,
                name: bossData.name,
                description: bossData.description,
                visualType: bossData.visualType,
                enabled: bossData.enabled,
                color: bossData.color,
                hpMult: bossData.hpMult,
                attackChance: bossData.attackChance,
                replaceSprite: bossData.replaceSprite || false,
                logic: bossData.logic,
                isGlobal: true, // Existing file-based bosses are Global Fallbacks
                generatedByAI: false,
                creatorId: null // System owned
            };

            // Upsert (Update if exists, Insert if new)
            await Boss.findOneAndUpdate(
                { id: bossData.id }, 
                dbPayload, 
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            console.log(`✅ Migrated: ${bossData.name}`);
        }

        console.log('All bosses migrated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrate();