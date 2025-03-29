import React, { useEffect, useRef, useState } from 'react';
import { GameState } from '../game/GameState';
import { AudioManager } from '../audio/AudioManager';

interface GameBoardProps {
  gameState: GameState;
  audioManager: AudioManager;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, audioManager }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const { width, height } = container.getBoundingClientRect();
          setDimensions({
            width: Math.min(width, height * (4/3)),
            height: Math.min(height, width * (3/4))
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (gameState.isPaused) return;

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw game objects
      gameState.objects.forEach(obj => {
        ctx.fillStyle = obj.color || '#000';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      });

      // Draw player
      if (gameState.player) {
        ctx.fillStyle = '#00f';
        ctx.fillRect(
          gameState.player.x,
          gameState.player.y,
          gameState.player.width,
          gameState.player.height
        );
      }

      // Draw score
      ctx.fillStyle = '#000';
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${gameState.score}`, 10, 30);
      ctx.fillText(`Lives: ${gameState.lives}`, 10, 60);
      ctx.fillText(`Level: ${gameState.level}`, 10, 90);

      if (gameState.isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', dimensions.width / 2, dimensions.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText(
          `Final Score: ${gameState.score}`,
          dimensions.width / 2,
          dimensions.height / 2 + 40
        );
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameState, dimensions]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        if (gameState.player && gameState.player.velocity) {
          gameState.player.velocity.x = -5;
        }
        break;
      case 'ArrowRight':
        if (gameState.player && gameState.player.velocity) {
          gameState.player.velocity.x = 5;
        }
        break;
      case ' ':
        if (gameState.player && gameState.player.velocity) {
          gameState.player.velocity.y = -10;
          audioManager.playSound('jump');
        }
        break;
      case 'p':
      case 'P':
        if (gameState.isPaused) {
          gameState.resume();
        } else {
          gameState.pause();
        }
        break;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        border: '1px solid black',
        display: 'block',
        margin: '0 auto',
        touchAction: 'none'
      }}
    />
  );
}; 