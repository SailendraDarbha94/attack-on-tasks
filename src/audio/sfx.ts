import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

// Fire-and-forget game SFX. Players persist for the app's lifetime;
// sound must never be able to crash the game, hence the broad catches.
const SOURCES = {
  strike: require('../../assets/sfx/strike.wav'),
  kill: require('../../assets/sfx/kill.wav'),
  grow: require('../../assets/sfx/grow.wav'),
} as const;

export type SfxName = keyof typeof SOURCES;

const players = new Map<SfxName, AudioPlayer>();
let modeSet = false;

export function playSfx(name: SfxName): void {
  try {
    if (!modeSet) {
      modeSet = true;
      // the blow should land even with the ringer switched off
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(SOURCES[name]);
      players.set(name, player);
    }
    player.seekTo(0);
    player.play();
  } catch (err) {
    console.warn('sfx failed', err);
  }
}
