import { TitanConfig } from './Titan';

export interface LevelConfig {
    id: number;
    name: string;
    description: string;
    worldWidth: number;
    worldHeight: number;
    backgroundTint?: number;
    backgroundTexture?: string;
    titans: Array<{
        config: TitanConfig;
        x: number;
        y: number;
    }>;
    obstacles: Array<{
        type: 'giant-tree' | 'building' | 'wall' | 'rock';
        x: number;
        y: number;
        scale?: number;
    }>;
    playerStart: { x: number; y: number };
    victoryCondition: 'defeat_all' | 'survive_time' | 'reach_goal';
    victoryParams?: {
        timeSeconds?: number;
        goalX?: number;
        goalY?: number;
    };
}

// Titan type configurations based on AoT
const TITAN_TYPES = {
    // 3-meter class (small and fast)
    SMALL: {
        name: '3m Titan',
        health: 60,
        speed: 80,
        damage: 8,
        scale: 0.6,
        tint: 0xd4a574
    },
    // 7-meter class (normal)
    NORMAL: {
        name: '7m Titan',
        health: 100,
        speed: 50,
        damage: 15,
        scale: 0.8,
        tint: 0xc4836c
    },
    // 10-meter class (large)
    LARGE: {
        name: '10m Titan',
        health: 150,
        speed: 40,
        damage: 20,
        scale: 1.0,
        tint: 0xb5725a
    },
    // 15-meter class (huge)
    HUGE: {
        name: '15m Titan',
        health: 200,
        speed: 30,
        damage: 25,
        scale: 1.2,
        tint: 0xa66048
    },
    // Abnormal (unpredictable, faster)
    ABNORMAL: {
        name: 'Abnormal',
        health: 120,
        speed: 90,
        damage: 18,
        scale: 0.9,
        tint: 0xff6666
    },
    // Armored Titan (boss)
    ARMORED: {
        name: 'Armored Titan',
        health: 350,
        speed: 35,
        damage: 30,
        scale: 1.3,
        tint: 0x888888
    },
    // Colossal Titan (final boss)
    COLOSSAL: {
        name: 'Colossal Titan',
        health: 500,
        speed: 15,
        damage: 50,
        scale: 1.8,
        tint: 0x8b3a3a
    }
};

export const LEVELS: LevelConfig[] = [
    // Level 1: Training Grounds - Tutorial
    {
        id: 1,
        name: 'Training Grounds',
        description: 'Learn to use your ODM gear against wooden titans.',
        worldWidth: 1200,
        worldHeight: 900,
        backgroundTint: 0x87CEEB,
        titans: [
            { config: TITAN_TYPES.SMALL, x: 500, y: 300 },
            { config: TITAN_TYPES.SMALL, x: 700, y: 500 },
            { config: TITAN_TYPES.SMALL, x: 900, y: 350 }
        ],
        obstacles: [
            { type: 'giant-tree', x: 300, y: 200 },
            { type: 'giant-tree', x: 600, y: 400 },
            { type: 'giant-tree', x: 400, y: 600 },
            { type: 'building', x: 800, y: 200 },
            { type: 'rock', x: 200, y: 500 }
        ],
        playerStart: { x: 150, y: 450 },
        victoryCondition: 'defeat_all'
    },

    // Level 2: Giant Forest - 57th Expedition
    {
        id: 2,
        name: 'Giant Forest',
        description: 'The Female Titan was spotted here. Eliminate all threats!',
        worldWidth: 1600,
        worldHeight: 1200,
        backgroundTint: 0x2d4a2d,
        titans: [
            { config: TITAN_TYPES.NORMAL, x: 400, y: 300 },
            { config: TITAN_TYPES.NORMAL, x: 800, y: 400 },
            { config: TITAN_TYPES.SMALL, x: 600, y: 600 },
            { config: TITAN_TYPES.SMALL, x: 1000, y: 300 },
            { config: TITAN_TYPES.ABNORMAL, x: 700, y: 800 }
        ],
        obstacles: [
            { type: 'giant-tree', x: 200, y: 200, scale: 1.5 },
            { type: 'giant-tree', x: 500, y: 300, scale: 1.3 },
            { type: 'giant-tree', x: 300, y: 500, scale: 1.4 },
            { type: 'giant-tree', x: 700, y: 200, scale: 1.2 },
            { type: 'giant-tree', x: 900, y: 500, scale: 1.5 },
            { type: 'giant-tree', x: 1100, y: 300, scale: 1.3 },
            { type: 'giant-tree', x: 400, y: 800, scale: 1.4 },
            { type: 'giant-tree', x: 1200, y: 600, scale: 1.2 },
            { type: 'rock', x: 600, y: 400 },
            { type: 'rock', x: 1000, y: 700 }
        ],
        playerStart: { x: 100, y: 600 },
        victoryCondition: 'defeat_all'
    },

    // Level 3: Trost District - Battle for Trost
    {
        id: 3,
        name: 'Trost District',
        description: 'Titans have breached the wall! Protect the citizens!',
        worldWidth: 1800,
        worldHeight: 1400,
        backgroundTint: 0x8b8b7a,
        titans: [
            { config: TITAN_TYPES.LARGE, x: 600, y: 400 },
            { config: TITAN_TYPES.NORMAL, x: 400, y: 600 },
            { config: TITAN_TYPES.NORMAL, x: 900, y: 500 },
            { config: TITAN_TYPES.SMALL, x: 700, y: 300 },
            { config: TITAN_TYPES.SMALL, x: 1100, y: 600 },
            { config: TITAN_TYPES.ABNORMAL, x: 800, y: 900 },
            { config: TITAN_TYPES.HUGE, x: 1200, y: 400 }
        ],
        obstacles: [
            { type: 'building', x: 200, y: 200 },
            { type: 'building', x: 400, y: 300 },
            { type: 'building', x: 600, y: 200 },
            { type: 'building', x: 300, y: 500 },
            { type: 'building', x: 800, y: 300 },
            { type: 'building', x: 1000, y: 200 },
            { type: 'building', x: 500, y: 700 },
            { type: 'building', x: 900, y: 700 },
            { type: 'wall', x: 100, y: 300 },
            { type: 'wall', x: 100, y: 600 },
            { type: 'wall', x: 100, y: 900 },
            { type: 'rock', x: 700, y: 600, scale: 0.8 },
            { type: 'rock', x: 1100, y: 800 }
        ],
        playerStart: { x: 200, y: 700 },
        victoryCondition: 'defeat_all'
    },

    // Level 4: Shiganshina District - Return to Shiganshina
    {
        id: 4,
        name: 'Shiganshina',
        description: 'Retake the fallen district! Beware of powerful titans.',
        worldWidth: 2000,
        worldHeight: 1600,
        backgroundTint: 0x6b6b5a,
        titans: [
            { config: TITAN_TYPES.HUGE, x: 600, y: 500 },
            { config: TITAN_TYPES.HUGE, x: 1000, y: 400 },
            { config: TITAN_TYPES.LARGE, x: 800, y: 700 },
            { config: TITAN_TYPES.LARGE, x: 1200, y: 600 },
            { config: TITAN_TYPES.ABNORMAL, x: 500, y: 900 },
            { config: TITAN_TYPES.ABNORMAL, x: 1400, y: 500 },
            { config: TITAN_TYPES.NORMAL, x: 700, y: 300 },
            { config: TITAN_TYPES.NORMAL, x: 900, y: 1000 },
            { config: TITAN_TYPES.ARMORED, x: 1000, y: 800 }
        ],
        obstacles: [
            { type: 'building', x: 300, y: 300, scale: 1.2 },
            { type: 'building', x: 500, y: 400 },
            { type: 'building', x: 700, y: 250 },
            { type: 'building', x: 400, y: 700 },
            { type: 'building', x: 1100, y: 300 },
            { type: 'building', x: 1300, y: 500 },
            { type: 'building', x: 600, y: 1100 },
            { type: 'building', x: 1000, y: 1100 },
            { type: 'wall', x: 200, y: 200 },
            { type: 'wall', x: 200, y: 500 },
            { type: 'wall', x: 200, y: 800 },
            { type: 'wall', x: 200, y: 1100 },
            { type: 'rock', x: 800, y: 500 },
            { type: 'rock', x: 1200, y: 900 }
        ],
        playerStart: { x: 150, y: 600 },
        victoryCondition: 'defeat_all'
    },

    // Level 5: Wall Maria - Final Stand (BOSS)
    {
        id: 5,
        name: 'Wall Maria',
        description: 'THE COLOSSAL TITAN APPEARS! Humanity\'s fate is in your hands!',
        worldWidth: 2400,
        worldHeight: 2000,
        backgroundTint: 0xff6b35,
        titans: [
            { config: TITAN_TYPES.COLOSSAL, x: 1200, y: 1000 },
            { config: TITAN_TYPES.ARMORED, x: 800, y: 700 },
            { config: TITAN_TYPES.ARMORED, x: 1600, y: 700 },
            { config: TITAN_TYPES.HUGE, x: 600, y: 500 },
            { config: TITAN_TYPES.HUGE, x: 1800, y: 500 },
            { config: TITAN_TYPES.ABNORMAL, x: 700, y: 1200 },
            { config: TITAN_TYPES.ABNORMAL, x: 1700, y: 1200 },
            { config: TITAN_TYPES.LARGE, x: 500, y: 800 },
            { config: TITAN_TYPES.LARGE, x: 1900, y: 800 },
            { config: TITAN_TYPES.NORMAL, x: 900, y: 400 },
            { config: TITAN_TYPES.NORMAL, x: 1500, y: 400 }
        ],
        obstacles: [
            { type: 'wall', x: 400, y: 300, scale: 1.5 },
            { type: 'wall', x: 800, y: 300, scale: 1.5 },
            { type: 'wall', x: 1200, y: 300, scale: 1.5 },
            { type: 'wall', x: 1600, y: 300, scale: 1.5 },
            { type: 'wall', x: 2000, y: 300, scale: 1.5 },
            { type: 'building', x: 500, y: 600 },
            { type: 'building', x: 900, y: 550 },
            { type: 'building', x: 1500, y: 550 },
            { type: 'building', x: 1900, y: 600 },
            { type: 'building', x: 600, y: 1000, scale: 1.2 },
            { type: 'building', x: 1000, y: 1200, scale: 1.2 },
            { type: 'building', x: 1400, y: 1200, scale: 1.2 },
            { type: 'building', x: 1800, y: 1000, scale: 1.2 },
            { type: 'rock', x: 1100, y: 800 },
            { type: 'rock', x: 1300, y: 800 },
            { type: 'rock', x: 1200, y: 600, scale: 1.3 }
        ],
        playerStart: { x: 200, y: 1000 },
        victoryCondition: 'defeat_all'
    }
];

export function getLevel(id: number): LevelConfig | undefined {
    return LEVELS.find(level => level.id === id);
}

export function getTotalLevels(): number {
    return LEVELS.length;
}
