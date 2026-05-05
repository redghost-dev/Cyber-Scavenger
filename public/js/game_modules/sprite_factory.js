// Sprite Manager
// Handles off-screen pre-rendering of common assets to improve performance

window.SpriteCache = {};

window.createRealisticBossSprite = function(type, color, radius) {
    const key = `boss-${color}-${radius}-${type}`;
    
    if (window.SpriteCache[key]) return window.SpriteCache[key];

    const size = radius * 4; // Plenty of room for effects
    const center = size / 2;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    
    // --- 3D RENDERING LOGIC ---
    ctx.translate(center, center);
    
    // Helper: Color adjust
    const adjustColor = (hex, amt) => {
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
    }

    if (type === 'seraphim') {
        // THE SERAPHIM - Biblically Accurate Angel Tech
        // Rings within rings, glowing core
        
        const r = radius * 1.5;
        
        // 1. The Core (Pure Energy)
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r*0.3);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.6, '#ffd700'); // Gold
        coreGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ffd700';
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r*0.3, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 2. Rotating Rings (Gyroscope effect simulation)
        // Ring A
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, r*0.8, r*0.2, Math.PI/4, 0, Math.PI*2);
        ctx.stroke();
        
        // Ring B
        ctx.strokeStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(0, 0, r*0.8, r*0.2, -Math.PI/4, 0, Math.PI*2);
        ctx.stroke();
        
        // Ring C (Outer Halo)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, r*0.9, 0, Math.PI*2);
        ctx.stroke();
        
        // 3. Floating Relics (Triangles orbiting)
        ctx.fillStyle = '#fff';
        [0, Math.PI*2/3, Math.PI*4/3].forEach(angle => {
            const tx = Math.cos(angle) * r * 0.9;
            const ty = Math.sin(angle) * r * 0.9;
            ctx.beginPath();
            ctx.moveTo(tx, ty - 5);
            ctx.lineTo(tx + 4, ty + 4);
            ctx.lineTo(tx - 4, ty + 4);
            ctx.closePath();
            ctx.fill();
        });

    } else {
        // FALLBACK
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(0, radius * 1.5);
        ctx.lineTo(radius * 0.9, -radius * 1.2);
        ctx.lineTo(0, -radius * 0.8);
        ctx.lineTo(-radius * 0.9, -radius * 1.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#444'; 
        ctx.fillRect(-radius*0.2, -radius*0.9, radius*0.4, radius*0.5);
        
        ctx.strokeStyle = '#666'; 
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, radius * 1.3); ctx.lineTo(radius * 0.6, -radius * 1.0);
        ctx.moveTo(0, radius * 1.3); ctx.lineTo(-radius * 0.6, -radius * 1.0);
        ctx.stroke();

        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-radius*0.5, 0, radius*0.15, 0, Math.PI*2);
        ctx.arc(radius*0.5, 0, radius*0.15, 0, Math.PI*2);
        ctx.fill();
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = color; 
        ctx.fillStyle = color;
        ctx.fillRect(-radius*0.6, -radius*1.2, radius*0.3, radius*0.2);
        ctx.fillRect(radius*0.3, -radius*1.2, radius*0.3, radius*0.2);
    }

    // Cache It
    window.SpriteCache[key] = {
        image: c,
        size: size,
        offset: center
    };
    return window.SpriteCache[key];
}

window.createNeonSprite = function(color, radius, blur = 10, shape = 'circle') {
    // Normalize color to ensure cache hits
    color = color.toLowerCase().trim();
    const key = `${color}-${radius}-${blur}-${shape}`;
    if (window.SpriteCache[key]) return window.SpriteCache[key];

    // Create an off-screen canvas
    // Increase padding for wider glows
    const padding = Math.max(blur * 3, radius * 2); 
    const size = Math.ceil((radius + padding) * 2);
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const center = size / 2;

    // 2050 SCI-FI RENDERER
    // All sprites get a High-Energy Core + Outer Halo
    
    ctx.save();
    ctx.translate(center, center);

    // Core Gradient (White Hot Center)
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    coreGrad.addColorStop(0, '#ffffff'); // White hot core
    coreGrad.addColorStop(0.4, color);   // Main color body
    coreGrad.addColorStop(1, 'transparent');

    // Outer Glow (Soft Halo)
    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
    ctx.fillStyle = color;

    if (shape === 'circle' || shape === 'orb') {
        // ENERGY ORB: Pulse Core
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright core
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = blur * 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

    } else if (shape === 'missile') {
            // MAGMA MISSILE: Sharp, Angular, Thruster Trail
            // Main Body (Triangle)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, -radius * 1.5); // Nose
            ctx.lineTo(radius * 0.8, radius); // Right rear
            ctx.lineTo(0, radius * 0.5); // Engine indent
            ctx.lineTo(-radius * 0.8, radius); // Left rear
            ctx.closePath();
            ctx.fill();
            
            // Tech Details
            ctx.fillStyle = '#fff';
            ctx.fillRect(-2, -radius, 4, radius);

    } else if (shape === 'bolt') {
            // PLASMA BOLT: Long, Energy Streak
            // Glowing core line
            ctx.lineCap = 'round';
            ctx.lineWidth = radius;
            ctx.strokeStyle = color;
            ctx.shadowBlur = blur * 1.5; // Extra glow
            ctx.beginPath();
            ctx.moveTo(0, radius);
            ctx.lineTo(0, -radius * 2); // Long tail
            ctx.stroke();
            
            // White hot center line
            ctx.lineWidth = radius * 0.4;
            ctx.strokeStyle = '#fff';
            ctx.shadowBlur = 5;
            ctx.stroke();

    } else if (shape === 'bullet') {
            // KINETIC SLUG: Omni-directional heavy round
            ctx.scale(0.8, 1.2); 
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI*2);
            ctx.fill();
            
            // Metallic sheen
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath();
            ctx.arc(-radius*0.3, -radius*0.3, radius*0.3, 0, Math.PI*2);
            ctx.fill();

    } else if (shape === 'square') {
        // HEAVY BLOCK
        ctx.shadowBlur = 0; // Sharp edges
        ctx.fillStyle = color;
        ctx.fillRect(-radius, -radius, radius*2, radius*2);
        
        // Energy Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-radius, -radius, radius*2, radius*2);

    } else if (shape === 'triangle') {
        // ION SHARD: Sharp crystalline
        ctx.fillStyle = '#fff'; // White core
        ctx.beginPath();
        ctx.moveTo(0, -radius * 2); // Long tip
        ctx.lineTo(radius * 0.6, radius);
        ctx.lineTo(-radius * 0.6, radius);
        ctx.closePath();
        ctx.fill();
        
        // Colored Aura
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

    } else if (shape === 'interceptor') {
        // Void Interceptor Ship Sprite
        const r = radius * 1.2;
        ctx.fillStyle = '#111';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(0, -r); // Nose
        ctx.lineTo(r, r); // Right Wing
        ctx.lineTo(0, r*0.5); // Engine
        ctx.lineTo(-r, r); // Left Wing
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

    } else if (shape === 'bomber') {
        // Bomber Ship
        const r = radius * 1.2;
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r, r*0.5);
        ctx.lineTo(r*0.5, r);
        ctx.lineTo(-r*0.5, r);
        ctx.lineTo(-r, r*0.5);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, r*0.3, 0, Math.PI*2);
        ctx.fill();

    } else if (shape === 'stealth') {
        // Stealth Ship
        const r = radius * 1.5;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r, r*0.8);
        ctx.lineTo(0, r*0.2); // Tail notch
        ctx.lineTo(-r, r*0.8);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

    } else if (shape === 'vanguard') {
        // OBSIDIAN VANGUARD: Sharp, Needle-like, Assassin
        const r = radius * 1.5;
        
        // Motion Blur / Phase Shift Effect (Outer Ghost)
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.2);
        ctx.lineTo(r * 0.4, r);
        ctx.lineTo(0, r * 0.8);
        ctx.lineTo(-r * 0.4, r);
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Main Hull - Pitch Black "Obsidian" with red sensors
        ctx.fillStyle = '#000'; // Pure black
        
        // We use a slight gradient to show edges on black
        const grad = ctx.createLinearGradient(-r, 0, r, 0);
        grad.addColorStop(0, '#111');
        grad.addColorStop(0.5, '#000');
        grad.addColorStop(1, '#111');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(0, -r); // Nose
        ctx.lineTo(r * 0.3, r * 0.8); // Right Wing Tip
        ctx.lineTo(0, r * 0.5); // Rear Center
        ctx.lineTo(-r * 0.3, r * 0.8); // Left Wing Tip
        ctx.closePath();
        ctx.fill();
        
        // Red Sensor Eyes
        ctx.fillStyle = '#f00';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#f00';
        ctx.beginPath();
        ctx.rect(-r*0.05, -r*0.4, r*0.1, r*0.4); // Thin vertical sensor
        ctx.fill();

    } else if (shape === 'dreadnought') {
        // ORBITAL DREADNOUGHT: Asymmetric, Industrial, Gatling Guns
        const r = radius * 1.8;
        
        // Hull Gradient (Rusty/Industrial Metal)
        const hullGrad = ctx.createLinearGradient(-r, -r, r, r);
        hullGrad.addColorStop(0, '#3a3a3a');
        hullGrad.addColorStop(0.5, '#222');
        hullGrad.addColorStop(1, '#3a3a3a');
        
        ctx.fillStyle = hullGrad;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;

        // Main Blocky Body
        ctx.beginPath();
        ctx.moveTo(-r*0.6, -r*0.8);
        ctx.lineTo(r*0.8, -r*0.6); // Slightly angled front
        ctx.lineTo(r*0.6, r*0.6);
        ctx.lineTo(-r*0.8, r*0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Detail: Gatling Gun (Left)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-r*0.6, 0, r*0.25, 0, Math.PI*2);
        ctx.fill();
        // Gun Barrels
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r*0.6, 0); ctx.lineTo(-r*0.6, -r*0.6); // Barrel up
        ctx.stroke();

        // Detail: Missile Pods (Right)
        ctx.fillStyle = '#444';
        ctx.fillRect(r*0.2, -r*0.4, r*0.3, r*0.6);
        // Missile tips
        ctx.fillStyle = '#f00'; 
        ctx.beginPath(); ctx.arc(r*0.35, -r*0.2, r*0.05, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(r*0.35, 0, r*0.05, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(r*0.35, 0.2*r, r*0.05, 0, Math.PI*2); ctx.fill();

    } else if (shape === 'seraphim') {
        // THE SERAPHIM: Abstract, Holy, Shape-shifting geometry
        const r = radius * 1.6;
        
        // Outer RingComponents (Floating geometry)
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        // We draw a "Star of David" style interlocking geometry
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r*0.86, r*0.5);
        ctx.lineTo(-r*0.86, r*0.5);
        ctx.closePath();
        ctx.stroke(); // Triangle 1
        
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.lineTo(-r*0.86, -r*0.5);
        ctx.lineTo(r*0.86, -r*0.5);
        ctx.closePath();
        ctx.stroke(); // Triangle 2 (Inverted)
        
        // Core: Pure Light
        ctx.fillStyle = '#fff';
        ctx.shadowColor = color; // Gold/White glow
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, r*0.3, 0, Math.PI*2);
        ctx.fill();
        
    } else {
        // Default Circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    
    // Store it
    window.SpriteCache[key] = {
        image: c,
        size: size,
        offset: center // To center it when drawing
    };
    return window.SpriteCache[key];
}

window.preRenderAssets = function() {
    // Pre-render common particle colors
    const commonColors = ['#ff0000', '#00fbff', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff', '#ff0055', '#800000'];
    const commonSizes = [1, 2, 3, 4, 5, 6, 8, 10]; // Common particle & projectile sizes

    commonColors.forEach(color => {
        commonSizes.forEach(size => {
            window.createNeonSprite(color, size, 10); // Standard glow
            window.createNeonSprite(color, size, 5);  // Low glow
            window.createNeonSprite(color, size, 20); // High glow
        });
    });
    console.log("Assets Pre-Rendered: " + Object.keys(window.SpriteCache).length + " sprites cached.");
}
