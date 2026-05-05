// Input Manager Module
// Handles Keyboard, Mouse, and Touch inputs

window.Input = {
    // State
    keys: {
        w: false, a: false, s: false, d: false,
        ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
        Space: false, f: false
    },
    
    joystick: {
        active: false,
        data: { x: 0, y: 0 },
        origin: { x: 0, y: 0 }
    },
    
    mouse: {
        active: false,
        target: { x: 0, y: 0 }
    },

    controlMode: 'auto', // 'keyboard', 'touch', 'mouse'

    // Configuration
    config: {
        joystickMaxRadius: 50
    },

    // Initialization
    init: function() {
        this.setupKeyboard();
        // Mouse and Touch are usually bound to specific DOM elements found in index.ejs
        // So we might need to call bind methods from index.ejs or pass elements here.
    },

    setupKeyboard: function() {
        window.addEventListener('keydown', (e) => {
            // Global Toggles (handled by main game loop or UI manager if present)
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if(window.togglePause) window.togglePause();
            }
            if (e.key === 'f' || e.key === 'F') {
                if(window.activateOverdrive) window.activateOverdrive();
            }

            // Movement Keys
            if (this.keys.hasOwnProperty(e.key) || e.code === 'Space') {
                if(e.code === 'Space') this.keys.Space = true;
                else this.keys[e.key] = true;
                
                // Auto-switch to keyboard mode
                if(this.controlMode !== 'keyboard' && window.setControlMode) {
                    window.setControlMode('keyboard');
                }
            }

            // Prevent Scrolling
            if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].indexOf(e.code) > -1) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key) || e.code === 'Space') {
                if(e.code === 'Space') this.keys.Space = false;
                else this.keys[e.key] = false;
            }
        });
    },

    // Mobile/Touch Helpers
    handleJoystickStart: function(clientX, clientY) {
        this.joystick.origin = { x: clientX, y: clientY };
        this.joystick.active = true;
        this.joystick.data = { x: 0, y: 0 };
        
        if(this.controlMode !== 'touch' && window.setControlMode) {
            window.setControlMode('touch');
        }
        
        return this.joystick.origin;
    },

    handleJoystickMove: function(clientX, clientY) {
        if (!this.joystick.active) return null;

        let dx = clientX - this.joystick.origin.x;
        let dy = clientY - this.joystick.origin.y;
        
        const distance = Math.min(Math.hypot(dx, dy), this.config.joystickMaxRadius);
        const angle = Math.atan2(dy, dx);
        
        const moveX = Math.cos(angle) * distance;
        const moveY = Math.sin(angle) * distance;
        
        // Normalize -1 to 1
        this.joystick.data.x = moveX / this.config.joystickMaxRadius;
        this.joystick.data.y = moveY / this.config.joystickMaxRadius;

        return { x: moveX, y: moveY };
    },

    handleJoystickEnd: function() {
        this.joystick.active = false;
        this.joystick.data = { x: 0, y: 0 };
    }
};

// Auto-init keyboard on load
window.addEventListener('DOMContentLoaded', () => {
    // We wait for game to start
    window.Input.init();
});
