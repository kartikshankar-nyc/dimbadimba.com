#!/bin/bash

# Dimbadimba Game Deployment Script
echo "Starting deployment process..."

# Create timestamp for cache busting
TIMESTAMP=$(date +%s)
echo "Using timestamp for cache busting: $TIMESTAMP"

# Create build directory if it doesn't exist
BUILD_DIR="build"
if [ ! -d "$BUILD_DIR" ]; then
  mkdir -p "$BUILD_DIR"
  echo "Created build directory at $BUILD_DIR"
fi

# Clean the build directory
rm -rf $BUILD_DIR/*
echo "Cleaned build directory"

# Copy all files to build directory first
cp -r index.html style.css script.js service-worker.js manifest.json icons/ images/ $BUILD_DIR/
echo "Copied base files to build directory"

# Update the cache version in service worker
sed -i.bak "s/const CACHE_VERSION = [0-9]\+;/const CACHE_VERSION = $TIMESTAMP;/g" $BUILD_DIR/service-worker.js
rm $BUILD_DIR/service-worker.js.bak
echo "Updated service worker cache version to timestamp: $TIMESTAMP"

# Add timestamp to CSS and JS references in HTML
sed -i.bak "s/style.css/style.css?v=$TIMESTAMP/g" $BUILD_DIR/index.html
sed -i.bak "s/script.js/script.js?v=$TIMESTAMP/g" $BUILD_DIR/index.html
rm $BUILD_DIR/index.html.bak
echo "Added cache busting parameters to asset URLs in HTML"

# Update manifest version
sed -i.bak "s/\"version\": \"[0-9.]*\"/\"version\": \"1.0.$TIMESTAMP\"/g" $BUILD_DIR/manifest.json
rm $BUILD_DIR/manifest.json.bak
echo "Updated version in manifest.json"

# Display completion message
echo "Build complete! Files ready for deployment in $BUILD_DIR/"
echo "Cache-busting timestamp $TIMESTAMP applied to critical assets"

# Create a zip file for easy upload
cd $BUILD_DIR
zip -r dimbadimba_game.zip ./*
cd ..

echo "Deployment complete with cache busting (v$TIMESTAMP)"
echo "Deployment package created successfully!"
echo "You can find the zip file at: $BUILD_DIR/dimbadimba_game.zip"
echo ""
echo "To deploy your game:"
echo "1. Upload these files to your chosen hosting provider"
echo "2. Configure your domain (dimbadimba.com) to point to your hosting"
echo "3. Enjoy your game at dimbadimba.com!"

# Optional: If you're using GitHub Pages, you can add git commands here
# git add .
# git commit -m "Prepare game files for deployment"
# git push origin main 