/**
 * Script to update cache versions and timestamps during build/deployment
 * Run this script before deploying to production to update the timestamp and version.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Generate build ID based on current timestamp
const timestamp = Date.now().toString();
const buildId = process.env.COMMIT_HASH || timestamp.substring(timestamp.length - 6);

console.log(`Updating cache version with timestamp: ${timestamp}`);
console.log(`Using build ID: ${buildId}`);

// Function to scan for all cacheable assets
function generateAssetList() {
    try {
        // Patterns to include
        const patterns = [
            '**/*.html', 
            '**/*.css', 
            '**/*.js', 
            '**/*.json',
            'images/**/*.png', 
            'images/**/*.jpg', 
            'images/**/*.svg',
            'icons/**/*.png',
            'sounds/**/*.mp3',
            'sounds/**/*.wav',
            'fonts/**/*.woff*'
        ];
        
        // Patterns to exclude
        const exclude = [
            'node_modules/**',
            'build/**',
            '.git/**',
            '*.dev.html',
            'debug-*.js'
        ];
        
        let assets = [];
        
        // Find all matching assets
        patterns.forEach(pattern => {
            const matches = glob.sync(pattern, { ignore: exclude });
            assets = [...assets, ...matches];
        });
        
        // Format for service worker (prefix with ./)
        return assets.map(asset => `'./${asset}'`).sort();
    } catch (err) {
        console.error('Error scanning for assets:', err);
        return null;
    }
}

// Update service-worker.js
const serviceWorkerPath = path.join(__dirname, 'service-worker.js');
let serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');

// Update the DEPLOY_TIMESTAMP constant
serviceWorkerContent = serviceWorkerContent.replace(
  /const DEPLOY_TIMESTAMP = ['"].*['"]/,
  `const DEPLOY_TIMESTAMP = '${timestamp}'`
);

// Increment CACHE_VERSION (if needed for major changes)
// This is optional and could be automated based on git tags or manually specified
// const currentVersionMatch = serviceWorkerContent.match(/const CACHE_VERSION = (\d+)/);
// if (currentVersionMatch) {
//   const currentVersion = parseInt(currentVersionMatch[1], 10);
//   const newVersion = currentVersion + 1;
//   serviceWorkerContent = serviceWorkerContent.replace(
//     /const CACHE_VERSION = \d+/,
//     `const CACHE_VERSION = ${newVersion}`
//   );
// }

// Generate and update asset list if possible
const assets = generateAssetList();
if (assets) {
    console.log(`Found ${assets.length} assets to cache`);
    
    // Find the asset array in the service worker
    const assetListRegex = /const ASSETS = \[([\s\S]*?)\];/;
    const assetListMatch = serviceWorkerContent.match(assetListRegex);
    
    if (assetListMatch) {
        // Replace with our generated list
        const assetListText = assets.join(',\n  ');
        serviceWorkerContent = serviceWorkerContent.replace(
            assetListRegex,
            `const ASSETS = [\n  ${assetListText}\n];`
        );
        console.log('Updated asset list in service worker');
    } else {
        console.warn('Could not find ASSETS array in service worker');
    }
}

// Write updated service worker file
fs.writeFileSync(serviceWorkerPath, serviceWorkerContent);
console.log('Updated service-worker.js');

// Update references in HTML file
const htmlPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Update script and stylesheet version parameters
htmlContent = htmlContent.replace(
  /<link rel="stylesheet" href="style\.css\?v=[^"]*"/g,
  `<link rel="stylesheet" href="style.css?v=${buildId}"`
);

htmlContent = htmlContent.replace(
  /<script src="script\.js\?v=[^"]*"/g,
  `<script src="script.js?v=${buildId}"`
);

// Add version to all other script and link tags if they don't have one
htmlContent = htmlContent.replace(
  /<script src="([^"]+)\.js"(?!\?v=)/g,
  `<script src="$1.js?v=${buildId}"`
);

// Write updated HTML file
fs.writeFileSync(htmlPath, htmlContent);
console.log('Updated cache-busting parameters in index.html');

console.log('Cache version update complete! Ready for deployment!'); 