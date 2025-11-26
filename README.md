# 2.5D Phaser Game

A browser-playable 2D game with 2.5D depth effects using Phaser 3, TypeScript, and Vite.

## Features

- **2.5D Depth Sorting**: Objects are sorted by their Y position to create depth illusion
- **Parallax Scrolling**: Multiple background layers moving at different speeds
- **Smooth Player Movement**: Arrow keys or WASD controls
- **Camera Following**: Camera smoothly follows the player
- **Interactive Obstacles**: Walk behind and in front of trees to see depth sorting in action

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Controls

- **Arrow Keys** or **WASD**: Move the player character
- Walk around the trees to see the 2.5D depth sorting effect in action!

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── main.ts          # Game initialization and configuration
├── GameScene.ts     # Main game scene with parallax and depth sorting
└── Player.ts        # Player character with movement controls

assets/              # Replace placeholder assets with your own
├── player.png       # Player sprite (recommended: 32x48px)
├── tree.png         # Obstacle sprite (recommended: 40x80px)
├── far-bg.png       # Far background tile (recommended: 64x64px)
└── near-bg.png      # Near background tile (recommended: 128x128px)
```

## 2.5D Techniques Used

### Depth Sorting
- All sprites have their depth updated based on their Y position
- Higher Y values (lower on screen) = higher depth (appear in front)
- This creates the illusion that objects further "down" are closer to the camera

### Parallax Scrolling
- **Far Background**: Moves at 0.1x camera speed (very slow)
- **Near Background**: Moves at 0.3x camera speed (medium)
- **Game Objects**: Move at 1.0x camera speed (normal)
- This creates depth perception through motion

## Customization

### Replace Placeholder Assets
The game currently uses colored rectangles as placeholders. Replace them with actual sprites:

1. Add your sprite files to the `assets/` directory
2. Update the `preload()` method in `GameScene.ts` to load your assets:
```typescript
this.load.image('player', 'assets/player.png');
this.load.image('tree', 'assets/tree.png');
```

### Add More Game Objects
To add more objects with depth sorting:
1. Create the sprite in `GameScene.create()`
2. Add it to the `gameObjects` array
3. The depth sorting will be handled automatically

### Adjust Parallax Speeds
Modify the multipliers in `GameScene.update()`:
```typescript
// Slower = further away, faster = closer
this.farBackground.tilePositionX = camera.scrollX * 0.1;  // Very far
this.nearBackground.tilePositionX = camera.scrollX * 0.5; // Closer
```

## Technologies Used

- **Phaser 3**: Game engine
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast development server and build tool