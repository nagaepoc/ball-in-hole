// Ball in a Hole Maze - Progressive Web App Support

let deferredPrompt;
let isInstalled = false;

function initPWA() {
    registerServiceWorker();
    setupInstallPrompt();
    checkIfInstalled();
    setupOfflineDetection();
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('New service worker found:', newWorker);
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
}

function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.style.display = 'block';
            
            installBtn.addEventListener('click', () => {
                showInstallPrompt();
            });
        }
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        isInstalled = true;
        hideInstallButton();
        showInstallSuccess();
    });
}

function showInstallPrompt() {
    if (!deferredPrompt) {
        console.log('No install prompt available');
        return;
    }
    
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
    });
}

function checkIfInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        isInstalled = true;
        hideInstallButton();
    }
    
    if (window.navigator.standalone) {
        isInstalled = true;
        hideInstallButton();
    }
}

function hideInstallButton() {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
    
    const pwaHint = document.querySelector('.pwa-hint');
    if (pwaHint) {
        pwaHint.style.display = 'none';
    }
}

function showInstallSuccess() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.innerHTML = `
        <h2>App Installed!</h2>
        <p>Ball in a Hole Maze is now installed on your device.</p>
        <p>You can play offline anytime!</p>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        document.body.removeChild(message);
    }, 3000);
}

function showUpdateNotification() {
    const updateDiv = document.createElement('div');
    updateDiv.className = 'success-message';
    updateDiv.innerHTML = `
        <h2>Update Available!</h2>
        <p>A new version of Ball in a Hole Maze is available.</p>
        <button id="update-btn" class="btn" style="margin-top: 15px;">Update Now</button>
    `;
    
    document.body.appendChild(updateDiv);
    
    document.getElementById('update-btn').addEventListener('click', () => {
        window.location.reload();
    });
    
    setTimeout(() => {
        if (document.body.contains(updateDiv)) {
            document.body.removeChild(updateDiv);
        }
    }, 10000);
}

function setupOfflineDetection() {
    window.addEventListener('online', () => {
        showOnlineStatus();
    });
    
    window.addEventListener('offline', () => {
        showOfflineStatus();
    });
    
    if (!navigator.onLine) {
        showOfflineStatus();
    }
}

function showOnlineStatus() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.style.background = '#4CAF50';
    message.innerHTML = `
        <h2>Back Online!</h2>
        <p>You're now connected to the internet.</p>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        document.body.removeChild(message);
    }, 2000);
}

function showOfflineStatus() {
    const message = document.createElement('div');
    message.className = 'success-message';
    message.style.background = '#f44336';
    message.innerHTML = `
        <h2>Offline Mode</h2>
        <p>You're currently offline.</p>
        <p>The game will continue to work.</p>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        document.body.removeChild(message);
    }, 3000);
}

function checkStorage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate()
            .then(estimate => {
                const used = (estimate.usage / 1024 / 1024).toFixed(2);
                const total = (estimate.quota / 1024 / 1024).toFixed(2);
                const percentage = ((estimate.usage / estimate.quota) * 100).toFixed(1);
                
                console.log(`Storage: ${used}MB used of ${total}MB (${percentage}%)`);
                
                if (percentage > 90) {
                    showStorageWarning();
                }
            });
    }
}

function showStorageWarning() {
    const warning = document.createElement('div');
    warning.className = 'success-message';
    warning.style.background = '#ff9800';
    warning.innerHTML = `
        <h2>Storage Warning</h2>
        <p>Your device storage is almost full.</p>
        <p>Some features may not work properly.</p>
    `;
    
    document.body.appendChild(warning);
    
    setTimeout(() => {
        document.body.removeChild(warning);
    }, 5000);
}

function clearCache() {
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
            });
            console.log('Cache cleared');
        });
    }
}

export {
    initPWA,
    showInstallPrompt,
    clearCache,
    checkStorage
};