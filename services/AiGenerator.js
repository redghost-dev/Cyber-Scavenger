const fs = require('fs');
const path = require('path');
const Boss = require('../models/Boss');
const GameConfig = require('../models/GameConfig'); // IMPORT ADDED
const { GoogleGenerativeAI } = require("@google/generative-ai");

class AiGenerator {
    constructor() {
        this.systemPrompt = "";
        
        try {
            const promptPath = path.join(__dirname, '../prompts/BossDesignSystem.md');
            this.systemPrompt = fs.readFileSync(promptPath, 'utf8');
            
            this.apiKeys = [
                process.env.GEMINI_API_KEY,
                process.env.GEMINI_API_KEY_BACKUP
            ].filter(k => k && k.length > 10); // Filter out empty or short keys

            if (this.apiKeys.length > 0) {
                console.log(`AI GENERATOR: Loaded ${this.apiKeys.length} API Keys.`);
            } else {
                console.warn("AI GENERATOR: No GEMINI_API_KEY found.");
            }

            this.deepseekKey = process.env.DEEPSEEK_API_KEY;
            if (this.deepseekKey) {
                console.log("AI GENERATOR: DeepSeek API Key loaded.");
            }

        } catch (e) {
            console.error("AI GENERATOR: Initialization Error", e);
        }
    }

    /**
     * GENERATE BOSS
     * Uses Gemini API with Key Rotation and Fallback
     */
    async generateBossPrototype(theme = "cybernetic", antiPatterns = "", antiPatternCode = "") {
        const logs = []; // Internal log collector
        const log = (msg) => { console.log(msg); logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`); };
        const warn = (msg) => { console.warn(msg); logs.push(`[${new Date().toLocaleTimeString()}] ⚠️ ${msg}`); };
        const errLog = (msg) => { console.error(msg); logs.push(`[${new Date().toLocaleTimeString()}] ❌ ${msg}`); };

        log(`AI GENERATOR: Designing boss with theme '${theme}'...`);
        // log(`Avoiding previous patterns: [${antiPatterns.length} chars]`);
        
        // Loop through available keys
        for (let i = 0; i < this.apiKeys.length; i++) {
            const currentKey = this.apiKeys[i];
            try {
                const genAI = new GoogleGenerativeAI(currentKey);
                // Try 1.5 Flash first
                const modelName = "gemini-1.5-flash-001";
                const model = genAI.getGenerativeModel({ model: modelName });
                
                log(`Attempting generation with Key #${i+1} (${modelName})...`);

                // ... Generation Logic ...
                const boss = await this._executeGeneration(model, theme, antiPatterns, antiPatternCode);
                
                log(`✅ SUCCESS: Boss generated via Google AI (Key #${i+1})`);
                boss.logs = logs; // Attach logs
                return boss;

            } catch (error) {
                errLog(`Key #${i+1} Failed. Error: ${error.message}`);
                // Continue to next key
            }
        }

        // --- GEMINI FAILED, TRY DEEPSEEK ---
        if (this.deepseekKey) {
            try {
                log("Gemini failed. Attempting generation with DeepSeek (DeepSeek-V3)...");
                const boss = await this._executeDeepSeekGeneration(theme, antiPatterns, antiPatternCode, log);
                log(`✅ SUCCESS: Boss generated via DeepSeek-V3`);
                boss.logs = logs;
                return boss;
            } catch (dsError) {
                errLog(`DeepSeek Failed. Error: ${dsError.message}`);
            }
        }

        // --- ALL KEYS FAILED ---
        warn("All API providers (Google & DeepSeek) failed.");

        // CHECK CONFIG TO SEE IF FALLBACK IS ALLOWED
        try {
            const config = await GameConfig.findOne({ key: 'global_settings' });
            if (config && config.ai && config.ai.enableFallback === false) {
                errLog("Fallback is DISABLED in Admin Panel. Aborting generation.");
                const error = new Error("AI Generation Failed: API Unavailable and Fallback Disabled.");
                error.logs = logs; 
                throw error;
            }
        } catch (dbErr) {
            // Rethrow the specific error we just created
            if (dbErr.message === "AI Generation Failed: API Unavailable and Fallback Disabled.") {
                throw dbErr;
            }
            // Only catch ACTUAL db errors
            warn(`Could not check config, assuming fallback is enabled. (${dbErr.message})`);
        }

        // If enabled (or check failed), proceed to Mock
        warn("Falling back to MOCK generator (Smart Procedural System)...");
        const boss = await this.mockGenerate(theme, antiPatterns);
        boss.logs = logs; // Attach logs
        return boss;
    }

    async _executeGeneration(model, theme, antiPatterns, antiPatternCode) {
            // UNLEASHED MODE: No hardcoded lists. No pre-defined shapes.
            // We rely entirely on the PROMPT and the ANTI-PATTERNS to force novelty.

            const features = [
                "Time Manipulation", "Gravity Distortion", "Screen Hacking", "Bullet Hell", "Laser Grid", 
                "Minion Swarm", "Mirror Illusion", "Black Hole", "Orbital Bombardment", "Ricochet Walls",
                "Color Absorption", "Pixel Disintegration", "Reverse Controls", "Shape Shifting"
            ];
            const randomFeature = features[Math.floor(Math.random() * features.length)];

            // Refine the prompt with the user's specific theme request
            const finalPrompt = `${this.systemPrompt}\n\n` + 
                `MISSION BRIEFING (GENERATE A COMPLETELY NEW BOSS CONCEPT):\n` +
                `1. THEME: "${theme}" (Interpret this creatively, do not be literal)\n` + 
                `2. EXISTING BOSS DATABASE (COMPLETE BLACKLIST): \n` + 
                `   The following list contains EVERY boss currently in the game. YOU ARE STRICTLY FORBIDDEN FROM REPEATING THESE CONCEPTS.\n` +
                `   [${antiPatterns}]\n` +
                `   CRITICAL SIMILARITY CONSTRAINT: You must analyze the list above very carefully. The new boss MUST NOT resemble any of these concepts by more than 10%. If a concept appears there (e.g., 'Giant Eye', 'Tank', 'Pyramid', 'Sun'), you are STRICTLY FORBIDDEN from using it. You must invent a shape, form, or metaphor that is NOT on this list.\n` + 
                `3. FORBIDDEN CODE PATTERNS: Do not use the logic structure found here:\n` +
                `   \`\`\`javascript\n${antiPatternCode}\n\`\`\`\n` +
                `4. VISUAL DIRECTIVE: Go wild. Use abstract shapes, fractals, glitch art, biological forms, or architectural structures. NO SIMPLE GEOMETRIC PRIMITIVES unless heavily modified.\n` + 
                `5. MOVEMENT PHYSICS: The boss must be SLOW and HEAVY. Max speed 1.5px per frame. Use lerp(target, 0.01). It is a massive entity, not a fly.\n` +
                `6. SPECIAL MECHANIC: Incorporate "${randomFeature}" into the logic.\n` +
                `7. MINIONS: Mandatory. They must be thematically linked (e.g. if boss is a hive, minions are bees).\n` +
                `8. UI: Use the mandatory integrated HP ring style (No rectangles).`;
            
            // DEBUG LOGGING FOR USER VERIFICATION
            console.log("----------------------------------------------------------------");
            console.log("DEBUG: CHECKING PROMPT CONTEXT INTEGRITY");
            console.log(`DEBUG: Theme: ${theme}`);
            console.log(`DEBUG: Anti-Pattern List Length: ${antiPatterns.length} characters`);
            console.log("DEBUG: Anti-Pattern Preview (First 200 chars):");
            console.log(antiPatterns.substring(0, 200));
            console.log("----------------------------------------------------------------");

            console.log(`AI GENERATOR: Sending OPEN CREATIVITY Prompt to Gemini...`);
            
            // Set high creativity
            const generationConfig = {
                temperature: 1.0, 
                maxOutputTokens: 8192,
            };

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
                generationConfig: generationConfig
            });
            const response = await result.response;
            const textRaw = response.text();

            // Extract JSON from potential markdown blocks ```json ... ```
            const cleanText = textRaw.replace(/```json/g, '').replace(/```/g, '').trim();
            const bossData = JSON.parse(cleanText);

            // Sanitization / Post-Processing could go here
            bossData.generatedByAI = true;
            bossData.enabled = true; // Auto-enable primarily for testing
            
            // ERROR CORRECTION: Ensure logic exists
            if (!bossData.logic) bossData.logic = {};

            // FORCE INJECT HP BAR (User Requirement: Standardization)
            // We overwrite whatever the AI generated to ensure it matches the "Integrated Logic"
            console.log("AI GENERATOR: Forcing Standardized HP Ring for " + bossData.name);
            bossData.logic.drawHp = [
                "// AUTO-INJECTED HP BAR (INTEGRATED RING & CORE)",
                "const hpRadius = (boss.radius || 60);", 
                "ctx.save();",
                "// 1. Under-glow (Health Indicator)",
                "ctx.globalCompositeOperation = 'screen';",
                "ctx.shadowBlur = 20;",
                "ctx.shadowColor = boss.color;",
                "ctx.beginPath(); ctx.arc(boss.x, boss.y, hpRadius + 5, -Math.PI/2, (-Math.PI/2) + (Math.PI*2 * (pct/100)));",
                "ctx.strokeStyle = boss.color; ctx.lineWidth = 6; ctx.stroke();",
                
                "// 2. Tech Ring (Static)",
                "ctx.globalCompositeOperation = 'source-over';",
                "ctx.beginPath(); ctx.arc(boss.x, boss.y, hpRadius + 15, 0, Math.PI*2);",
                "ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke();",
                
                "// 3. Digital Percent (On Body)",
                "if(pct < 100) {",
                "   ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.textAlign='center';",
                "   ctx.fillText(Math.floor(pct) + '%', boss.x, boss.y + hpRadius + 30);",
                "}",
                "ctx.restore();"
            ];
            
            // Mark source
            bossData.description = (bossData.description || "") + " [Gen: Gemini 1.5 Flash]";

            return bossData;
    }

    /**
     * NEW: Procedural Builder to ensure variety even without API
     */
    _buildProceduralBoss(theme, antiPatterns = "") {
        // EXPANDED SHAPE LIBRARY FOR FALLBACK MODE
        const shapes = ['Orb', 'Construct', 'Eye', 'Star', 'Poly', 'Swarm', 'Pyramid', 'Tentacle', 'GlitchBox', 'Angel', 'Hydra', 'CubeSwarm', 'Totem', 'Spider', 'Cloud', 'Rings'];
        
        // Anti-pattern Filtering for Mock Mode
        // "antiPatterns" string contains "[Name: 'X' | Visual: 'Eye']... "
        // We filter out shapes that appear in the blacklist string
        const availableShapes = shapes.filter(s => !antiPatterns.toLowerCase().includes(s.toLowerCase()));
        
        // If we filtered everything, reset (should be rare with 15 types)
        const finalShapes = availableShapes.length > 0 ? availableShapes : shapes;
        
        console.log(`AI GENERATOR (MOCK): Filtered shapes based on history. Available: ${finalShapes.length}/${shapes.length}`);

        const moves = ['Hover', 'Chase', 'Figure8', 'Teleport', 'Bounce', 'OrbitCenter', 'ZigZag', 'GridSnap'];
        const weapons = ['Spiral', 'Nova', 'Aimed', 'Scatter', 'LaserBeam', 'Rain', 'HomingMissiles', 'Shockwave', 'TurretSpawn'];

        const seed = Math.floor(Math.random() * 10000);
        const r = (n) => (seed * n * 9301 + 49297) % 233280 / 233280; // Pseudo-random mapping

        const shape = finalShapes[Math.floor(Math.random() * finalShapes.length)];
        const move = moves[Math.floor(Math.random() * moves.length)];
        const weapon = weapons[Math.floor(Math.random() * weapons.length)];
        
        const colors = ['#ff0055', '#00ffaa', '#aa00ff', '#ffaa00', '#00ccff', '#ff3333', '#33ff33', '#3333ff', '#ffffff', '#ffff00'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const namePrefixes = ["Void", "Neo", "Cyber", "Dark", "Solar", "Lunar", "Mecha", "Omega", "Bio", "Quantum", "Hyper", "Nano", "Glitch", "Iron", "Steel", "Plasma"];
        const nameSuffixes = ["Core", "Guardian", "Engine", "Watcher", "Destroyer", "Prism", "Vanguard", "Titan", "Wraith", "Sentinel", "Mind", "Hive", "Lord", "King", "Overseer"];
        const name = `${namePrefixes[Math.floor(Math.random()*namePrefixes.length)]} ${nameSuffixes[Math.floor(Math.random()*nameSuffixes.length)]}`;

        // 1. GENERATE DRAW LOGIC
        let drawCode = ["ctx.save(); ctx.translate(boss.x, boss.y);"];
        drawCode.push(`const pulse = 1 + Math.sin(boss.timer * 0.05) * 0.1;`);
        drawCode.push(`ctx.scale(pulse, pulse);`);
        drawCode.push(`ctx.shadowBlur = 20; ctx.shadowColor = '${color}';`);
        
        if (shape === 'Orb') {
            drawCode.push(`ctx.fillStyle = '${color}'; ctx.beginPath(); ctx.arc(0,0,50,0,Math.PI*2); ctx.fill();`);
            drawCode.push(`ctx.strokeStyle = '#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,60,0,Math.PI*2); ctx.stroke();`);
        } else if (shape === 'Construct') {
            drawCode.push(`ctx.rotate(boss.timer * 0.02);`);
            drawCode.push(`ctx.fillStyle = '${color}'; ctx.fillRect(-40, -40, 80, 80);`);
            drawCode.push(`ctx.fillStyle = '#222'; ctx.fillRect(-20, -20, 40, 40);`);
        } else if (shape === 'Pyramid') {
             drawCode.push(`ctx.rotate(boss.timer * -0.01);`);
             drawCode.push(`ctx.fillStyle = '${color}'; ctx.beginPath(); ctx.moveTo(0,-60); ctx.lineTo(50, 40); ctx.lineTo(-50, 40); ctx.fill();`);
             drawCode.push(`ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2); ctx.fill();`);
        } else if (shape === 'Tentacle') {
             drawCode.push(`for(let i=0; i<8; i++) { ctx.rotate(Math.PI/4); ctx.fillStyle = '${color}'; ctx.fillRect(10, -5, 60 + Math.sin(boss.timer*0.1 + i)*20, 10); }`);
             drawCode.push(`ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill();`);
        } else if (shape === 'GlitchBox') {
             drawCode.push(`const s = 50 + Math.random()*10;`);
             drawCode.push(`ctx.fillStyle = '${color}'; ctx.fillRect(-s/2, -s/2, s, s);`);
             drawCode.push(`ctx.strokeStyle = '#fff'; ctx.strokeRect(-s/2+5, -s/2+5, s-10, s-10);`);
        } else if (shape === 'Angel') {
             drawCode.push(`ctx.strokeStyle = '${color}'; ctx.lineWidth=2;`);
             drawCode.push(`ctx.beginPath(); ctx.arc(0,0,40,0,Math.PI*2); ctx.stroke();`);
             drawCode.push(`ctx.beginPath(); ctx.arc(0,0,70,0,Math.PI*2); ctx.stroke();`);
             drawCode.push(`ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill();`);
        } else if (shape === 'Eye') {
             drawCode.push(`ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0,0,60,40,0,0,Math.PI*2); ctx.fill();`);
             drawCode.push(`const px = (player.x - boss.x)*0.05; const py = (player.y - boss.y)*0.05;`);
             drawCode.push(`ctx.fillStyle = '${color}'; ctx.beginPath(); ctx.arc(px,py,20,0,Math.PI*2); ctx.fill();`);
        } else if (shape === 'Star') {
             drawCode.push(`ctx.rotate(boss.timer * 0.05);`);
             drawCode.push(`ctx.fillStyle = '${color}';`);
             drawCode.push(`for(let i=0; i<8; i++) { ctx.rotate(Math.PI/4); ctx.fillRect(20, -5, 40, 10); }`);
             drawCode.push(`ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill();`);
        } else { // Poly
             drawCode.push(`ctx.rotate(boss.timer * -0.03);`);
             drawCode.push(`ctx.strokeStyle = '${color}'; ctx.lineWidth=5;`);
             drawCode.push(`ctx.beginPath(); ctx.moveTo(50,0); ctx.lineTo(-25, 43); ctx.lineTo(-25, -43); ctx.closePath(); ctx.stroke();`);
        }
        drawCode.push("ctx.restore();");
        
        // Add HP Bar for Procedural Gen logic too
        // Since this is the fallback engine, we just add it to 'draw' or create a separate 'drawHp'
        // But the schema expects 'logic.drawHp'
        
        // Add Minion drawing
        drawCode.push("if(boss.minions) boss.minions.forEach(m => { if(m.def.logic.draw) m.def.logic.draw.call(m, ctx, boss, m); });");


        // 2. GENERATE UPDATE LOGIC
        let updateCode = [];
        updateCode.push("const cx = (typeof canvas !== 'undefined') ? canvas.width/2 : 400;");
        updateCode.push("boss.timer = (boss.timer || 0) + 1;");
        
        if (move === 'Hover') {
            updateCode.push("boss.x += (cx - boss.x) * 0.005; // SLOWED DOWN");
            updateCode.push("boss.y = 150 + Math.sin(boss.timer * 0.02) * 20;");
        } else if (move === 'Bounce') {
             updateCode.push("boss.vx = (boss.vx || 1.5); boss.vy = (boss.vy || 1); // REDUCED SPEED");
             updateCode.push("boss.x += boss.vx; boss.y += boss.vy;");
             updateCode.push("if(boss.x < 50 || boss.x > cx*2-50) boss.vx *= -1;");
             updateCode.push("if(boss.y < 50 || boss.y > 300) boss.vy *= -1;");
        } else if (move === 'OrbitCenter') {
             updateCode.push("boss.angle = (boss.angle || 0) + 0.01; // SLOWER ROTATION");
             updateCode.push("boss.x = cx + Math.cos(boss.angle) * 150;");
             updateCode.push("boss.y = 150 + Math.sin(boss.angle) * 50;");
        } else if (move === 'Chase') {
             updateCode.push("boss.x += (player.x - boss.x) * 0.008; // SLOWER CHASE");
             updateCode.push("boss.y += (150 - boss.y) * 0.02;");
        } else if (move === 'Figure8') {
             updateCode.push("boss.x = cx + Math.sin(boss.timer * 0.01) * 150; // SLOWER SINE");
             updateCode.push("boss.y = 150 + Math.sin(boss.timer * 0.02) * 50;");
        } else { // Teleport / Random
             updateCode.push("if(boss.timer % 300 === 0) { boss.targetX = Math.random()*600+100; boss.targetY = Math.random()*200+50; }");
             updateCode.push("boss.x += ((boss.targetX||cx) - boss.x) * 0.02; // SMOOTHER LERP");
             updateCode.push("boss.y += ((boss.targetY||150) - boss.y) * 0.02;");
        }

        // Weapon Logic
        // We reuse the helpers defined in mockGenerate, but we need to output the code string
        // Since we are separated from the helpers inside mockGenerate, we'll inline simple shooting logic or assume global helpers? 
        // No, we should output the raw code.
        
        if (weapon === 'Spiral') {
             updateCode.push("boss.spiralA = (boss.spiralA||0) + 0.2;");
             updateCode.push(`if(boss.timer % 5 === 0 && typeof projectiles !== 'undefined') projectiles.push({ x: boss.x, y: boss.y, dx: Math.cos(boss.spiralA)*5, dy: Math.sin(boss.spiralA)*5, radius: 5, color: '${color}' });`);
        } else if (weapon === 'Nova') {
             updateCode.push(`if(boss.timer % 120 === 0 && typeof projectiles !== 'undefined') {`);
             updateCode.push(`  for(let i=0; i<12; i++) { const a = (Math.PI*2/12)*i; projectiles.push({ x: boss.x, y: boss.y, dx: Math.cos(a)*4, dy: Math.sin(a)*4, radius: 6, color: '${color}' }); }`);
             updateCode.push(`}`);
        } else if (weapon === 'LaserBeam') {
             updateCode.push(`// Laser Beam Warning`);
             updateCode.push(`if(boss.timer % 150 < 30) { ctx.font = '20px Arial'; ctx.fillText('CHARGING', boss.x, boss.y-50); }`);
             updateCode.push(`if(boss.timer % 150 === 30 && typeof projectiles !== 'undefined') {`); 
             updateCode.push(`   projectiles.push({ x: boss.x, y: boss.y, dx: 0, dy: 10, radius: 20, color: '#fff' });`);
             updateCode.push(`}`);
        } else if (weapon === 'Rain') {
              updateCode.push(`if(boss.timer % 10 === 0 && typeof projectiles !== 'undefined') {`);
              updateCode.push(`  projectiles.push({ x: Math.random()*800, y: 0, dx: 0, dy: 5, radius: 4, color: '${color}' });`);
              updateCode.push(`}`);
        } else if (weapon === 'Aimed') {
             updateCode.push(`if(boss.timer % 60 === 0 && typeof projectiles !== 'undefined') {`);
             updateCode.push(`   const a = Math.atan2(player.y - boss.y, player.x - boss.x);`);
             updateCode.push(`   projectiles.push({ x: boss.x, y: boss.y, dx: Math.cos(a)*8, dy: Math.sin(a)*8, radius: 8, color: '${color}' });`);
             updateCode.push(`}`);
        } else { // Scatter
             updateCode.push(`if(boss.timer % 10 === 0 && typeof projectiles !== 'undefined') {`);
             updateCode.push(`   const a = Math.PI/2 + (Math.random()-0.5);`);
             updateCode.push(`   projectiles.push({ x: boss.x, y: boss.y, dx: Math.cos(a)*6, dy: Math.sin(a)*6, radius: 4, color: '${color}' });`);
             updateCode.push(`}`);
        }

        // Minion Logic
        // Always add minions
        updateCode.push(`
            if (!boss.minionsInit) {
                boss.minions = [];
                for(let i=0; i<4; i++) {
                    boss.minions.push({ 
                        index: i, 
                        x: boss.x, y: boss.y, hp: 20, 
                        def: { logic: { 
                            update: function(b, m) { 
                                m.angle = (Date.now() * 0.002) + (m.index * 1.57);
                                m.x = b.x + Math.cos(m.angle) * 80;
                                m.y = b.y + Math.sin(m.angle) * 80;
                            },
                            draw: function(ctx, b, m) {
                                ctx.fillStyle = '${color}';
                                ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, Math.PI*2); ctx.fill();
                            }
                        }}
                    });
                }
                boss.minionsInit = true;
            }
            boss.minions.forEach(m => m.def.logic.update(boss, m));
        `);

        // Assemble Final
        const adjectives = ['Cybernetic', 'Quantum', 'Void', 'Neon', 'Abyssal', 'Solar', 'Lunar', 'Digital', 'Plasma', 'Mecha'];
        const types = ['Guardian', 'Construct', 'Entity', 'Sentinel', 'Wraith', 'Specter', 'Engine', 'Core', 'Titan', 'Monstrosity'];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomType = types[Math.floor(Math.random() * types.length)];

        return {
            id: `gen_${Math.floor(Math.random()*99999)}`,
            name: `${namePrefixes[Math.floor(Math.random()*namePrefixes.length)]} ${nameSuffixes[Math.floor(Math.random()*nameSuffixes.length)]}`,
            description: `A ${randomAdjective.toLowerCase()} ${randomType.toLowerCase()} wielding ${weapon.toLowerCase()} systems. (Procedural Generation)`,
            visualType: shape,
            color: color,
            hpMult: 1.0 + Math.random(),
            attackChance: 0.1,
            replaceSprite: true,
            generatedByAI: true,
            logic: {
                update: updateCode,
                draw: drawCode,
                drawHp: [
                    "// AUTO-INJECTED HP BAR (INTEGRATED RING & CORE)",
                    "const hpRadius = (boss.radius || 60);", 
                    "ctx.save();",
                    "// 1. Under-glow (Health Indicator)",
                    "ctx.globalCompositeOperation = 'screen';",
                    "ctx.shadowBlur = 20;",
                    "ctx.shadowColor = boss.color;",
                    "ctx.beginPath(); ctx.arc(boss.x, boss.y, hpRadius + 5, -Math.PI/2, (-Math.PI/2) + (Math.PI*2 * (pct/100)));",
                    "ctx.strokeStyle = boss.color; ctx.lineWidth = 6; ctx.stroke();",
                    
                    "// 2. Tech Ring (Static)",
                    "ctx.globalCompositeOperation = 'source-over';",
                    "ctx.beginPath(); ctx.arc(boss.x, boss.y, hpRadius + 15, 0, Math.PI*2);",
                    "ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke();",
                    
                    "// 3. Digital Percent (On Body)",
                    "if(pct < 100) {",
                    "   ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.textAlign='center';",
                    "   ctx.fillText(Math.floor(pct) + '%', boss.x, boss.y + hpRadius + 30);",
                    "}",
                    "ctx.restore();"
                ],
                entrance: {
                    duration: 2000,
                    init: ["boss.y = -200"],
                    update: ["boss.y += (150 - boss.y) * 0.05"],
                    draw: drawCode // Reuse main draw
                },
                death: {
                    duration: 2000,
                    draw: ["ctx.globalAlpha = 1-progress; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(boss.x, boss.y, progress*200, 0, Math.PI*2); ctx.fill();"]
                },
                minions: [] // Logic handled manually in update for simplicity
            }
        };
    }

    // Legacy Mock Generator (Kept as fallback)
    async mockGenerate(theme, antiPatterns) {
        console.log("Generating PROCEDURAL BOSS (New Algorithm)...");
        // Use the new advanced builder
        return this._buildProceduralBoss(theme, antiPatterns);
    }

    /* DEPRECATED: OLD MOCK GENERATOR
    async x_old_mockGenerate(theme) {
        // Mock Delay
        await new Promise(r => setTimeout(r, 800));
        console.log("Generating PROCEDURAL FALLBACK boss (Mock Mode)...");

        // --- RANDOMIZATION ENGINE ---
        const shapes = ['void_prism', 'crimson_eye', 'cyber_tank', 'solar_core', 'nano_swarm'];
        let selectedShape = shapes[Math.floor(Math.random() * shapes.length)];
        
        // Theme overrides
        if (theme) {
            theme = theme.toLowerCase();
            if (theme.includes("eye") || theme.includes("organic")) selectedShape = 'crimson_eye';
            else if (theme.includes("tank") || theme.includes("mech")) selectedShape = 'cyber_tank';
            else if (theme.includes("sun") || theme.includes("fire")) selectedShape = 'solar_core';
            else if (theme.includes("warm") || theme.includes("nano")) selectedShape = 'nano_swarm';
        }

        const bossId = `proc_${selectedShape}_${Math.floor(Math.random()*9999)}`;
        const baseColors = {
            'void_prism': '#00ffff',
            'crimson_eye': '#ff3333',
            'cyber_tank': '#aa8800',
            'solar_core': '#ff8800',
            'nano_swarm': '#00ff00'
        };
        const color = baseColors[selectedShape];

        let logicConfig = {};

        const minionUpdateLoop = [
            "// --- MINION MANAGEMENT ---",
            "// Check for blueprint existence (Game Mode) vs Preview Mode",
            "if (typeof boss.blueprint !== 'undefined' && boss.blueprint.meta && boss.blueprint.meta.minions) {",
            "   if (!boss.minions) { boss.minions = []; boss.minionsSpawned = false; }",
            "   if (!boss.minionsSpawned) {",
            "       boss.blueprint.meta.minions.forEach(def => {",
            "           for(let i=0; i<def.count; i++) {",
            "               const m = { x: boss.x, y: boss.y, hp: def.hp, def: def };",
            "               if(def.logic.init) def.logic.init.call(m, boss, m, i);",
            "               boss.minions.push(m);",
            "           }",
            "       });",
            "       boss.minionsSpawned = true;",
            "   }",
            "   boss.minions.forEach((m, i) => {",
            "       if(m.def.logic.update) m.def.logic.update.call(m, boss, m, i, canvas);",
            "   });",
            "}"
        ];
        
        const minionDrawLoop = [
            "if (boss.minions) {",
            "   boss.minions.forEach((m, i) => {",
            "       if(m.def.logic.draw) m.def.logic.draw.call(m, ctx, boss, m, i);",
            "   });",
            "}"
        ];

        // --- SHOOTING LOGIC HELPERS --- 
        // 1. Aimed Shot
        const fireAimed = (cd, speed, radius, color, ox = 'boss.x', oy = 'boss.y') => [
            `boss.shootTimer = (boss.shootTimer || 0) - 16;`,
            `if(boss.shootTimer <= 0) {`,
            `   boss.shootTimer = ${cd};`,
            `   const sx = ${ox}; const sy = ${oy};`,
            `   const angle = Math.atan2(player.y - sy, player.x - sx);`,
            `   if(typeof projectiles !== 'undefined') projectiles.push({`,
            `       x: sx, y: sy,`,
            `       dx: Math.cos(angle)*${speed}, dy: Math.sin(angle)*${speed},`,
            `       radius: ${radius}, color: '${color}'`,
            `   });`,
            `}`
        ];

        // 2. Radial Burst
        const fireRadial = (cd, count, speed, radius, color, ox = 'boss.x', oy = 'boss.y') => [
            `boss.shootTimer = (boss.shootTimer || 0) - 16;`,
            `if(boss.shootTimer <= 0) {`,
            `   boss.shootTimer = ${cd};`,
            `   const sx = ${ox}; const sy = ${oy};`,
            `   for(let i=0; i<${count}; i++) {`,
            `       const angle = (Math.PI*2 / ${count}) * i + (boss.rotation || 0);`,
            `       if(typeof projectiles !== 'undefined') projectiles.push({`,
            `           x: sx, y: sy,`,
            `           dx: Math.cos(angle)*${speed}, dy: Math.sin(angle)*${speed},`,
            `           radius: ${radius}, color: '${color}'`,
            `       });`,
            `   }`,
            `}`
        ];

        // 3. Spiral
        const fireSpiral = (cd, speed, radius, color, ox = 'boss.x', oy = 'boss.y') => [
            `boss.shootTimer = (boss.shootTimer || 0) - 16;`,
            `boss.spiralAngle = (boss.spiralAngle || 0) + 0.2;`,
            `if(boss.shootTimer <= 0) {`,
            `   boss.shootTimer = ${cd};`,
            `   const sx = ${ox}; const sy = ${oy};`,
            `   const angle = boss.spiralAngle;`,
            `   if(typeof projectiles !== 'undefined') projectiles.push({`,
            `       x: sx, y: sy,`,
            `       dx: Math.cos(angle)*${speed}, dy: Math.sin(angle)*${speed},`,
            `       radius: ${radius}, color: '${color}'`,
            `   });`,
            `}`
        ];

        // --- ARCHETYPE LOGIC ---
        if (selectedShape === 'void_prism') {
            logicConfig = {
                name: "Crystalline Construct",
                update: [
                    "// Timer handled by game loop (ms)",
                    "// Smooth Hover relative to screen center",
                     "const cx = (typeof canvas !== 'undefined') ? canvas.width / 2 : 400;",
                     "const targetX = cx + Math.sin(boss.timer * 0.001) * 200;",
                     "const targetY = 150 + Math.cos(boss.timer * 0.0015) * 50;",
                     "boss.x += (targetX - boss.x) * 0.05;",
                     "boss.y += (targetY - boss.y) * 0.05;",
                     "boss.rotation = (boss.rotation || 0) + 0.02;",
                     ...fireAimed(1200, 7, 6, '#00ffff', 'boss.x + Math.cos(boss.rotation - Math.PI/2)*50', 'boss.y + Math.sin(boss.rotation - Math.PI/2)*50'),
                     ...minionUpdateLoop
                ],
                draw: [
                    "ctx.save(); ctx.translate(boss.x, boss.y); ctx.rotate(boss.rotation);",
                    "ctx.shadowBlur = 20; ctx.shadowColor = boss.color;",
                    "ctx.strokeStyle = boss.color; ctx.lineWidth = 4;",
                    "ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(40, 20); ctx.lineTo(-40, 20); ctx.closePath(); ctx.stroke();",
                    "ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill();",
                    "ctx.restore();",
                    ...minionDrawLoop
                ],
                minions: [{ name: "Shard", count: 4, hp: 30, logic: { 
                    update: ["const cx = boss.x; const cy = boss.y;", "this.angle = (boss.timer * 0.002) + (index * 1.5);", "this.x = cx + Math.cos(this.angle) * 80;", "this.y = cy + Math.sin(this.angle) * 80;"],
                    draw: ["ctx.fillStyle = boss.color; ctx.beginPath(); ctx.moveTo(this.x, this.y-10); ctx.lineTo(this.x+5, this.y); ctx.lineTo(this.x-5, this.y); ctx.fill();"]
                }}]
            };
        } else if (selectedShape === 'crimson_eye') {
            logicConfig = {
                name: "The All-Seer",
                update: [
                    "const cx = (typeof canvas !== 'undefined') ? canvas.width / 2 : 400;",
                    "boss.x = cx + Math.sin(boss.timer * 0.0005) * 100;",
                    "boss.y = 120 + Math.sin(boss.timer * 0.002) * 20;",
                    "boss.pupilX = (player.x - boss.x) * 0.1;",
                    "boss.pupilY = (player.y - boss.y) * 0.1;",
                    ...fireAimed(800, 9, 8, '#ff0000', 'boss.x + (boss.pupilX||0)', 'boss.y + (boss.pupilY||0)'),
                    ...minionUpdateLoop
                ],
                draw: [
                   "ctx.save(); ctx.translate(boss.x, boss.y);",
                   "ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.arc(0,0, 60, 0, Math.PI*2); ctx.fill();",
                   "const px = Math.max(-20, Math.min(20, boss.pupilX || 0));",
                   "const py = Math.max(-20, Math.min(20, boss.pupilY || 0));",
                   "ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(px,py, 20, 0, Math.PI*2); ctx.fill();",
                   "ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px,py, 8, 0, Math.PI*2); ctx.fill();",
                   "ctx.restore();",
                   ...minionDrawLoop
                ],
                minions: [{ name: "Tear", count: 2, hp: 15, logic: {
                    update: ["this.y += 3; if(this.y > (typeof canvas !== 'undefined' ? canvas.height : 800)) { this.y = boss.y; this.x = boss.x + (Math.random()*40-20); }"],
                    draw: ["ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI*2); ctx.fill();"]
                }}]
            };
        } else if (selectedShape === 'solar_core') {
            logicConfig = {
                name: "Solar Core",
                update: [
                    "// Orbit movement",
                    "const cx = (typeof canvas !== 'undefined') ? canvas.width / 2 : 400;",
                    "boss.x = cx + Math.cos(boss.timer*0.001) * 200;",
                    "boss.y = 150 + Math.sin(boss.timer*0.001) * 50;",
                    ...fireRadial(2000, 12, 5, 6, '#ffaa00'),
                    ...minionUpdateLoop
                ],
                draw: [
                    "ctx.save(); ctx.translate(boss.x, boss.y);",
                    "const pulse = 1 + Math.sin(boss.timer * 0.005) * 0.1;",
                    "ctx.scale(pulse, pulse);",
                    "ctx.shadowBlur = 40; ctx.shadowColor = boss.color;",
                    "ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(0,0, 50, 0, Math.PI*2); ctx.fill();",
                    "ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(0,0, 30, 0, Math.PI*2); ctx.fill();",
                    "ctx.restore();",
                    ...minionDrawLoop
                ],
                minions: [{ name: "Flare", count: 6, hp: 10, logic: {
                    init: ["this.a = index;"],
                    update: ["this.a += 0.05;", "this.x = boss.x + Math.cos(this.a)*90;", "this.y = boss.y + Math.sin(this.a)*90;"],
                    draw: ["ctx.fillStyle = '#ff5500'; ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI*2); ctx.fill();"]
                }}]
            };
        } else {
             logicConfig = {
                name: "Mechanoid Prime",
                update: [
                     "// Chase player on X axis",
                     "boss.x += (player.x > boss.x ? 1 : -1) * 1.5;",
                     "boss.y = 100;",
                     "boss.rotation = Math.atan2(player.y - boss.y, player.x - boss.x);",
                     ...fireSpiral(100, 8, 4, '#00ff00', 'boss.x + Math.cos(boss.rotation)*60', 'boss.y + Math.sin(boss.rotation)*60'),
                     ...minionUpdateLoop
                ],
                draw: [
                    "ctx.save(); ctx.translate(boss.x, boss.y);",
                    "ctx.fillStyle = '#444'; ctx.fillRect(-50, -30, 100, 60);",
                    "ctx.rotate(boss.rotation || 0); ctx.fillStyle = '#888'; ctx.fillRect(0, -10, 60, 20);",
                    "ctx.restore();",
                    ...minionDrawLoop
                ],
                minions: [{ name: "Drone", count: 3, hp: 40, logic: {
                    update: ["this.offsetY = Math.sin((boss.timer + index*100) * 0.003) * 30;", "this.x = boss.x + (index-1)*60;", "this.y = boss.y - 60 + this.offsetY;"],
                    draw: ["ctx.fillStyle = '#0f0'; ctx.fillRect(this.x-10, this.y-10, 20, 20);"]
                }}]
             };
        }

        // --- CUSTOM ENTRANCE & DEATH LOGIC BY TYPE ---
        let entranceConfig, deathConfig;

        if (selectedShape === 'void_prism') {
             // Crystalline: Materialize from shards + Shatter
             entranceConfig = {
                 duration: 4000,
                 init: ["boss.y = 150; boss.scale = 0.1; boss.alpha = 0;"],
                 update: [
                    "// Spin and Scale Up",
                    "boss.scale = Math.min(1, (boss.scale || 0.1) + 0.01);",
                    "boss.alpha = boss.scale;",
                    "boss.rotation = (boss.rotation || 0) + (1.1 - boss.scale) * 0.1;"
                 ],
                 draw: [
                    "ctx.save(); ctx.translate(boss.x, boss.y); ctx.rotate(boss.rotation || 0);",
                    "const s = Math.max(0.1, boss.scale || 0.1);",
                    "ctx.scale(s, s);",
                    "ctx.strokeStyle = boss.color; ctx.lineWidth = 4;", // Fixed line width
                    "// Draw fragmented wireframe",
                    "ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(40, 20); ctx.lineTo(-40, 20); ctx.closePath(); ctx.stroke();",
                    "ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill();", // Added core match
                    "ctx.restore();"
                 ]
             };
             deathConfig = {
                 duration: 3000,
                 draw: [
                     "// Shatter effect",
                     "const p = progress; // 0 to 1",
                     "ctx.save(); ctx.translate(boss.x, boss.y);",
                     "ctx.fillStyle = boss.color;",
                     "// Top Shard",
                     "ctx.save(); ctx.translate(0, -50 - p*100); ctx.rotate(p); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(20,40); ctx.lineTo(-20,40); ctx.fill(); ctx.restore();",
                     "// Left Shard",
                     "ctx.save(); ctx.translate(-40 - p*80, 20 + p*50); ctx.rotate(-p); ctx.fillRect(-10, -10, 20, 20); ctx.restore();",
                     "// Right Shard",
                     "ctx.save(); ctx.translate(40 + p*80, 20 + p*50); ctx.rotate(p*2); ctx.fillRect(-10, -10, 20, 20); ctx.restore();",
                     "ctx.restore();"
                 ]
             };
        } else if (selectedShape === 'crimson_eye') {
             // Organic: Fade in from darkness + Close Eye/Implode
             entranceConfig = {
                 duration: 3000,
                 init: ["boss.y = 100; boss.lidOpen = 0; boss.x = (typeof canvas !== 'undefined') ? canvas.width / 2 : 400;"],
                 update: [
                    "// Eye opens slowly",
                    "boss.lidOpen = Math.min(1, (boss.lidOpen || 0) + 0.005);",
                    "boss.y = 120 + Math.sin(Date.now() * 0.002) * 20;" // Match idle movement
                 ],
                 draw: [
                    "ctx.save(); ctx.translate(boss.x, boss.y);",
                    "const lid = Math.max(0.1, boss.lidOpen || 0);",
                    "ctx.fillStyle = '#fff';",
                    "ctx.beginPath(); ctx.ellipse(0, 0, 60, 60 * lid, 0, 0, Math.PI*2); ctx.fill();",
                    "// Pupil",
                    "ctx.scale(1, lid);",
                    "ctx.fillStyle = boss.color; ctx.beginPath(); ctx.arc(0,0, 20, 0, Math.PI*2); ctx.fill();",
                    "ctx.restore();"
                 ]
             };
             deathConfig = {
                 duration: 2500,
                 draw: [
                     "// Eye Closes and Bleeds",
                     "const p = Math.max(0, 1 - progress);",
                     "ctx.save(); ctx.translate(boss.x, boss.y);",
                     "ctx.fillStyle = '#400';",
                     "ctx.beginPath(); ctx.ellipse(0, 0, 60, 60 * p, 0, 0, Math.PI*2); ctx.fill();",
                     "// Blood Drops",
                     "ctx.fillStyle = '#f00';",
                     "for(let i=0; i<5; i++) {",
                     "   const y = progress * 200 + i*20;",
                     "   ctx.globalAlpha = 1 - progress;",
                     "   ctx.beginPath(); ctx.arc(-20 + i*10, y, 4, 0, Math.PI*2); ctx.fill();",
                     "}",
                     "ctx.restore();"
                 ]
             };
        } else if (selectedShape === 'solar_core') {
             // Star: Nebular Condensation -> Critical Mass -> Ignition
             entranceConfig = {
                 duration: 4500,
                 init: ["boss.y = 150; boss.x = (typeof canvas !== 'undefined') ? canvas.width / 2 : 400;"],
                 update: [], // Logic handled in draw for precise timing phases
                 draw: [
                    "ctx.save(); ctx.translate(boss.x, boss.y);",
                    "const p = progress;",
                    
                    "if (p < 0.6) {",
                        "// PHASE 1: GATHERING ENERGY (0% - 60%)",
                        "const phaseP = p / 0.6;", // 0 to 1
                        "const r = 400 * (1 - phaseP) + 10;", // Shrinks from 400 to 10
                        "ctx.rotate(Date.now() * 0.005 + (phaseP * 10));", // Spin faster",
                        "ctx.strokeStyle = boss.color;",
                        "ctx.globalAlpha = Math.min(1, phaseP * 2);", 
                        "// Draw swirling accumulation lines",
                        "for(let i=0; i<8; i++) {",
                            "ctx.rotate(Math.PI/4);",
                            "ctx.beginPath(); ctx.arc(r, 0, 5, 0, Math.PI*2); ctx.fill();", // Particles",
                            "ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(r + 100 * (1-phaseP), 0); ctx.stroke();", // Trails",
                        "}",
                    "} else if (p < 0.75) {",
                        "// PHASE 2: CRITICAL MASS (60% - 75%)",
                        "// Tiny unstable white dot",
                        "ctx.fillStyle = '#fff';",
                        "ctx.shadowBlur = 20 + Math.random()*20; ctx.shadowColor = '#fff';",
                        "const shake = (Math.random() - 0.5) * 5;",
                        "ctx.beginPath(); ctx.arc(shake, shake, 6, 0, Math.PI*2); ctx.fill();",
                    "} else {",
                        "// PHASE 3: IGNITION & STABILIZATION (75% - 100%)",
                        "const phaseP = (p - 0.75) / 0.25;", // 0 to 1
                        "// Explosive growth to main size (Radius ~50)",
                        "const mainR = 50;",
                        "const currR = mainR * Math.min(1, phaseP * 2);", // Overshoot slightly?",
                        
                        "// Core",
                        "ctx.fillStyle = '#fff';",
                        "ctx.shadowBlur = 50; ctx.shadowColor = boss.color;",
                        "ctx.beginPath(); ctx.arc(0,0, currR, 0, Math.PI*2); ctx.fill();",
                        
                        "// Shockwave Ring expanding outward",
                        "if (phaseP < 0.8) {",
                            "ctx.strokeStyle = boss.color;",
                            "ctx.lineWidth = 20 * (1 - phaseP);",
                            "ctx.beginPath(); ctx.arc(0,0, phaseP * 300, 0, Math.PI*2); ctx.stroke();",
                        "}",
                    "}",
                    "ctx.restore();"
                 ]
             };
             deathConfig = {
                 duration: 4000,
                 draw: [
                     "// Supernova Expansion",
                     "const r = Math.max(1, progress * 1000);", 
                     "ctx.save(); ctx.translate(boss.x, boss.y);",
                     "ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2);",
                     "const g = ctx.createRadialGradient(0,0,r*0.2, 0,0,r);",
                     "g.addColorStop(0, '#fff');",
                     "g.addColorStop(0.5, boss.color);",
                     "g.addColorStop(1, 'rgba(0,0,0,0)');", 
                     "ctx.fillStyle = g;",
                     "ctx.globalAlpha = 1 - progress;",
                     "ctx.fill();",
                     "ctx.restore();"
                 ]
             };
        } else {
             // Mechanoid: Drop from sky + Explosions
             entranceConfig = {
                 duration: 2000,
                 init: ["boss.y = -200; boss.vy = 10; boss.x = 400;"],
                 update: [
                    "// Heavy Drop",
                    "if(boss.y < 100) { boss.y += boss.vy; boss.vy *= 1.1; }",
                    "else { boss.y = 100; if(Math.abs(boss.vy) > 1) { boss.vy = -boss.vy * 0.3; } else { boss.vy = 0; } }" // Bounce
                 ],
                 draw: [
                    "ctx.save(); ctx.translate(boss.x, boss.y);",
                    "// Speed lines if falling",
                    "if(boss.y < 90) {",
                    "   ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;",
                    "   ctx.beginPath(); ctx.moveTo(-30, -50); ctx.lineTo(-30, -150); ctx.stroke();",
                    "   ctx.beginPath(); ctx.moveTo(30, -50); ctx.lineTo(30, -150); ctx.stroke();",
                    "}",
                    "// Match Main Draw exactly",
                    "ctx.fillStyle = '#444'; ctx.fillRect(-50, -30, 100, 60);",
                    "ctx.rotate(Math.PI/2); ctx.fillStyle = '#888'; ctx.fillRect(0, -10, 60, 20);",
                    "ctx.restore();"
                 ]
             };
             deathConfig = {
                 duration: 3000,
                 draw: [
                     "ctx.save(); ctx.translate(boss.x, boss.y);",
                     "// Flicker Visibility",
                     "if(Math.random() > 0.5) {",
                     "   ctx.fillStyle = '#222'; ctx.fillRect(-50, -30, 100, 60);",
                     "}",
                     "// Random Explosions",
                     "const ex = (Math.random()-0.5) * 100;",
                     "const ey = (Math.random()-0.5) * 60;",
                     "ctx.fillStyle = '#f90';",
                     "ctx.beginPath(); ctx.arc(ex, ey, Math.random()*20+10, 0, Math.PI*2); ctx.fill();",
                     "ctx.restore();"
                 ]
             };
        }

        return {
            id: bossId,
            name: `${logicConfig.name} MK-${Math.floor(Math.random() * 9)}`,
            description: "A procedurally generated guardian.",
            visualType: selectedShape,
            color: color,
            hpMult: 1.5,
            attackChance: 0.1,
            replaceSprite: true,
            enabled: true,
            generatedByAI: false,
            logic: {
                drawHp: [
                   "const w = boss.radius * 2 * (pct/100);",
                   "ctx.fillStyle = boss.color;",
                   "ctx.shadowBlur = 10; ctx.shadowColor = boss.color;",
                   "ctx.fillRect(boss.x - boss.radius, boss.y - boss.radius - 20, w, 4);",
                   "ctx.shadowBlur = 0;"
                ],
                update: logicConfig.update,
                draw: logicConfig.draw,
                entrance: entranceConfig,
                death: deathConfig,
                minions: logicConfig.minions
            }
        };
    }
    */

    async saveGeneratedBoss(bossData) {
        try {
            const newBoss = new Boss(bossData);
            await newBoss.save();
            console.log("AI GENERATOR: Boss saved to DB:", newBoss.id);
            return newBoss;
        } catch(err) {
            console.error("AI GENERATOR: DB Save Error", err);
            throw err;
        }
    }
    async _executeDeepSeekGeneration(theme, antiPatterns, antiPatternCode, log) {
        const features = [
            "Time Manipulation", "Gravity Distortion", "Screen Hacking", "Bullet Hell", "Laser Grid", 
            "Minion Swarm", "Mirror Illusion", "Black Hole", "Orbital Bombardment", "Ricochet Walls",
            "Color Absorption", "Pixel Disintegration", "Reverse Controls", "Shape Shifting"
        ];
        const randomFeature = features[Math.floor(Math.random() * features.length)];

        const finalPrompt = `${this.systemPrompt}\n\n` + 
            `MISSION BRIEFING (GENERATE A COMPLETELY NEW BOSS CONCEPT):\n` +
            `1. THEME: "${theme}"\n` + 
            `2. EXISTING BOSS DATABASE (BLACKLIST): [${antiPatterns}]\n` + 
            `3. FORBIDDEN CODE PATTERNS: \`\`\`javascript\n${antiPatternCode}\n\`\`\`\n` +
            `4. SPECIAL MECHANIC: Incorporate "${randomFeature}"\n` + 
            `5. OUTPUT FORMAT: PURE JSON ONLY. NO MARKDOWN. NO EXPLANATIONS.`;

        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.deepseekKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat", // DeepSeek-V3
                messages: [
                    { role: "system", content: "You are a specialized JSON boss generator for a web game." },
                    { role: "user", content: finalPrompt }
                ],
                response_format: { type: 'json_object' },
                temperature: 1.0
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`DeepSeek API error (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Clean and Parse
        const cleanText = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const bossData = JSON.parse(cleanText);

        // ID & Metadata
        bossData.id = "boss_" + Math.random().toString(36).substr(2, 9);
        bossData.generatedByAI = true;
        bossData.createdAt = new Date();
        
        return bossData;
    }
}

module.exports = new AiGenerator();
