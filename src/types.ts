/**
 * Arena Clash - Types & Constants
 */

export type GameMode = '1P_EASY' | '1P_NORMAL' | '1P_HARD' | '2P';

export type GamePhase = 
  | 'TITLE'
  | 'CONTROLS'
  | 'ROUND_INTRO'
  | 'FIGHTING'
  | 'ROUND_OVER'
  | 'MATCH_OVER'
  | 'PAUSED';

export type FighterState = 
  | 'IDLE'
  | 'WALK_FWD'
  | 'WALK_BACK'
  | 'JUMP'
  | 'PUNCH'
  | 'KICK'
  | 'BLOCK'
  | 'HIT'
  | 'SPECIAL'
  | 'KNOCKED_DOWN';

export interface FighterConfig {
  id: 'p1' | 'p2';
  name: string;
  title: string;
  skinTone: string;
  hairColor: string;
  hairStyle: 'spiky' | 'headband';
  outfitPrimary: string;
  outfitSecondary: string;
  glovesColor: string;
  specialName: string;
  specialColor: string;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type: 'spark' | 'dust' | 'fire' | 'ice' | 'ring' | 'smoke';
  life: number;
  maxLife: number;
  rotation?: number;
  vRot?: number;
}

export interface Projectile {
  id: string;
  ownerId: 'p1' | 'p2';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  coreColor: string;
  damage: number;
  active: boolean;
  trailTimer: number;
}

export interface MatchStats {
  p1DamageDealt: number;
  p2DamageDealt: number;
  p1MaxCombo: number;
  p2MaxCombo: number;
  p1RoundsWon: number;
  p2RoundsWon: number;
  durationSeconds: number;
  winner: 'p1' | 'p2' | null;
}
