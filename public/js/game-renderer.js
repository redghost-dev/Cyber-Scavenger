// Shared Game Renderer v1.0
// Unifies rendering logic between Game and Admin Panel

window.SpriteCache = {};

window.GameRenderer = {
    // Helper: Color adjust
    adjustColor: (hex, amt) => {
        let usePound = false;
        if (hex[0] == "#") { hex = hex.slice(1); usePound = true; }
        let num = parseInt(hex, 16);
        let r = (num >> 16) + amt;
        if (r > 255) r = 255; else if (r < 0) r = 0;
        let b = ((num >> 8) & 0x00FF) + amt;
        if (b > 255) b = 255; else if (b < 0) b = 0;
        let g = (num & 0x0000FF) + amt;
        if (g > 255) g = 255; else if (g < 0) g = 0;
        return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
    },

    createNeonSprite: function(color, radius, blur = 10, shape = 'circle') {
        // Normalize color to ensure cache hits
        color = color.toLowerCase().trim();
        const key = `${color}-${radius}-${blur}-${shape}`;
        if (SpriteCache[key]) return SpriteCache[key];

        // Create an off-screen canvas
        const padding = Math.max(blur * 3, radius * 2); 
        const size = Math.ceil((radius + padding) * 2);
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        const center = size / 2;

        ctx.save();
        ctx.translate(center, center);

        // Core Gradient
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        coreGrad.addColorStop(0, '#ffffff'); 
        coreGrad.addColorStop(0.4, color);   
        coreGrad.addColorStop(1, 'transparent');

        // Outer Glow
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        if (shape === 'circle' || shape === 'orb') {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = blur * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === 'missile') {
             ctx.fillStyle = color;
             ctx.beginPath();
             ctx.moveTo(0, -radius * 1.5); 
             ctx.lineTo(radius * 0.8, radius); 
             ctx.lineTo(0, radius * 0.5); 
             ctx.lineTo(-radius * 0.8, radius); 
             ctx.closePath();
             ctx.fill();
             ctx.fillStyle = '#fff';
             ctx.fillRect(-2, -radius, 4, radius);
        } else if (shape === 'bolt') {
             ctx.lineCap = 'round';
             ctx.lineWidth = radius;
             ctx.strokeStyle = color;
             ctx.shadowBlur = blur * 1.5; 
             ctx.beginPath();
             ctx.moveTo(0, radius);
             ctx.lineTo(0, -radius * 2); 
             ctx.stroke();
             ctx.lineWidth = radius * 0.4;
             ctx.strokeStyle = '#fff';
             ctx.shadowBlur = 5;
             ctx.stroke();
        } else if (shape === 'bullet') {
             ctx.scale(0.8, 1.2); 
             ctx.beginPath();
             ctx.arc(0, 0, radius, 0, Math.PI*2);
             ctx.fill();
             ctx.fillStyle = 'rgba(255,255,255,0.8)';
             ctx.beginPath();
             ctx.arc(-radius*0.3, -radius*0.3, radius*0.3, 0, Math.PI*2);
             ctx.fill();
        } else if (shape === 'square') {
            ctx.shadowBlur = 0; 
            ctx.fillStyle = color;
            ctx.fillRect(-radius, -radius, radius*2, radius*2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-radius, -radius, radius*2, radius*2);
        } else if (shape === 'triangle') {
            ctx.fillStyle = '#fff'; 
            ctx.beginPath();
            ctx.moveTo(0, -radius * 2); 
            ctx.lineTo(radius * 0.6, radius);
            ctx.lineTo(-radius * 0.6, radius);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        ctx.restore();
        
        SpriteCache[key] = {
            image: c,
            size: size,
            offset: center
        };
        return SpriteCache[key];
    },

    createRealisticBossSprite: function(type, color, radius) {
        // Fix Key Mismatch
        const key = `boss-${color}-${radius}-${type}`;
        
        if (SpriteCache[key]) return SpriteCache[key];

        const size = radius * 4; 
        const center = size / 2;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        
        ctx.translate(center, center);
        
        // --- 3D RENDERING LOGIC ---
        
        if (type === 'mech') {
            // TITAN MECH
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.moveTo(0, radius*1.6);
            ctx.lineTo(radius*1.1, -radius*1.3);
            ctx.lineTo(-radius*1.1, -radius*1.3);
            ctx.closePath();
            ctx.fill();

            const leftGrad = ctx.createLinearGradient(-radius, 0, 0, 0);
            leftGrad.addColorStop(0, '#222'); leftGrad.addColorStop(1, '#555'); 
            ctx.fillStyle = leftGrad;
            ctx.beginPath();
            ctx.moveTo(0, radius * 1.5); ctx.lineTo(0, -radius * 1.1); ctx.lineTo(-radius * 0.9, -radius * 1.2); ctx.closePath();
            ctx.fill();
            
            const rightGrad = ctx.createLinearGradient(0, 0, radius, 0);
            rightGrad.addColorStop(0, '#666'); rightGrad.addColorStop(1, '#333'); 
            ctx.fillStyle = rightGrad;
            ctx.beginPath();
            ctx.moveTo(0, radius * 1.5); ctx.lineTo(radius * 0.9, -radius * 1.2); ctx.lineTo(0, -radius * 1.1); ctx.closePath();
            ctx.fill();
            
            const towerW = radius * 0.4;
            const towerH = radius * 0.3;
            const towerY = -radius * 0.9;
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.moveTo(0, towerY); ctx.lineTo(towerW/2, towerY + towerH/2);
            ctx.lineTo(0, towerY + towerH); ctx.lineTo(-towerW/2, towerY + towerH/2);
            ctx.closePath(); ctx.fill();

            [ -radius*0.5, radius*0.5 ].forEach(x => {
                const engY = -radius * 1.2;
                const engW = radius * 0.25;
                const grad = ctx.createRadialGradient(x, engY, 0, x, engY, engW);
                grad.addColorStop(0, '#fff'); grad.addColorStop(0.4, '#ff8800'); grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(x, engY, engW*1.5, 0, Math.PI*2); ctx.fill();
            });

        } else if (type === 'interceptor') {
            // VIPER JET
            const draw3DWing = (scaleX) => {
                ctx.save();
                ctx.scale(scaleX, 1);
                const frameGrad = ctx.createLinearGradient(0, -radius, radius*2, radius);
                frameGrad.addColorStop(0, '#666'); frameGrad.addColorStop(0.5, '#444'); frameGrad.addColorStop(1, '#888');
                ctx.fillStyle = frameGrad;
                ctx.beginPath();
                ctx.moveTo(radius * 0.7, 0); 
                ctx.lineTo(radius * 1.5, -radius * 1.1); ctx.lineTo(radius * 1.5, -radius * 0.3);
                ctx.lineTo(radius * 1.0, 0); ctx.lineTo(radius * 1.5, radius * 0.3); ctx.lineTo(radius * 1.5, radius * 1.1);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#050505';
                ctx.beginPath();
                ctx.moveTo(radius * 0.8, 0); ctx.lineTo(radius * 1.4, -radius * 1.0); ctx.lineTo(radius * 1.4, -radius * 0.4); 
                ctx.lineTo(radius * 1.1, 0); ctx.lineTo(radius * 1.4, radius * 0.4); ctx.lineTo(radius * 1.4, radius * 1.0); 
                ctx.closePath(); ctx.fill();
                ctx.restore();
            };
            draw3DWing(1); draw3DWing(-1);
            
            const sphereGrad = ctx.createRadialGradient(-radius*0.15, -radius*0.15, 2, 0, 0, radius*0.4);
            sphereGrad.addColorStop(0, '#fff'); sphereGrad.addColorStop(0.2, '#888'); sphereGrad.addColorStop(1, '#111');
            ctx.fillStyle = sphereGrad;
            ctx.beginPath(); ctx.arc(0, 0, radius*0.4, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, radius*0.18, 0, Math.PI*2); ctx.fill(); ctx.stroke();

        } else if (type === 'station') {
            // DEATH STAR
            const sphereGrad = ctx.createRadialGradient(-radius*0.4, -radius*0.4, radius*0.1, 0, 0, radius);
            sphereGrad.addColorStop(0, '#777'); sphereGrad.addColorStop(0.5, '#444'); sphereGrad.addColorStop(1, '#111');
            ctx.fillStyle = sphereGrad;
            ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.fill();
            
            ctx.save();
            ctx.beginPath(); ctx.arc(0,0,radius,0,Math.PI*2); ctx.clip();
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath(); ctx.ellipse(0, 0, radius, radius*0.1, 0, 0, Math.PI*2); ctx.fill();
            ctx.restore();
            
            const dishX = -radius * 0.4; const dishY = -radius * 0.4; const dishR = radius * 0.35;
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.ellipse(dishX, dishY, dishR, dishR * 0.8, Math.PI*0.1, 0, Math.PI*2); ctx.fill();
            const dishGrad = ctx.createRadialGradient(dishX - 5, dishY - 5, 2, dishX, dishY, dishR);
            dishGrad.addColorStop(0, '#222'); dishGrad.addColorStop(0.8, '#555');
            ctx.fillStyle = dishGrad;
            ctx.beginPath(); ctx.ellipse(dishX, dishY, dishR*0.9, dishR*0.7, Math.PI*0.1, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 20; ctx.shadowColor = '#0f0'; ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(dishX, dishY, 4, 0, Math.PI*2); ctx.fill();

        } else if (type === 'vanguard') {
            // OBSIDIAN VANGUARD
            ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000'; ctx.fillStyle = 'rgba(50, 0, 0, 0.2)';
            ctx.beginPath(); ctx.moveTo(0, -radius * 1.6); ctx.lineTo(radius * 1.2, radius * 1.1); ctx.lineTo(0, radius * 0.6);
            ctx.lineTo(-radius * 1.2, radius * 1.1); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;

            ctx.fillStyle = '#1a1a1a'; 
            ctx.beginPath(); ctx.moveTo(0, -radius * 1.5); ctx.lineTo(0, radius * 0.5); ctx.lineTo(-radius * 1.2, radius * 1.1); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#222'; 
            ctx.beginPath(); ctx.moveTo(0, -radius * 1.5); ctx.lineTo(radius * 1.2, radius * 1.1); ctx.lineTo(0, radius * 0.5); ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.moveTo(0, -radius * 1.5); ctx.lineTo(radius * 0.2, radius * 0.6); ctx.lineTo(0, radius * 0.8); ctx.lineTo(-radius * 0.2, radius * 0.6); ctx.closePath(); ctx.fill();

            ctx.shadowBlur = 10; ctx.shadowColor = '#ff3333'; ctx.fillStyle = '#ff0000';
            ctx.beginPath(); ctx.moveTo(0, -radius * 0.5); ctx.lineTo(radius * 0.15, -radius * 0.3); ctx.lineTo(0, -radius * 0.1); ctx.lineTo(-radius * 0.15, -radius * 0.3); ctx.closePath(); ctx.fill();

            ctx.strokeStyle = '#ff3333'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-radius * 0.4, 0); ctx.lineTo(-radius * 0.8, radius*0.5);
            ctx.moveTo(radius * 0.4, 0); ctx.lineTo(radius * 0.8, radius*0.5); ctx.stroke();

        } else if (type === 'dreadnought') {
            // ORBITAL DREADNOUGHT
            const r = radius;
            const engGrad = ctx.createLinearGradient(-r, 0, r, 0);
            engGrad.addColorStop(0, '#111'); engGrad.addColorStop(0.5, '#222'); engGrad.addColorStop(1, '#111');
            ctx.fillStyle = engGrad; ctx.fillRect(-r*0.6, r*0.4, r*1.2, r*0.6); 
            
            ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff'; ctx.fillStyle = '#ccffff';
            [-r*0.4, 0, r*0.4].forEach(x => { ctx.beginPath(); ctx.arc(x, r*0.9, r*0.15, 0, Math.PI*2); ctx.fill(); });
            ctx.shadowBlur = 0;

            const hullGrad = ctx.createLinearGradient(-r, -r, -r, r);
            hullGrad.addColorStop(0, '#444'); hullGrad.addColorStop(1, '#222');
            ctx.fillStyle = hullGrad;
            ctx.beginPath(); ctx.moveTo(-r*0.5, r*0.4); ctx.lineTo(-r*0.8, -r*0.2); ctx.lineTo(-r*1.1, -r*0.6); ctx.lineTo(r*1.1, -r*0.6); 
            ctx.lineTo(r*0.8, -r*0.2); ctx.lineTo(r*0.5, r*0.4); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.stroke();

            ctx.fillStyle = '#111'; ctx.fillRect(-r*0.3, -r*0.1, r*0.6, r*0.4);
            ctx.fillStyle = '#555'; ctx.fillRect(-r*0.25, -r*0.05, r*0.5, r*0.3);

            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(-r*0.9, -r*0.6, r*0.15, 0, Math.PI*2); ctx.arc(r*0.9, -r*0.6, r*0.15, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.arc(-r*0.9, -r*0.6, r*0.08, 0, Math.PI*2); ctx.arc(r*0.9, -r*0.6, r*0.08, 0, Math.PI*2); ctx.fill();

        } else if (type === 'seraphim') {
            // THE SERAPHIM
            const r = radius * 1.5;
            const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r*0.3);
            coreGrad.addColorStop(0, '#ffffff'); coreGrad.addColorStop(0.6, '#ffd700'); coreGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.shadowBlur = 30; ctx.shadowColor = '#ffd700'; ctx.fillStyle = coreGrad;
            ctx.beginPath(); ctx.arc(0, 0, r*0.3, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

            // Inner rings moved to dynamic rendering for animation
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, 0, r*0.9, 0, Math.PI*2); ctx.stroke();
            
            // Satellites moved to dynamic rendering for animation
            
        } else {
            // FALLBACK
            ctx.shadowBlur = 0; ctx.fillStyle = '#2a2a2a';
            ctx.beginPath(); ctx.moveTo(0, radius * 1.5); ctx.lineTo(radius * 0.9, -radius * 1.2); ctx.lineTo(0, -radius * 0.8); ctx.lineTo(-radius * 0.9, -radius * 1.2); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#444'; ctx.fillRect(-radius*0.2, -radius*0.9, radius*0.4, radius*0.5);
            ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, radius * 1.3); ctx.lineTo(radius * 0.6, -radius * 1.0);
            ctx.moveTo(0, radius * 1.3); ctx.lineTo(-radius * 0.6, -radius * 1.0); ctx.stroke();
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(-radius*0.5, 0, radius*0.15, 0, Math.PI*2); ctx.arc(radius*0.5, 0, radius*0.15, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 15; ctx.shadowColor = color; ctx.fillStyle = color;
            ctx.fillRect(-radius*0.6, -radius*1.2, radius*0.3, radius*0.2); ctx.fillRect(radius*0.3, -radius*1.2, radius*0.3, radius*0.2);
        }

        // Cache It
        SpriteCache[key] = {
            image: c,
            size: size,
            offset: center
        };
        return SpriteCache[key];
    }
};
