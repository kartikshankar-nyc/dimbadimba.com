/**
 * Asset hashing utility for Dimbadimba game
 * 
 * This script:
 * 1. Creates a hashed version of all static assets based on content
 * 2. Copies them to a build directory with content hash in filename
 * 3. Updates all references in HTML, CSS, and JS files
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const glob = require('glob');

// Build directory
const BUILD_DIR = 'build';
// Hash length in filename
const HASH_LENGTH = 8;
// Map of original to hashed filenames
const fileHashMap = new Map();
// Track processed files to avoid duplicate processing
const processedFiles = new Set();

/**
 * Calculate MD5 hash of file contents
 */
function hashFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex').substring(0, HASH_LENGTH);
}

/**
 * Create hashed filename
 * example.png -> example.a1b2c3d4.png
 */
function createHashedFilename(filePath, hash) {
  const parsedPath = path.parse(filePath);
  return `${parsedPath.name}.${hash}${parsedPath.ext}`;
}

/**
 * Process an asset file - hash its contents and copy to build dir with hashed name
 */
function processAsset(filePath) {
  // Skip if already processed
  if (processedFiles.has(filePath)) return fileHashMap.get(filePath);
  
  try {
    // Calculate hash based on content
    const hash = hashFile(filePath);
    
    // Create hashed filename
    const hashedFilename = createHashedFilename(filePath, hash);
    
    // Determine build path - maintain directory structure
    const relativePath = path.relative('.', filePath);
    const targetDir = path.join(BUILD_DIR, path.dirname(relativePath));
    const targetPath = path.join(targetDir, path.basename(hashedFilename));
    
    // Ensure target directory exists
    fs.mkdirSync(targetDir, { recursive: true });
    
    // Copy file with hashed name
    fs.copyFileSync(filePath, targetPath);
    
    // Store mapping from original to hashed path
    const originalPath = relativePath.replace(/\\/g, '/');
    const hashedPath = path.join(path.dirname(relativePath), hashedFilename).replace(/\\/g, '/');
    
    fileHashMap.set(originalPath, hashedPath);
    processedFiles.add(filePath);
    
    console.log(`Hashed: ${originalPath} -> ${hashedPath}`);
    
    return hashedPath;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return filePath;
  }
}

/**
 * Process CSS files - replace all url() references with hashed versions
 */
function processCssFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find all url() references
    const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
    let match;
    
    // Replace each url with hashed version
    while ((match = urlRegex.exec(content)) !== null) {
      const originalUrl = match[1];
      
      // Skip external URLs and data URIs
      if (originalUrl.startsWith('http') || originalUrl.startsWith('data:')) {
        continue;
      }
      
      // Resolve the referenced file path
      let referencedFilePath = originalUrl;
      if (referencedFilePath.startsWith('./')) {
        referencedFilePath = referencedFilePath.substring(2);
      }
      
      // Resolve relative to the CSS file
      const cssDir = path.dirname(filePath);
      const absoluteFilePath = path.resolve(cssDir, referencedFilePath);
      
      // If the file exists, process it
      if (fs.existsSync(absoluteFilePath)) {
        const hashedPath = processAsset(absoluteFilePath);
        
        // Calculate new relative path from CSS file to the hashed asset
        const relativePath = path.relative(path.dirname(filePath), hashedPath);
        const newReference = relativePath.replace(/\\/g, '/');
        
        // Replace in CSS content
        content = content.replace(new RegExp(originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newReference);
      }
    }
    
    // Write the updated CSS to build directory
    const targetPath = path.join(BUILD_DIR, filePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
    
    console.log(`Processed CSS: ${filePath}`);
    return targetPath;
  } catch (err) {
    console.error(`Error processing CSS file ${filePath}:`, err);
    return filePath;
  }
}

/**
 * Process HTML file - replace all script, link, img, etc. references with hashed versions
 */
function processHtmlFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Process all script src attributes
    content = content.replace(/<script[^>]+src=['"]([^'"]+)['"][^>]*>/g, (match, src) => {
      if (src.startsWith('http') || src.startsWith('//')) return match;
      
      const jsPath = src.split('?')[0]; // Remove query string if any
      const absoluteJsPath = path.resolve(path.dirname(filePath), jsPath);
      
      if (fs.existsSync(absoluteJsPath)) {
        const hashedPath = processAsset(absoluteJsPath);
        const relativePath = path.relative('.', hashedPath).replace(/\\/g, '/');
        return match.replace(jsPath, relativePath);
      }
      
      return match;
    });
    
    // Process all link href attributes
    content = content.replace(/<link[^>]+href=['"]([^'"]+)['"][^>]*>/g, (match, href) => {
      if (href.startsWith('http') || href.startsWith('//')) return match;
      
      const cssPath = href.split('?')[0]; // Remove query string if any
      const absoluteCssPath = path.resolve(path.dirname(filePath), cssPath);
      
      if (fs.existsSync(absoluteCssPath)) {
        // Special handling for CSS files
        if (href.endsWith('.css')) {
          const processedCssPath = processCssFile(cssPath);
          const relativePath = path.relative('.', processedCssPath).replace(/\\/g, '/');
          return match.replace(cssPath, relativePath);
        } else {
          const hashedPath = processAsset(absoluteCssPath);
          const relativePath = path.relative('.', hashedPath).replace(/\\/g, '/');
          return match.replace(cssPath, relativePath);
        }
      }
      
      return match;
    });
    
    // Process all img src attributes
    content = content.replace(/<img[^>]+src=['"]([^'"]+)['"][^>]*>/g, (match, src) => {
      if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return match;
      
      const imgPath = src.split('?')[0]; // Remove query string if any
      const absoluteImgPath = path.resolve(path.dirname(filePath), imgPath);
      
      if (fs.existsSync(absoluteImgPath)) {
        const hashedPath = processAsset(absoluteImgPath);
        const relativePath = path.relative('.', hashedPath).replace(/\\/g, '/');
        return match.replace(imgPath, relativePath);
      }
      
      return match;
    });
    
    // Write updated HTML
    fs.writeFileSync(path.join(BUILD_DIR, filePath), content);
    console.log(`Processed HTML: ${filePath}`);
    
  } catch (err) {
    console.error(`Error processing HTML file ${filePath}:`, err);
  }
}

/**
 * Process JS file - find and update references to assets
 */
function processJsFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Look for string literals that might be asset paths
    const fileRefs = [];
    
    // Find strings that look like file paths to common asset types
    // Support both single and double quotes
    const fileRegex = /['"]([^'"]+\.(png|jpg|jpeg|gif|svg|mp3|wav|ogg|json))['"]/g;
    let match;
    
    while ((match = fileRegex.exec(content)) !== null) {
      const assetPath = match[1];
      
      // Skip absolute URLs
      if (assetPath.startsWith('http')) continue;
      
      fileRefs.push({
        original: assetPath,
        regex: new RegExp(assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      });
    }
    
    // Also find dynamic imports/requires that might reference asset files
    const importRegex = /import\(['"]([^'"]+)['"]\)/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    
    [importRegex, requireRegex].forEach(regex => {
      while ((match = regex.exec(content)) !== null) {
        const modulePath = match[1];
        
        // Only handle relative paths that might be assets
        if (!modulePath.startsWith('./') && !modulePath.startsWith('../')) continue;
        
        // Skip if doesn't look like an asset file
        if (!/\.(js|json)$/.test(modulePath)) continue;
        
        fileRefs.push({
          original: modulePath,
          regex: new RegExp(modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        });
      }
    });
    
    // Process each reference
    for (const ref of fileRefs) {
      const absolutePath = path.resolve(path.dirname(filePath), ref.original);
      
      if (fs.existsSync(absolutePath)) {
        const hashedPath = processAsset(absolutePath);
        const relativePath = path.relative(path.dirname(filePath), hashedPath).replace(/\\/g, '/');
        
        // Replace in JS content
        content = content.replace(ref.regex, relativePath);
      }
    }
    
    // Write the updated JS to build directory
    const targetPath = path.join(BUILD_DIR, filePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content);
    
    console.log(`Processed JS: ${filePath}`);
    return targetPath;
  } catch (err) {
    console.error(`Error processing JS file ${filePath}:`, err);
    return filePath;
  }
}

/**
 * Generate a JSON manifest of all original to hashed filenames
 */
function generateManifest() {
  const manifest = Object.fromEntries(fileHashMap);
  fs.writeFileSync(path.join(BUILD_DIR, 'asset-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Generated asset manifest with ${fileHashMap.size} entries`);
}

/**
 * Process all files in the project
 */
function processAllFiles() {
  // Clean build directory
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(BUILD_DIR);
  
  // Find HTML files
  const htmlFiles = glob.sync('*.html');
  for (const htmlFile of htmlFiles) {
    if (!htmlFile.includes('.dev.')) {
      processHtmlFile(htmlFile);
    }
  }
  
  // Find any JS files not already processed via HTML
  const jsFiles = glob.sync('*.js');
  for (const jsFile of jsFiles) {
    if (!jsFile.startsWith('debug-') && 
        !jsFile.endsWith('-hashing.js') && 
        !processedFiles.has(jsFile)) {
      processJsFile(jsFile);
    }
  }
  
  // Generate manifest file
  generateManifest();
  
  // Copy service worker with special handling
  let serviceWorkerContent = fs.readFileSync('service-worker.js', 'utf8');
  
  // Update the service worker to use the asset manifest
  serviceWorkerContent = serviceWorkerContent.replace(
    /const ASSETS = \[[\s\S]*?\];/,
    `const ASSETS = [];\n// Assets are loaded from manifest in production build`
  );
  
  // Add code to load from manifest
  serviceWorkerContent = serviceWorkerContent.replace(
    /self\.addEventListener\('install', event => {/,
    `self.addEventListener('install', event => {
  // Load assets from manifest
  let assetsToCache = ASSETS;
  
  fetch('./asset-manifest.json')
    .then(response => response.json())
    .then(manifest => {
      // Add all hashed assets to cache list
      assetsToCache = assetsToCache.concat(Object.values(manifest));
      swLog('Loaded ' + Object.values(manifest).length + ' assets from manifest');
    })
    .catch(err => {
      swLog('Error loading asset manifest: ' + err);
    });`
  );
  
  // Write updated service worker
  fs.writeFileSync(path.join(BUILD_DIR, 'service-worker.js'), serviceWorkerContent);
  
  console.log('Complete! All assets processed and hashed.');
}

// Run the processor
processAllFiles(); 