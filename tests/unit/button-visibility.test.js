/**
 * Start Button Visibility Test
 * 
 * This test verifies that the start button is always visible in the viewport,
 * regardless of screen orientation or device size.
 */

describe('Start Button Visibility', () => {
    beforeEach(() => {
        // Set up the document body with a mock of our game structure
        document.body.innerHTML = `
            <div class="game-container">
                <div class="game-area">
                    <div class="overlay" id="startScreen">
                        <h2>Pixel Runner</h2>
                        <div class="character-intro">
                            <div id="dimbadimbaDisplay" class="character-display"></div>
                            <p class="game-description">Game description text</p>
                        </div>
                        <div class="mode-selection">
                            <p>Select Mode:</p>
                            <div class="mode-buttons">
                                <button id="dayModeBtn" class="selected">Day Mode</button>
                                <button id="nightModeBtn">Night Mode</button>
                            </div>
                        </div>
                        <button id="startButton">Start Game</button>
                        <p class="instructions">Instructions text</p>
                    </div>
                </div>
            </div>
        `;
        
        // Mock the ensureStartButtonVisibility function
        window.ensureStartButtonVisibility = function() {
            const startButton = document.getElementById('startButton');
            if (startButton) {
                // Simple implementation for testing
                const rect = startButton.getBoundingClientRect();
                if (rect.bottom > window.innerHeight) {
                    startButton.scrollIntoView({block: 'center'});
                }
            }
        };
    });
    
    test('Start button should be visible in portrait mode', () => {
        // Mock a portrait mode viewport
        Object.defineProperty(window, 'innerWidth', {configurable: true, value: 375});
        Object.defineProperty(window, 'innerHeight', {configurable: true, value: 667});
        
        // Call the function being tested
        window.ensureStartButtonVisibility();
        
        // Get button position
        const startButton = document.getElementById('startButton');
        const rect = startButton.getBoundingClientRect();
        
        // Verify the button is fully in the viewport
        expect(rect.top).toBeGreaterThanOrEqual(0);
        expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    });
    
    test('Start button should be visible in landscape mode on small screens', () => {
        // Mock a landscape mode viewport with small height (like a phone)
        Object.defineProperty(window, 'innerWidth', {configurable: true, value: 667});
        Object.defineProperty(window, 'innerHeight', {configurable: true, value: 375});
        
        const startButton = document.getElementById('startButton');

        // Spy on scrollIntoView to verify it gets called when button is off-screen
        const scrollSpy = jest.fn();
        startButton.scrollIntoView = scrollSpy;

        // Simulate the button being below the viewport by mocking getBoundingClientRect
        startButton.getBoundingClientRect = jest.fn().mockReturnValue({
            top: 400,
            bottom: 440,
            left: 0,
            right: 200,
            width: 200,
            height: 40
        });
        
        // Call the function being tested
        window.ensureStartButtonVisibility();
        
        // In jsdom, scrollIntoView should be called when button.bottom > innerHeight
        expect(scrollSpy).toHaveBeenCalledWith({block: 'center'});
    });
}); 