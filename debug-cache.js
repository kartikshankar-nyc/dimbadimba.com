/**
 * Browser Cache Debugging Tool
 * Add this to your HTML during development to help troubleshoot caching issues
 * DO NOT include in production!
 */

// Only run if we're in development or debugging mode
const ENABLE_CACHE_DEBUGGING = true;

if (ENABLE_CACHE_DEBUGGING) {
    console.log('Cache debugging tools initialized');
    
    // Create UI for cache debugging
    const debugContainer = document.createElement('div');
    debugContainer.style.position = 'fixed';
    debugContainer.style.bottom = '10px';
    debugContainer.style.right = '10px';
    debugContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugContainer.style.color = 'white';
    debugContainer.style.padding = '10px';
    debugContainer.style.borderRadius = '5px';
    debugContainer.style.fontFamily = 'monospace';
    debugContainer.style.fontSize = '12px';
    debugContainer.style.zIndex = '9999';
    debugContainer.style.maxWidth = '300px';
    
    // Add header
    const header = document.createElement('h3');
    header.textContent = 'Cache Debugging';
    header.style.margin = '0 0 10px 0';
    debugContainer.appendChild(header);
    
    // Add version info
    const versionInfo = document.createElement('div');
    versionInfo.innerHTML = `
        <div>App Version: ${document.querySelector('script[src*="script.js"]')?.src.split('?v=')[1] || 'Unknown'}</div>
        <div>CSS Version: ${document.querySelector('link[href*="style.css"]')?.href.split('?v=')[1] || 'Unknown'}</div>
    `;
    debugContainer.appendChild(versionInfo);
    
    // Add buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '5px';
    buttonContainer.style.marginTop = '10px';
    
    // Clear service worker cache button
    const clearCacheBtn = document.createElement('button');
    clearCacheBtn.textContent = 'Clear SW Caches';
    clearCacheBtn.onclick = async () => {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log(`Deleted cache: ${cacheName}`);
        }
        logMessage('All service worker caches cleared!');
    };
    buttonContainer.appendChild(clearCacheBtn);
    
    // Update service worker button
    const updateSWBtn = document.createElement('button');
    updateSWBtn.textContent = 'Update Service Worker';
    updateSWBtn.onclick = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
                logMessage('Service worker update triggered');
            } else {
                logMessage('No service worker registration found');
            }
        } else {
            logMessage('Service workers not supported');
        }
    };
    buttonContainer.appendChild(updateSWBtn);
    
    // Hard Refresh button
    const hardRefreshBtn = document.createElement('button');
    hardRefreshBtn.textContent = 'Hard Refresh Page';
    hardRefreshBtn.onclick = () => {
        window.location.reload(true);
    };
    buttonContainer.appendChild(hardRefreshBtn);
    
    // Unregister SW button
    const unregisterSWBtn = document.createElement('button');
    unregisterSWBtn.textContent = 'Unregister Service Worker';
    unregisterSWBtn.onclick = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const result = await registration.unregister();
                if (result) {
                    logMessage('Service worker unregistered successfully');
                } else {
                    logMessage('Failed to unregister service worker');
                }
            } else {
                logMessage('No service worker registration found');
            }
        } else {
            logMessage('Service workers not supported');
        }
    };
    buttonContainer.appendChild(unregisterSWBtn);
    
    // Log container
    const logContainer = document.createElement('div');
    logContainer.style.marginTop = '10px';
    logContainer.style.maxHeight = '100px';
    logContainer.style.overflow = 'auto';
    logContainer.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    logContainer.style.padding = '5px';
    
    // Function to log messages
    function logMessage(message) {
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logContainer.appendChild(logEntry);
        console.log('[Cache Debug]', message);
        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // Show/hide toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Hide';
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.top = '5px';
    toggleBtn.style.right = '5px';
    toggleBtn.onclick = () => {
        const isHidden = buttonContainer.style.display === 'none';
        buttonContainer.style.display = isHidden ? 'flex' : 'none';
        logContainer.style.display = isHidden ? 'block' : 'none';
        versionInfo.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
    };
    
    // Add all elements to container
    debugContainer.appendChild(buttonContainer);
    debugContainer.appendChild(logContainer);
    debugContainer.appendChild(toggleBtn);
    
    // Add to document
    document.body.appendChild(debugContainer);
    
    // Display initial service worker status
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                logMessage(`SW active: ${!!registration.active}`);
                if (registration.waiting) {
                    logMessage('New SW waiting to activate');
                }
            } else {
                logMessage('No SW registered');
            }
        });
    }
    
    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.debug) {
            logMessage(`SW: ${event.data.debug}`);
        }
    });
} 