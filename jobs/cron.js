const cron = require('node-cron');
const User = require('../models/User');

const setupCronJobs = () => {
    // Run every Sunday at midnight (00:00)
    cron.schedule('0 0 * * 0', async () => {
        console.log('Running weekly league reset...');
        
        try {
            // 1. Fetch all users sorted by weekly score
            const users = await User.find({}).sort({ 'stats.weeklyScore': -1 });
            
            if (users.length === 0) return;

            // 2. Define thresholds (Simple percentage or fixed numbers)
            // For MVP: Fixed numbers are safer/easier to understand
            // Top 10 -> Cyber Legend
            // Next 40 -> Diamond
            // Next 150 -> Gold
            // Next 300 -> Silver
            // Rest -> Bronze

            const updates = users.map((user, index) => {
                let newTier = 'Bronze';
                
                // Only active players (score > 0) can be in high tiers
                if (user.stats.weeklyScore > 0) {
                    if (index < 10) newTier = 'Cyber Legend';
                    else if (index < 50) newTier = 'Diamond';
                    else if (index < 200) newTier = 'Gold';
                    else if (index < 500) newTier = 'Silver';
                }

                return {
                    updateOne: {
                        filter: { _id: user._id },
                        update: { 
                            $set: { 
                                'stats.leagueTier': newTier,
                                'stats.weeklyScore': 0 // Reset score
                            } 
                        }
                    }
                };
            });

            // 3. Bulk Write for performance
            if (updates.length > 0) {
                await User.bulkWrite(updates);
                console.log(`Weekly reset completed. Processed ${updates.length} users.`);
            }

        } catch (err) {
            console.error('Error in weekly reset cron:', err);
        }
    });

    console.log('Cron jobs initialized: Weekly League Reset (Sunday 00:00)');
};

module.exports = setupCronJobs;
