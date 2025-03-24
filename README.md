# Pixel Runner

http://dimbadimba.com/ <br>
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
- Endless runner gameplay with dimbadimba character
- Obstacle avoidance and coin collection
- Responsive design for all screen sizes 
<img width="1425" src="https://github.com/user-attachments/assets/4364664e-7f59-458b-b50d-793c4f0c6baf" />
<img width="1425" alt="Description" src="https://github.com/user-attachments/assets/d8aaaa23-d838-43c3-b10e-6196fd9783e7" />



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


## Local Development

1. Clone this repository
2. Open index.html in your browser to play the game locally
3. Make changes to HTML, CSS, or JS files and refresh to see updates

## Files Overview

- `index.html` - Main game HTML structure
- `style.css` - Game styling and responsive design
- `script.js` - Game logic and mechanics


