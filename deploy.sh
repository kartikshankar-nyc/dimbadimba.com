#!/bin/bash

# Dimbadimba Game Deployment Script
echo "Starting deployment process..."

# Check for development files that shouldn't be deployed
if grep -q "debug-cache.js" index.html; then
  echo "ERROR: index.html contains debug tools! Use the production version for deployment."
  exit 1
fi

# Make sure we're deploying index.html, not index.dev.html
if [ ! -f "index.html" ]; then
  echo "ERROR: index.html not found! Make sure you're deploying from the right directory."
  exit 1
fi

# Get the current git commit hash for versioning
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
export COMMIT_HASH
TIMESTAMP=$(date +%s)
echo "Using build ID: $COMMIT_HASH and timestamp: $TIMESTAMP"

# Check if npm is available for tools
if ! command -v npm &> /dev/null; then
  echo "ERROR: npm is required for the build process"
  exit 1
fi

# Install required dependencies
echo "Checking dependencies..."
npm install --no-save glob

# Create build directory if it doesn't exist
BUILD_DIR="build"
if [ ! -d "$BUILD_DIR" ]; then
  mkdir -p "$BUILD_DIR"
fi

# Run the asset hashing script
echo "Running asset content hashing..."
node asset-hashing.js

# Update the service worker timestamp
sed -i.bak "s/const DEPLOY_TIMESTAMP = ['\"]\(.*\)['\"];/const DEPLOY_TIMESTAMP = '$TIMESTAMP';/g" $BUILD_DIR/service-worker.js
rm $BUILD_DIR/service-worker.js.bak

# Create .htaccess with cache control headers
echo "Creating .htaccess with cache control settings..."
cat > $BUILD_DIR/.htaccess << EOF
# Cache control settings
<IfModule mod_expires.c>
  ExpiresActive On

  # HTML and manifest - short cache time
  ExpiresByType text/html "access plus 1 hour"
  ExpiresByType application/manifest+json "access plus 1 hour"

  # Content hashed assets - very long cache time since filename changes when content changes
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType audio/mpeg "access plus 1 year"
  ExpiresByType audio/wav "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Force service worker to update
<FilesMatch "service-worker\.js$">
  Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
</FilesMatch>

# Force asset-manifest.json to update
<FilesMatch "asset-manifest\.json$">
  Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
</FilesMatch>

# Force index.html to update frequently
<FilesMatch "index\.html$">
  Header set Cache-Control "max-age=3600, must-revalidate"
</FilesMatch>
EOF

# Display completion message
echo "Build complete! Files are ready in the $BUILD_DIR/ directory"

# Create a zip file for easy upload
echo "Creating deployment package..."
cd $BUILD_DIR
zip -r dimbadimba_game_v${TIMESTAMP}.zip ./*
cd ..

echo "============================================="
echo "Deployment build completed successfully!"
echo "Content-based hashed assets ensure perfect cache invalidation"
echo "You can find the deployment package at:"
echo "$BUILD_DIR/dimbadimba_game_v${TIMESTAMP}.zip"
echo ""
echo "To deploy your game:"
echo "1. Upload the contents of the build directory to your hosting"
echo "2. Enjoy perfect caching with reliable updates!"
echo "=============================================" 