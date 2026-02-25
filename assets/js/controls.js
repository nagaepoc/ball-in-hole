// Ball in a Hole Maze - Device Orientation Controls

let orientationHandler = null;
let keyboardHandler = null;
let mouseHandler = null;
let currentGravity = { x: 0, y: 0 };
let isMobile = false;
const MAX_TILT = 45;
const GRAVITY_SCALE = 0.001;

function initControls(callback, mobile = false) {
    isMobile = mobile;
    setupDeviceOrientation(callback);
    setupKeyboardControls(callback);
    setupMouseControls(callback);
    setupTouchControls(callback);
}

function setupDeviceOrientation(callback) {
    if (!window.DeviceOrientationEvent) {
        console.log('Device Orientation API not supported');
        return;
    }
    
    const permissionPrompt = document.getElementById('orientation-permission');
    
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        permissionPrompt.style.display = 'flex';
        
        document.getElementById('permission-btn').addEventListener('click', () => {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        permissionPrompt.style.display = 'none';
                        startOrientationListening(callback);
                    }
                })
                .catch(console.error);
        });
    } else {
        permissionPrompt.style.display = 'none';
        startOrientationListening(callback);
    }
}

function startOrientationListening(callback) {
    orientationHandler = (event) => {
        const gravity = calculateGravityFromOrientation(event);
        currentGravity = gravity;
        
        if (callback) {
            callback(gravity);
        }
    };
    
    window.addEventListener('deviceorientation', orientationHandler);
}

function calculateGravityFromOrientation(event) {
    let beta = event.beta || 0;
    let gamma = event.gamma || 0;
    
    beta = clamp(beta, -MAX_TILT, MAX_TILT);
    gamma = clamp(gamma, -MAX_TILT, MAX_TILT);
    
    const gravityScale = isMobile ? GRAVITY_SCALE * 2 : GRAVITY_SCALE;
    const x = (gamma / MAX_TILT) * gravityScale;
    const y = (beta / MAX_TILT) * gravityScale;
    
    return { x, y };
}

function setupKeyboardControls(callback) {
    const keys = {};
    
    keyboardHandler = (e) => {
        keys[e.key] = e.type === 'keydown';
        
        let x = 0, y = 0;
        const force = isMobile ? 0.001 : 0.0005;
        
        if (keys['ArrowUp'] || keys['w'] || keys['W']) y = -force;
        if (keys['ArrowDown'] || keys['s'] || keys['S']) y = force;
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) x = -force;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) x = force;
        
        currentGravity = { x, y };
        
        if (callback && (x !== 0 || y !== 0)) {
            callback(currentGravity);
        }
    };
    
    window.addEventListener('keydown', keyboardHandler);
    window.addEventListener('keyup', keyboardHandler);
}

function setupMouseControls(callback) {
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    
    const canvas = document.getElementById('game-canvas');
    
    mouseHandler = {
        mousedown: (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.style.cursor = 'grabbing';
        },
        
        mousemove: (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            
            const forceScale = 0.00001;
            const x = dx * forceScale;
            const y = dy * forceScale;
            
            currentGravity = { x, y };
            
            if (callback) {
                callback(currentGravity);
            }
            
            lastX = e.clientX;
            lastY = e.clientY;
        },
        
        mouseup: () => {
            isDragging = false;
            canvas.style.cursor = 'grab';
            currentGravity = { x: 0, y: 0 };
            
            if (callback) {
                callback(currentGravity);
            }
        },
        
        mouseleave: () => {
            if (isDragging) {
                isDragging = false;
                canvas.style.cursor = 'grab';
                currentGravity = { x: 0, y: 0 };
                
                if (callback) {
                    callback(currentGravity);
                }
            }
        }
    };
    
    canvas.addEventListener('mousedown', mouseHandler.mousedown);
    canvas.addEventListener('mousemove', mouseHandler.mousemove);
    canvas.addEventListener('mouseup', mouseHandler.mouseup);
    canvas.addEventListener('mouseleave', mouseHandler.mouseleave);
    canvas.style.cursor = 'grab';
}

function setupTouchControls(callback) {
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;
    
    const canvas = document.getElementById('game-canvas');
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isTouching) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        
        const dx = touchX - touchStartX;
        const dy = touchY - touchStartY;
        
        const forceScale = isMobile ? 0.00005 : 0.00002;
        const x = dx * forceScale;
        const y = dy * forceScale;
        
        currentGravity = { x, y };
        
        if (callback) {
            callback(currentGravity);
        }
        
        touchStartX = touchX;
        touchStartY = touchY;
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        isTouching = false;
        currentGravity = { x: 0, y: 0 };
        
        if (callback) {
            callback(currentGravity);
        }
    });
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getGravityVector() {
    return currentGravity;
}

function cleanupControls() {
    if (orientationHandler) {
        window.removeEventListener('deviceorientation', orientationHandler);
    }
    
    if (keyboardHandler) {
        window.removeEventListener('keydown', keyboardHandler);
        window.removeEventListener('keyup', keyboardHandler);
    }
    
    const canvas = document.getElementById('game-canvas');
    if (canvas && mouseHandler) {
        canvas.removeEventListener('mousedown', mouseHandler.mousedown);
        canvas.removeEventListener('mousemove', mouseHandler.mousemove);
        canvas.removeEventListener('mouseup', mouseHandler.mouseup);
        canvas.removeEventListener('mouseleave', mouseHandler.mouseleave);
    }
}

export {
    initControls,
    getGravityVector,
    cleanupControls
};