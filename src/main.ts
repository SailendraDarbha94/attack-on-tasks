import Phaser from 'phaser';
import { PreloaderScene } from './PreloaderScene';
import { MainMenuScene } from './MainMenuScene';
import { GameScene } from './GameScene';

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0, x: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [PreloaderScene, MainMenuScene, GameScene]
};

// Initialize the game
const game = new Phaser.Game(config);

export default game;