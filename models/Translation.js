const mongoose = require('mongoose');

const TranslationSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    unique: true, // 'en', 'tr', 'de'
    trim: true
  },
  data: {
    type: Object,
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Translation', TranslationSchema);
