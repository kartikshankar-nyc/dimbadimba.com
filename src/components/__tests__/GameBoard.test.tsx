import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameBoard } from '../../ui/GameBoard';
import { createMockGameState, createMockAudioManager } from '../../test/utils/testUtils';
import { GameState } from '../../game/GameState';
import { AudioManager } from '../../audio/AudioManager';

describe('GameBoard Component', () => {
  const mockGameState = createMockGameState() as unknown as GameState;
  const mockAudioManager = createMockAudioManager() as unknown as AudioManager;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders canvas element', () => {
      render(<GameBoard gameState={mockGameState} audioManager={mockAudioManager} />);
      const canvas = screen.getByRole('img'); // Canvas elements are treated as images for a11y
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe('CANVAS');
    });

    test('applies correct styles to canvas', () => {
      render(<GameBoard gameState={mockGameState} audioManager={mockAudioManager} />);
      const canvas = screen.getByRole('img');
      
      const styles = window.getComputedStyle(canvas);
      expect(canvas).toHaveStyle('border: 1px solid black');
      expect(canvas).toHaveStyle('display: block');
      expect(canvas).toHaveStyle('margin: 0 auto');
    });
  });

  describe('Game State Integration', () => {
    test('canvas has proper dimensions', () => {
      render(<GameBoard gameState={mockGameState} audioManager={mockAudioManager} />);
      const canvas = screen.getByRole('img');
      
      // Default dimensions from the component
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
    });

    test('handles window resize', () => {
      // Mock resize function
      const resizeSpy = jest.spyOn(window, 'addEventListener');

      render(<GameBoard gameState={mockGameState} audioManager={mockAudioManager} />);
      
      // Should register resize listener
      expect(resizeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      // Clean up
      resizeSpy.mockRestore();
    });
  });

  describe('Input Handling', () => {
    test('registers key down events', () => {
      render(<GameBoard gameState={mockGameState} audioManager={mockAudioManager} />);
      const canvas = screen.getByRole('img');
      
      // Canvas should be focusable
      expect(canvas).toHaveAttribute('tabIndex', '0');
      
      // Simulate left arrow key
      fireEvent.keyDown(canvas, { key: 'ArrowLeft' });
      
      // Verify player velocity changed if conditions in component met
      if (mockGameState.player && mockGameState.player.velocity) {
        expect(mockGameState.player.velocity.x).toBe(-5);
      }
    });

    test('handles space key for jump', () => {
      render(<GameBoard gameState={mockGameState} audioManager={mockAudioManager} />);
      const canvas = screen.getByRole('img');
      
      // Simulate space key
      fireEvent.keyDown(canvas, { key: ' ' });
      
      // Verify player velocity changed if conditions in component met
      if (mockGameState.player && mockGameState.player.velocity) {
        expect(mockGameState.player.velocity.y).toBe(-10);
      }
      
      // Verify sound played
      expect(mockAudioManager.playSound).toHaveBeenCalledWith('jump');
    });

    test('handles p key for pause/resume', () => {
      // Setup initial state
      mockGameState.isPaused = false;
      
      render(<GameBoard gameState={mockGameState} audioManager={mockAudioManager} />);
      const canvas = screen.getByRole('img');
      
      // Simulate p key
      fireEvent.keyDown(canvas, { key: 'p' });
      
      // Verify pause called
      expect(mockGameState.pause).toHaveBeenCalled();
      
      // Setup paused state
      mockGameState.isPaused = true;
      
      // Simulate p key again
      fireEvent.keyDown(canvas, { key: 'p' });
      
      // Verify resume called
      expect(mockGameState.resume).toHaveBeenCalled();
    });
  });

  describe('Rendering Logic', () => {
    test('uses requestAnimationFrame for rendering', () => {
      const requestSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
      
      render(<GameBoard gameState={mockGameState} audioManager={mockAudioManager} />);
      
      expect(requestSpy).toHaveBeenCalled();
      
      requestSpy.mockRestore();
    });

    test('cleans up animation frame on unmount', () => {
      const cancelSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
      
      const { unmount } = render(
        <GameBoard gameState={mockGameState} audioManager={mockAudioManager} />
      );
      
      // Unmount to trigger cleanup
      unmount();
      
      expect(cancelSpy).toHaveBeenCalled();
      
      cancelSpy.mockRestore();
    });
  });
}); 