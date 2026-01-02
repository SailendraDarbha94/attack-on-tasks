# ⚔️ Attack on Tasks

A browser-playable 2.5D action game where you fight **Titans** representing your bad habits! Built with Phaser 3, TypeScript, and Vite.

## 🎮 Game Features

### Combat System
- **Attack** (SPACE): Lunge attack with directional hitbox detection
- **Dodge** (SHIFT): Quick dodge roll with invulnerability frames
- **Health & Energy**: Manage your resources strategically

### Titans (Bad Habit Enemies)
Each titan represents a bad habit you're fighting against:
- 🚬 **Smoke Titan** - The grey menace of nicotine
- 🍺 **Drink Titan** - The brown beast of alcohol
- 😴 **Sleep Titan** - The purple sloth of oversleeping  
- 🍔 **Junk Titan** - The orange glutton of unhealthy eating
- 🐢 **Lazy Titan** - The dark demon of procrastination
- 👹 **Habit Colossus** - The final boss (all habits combined!)

### 5 Levels
1. **The First Battle** - Tutorial level
2. **Smoke District** - Clear the smoky haze
3. **Tavern of Temptation** - Face the allure of drinks
4. **The Feast Grounds** - Resist unhealthy eating
5. **The Final Stand** - Boss fight against the Habit Colossus!

### Visual Features
- **2.5D Depth Sorting**: Dynamic sprite ordering based on Y-position
- **Parallax Scrolling**: Multi-layer backgrounds for depth perception
- **Particle Effects**: Combat feedback and visual polish
- **Screen Shake**: Impactful combat feel
- **Animated UI**: Smooth transitions and notifications

## 🚀 Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## 🎯 Controls

| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| SPACE | Attack |
| SHIFT | Dodge/Roll |
| ENTER | Continue/Retry |
| ESC | Return to Menu |

## 📁 Project Structure

```
src/
├── main.ts              # Game initialization
├── PreloaderScene.ts    # Asset loading with progress bar
├── MainMenuScene.ts     # Title screen and level select
├── GameScene.ts         # Main gameplay
├── Player.ts            # Player with combat abilities
├── Titan.ts             # Enemy AI and behavior
├── UIManager.ts         # HUD and notifications
└── LevelConfig.ts       # Level definitions

assets/
├── player-sprite.png    # Player character sprite
├── titan.png            # Titan enemy sprite
├── background.png       # Game background
├── tileset.png          # Environment tiles
└── ui-elements.png      # UI graphics
```

## 🎨 Game Mechanics

### Depth Sorting (2.5D Effect)
All sprites have their render depth updated each frame based on their Y position:
- Higher Y = appears in front (closer to camera)
- Creates illusion of walking behind/in front of objects

### Parallax Scrolling
- **Far layer**: Moves at 0.1x camera speed
- **Near layer**: Moves at 0.3x camera speed
- **Game objects**: Move at 1.0x camera speed

### Combat
- Attacks have directional hitboxes
- Titans have health bars and aggressive behavior
- Dodge grants temporary invulnerability
- Energy regenerates over time

## 🛠️ Technologies

- **Phaser 3** - Game engine
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast development and building

## 🏆 Tips

1. **Manage Energy**: Don't spam attacks, let energy regenerate
2. **Use Dodge**: Invulnerability frames can save you
3. **Hit and Run**: Attack then dodge away
4. **Prioritize**: Take out smaller titans before the boss
5. **Stay Mobile**: Standing still makes you an easy target

## 📜 License

MIT License - Feel free to use and modify!

---

*Conquer your habits, one Titan at a time!* ⚔️