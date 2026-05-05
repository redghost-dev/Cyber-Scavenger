const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

// @desc    Get all shop items
// @route   GET /api/shop/items
router.get('/items', async (req, res) => {
    try {
        const items = await Item.find({ isActive: true }).sort({ order: 1 });
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Buy an item
// @route   POST /api/shop/buy
router.post('/buy', ensureAuthenticated, async (req, res) => {
    const { itemId } = req.body;

    try {
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (!item.isActive) {
            return res.status(400).json({ error: 'Item is not available' });
        }

        const user = await User.findById(req.user._id);

        // Initialize wallet if missing (for legacy users)
        if (!user.wallet) {
            user.wallet = { coins: 0, gems: 0 };
        }
        // Initialize inventory if missing
        if (!user.inventory) {
            user.inventory = [];
        }

        // Check if user already owns the item (unless it's a consumable/currency pack)
        // For now, let's assume ships/skins are unique, powerups might be stackable (but we'll keep it simple for now)
        const alreadyOwns = user.inventory.some(invItem => invItem.item.toString() === itemId);
        if (alreadyOwns && item.type !== 'powerup' && item.type !== 'currency_pack') {
            return res.status(400).json({ error: 'You already own this item' });
        }

        // Check funds
        if (item.currencyType === 'coin') {
            if (user.wallet.coins < item.price) {
                return res.status(400).json({ error: 'Insufficient coins' });
            }
            user.wallet.coins -= item.price;
        } else if (item.currencyType === 'gem') {
            if (user.wallet.gems < item.price) {
                return res.status(400).json({ error: 'Insufficient gems' });
            }
            user.wallet.gems -= item.price;
        } else if (item.currencyType === 'real_money') {
            // TODO: Implement payment gateway integration
            return res.status(501).json({ error: 'Real money purchases not implemented yet' });
        }

        // Add to inventory
        if (item.type !== 'currency_pack') {
            user.inventory.push({
                item: item._id,
                acquiredAt: new Date(),
                isEquipped: false
            });
        } else {
            // Handle currency packs (e.g. buy 100 gems with coins? or usually real money -> gems)
            // For now, let's assume currency packs are just added to wallet if we had logic for it
        }

        await user.save();

        res.json({ 
            success: true, 
            message: `Purchased ${item.name}`,
            wallet: user.wallet,
            inventory: user.inventory
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Get user inventory
// @route   GET /api/shop/inventory
router.get('/inventory', ensureAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('inventory.item');
        res.json(user.inventory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Equip an item
// @route   POST /api/shop/equip
router.post('/equip', ensureAuthenticated, async (req, res) => {
    const { itemId } = req.body;
    console.log(`[Shop] Equip request for item: ${itemId} by user: ${req.user._id}`);

    try {
        const user = await User.findById(req.user._id).populate('inventory.item');
        
        const inventoryItem = user.inventory.find(inv => inv.item && inv.item._id.toString() === itemId);
        
        if (!inventoryItem) {
            console.log(`[Shop] Item not found in inventory or item data missing.`);
            return res.status(404).json({ error: 'Item not found in inventory' });
        }

        // Check if the actual item data exists (handle deleted items)
        if (!inventoryItem.item) {
            console.log(`[Shop] Ghost item detected. Cleaning up.`);
            // Remove the ghost item from inventory
            user.inventory = user.inventory.filter(inv => inv.item); 
            await user.save();
            return res.status(400).json({ error: 'Item data missing. Inventory cleaned.' });
        }

        const itemType = inventoryItem.item.type;
        console.log(`[Shop] Equipping item type: ${itemType}`);

        // Unequip other items of the same type
        user.inventory.forEach(inv => {
            // Check if item exists (it might have been deleted from DB)
            if (inv.item && inv.item.type === itemType) {
                inv.isEquipped = false;
            }
        });

        // Equip the new item
        // We need to find the item in the array again because forEach works on the array elements
        const itemToEquip = user.inventory.find(inv => inv.item && inv.item._id.toString() === itemId);
        if (itemToEquip) {
            itemToEquip.isEquipped = true;
            console.log(`[Shop] Item equipped successfully.`);
        } else {
             console.log(`[Shop] Failed to re-find item to equip.`);
        }

        await user.save();

        res.json({ success: true, message: 'Item equipped', inventory: user.inventory });

    } catch (err) {
        console.error('[Shop] Error in equip:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @desc    Add coins (e.g. from watching ads)
// @route   POST /api/shop/add-coins
router.post('/add-coins', ensureAuthenticated, async (req, res) => {
    const { amount, reason } = req.body;

    // Basic validation
    if (!amount || amount <= 0 || amount > 1000) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    try {
        const user = await User.findById(req.user._id);
        
        if (!user.wallet) {
            user.wallet = { coins: 0, gems: 0 };
        }

        user.wallet.coins += parseInt(amount);
        
        // Optional: Log this transaction if you have a Transaction model
        // console.log(`User ${user.username} earned ${amount} coins via ${reason}`);

        await user.save();

        res.json({ 
            success: true, 
            message: `Added ${amount} coins`,
            wallet: user.wallet
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
