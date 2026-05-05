// Boss Manager Module
// Handles Boss Spawning, AI Logic integration, and State Management

window.BossManager = {
    // Initializer: Connects to Backend API
    init: async function() {
        console.log("BossManager: Initializing Hybrid DB Connection...");
        window.BOSS_LOGIC = {};
        
        try {
            const res = await fetch('/api/bosses/active');
            const data = await res.json();
            
            if (data.success && data.bosses.length > 0) {
                console.log(`BossManager: Retrieved ${data.bosses.length} bosses from DB.`);
                
                // Helper to reconstruct functions from strings
                const cleanCode = (code) => Array.isArray(code) ? code.join('\n') : (code || '');
                
                data.bosses.forEach(bossData => {
                    try {
                        const logic = {
                            meta: {
                                name: bossData.name,
                                color: bossData.color,
                                hpMult: bossData.hpMult || 1,
                                attackChance: bossData.attackChance || 0.05,
                                radius: 60,
                                replaceSprite: bossData.replaceSprite,
                                minions: bossData.logic.minions ? bossData.logic.minions.map(m => ({
                                    ...m,
                                    logic: {
                                        update: new Function('boss', 'minion', 'index', 'canvas', cleanCode(m.logic.update)),
                                        draw: new Function('ctx', 'boss', 'minion', 'index', cleanCode(m.logic.draw)),
                                        init: m.logic.init ? new Function('boss', 'minion', 'index', cleanCode(m.logic.init)) : null
                                    }
                                })) : []
                            },
                            drawHp: new Function('ctx', 'boss', 'pct', cleanCode(bossData.logic.drawHp)),
                            update: new Function('boss', 'player', 'canvas', 'projectiles', cleanCode(bossData.logic.update)),
                            draw: bossData.logic.draw ? new Function('ctx', 'boss', 'canvas', cleanCode(bossData.logic.draw)) : null,
                            entrance: {
                                duration: bossData.logic.entrance.duration || 4000,
                                init: bossData.logic.entrance.init ? new Function('boss', cleanCode(bossData.logic.entrance.init)) : () => {},
                                update: new Function('boss', 'progress', cleanCode(bossData.logic.entrance.update)),
                                draw: new Function('ctx', 'boss', 'progress', 'canvas', cleanCode(bossData.logic.entrance.draw))
                            },
                            death: {
                                duration: bossData.logic.death.duration || 4000,
                                draw: new Function('ctx', 'boss', 'progress', 'canvas', cleanCode(bossData.logic.death.draw))
                            }
                        };
                        window.BOSS_LOGIC[bossData.id] = logic;
                        console.log(`BossManager: Loaded ${bossData.id}`);
                    } catch (e) {
                         console.error(`Failed to parse boss logic for ${bossData.id}`, e);
                    }
                });
            } else {
                console.warn("BossManager: No bosses found in DB. Using internal fallbacks might be required.");
            }
        } catch (err) {
            console.error("BossManager: API Error", err);
        }
    },

    spawn: function() {
        try {
            const bossLevel = window.bossLevel;
            const canvas = window.canvas; // Explicit purely for clarity, works implicitly too
            
            console.log('--- SPAWN BOSS INITIATED ---');
            console.log('Current Boss Level:', bossLevel);
            
            // Ensure difficultySettings is available (defined in index.ejs)
            // If undefined (loading order issue or unit test), provide default
            const diffSettings = window.difficultySettings || {
                medium: { bossHpMult: 1.0 }
            };
            const currentDiff = window.difficulty || window.GameState.difficulty || 'medium';
            const settings = diffSettings[currentDiff] || diffSettings['medium'];

            const config = window.gameConfig || window.GameState.gameConfig;
            
            // HP Calculation: Scaling with bossLevel
            const increasePercent = (config && config.gameplay && config.gameplay.bossScoreIncreasePercent) ? config.gameplay.bossScoreIncreasePercent : 20;
            const levelMultiplier = Math.pow(1 + (increasePercent/100), bossLevel - 1);
      
            const baseHp = 100 * settings.bossHpMult; 
            const calculatedHp = Math.floor(baseHp * levelMultiplier);
      
            // --- DYNAMIC BOSS CONFIG ---
            let bossConfigList = [];
            
            // Load enabled bosses from config
            if (config && config.gameplay && config.gameplay.bosses && config.gameplay.bosses.length > 0) {
                bossConfigList = config.gameplay.bosses.filter(b => b.enabled);
                
                // SAFETY: Filter out bosses that have no loaded blueprint logic
                if (window.BOSS_LOGIC) {
                   const availableIds = Object.keys(window.BOSS_LOGIC);
                   bossConfigList = bossConfigList.filter(b => availableIds.includes(b.id));
                }
            }
            
            // --- FORCE INJECT VOID HARBINGER (SAFETY FALLBACK) ---
            const hasVoid = bossConfigList.find(b => b.id === 'void_harbinger');
            if (!hasVoid) {
                console.log("Injecting Void Harbinger into Config List");
                bossConfigList.push({ 
                    id: 'void_harbinger', 
                    name: 'Void Harbinger', 
                    enabled: true, 
                    hpMult: 2.0, 
                    color: '#9900ff', 
                    attackChance: 0.1 
                });
            }

            // --- DYNAMIC INJECTION OF AI BOSSES ---
            // Integrates new AI bosses from BOSS_LOGIC into the rotation
            if (window.BOSS_LOGIC) {
                const logicKeys = Object.keys(window.BOSS_LOGIC);
                const existingConfigIds = bossConfigList.map(b => b.id);
                // Find IDs that are loaded in logic but not in the static config list
                const aiBossIds = logicKeys.filter(id => !existingConfigIds.includes(id));
                
                if (aiBossIds.length > 0) {
                    console.log(`BossManager: Found ${aiBossIds.length} AI Bosses. Injecting into rotation.`);
                    aiBossIds.forEach(id => {
                         const meta = window.BOSS_LOGIC[id].meta || {};
                         bossConfigList.push({
                             id: id,
                             name: meta.name || 'Unknown Construct',
                             enabled: true,
                             hpMult: meta.hpMult || 1.5,
                             color: meta.color || '#00ffcc',
                             attackChance: meta.attackChance || 0.05
                         });
                    });
                }
            }
            
            // Double check list emptiness
            if (bossConfigList.length === 0) {
                 console.warn("Config List Empty, using Default Fallback");
                 bossConfigList = [
                     { id: 'seraphim', name: 'The Seraphim', enabled: true, hpMult: 1.8, color: '#ffd700', attackChance: 0.08 }
                 ];
            }
      
            let selectedConfig;
      
            // Logic: Boss Order matches Admin Panel Order (Cyclic Levels)
            if (bossConfigList.length > 0) {
                const bossIndex = (bossLevel - 1) % bossConfigList.length;
                selectedConfig = bossConfigList[bossIndex];
                console.log(`Selected Config: ${selectedConfig.id} (Index: ${bossIndex})`);
            } else {
               selectedConfig = { id: 'seraphim', name: 'The Seraphim', hpMult: 1.8, color: '#ffd700', attackChance: 0.08 };
            }
      
            // --- BLUEPRINT INTEGRATION ---
            if (!window.BOSS_LOGIC) window.BOSS_LOGIC = {};
            let blueprint = window.BOSS_LOGIC[selectedConfig.id];
      
            console.log(`Blueprint for ${selectedConfig.id}:`, blueprint ? "FOUND" : "MISSING");
      
            // Ensure fresh copy of blueprint structure to prevent pollution
            if (blueprint) {
                // Deep Clone meta and structure, but keep functions by reference
                const master = blueprint;
                blueprint = {
                    meta: { ...master.meta },
                    drawHp: master.drawHp,
                    update: master.update,
                    draw: master.draw,
                    entrance: { ...master.entrance },
                    death: { ...master.death }
                };
            }
      
            // If still no blueprint, abort spawn to prevent softlock
            if (!blueprint) {
                console.error(`Critical Error: No blueprint for ${selectedConfig.id}`);
                if(window.spawnFloatingText) window.spawnFloatingText(canvas.width/2, canvas.height/2, `ERROR: MISSING DATA (${selectedConfig.id})`, "#f00", 60);
                
                // Emergency Fallback
                if (selectedConfig.id !== 'seraphim' && window.BOSS_LOGIC['seraphim']) {
                    console.log("Attempting Emergency Fallback to Seraphim");
                    selectedConfig = { id: 'seraphim', name: 'The Seraphim', hpMult: 1.8, color: '#ffd700', attackChance: 0.08 };
                    blueprint = window.BOSS_LOGIC['seraphim'];
                } else {
                    return;
                }
            }
            
            // Apply Config Attributes
            const finalHp = Math.floor(calculatedHp * (selectedConfig.hpMult || (blueprint ? blueprint.meta.hpMult : 1)));
            
            // Assign to Global/GameState
            window.boss = {
              x: canvas.width / 2,
              y: -100, // Start higher up for dramatic entry
              radius: (blueprint && blueprint.meta.radius) ? blueprint.meta.radius : 50,
              hp: finalHp,
              maxHp: finalHp,
              color: (blueprint && blueprint.meta.color) ? blueprint.meta.color : (selectedConfig.color || '#fff'),
              subType: selectedConfig.id, 
              attackChance: (blueprint && blueprint.meta.attackChance) ? blueprint.meta.attackChance : (selectedConfig.attackChance || 0.05),
              state: 'entering', 
              timer: 0,
              angle: 0,
              blueprint: blueprint, // ATTACH DNA
              // Runtime variables
              rotAngle: 0
            };
      
            // Initialize Blueprint Props
            if (window.boss.blueprint && window.boss.blueprint.entrance && window.boss.blueprint.entrance.init) {
                window.boss.blueprint.entrance.init(window.boss);
            }
      
            // Pre-generate Sprite Key (Legacy Fallback)
            if(window.createNeonSprite) { // Ensure factory loaded
                window.boss.spriteKey = `boss-${window.boss.color}-${window.boss.radius}-${window.boss.subType}`;
                if (!window.SpriteCache[window.boss.spriteKey]) {
                    window.createNeonSprite(window.boss.color, window.boss.radius, 20, window.boss.subType);
                }
                if (!window.SpriteCache[window.boss.spriteKey] && window.createRealisticBossSprite) {
                    window.createRealisticBossSprite(window.boss.subType, window.boss.color, window.boss.radius);
                }
            }
            
            if(window.triggerShake) window.triggerShake(1000, 5);
      
            // --- ENTRANCE EVENT ---
            // Capture existing enemies for FX before clearing
            const existingEnemies = [...(window.enemies || [])];
            
            window.enemies = []; // Despawn fodder immediately
            window.projectiles = []; // Clear current bullets
            window.friendlyProjectiles = []; // Don't let player spawn-kill instantly
      
            if(window.player) window.player.isCinematic = true; 
            
            const warningText = blueprint ? `WARNING: CLASS-S DETECTED` : "WARNING: BOSS DETECTED";
            if(window.spawnFloatingText) window.spawnFloatingText(canvas.width/2, canvas.height/2, warningText, "#f00", 30);
            if(window.Sound) window.Sound.playTone(100, 'sawtooth', 0.5); // Alarm
            
            // Create death particles for despawned enemies
            if(window.createParticles) {
                existingEnemies.forEach(e => window.createParticles(e.x, e.y, e.color, 5, 3));
            }
            
        } catch (err) {
            console.error("CRASH IN SPAWN BOSS:", err);
            if(window.spawnFloatingText) window.spawnFloatingText(window.canvas.width/2, window.canvas.height/2, "SYSTEM ERROR", "#f00", 60);
        }
    }
};

// Global Alias
window.spawnBoss = () => window.BossManager.spawn();
