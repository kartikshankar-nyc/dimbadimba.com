# Pixel Runner

A fast-paced endless runner game built with vanilla JavaScript and HTML5 Canvas.

## Game Description

Pixel Runner is an addictive endless runner where you control a character jumping over obstacles and collecting coins for points. The game gets progressively harder as your score increases, with the game speed gradually increasing.

## Features

- Simple, addictive gameplay
- Pixel art graphics created dynamically in JavaScript
- Progressive difficulty
- Score tracking with local storage for high scores
- Responsive design that works on mobile and desktop
- Smooth animations and collision detection
- Game pause functionality

## How to Play

1. Click the "START GAME" button to begin
2. Press SPACE bar to jump over obstacles
3. Collect yellow coins for bonus points
4. Press P to pause the game at any time
5. The game ends when you hit an obstacle

## Controls

- **SPACE / Touch**: Jump
- **P**: Pause/Resume game

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- HTML5 Canvas for rendering
- Local Storage API for saving high scores

## Setup

Simply open the `index.html` file in a web browser to play the game.

No dependencies or build process required!

## Development

The game is built using vanilla JavaScript without any external libraries or frameworks. All game elements, including the pixel art graphics, are generated dynamically using the HTML5 Canvas API.

Feel free to modify and extend the game with new features!

# Dimbadimba - Pixel Runner

A browser-based pixel runner game with day/night modes, parallax backgrounds, and mobile support.

## Game Features

- Simple pixel art graphics
- Day and night game modes with different visuals
- Parallax backgrounds for depth effect
- Obstacle variety with different shapes and sizes
- Mobile support with touch controls
- Progressive Web App (PWA) compatibility

## Development

### Prerequisites

- Node.js and npm installed

### Setup

1. Clone the repository
2. Install dependencies:

```
npm install
```

## Testing

This project uses Jest for unit and regression testing. The tests ensure that game functionality works correctly and that new changes don't break existing features.

### Running Tests

To run all tests:

```
npm test
```

To run tests in watch mode (for development):

```
npm run test:watch
```

To generate a test coverage report:

```
npm run test:coverage
```

### Test Structure

Tests are organized by feature area:

- `tests/game.test.js` - Core game functionality tests
- `tests/background.test.js` - Parallax background tests
- `tests/obstacles.test.js` - Obstacle creation and behavior tests
- `tests/mobile.test.js` - Mobile support and touch control tests
- `tests/audio.test.js` - Game audio system tests

### Test Process

Before making changes to the codebase, always run the tests to ensure everything is working properly:

1. Make sure all tests pass with `npm test`
2. Make your changes
3. Run tests again to verify your changes don't break existing functionality
4. Add new tests for any new features you implement

## Gameplay

- Press SPACE to jump (or tap the screen on mobile)
- Press P to pause the game
- Avoid obstacles and collect coins to increase your score

## License

ISC

## Deployment Guide

### Option 1: GitHub Pages (Free and Easy)

1. Create a GitHub account if you don't have one
2. Create a new repository named `dimbadimba.com`
3. Upload all game files (index.html, style.css, script.js) to the repository
4. Go to repository Settings → Pages
5. Enable GitHub Pages and select the main branch as source
6. GitHub will provide a URL like `yourusername.github.io/dimbadimba.com`

#### Connecting Your Domain:
1. In your GitHub repository, go to Settings → Pages
2. Under "Custom domain," enter `dimbadimba.com` and save
3. Go to your Porkbun domain dashboard
4. Add these DNS records:
   - Type: A, Host: @, Value: 185.199.108.153
   - Type: A, Host: @, Value: 185.199.109.153
   - Type: A, Host: @, Value: 185.199.110.153
   - Type: A, Host: @, Value: 185.199.111.153
   - Type: CNAME, Host: www, Value: yourusername.github.io.
5. Wait for DNS propagation (up to 24 hours)

### Option 2: Netlify (Free and Easy)

1. Create a Netlify account
2. Click "New site from Git" or drag-and-drop your folder with game files
3. Configure build settings (not needed for this static site)
4. Deploy your site

#### Connecting Your Domain:
1. In Netlify dashboard, go to your site → Domain settings → Add custom domain
2. Enter `dimbadimba.com`
3. Verify domain ownership by adding DNS records provided by Netlify to Porkbun
4. Or change your domain's nameservers to Netlify's nameservers

### Option 3: Traditional Web Hosting

1. Sign up for a web hosting service (Bluehost, HostGator, etc.)
2. Set up your hosting account and connect your domain
3. Upload game files via FTP or web interface to the public_html folder

## Local Development

1. Clone this repository
2. Open index.html in your browser to play the game locally
3. Make changes to HTML, CSS, or JS files and refresh to see updates

## Files Overview

- `index.html` - Main game HTML structure
- `style.css` - Game styling and responsive design
- `script.js` - Game logic and mechanics

## Game Features

- Endless runner gameplay with dimbadimba character
- Day and night visual modes
- Obstacle avoidance and coin collection
- Mobile-friendly with touch controls
- Responsive design for all screen sizes 