// Per-device settings, profile and match history (localStorage). Every access is guarded:
// in private windows or embedded viewers storage can be missing, and the game must still work.

import type { Star } from '../sim/data';
import type { BoardId } from './theme';

export interface Settings {
  board: BoardId | 'random';
  speed: number;
  haptics: boolean;
  reduceMotion: boolean;
}

export interface Profile {
  name: string;
  /** Unit id whose bust is the player's avatar. */
  avatar: string;
}

export interface MatchRecord {
  date: number;
  placement: number;
  rounds: number;
  lineup: { defId: string; star: Star }[];
}

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export const DEFAULT_SETTINGS: Settings = { board: 'random', speed: 1, haptics: true, reduceMotion: prefersReducedMotion() };
const DEFAULT_PROFILE: Profile = { name: 'Player', avatar: 'warden' };

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : { ...fallback, ...JSON.parse(v) };
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

export const store = {
  settings: read<Settings>('ct.settings', DEFAULT_SETTINGS),
  profile: read<Profile>('ct.profile', DEFAULT_PROFILE),
  history: (() => {
    try {
      const v = localStorage.getItem('ct.history');
      return v ? (JSON.parse(v) as MatchRecord[]) : [];
    } catch {
      return [] as MatchRecord[];
    }
  })(),

  saveSettings() {
    write('ct.settings', this.settings);
  },
  resetSettings() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  },
  saveProfile() {
    write('ct.profile', this.profile);
  },
  addMatch(rec: MatchRecord) {
    this.history = [rec, ...this.history].slice(0, 50);
    try {
      localStorage.setItem('ct.history', JSON.stringify(this.history));
    } catch {
      /* storage unavailable */
    }
  },
};
