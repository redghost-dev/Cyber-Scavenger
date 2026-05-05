// Cyber Scavenger Asset Loading & Error Controller
let isWindowLoaded = (document.readyState === 'complete');
let criticalError = null;
const wasTransitioning = sessionStorage.getItem('cyber_transition') === 'true';

// Safety: If for some reason the page takes too long, force closure
const introSafetyTimeout = setTimeout(() => {
    isWindowLoaded = true;
    console.warn("Intro safety trigger: Forced load state");
}, 8000); 

// Cyber Typewriter Effect
function typeStatus(text, speed = 40) {
    const statusText = document.getElementById('intro-status-text');
    if (!statusText) return;
    
    // Clear previous interval if exists to prevent overlap
    if (statusText._typeInterval) clearInterval(statusText._typeInterval);
    
    statusText.innerText = '';
    let i = 0;
    statusText._typeInterval = setInterval(() => {
        if (i < text.length) {
            statusText.innerText += text.charAt(i);
            i++;
        } else {
            clearInterval(statusText._typeInterval);
        }
    }, speed);
}

// Immediately check if we need to show intro on navigation
window.showCyberIntro = function(msg = "TRANSMITTING DATA...") {
    const introOverlay = document.getElementById('cyber-intro');
    if (introOverlay) {
        // Flag that we are in a transition to keep the intro seamless
        sessionStorage.setItem('cyber_transition', 'true');
        
        introOverlay.style.display = 'flex';
        // Force reflow
        introOverlay.offsetHeight;
        introOverlay.style.opacity = '1';
        introOverlay.classList.remove('fade-out');
        
        typeStatus(msg, 30);
        
        // Reset progress bar for navigation
        const progressBar = document.getElementById('intro-progress');
        if (progressBar) progressBar.style.width = '10%';
    }
};

window.addEventListener('beforeunload', () => {
    // Only set transition flag if we aren't opening a new tab
    sessionStorage.setItem('cyber_transition', 'true');
});

window.addEventListener('load', () => {
    isWindowLoaded = true;
    if (typeof introSafetyTimeout !== 'undefined') clearTimeout(introSafetyTimeout);
    // Clear transition flag once fully loaded
    sessionStorage.removeItem('cyber_transition');
});

// Global error listener to catch critical initialization failures
window.onerror = function(message, source, lineno, colno, error) {
    if (!isWindowLoaded) {
        showIntroError(`JS_CORE_ERR: ${message.substring(0, 20)}...`);
    }
};

function showIntroError(code) {
    criticalError = code;
    const statusText = document.getElementById('intro-status-text');
    const progressBar = document.getElementById('intro-progress');
    if (statusText) {
        statusText.style.color = '#ff0055';
        statusText.innerHTML = `<i class="fas fa-exclamation-triangle"></i> CRITICAL_ERROR: ${code}<br><span style="font-size: 0.6rem; opacity: 0.6;">RELOAD RECOMMENDED</span>`;
    }
    if (progressBar) {
        progressBar.style.background = '#ff0055';
        progressBar.style.boxShadow = '0 0 15px #ff0055';
    }
}

// Function to trigger intro on link clicks and form submissions
function attachIntroToTriggers() {
    // Links
    document.querySelectorAll('a').forEach(link => {
        if (link.hostname === window.location.hostname && 
            !link.hash && 
            !link.href.includes('javascript:') && 
            link.target !== '_blank') {
            
            link.addEventListener('click', (e) => {
                // Ignore special clicks (ctrl, shift, right-click, etc)
                if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                
                let msg = "NAVIGATING...";
                if (link.href.includes('logout')) msg = "TERMINATING SESSION...";
                if (link.href.includes('login') || link.href.includes('register')) msg = "ESTABLISHING SECURE CONNECTION...";
                
                window.showCyberIntro(msg);
            });
        }
    });

    // Forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', () => {
            window.showCyberIntro("PROCESSING...");
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Neural Link UI References
    const nodeValue = document.getElementById('node-percent');
    const statusText = document.getElementById('intro-status-text');
    const introOverlay = document.getElementById('cyber-intro');
    const hexLeft = document.getElementById('hex-stream-left');
    const hexRight = document.getElementById('hex-stream-right');
    const timestampElem = document.getElementById('current-timestamp');

    // Attach to all current triggers
    attachIntroToTriggers();

    const statusMessages = [
        "ESTABLISHING_NEURAL_UPLINK...",
        "SYNCHRONIZING_DATA_CORES...",
        "DECRYPTING_SECURE_LAYER_X12...",
        "BYPASSING_EXTERNAL_FIREWALLS...",
        "OPTIMIZING_TACTICAL_DISPLAY...",
        "HANDSHAKE_COMPLETE_UPLINK_STABLE",
        "FILTERING_ATMOSPHERIC_NOISE..."
    ];

    let progress = wasTransitioning ? 70 : 0;
    let messageIndex = 0;

    // Helper: Generate Hex Stream
    function updateHexStreams() {
        const chars = '0123456789ABCDEF';
        let str = '';
        for(let i=0; i<50; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
        if(hexLeft) hexLeft.innerText = str;
        if(hexRight) hexRight.innerText = str.split('').reverse().join('');
    }

    // Helper: Update Timestamp
    function updateClock() {
        if(timestampElem) {
            const now = new Date();
            timestampElem.innerText = now.toTimeString().split(' ')[0];
        }
    }

    if (wasTransitioning) {
        typeStatus("SYNC_RESTORED: RE-CONNECTING...");
    } else {
        typeStatus("INITIALIZING_NEURAL_LINK...");
    }

    // Monitoring Interval
    const interval = setInterval(() => {
        if (criticalError) {
            clearInterval(interval);
            return;
        }

        updateHexStreams();
        updateClock();

        if (!isWindowLoaded) {
            if (progress < 90) {
                progress += Math.random() * 2.5; 
            } else {
                progress += 0.05;
                if (progress > 98) progress = 98;
            }

            // Message cycling based on progress
            let targetIdx = Math.min(Math.floor(progress / 15), statusMessages.length - 1);
            if (targetIdx !== messageIndex && !wasTransitioning) {
                messageIndex = targetIdx;
                typeStatus(statusMessages[messageIndex], 30);
            }
        } else {
            progress += 5;
        }

        if (progress > 100) progress = 100;
        if (nodeValue) nodeValue.innerText = Math.floor(progress) + '%';

        // Cleanup & Entry
        if (progress >= 100 && isWindowLoaded) {
            clearInterval(interval);
            typeStatus("CONNECTION_STABLE. WELCOME BACK, SCAVENGER.");
            
            setTimeout(() => {
                if (introOverlay) {
                    introOverlay.classList.add('fade-out');
                    setTimeout(() => {
                        introOverlay.style.display = 'none';
                        window.isSystemReady = true;
                        document.dispatchEvent(new Event('cyber-ready'));
                    }, 600);
                }
            }, 800);
        }
    }, 80);
});

// Expose error trigger globally
window.triggerLoadingError = showIntroError;
