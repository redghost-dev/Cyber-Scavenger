const mongoose = require('mongoose');

const BossSchema = new mongoose.Schema({
  // Unique Identifier (e.g., 'void_harbinger')
  id: { type: String, required: true, unique: true },
  
  // Display Name
  name: { type: String, required: true },
  
  // Metadata
  description: { type: String },
  visualType: { type: String, default: 'default' },
  enabled: { type: Boolean, default: true },
  
  // Game Logic Configuration
  color: { type: String, default: '#ff0000' },
  hpMult: { type: Number, default: 1.0 },
  attackChance: { type: Number, default: 0.05 },
  order: { type: Number, default: 0 }, // Spawn Order (0 = Random or First)
  replaceSprite: { type: Boolean, default: false }, // For custom visuals overriding mechanical sprites

  // The Core Logic (Stored as Arrays of Strings to be new Function()'d on client)
  logic: {
    drawHp: [String],
    entrance: {
      duration: { type: Number, default: 4000 },
      init: [String],
      update: [String],
      draw: [String]
    },
    death: {
      duration: { type: Number, default: 4000 },
      draw: [String]
    },
    update: [String],
    draw: [String],
    // Minion System for Helper Ships (AI Generated)
    minions: [{
        name: { type: String }, // e.g., "Interceptor", "RepairDrone"
        visualType: { type: String, default: 'default' },
        hp: { type: Number, default: 50 },
        count: { type: Number, default: 3 }, // How many to spawn
        respawn: { type: Boolean, default: true },
        logic: {
            init: [String],
            update: [String],
            draw: [String]
        }
    }]
  },

  // Ecosystem & AI Integration Fields
  isGlobal: { type: Boolean, default: false }, // If true, available to everyone as fallback
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null for system bosses
  generatedByAI: { type: Boolean, default: false }, // To track AI usage
  
  // Usage Statistics (For community sharing features)
  playCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Boss', BossSchema);
