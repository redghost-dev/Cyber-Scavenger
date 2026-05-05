// Global Game State Management
window.GameState = {
    // Canvas & Context
    canvas: null,
    ctx: null,
    
    // Game Entities
    player: null,
    enemies: [], // Fodder enemies
    projectiles: [], // ENEMY projectiles (matches index.ejs legacy naming)
    friendlyProjectiles: [], // PLAYER projectiles (matches index.ejs legacy naming)
    powerups: [],
    collectibles: [], // Items dropped
    particles: [],
    floatingTexts: [],
    shockwaves: [],
    explosions: [], // Custom explosions
    activeEffects: [],
    
    // Boss State
    boss: null,
    bossLevel: 1,
    bossKillCounter: 0,
    bossSpawnThreshold: 5000,
    bossMode: 'score', // 'score' or 'kills'
    
    // Game Status
    running: false,
    paused: false,
    isGameOver: false,
    
    // Economy & Score
    score: 0,
    coinsEarned: 0,
    highScore: 0,
    
    // Managers (To be initialized)
    minionManager: null, // For AI minions
    
    // Configs
    difficulty: 'medium', // Default
    gameConfig: null, // Global config loaded from backend
    user: null, // Current user
    
    // Helpers
    cleanup: function() {
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.powerups = [];
        this.particles = [];
        this.floatingTexts = [];
        this.boss = null;
    }
};