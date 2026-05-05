const mongoose = require('mongoose');
const GameConfig = require('./models/GameConfig');

const MONGODB_URI = 'mongodb://localhost/cyber-scavenger';

const missingBosses = [
    {
        id: 'vanguard',
        name: 'Obsidian Vanguard',
        enabled: true,
        hpMult: 1.0,
        color: '#ff0000',
        attackChance: 0.15,
        description: 'Stealth assassin. Cloaks and strikes fast.'
    },
    {
        id: 'dreadnought',
        name: 'Orbital Dreadnought',
        enabled: true,
        hpMult: 3.0,
        color: '#ff8800',
        attackChance: 0.05,
        description: 'Massive capital ship with independent gun turrets.'
    },
    {
        id: 'seraphim',
        name: 'The Seraphim',
        enabled: true,
        hpMult: 1.8,
        color: '#ffd700',
        attackChance: 0.08,
        description: 'Shape-shifting geometric entity. Manipulates space.'
    }
];

async function fixBosses() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const config = await GameConfig.findOne({ key: 'global_settings' });
        
        if (!config) {
            console.log('No global_settings found. Creating new...');
            // If completely empty, the model default would handle it, but we can force it here
            await GameConfig.create({ key: 'global_settings' });
        } else {
            console.log(`Current boss count: ${config.gameplay.bosses.length}`);
            
            let addedCount = 0;
            const currentIds = config.gameplay.bosses.map(b => b.id);

            missingBosses.forEach(newBoss => {
                if (!currentIds.includes(newBoss.id)) {
                    console.log(`Adding missing boss: ${newBoss.name}`);
                    config.gameplay.bosses.push(newBoss);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                config.markModified('gameplay.bosses'); // Required for Mixed/Array changes
                await config.save();
                console.log(`Successfully added ${addedCount} new bosses.`);
            } else {
                console.log('All bosses already exist. No changes needed.');
            }
        }
        
        mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
        process.exit(1);
    }
}

fixBosses();
