const express = require('express');
const router = express.Router();
const Translation = require('../models/Translation');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// @desc    Get translations for a specific language
// @route   GET /api/translations/:lang
// @access  Public
router.get('/:lang', async (req, res) => {
  try {
    const lang = req.params.lang;
    const translation = await Translation.findOne({ language: lang });
    
    if (!translation) {
      // Fallback to English if not found, or return empty
      const fallback = await Translation.findOne({ language: 'en' });
      if (fallback) {
        return res.json(fallback.data);
      }
      return res.status(404).json({ msg: 'Language not found' });
    }
    
    res.json(translation.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @desc    Get all available languages
// @route   GET /api/translations
// @access  Public
router.get('/', async (req, res) => {
  try {
    const languages = await Translation.find({}, 'language lastUpdated');
    res.json(languages);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @desc    Update/Create translations for a language
// @route   POST /api/translations/:lang
// @access  Admin
router.post('/:lang', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const lang = req.params.lang;
    const { data } = req.body; // Expects { "key": "value", ... }

    let translation = await Translation.findOne({ language: lang });

    if (translation) {
      // Update existing keys
      // We merge the new data with existing data
      // If data is a Map in Mongoose, we need to set it properly
      for (const [key, value] of Object.entries(data)) {
        translation.data.set(key, value);
      }
      translation.lastUpdated = Date.now();
    } else {
      // Create new
      translation = new Translation({
        language: lang,
        data: data
      });
    }

    await translation.save();
    res.json(translation);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
