export interface Vector2D {
  x: number;
  y: number;
}

export type PlatformType = 'normal' | 'bounce' | 'hazard' | 'disappear' | 'ice' | 'checkpoint';

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  color?: string;
  label?: string;
  isTriggered?: boolean; // For disappearing platforms
  triggerTime?: number;
}

export interface MagicCore {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export interface HistoryFrame {
  x: number;
  y: number;
  vx: number;
  vy: number;
  timestamp: number;
  isGrounded: boolean;
  facingLeft: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number; // 0 to 1
  decay: number;
  glow?: boolean;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Master';
  bestTime?: number; // in milliseconds
  startX: number;
  startY: number;
  platforms: Platform[];
  cores: MagicCore[];
  parTime: number; // target time in seconds
  hint?: string;
}

export interface GameState {
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    isGrounded: boolean;
    facingLeft: boolean;
    coyoteTime: number;
    jumpBuffer: number;
  };
  ghost: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
    isGrounded: boolean;
  };
  rope: {
    active: boolean;
    tension: number; // 0 to 1
    thickness: number;
    connecting: boolean;
    lastActive: boolean;
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    maxUses?: number;
    remainingUses?: number;
    maxLifetime?: number; // in seconds
    remainingLifetime?: number; // in seconds
  };
  history: HistoryFrame[];
  particles: Particle[];
  cores: MagicCore[];
  platforms: Platform[];
  currentLevelIndex: number;
  score: number;
  timeElapsed: number; // in ms
  isCleared: boolean;
  isGameOver: boolean;
  deaths: number;
  ropeStitchesCreated: number;
  checkpoint: Vector2D | null;
}
