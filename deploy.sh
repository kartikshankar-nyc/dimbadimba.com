#!/bin/bash

# Simple deployment script for dimbadimba.com

echo "Preparing Dimbadimba game files for deployment..."

# Create a deployment directory
mkdir -p deploy

# Copy main game files
cp index.html deploy/
cp style.css deploy/
cp script.js deploy/
cp README.md deploy/
cp manifest.json deploy/
cp service-worker.js deploy/

# Create blank image files as placeholders (you should replace these with real icons)
echo "Creating placeholder icons (replace with your own icon images)..."
# Create simple icon files using ImageMagick if available
if command -v convert &> /dev/null; then
    convert -size 16x16 xc:black -fill white -font "Arial" -pointsize 10 -gravity center -draw "text 0,0 'D'" deploy/favicon-16.png
    convert -size 32x32 xc:black -fill white -font "Arial" -pointsize 20 -gravity center -draw "text 0,0 'D'" deploy/favicon-32.png
    convert -size 180x180 xc:black -fill white -font "Arial" -pointsize 100 -gravity center -draw "text 0,0 'D'" deploy/apple-touch-icon.png
    convert -size 192x192 xc:black -fill white -font "Arial" -pointsize 100 -gravity center -draw "text 0,0 'D'" deploy/icon-192.png
    convert -size 512x512 xc:black -fill white -font "Arial" -pointsize 250 -gravity center -draw "text 0,0 'D'" deploy/icon-512.png
else
    # If ImageMagick is not available, create empty files
    touch deploy/favicon-16.png
    touch deploy/favicon-32.png
    touch deploy/apple-touch-icon.png
    touch deploy/icon-192.png
    touch deploy/icon-512.png
    echo "ImageMagick not found. Please create your own icon files."
fi

# Create a zip file for easy upload
cd deploy
zip -r dimbadimba_game.zip ./*
cd ..

echo "Deployment package created successfully!"
echo "You can find the zip file at: deploy/dimbadimba_game.zip"
echo ""
echo "To deploy your game:"
echo "1. Upload these files to your chosen hosting provider"
echo "2. Configure your domain (dimbadimba.com) to point to your hosting"
echo "3. Enjoy your game at dimbadimba.com!"

# Optional: If you're using GitHub Pages, you can add git commands here
# git add .
# git commit -m "Prepare game files for deployment"
# git push origin main 