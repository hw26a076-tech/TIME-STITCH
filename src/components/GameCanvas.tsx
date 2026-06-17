import React, { useEffect, useRef, useState } from 'react';
import { GameState, Level, Platform, MagicCore, Particle, HistoryFrame, Vector2D } from '../types';
import { sfx } from '../audio';
import { Play, RotateCcw, Volume2, HelpCircle, Save, Award, Zap, ChevronRight, Check } from 'lucide-react';

interface GameCanvasProps {
  currentLevel: Level;
  onStageCleared: (time: number) => void;
  onExitToMenu: () => void;
  isCustomLevel?: boolean;
}

export default function GameCanvas({ currentLevel, onStageCleared, onExitToMenu, isCustomLevel = false }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sound settings
  const [musicOn, setMusicOn] = useState(true);
  const [sfxVolume, setSfxVolume] = useState(0.7);
  const [musicVolume, setMusicVolume] = useState(0.5);

  // Game UI overlays
  const [showHelp, setShowHelp] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // References for live state to avoid react closure stale bounds inside high-frequency animation frames
  const levelRef = useRef<Level>(currentLevel);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Collectables and stats
  const [collectedCount, setCollectedCount] = useState(0);
  const [totalCores, setTotalCores] = useState(currentLevel.cores.length);
  const [deaths, setDeaths] = useState(0);
  const [stitchesCreated, setStitchesCreated] = useState(0);
  const [gameTimer, setGameTimer] = useState(0); // in ms
  const [isCleared, setIsCleared] = useState(false);

  // Checkpoint tracking
  const activeCheckpoint = useRef<Vector2D | null>(null);

  // Track disappearing platforms lifetimes
  const platStateRef = useRef<{ [id: string]: { state: 'normal' | 'disappeared', timer: number } }>({});

  // Physics constants
  const GRAVITY = 0.38;
  const WALK_ACCEL = 0.55;
  const WALK_DECEL = 0.85;
  const MAX_SPEED_X = 5.2;
  const JUMP_FORCE = -8.2;
  const CATAPULT_FORCE = -12.5; // Big bouncy slingshot jump
  const ROPE_MIN_BOUNCE = -11.0;

  // Let's create our dynamic game variables inside a single reference object to bypass re-renders
  const stateRef = useRef<GameState>({
    player: {
      x: currentLevel.startX,
      y: currentLevel.startY,
      vx: 0,
      vy: 0,
      width: 22,
      height: 32,
      isGrounded: false,
      facingLeft: false,
      coyoteTime: 0,
      jumpBuffer: 0
    },
    ghost: {
      x: currentLevel.startX,
      y: currentLevel.startY,
      vx: 0,
      vy: 0,
      active: false,
      isGrounded: false
    },
    rope: {
      active: false,
      tension: 0,
      thickness: 3,
      connecting: false,
      lastActive: false,
      maxUses: 3,
      remainingUses: 3,
      maxLifetime: 4.0,
      remainingLifetime: 4.0
    },
    history: [],
    particles: [],
    cores: JSON.parse(JSON.stringify(currentLevel.cores)),
    platforms: JSON.parse(JSON.stringify(currentLevel.platforms)),
    currentLevelIndex: currentLevel.id,
    score: 0,
    timeElapsed: 0,
    isCleared: false,
    isGameOver: false,
    deaths: 0,
    ropeStitchesCreated: 0,
    checkpoint: null
  });

  // Re-sync levels if level changes
  useEffect(() => {
    levelRef.current = currentLevel;
    activeCheckpoint.current = null;
    
    // Initialize platform dynamic states
    const platStates: any = {};
    currentLevel.platforms.forEach(p => {
      if (p.type === 'disappear') {
        platStates[p.id] = { state: 'normal', timer: 0 };
      }
    });
    platStateRef.current = platStates;

    stateRef.current = {
      player: {
        x: currentLevel.startX,
        y: currentLevel.startY,
        vx: 0,
        vy: 0,
        width: 22,
        height: 32,
        isGrounded: false,
        facingLeft: false,
        coyoteTime: 0,
        jumpBuffer: 0
      },
      ghost: {
        x: currentLevel.startX,
        y: currentLevel.startY,
        vx: 0,
        vy: 0,
        active: false,
        isGrounded: false
      },
      rope: {
        active: false,
        tension: 0,
        thickness: 3,
        connecting: false,
        lastActive: false,
        maxUses: 3,
        remainingUses: 3,
        maxLifetime: 4.0,
        remainingLifetime: 4.0
      },
      history: [
        {
          x: currentLevel.startX,
          y: currentLevel.startY,
          vx: 0,
          vy: 0,
          timestamp: Date.now(),
          isGrounded: false,
          facingLeft: false
        }
      ],
      particles: [],
      cores: JSON.parse(JSON.stringify(currentLevel.cores)),
      platforms: JSON.parse(JSON.stringify(currentLevel.platforms)),
      currentLevelIndex: currentLevel.id,
      score: 0,
      timeElapsed: 0,
      isCleared: false,
      isGameOver: false,
      deaths: 0,
      ropeStitchesCreated: 0,
      checkpoint: null
    };

    setCollectedCount(0);
    setTotalCores(currentLevel.cores.length);
    setDeaths(0);
    setStitchesCreated(0);
    setGameTimer(0);
    setIsCleared(false);

    // Warm-up synthesizer volumes
    sfx.setSfxVolume(sfxVolume);
    sfx.setMusicVolume(musicVolume);

    if (musicOn) {
      sfx.startMusic();
    } else {
      sfx.stopMusic();
    }

    return () => {
      sfx.stopMusic();
    };
  }, [currentLevel]);

  // Handle keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default actions for gaming keys to avoid page scrolling
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }
      keysPressed.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set music & sfx properties programmatically
  const toggleMusic = () => {
    if (musicOn) {
      sfx.stopMusic();
      setMusicOn(false);
    } else {
      setMusicOn(true);
      sfx.startMusic();
    }
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSfxVolume(val);
    sfx.setSfxVolume(val);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVolume(val);
    sfx.setMusicVolume(val);
  };

  const resetStage = () => {
    const current = levelRef.current;
    const spawnX = activeCheckpoint.current ? activeCheckpoint.current.x : current.startX;
    const spawnY = activeCheckpoint.current ? activeCheckpoint.current.y : current.startY;
    
    stateRef.current.player.x = spawnX;
    stateRef.current.player.y = spawnY;
    stateRef.current.player.vx = 0;
    stateRef.current.player.vy = 0;
    stateRef.current.player.isGrounded = false;
    stateRef.current.rope.active = false;
    stateRef.current.rope.tension = 0;
    stateRef.current.rope.startX = undefined;
    stateRef.current.rope.startY = undefined;
    stateRef.current.rope.endX = undefined;
    stateRef.current.rope.endY = undefined;
    // Clear recent history to avoid instant tail confusion
    stateRef.current.history = Array.from({ length: 40 }).map(() => ({
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      timestamp: Date.now(),
      isGrounded: false,
      facingLeft: false
    }));
    
    // Clear disappearing platform timers
    Object.keys(platStateRef.current).forEach(id => {
      platStateRef.current[id] = { state: 'normal', timer: 0 };
    });

    sfx.playDeath();

    // Trigger explosive red spark death feedback
    createExplosion(spawnX + 11, spawnY + 16, '#ff4444', 35);
    setDeaths(d => d + 1);
  };

  // Build random explosions
  const createExplosion = (x: number, y: number, color: string, count: number) => {
    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 5.5;
      list.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 3.5,
        color,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        glow: true
      });
    }
    stateRef.current.particles.push(...list);
  };

  // Find precise position on player track exactly 3 seconds ago
  const calculateGhostPosition = (currentTime: number) => {
    const history = stateRef.current.history;
    if (history.length === 0) return;

    // Freeze ghost in place if stitching (rope is active)
    if (stateRef.current.rope.active) {
      return;
    }

    const targetTime = currentTime - 3000; // 3 seconds ago
    
    // If our history timeline is shorter than 3 seconds
    if (history[0].timestamp > targetTime) {
      // Just keep ghost at the very first starting frame
      stateRef.current.ghost.x = history[0].x;
      stateRef.current.ghost.y = history[0].y;
      stateRef.current.ghost.active = false;
      return;
    }

    stateRef.current.ghost.active = true;

    // Binary search or linear search for closest state
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < history.length; i++) {
      const diff = Math.abs(history[i].timestamp - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    const frame = history[closestIndex];
    stateRef.current.ghost.x = frame.x;
    stateRef.current.ghost.y = frame.y;
    stateRef.current.ghost.vx = frame.vx;
    stateRef.current.ghost.vy = frame.vy;
    stateRef.current.ghost.isGrounded = frame.isGrounded;
  };

  // Distance from point to line segment
  const getDistanceToLineSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return { dist: Math.hypot(px - x1, py - y1), u: 0 };
    
    let u = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    u = Math.max(0, Math.min(1, u));
    
    const projX = x1 + u * (x2 - x1);
    const projY = y1 + u * (y2 - y1);
    
    return {
      dist: Math.hypot(px - projX, py - projY),
      x: projX,
      y: projY,
      u
    };
  };

  // Main animation / physics routine
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    let totalFrameTime = 0;

    const gameTick = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      let dt = timestamp - lastTimeRef.current;
      if (dt > 100) dt = 16.66; // Protection against background tab pause hops
      lastTimeRef.current = timestamp;

      if (!isPaused && !isCleared) {
        totalFrameTime += dt;
        setGameTimer(prev => prev + dt);

        // Core physics calculations
        updatePhysics(dt);
      }

      // Drawing routines
      renderFrame(ctx);

      animFrameIdRef.current = requestAnimationFrame(gameTick);
    };

    const updatePhysics = (dt: number) => {
      const p = stateRef.current.player;
      const history = stateRef.current.history;
      const now = Date.now();

      // Input Left/Right
      let moveDir = 0;
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA'] || keysPressed.current['KeyJ']) {
        moveDir = -1;
        p.facingLeft = true;
      }
      if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD'] || keysPressed.current['KeyL']) {
        moveDir = 1;
        p.facingLeft = false;
      }

      // Smooth horizontal acceleration
      if (moveDir !== 0) {
        p.vx += moveDir * WALK_ACCEL;
        if (Math.abs(p.vx) > MAX_SPEED_X) {
          p.vx = Math.sign(p.vx) * MAX_SPEED_X;
        }

        // Emit simple white dust at player feet while grounded
        if (p.isGrounded && Math.random() < 0.25) {
          stateRef.current.particles.push({
            x: p.x + p.width / 2 + (Math.random() * p.width - p.width / 2),
            y: p.y + p.height,
            vx: -p.vx * 0.2 + (Math.random() * 0.6 - 0.3),
            vy: -0.2 - Math.random() * 0.5,
            size: 1 + Math.random() * 2.5,
            color: 'rgba(255, 255, 255, 0.4)',
            life: 0.8,
            decay: 0.04
          });
        }
      } else {
        // Friction / Deceleration
        if (p.vx > 0) {
          p.vx = Math.max(0, p.vx - WALK_DECEL);
        } else if (p.vx < 0) {
          p.vx = Math.min(0, p.vx + WALK_DECEL);
        }
      }

      // Coyote time & Jump buffers
      if (p.isGrounded) {
        p.coyoteTime = 8; // frames
      } else {
        p.coyoteTime = Math.max(0, p.coyoteTime - 1);
      }

      const g = stateRef.current.ghost;
      if (keysPressed.current['Space'] && !stateRef.current.rope.active) {
        if (g.active) {
          // Just triggered rope - requires ghost to be active to stitch
          stateRef.current.rope.active = true;
          stateRef.current.rope.startX = p.x + p.width / 2;
          stateRef.current.rope.startY = p.y + p.height / 2;
          stateRef.current.rope.endX = g.x + p.width / 2;
          stateRef.current.rope.endY = g.y + p.height / 2;
          stateRef.current.rope.maxUses = 3;
          stateRef.current.rope.remainingUses = 3;
          stateRef.current.rope.maxLifetime = 4.0;
          stateRef.current.rope.remainingLifetime = 4.0;

          setStitchesCreated(sc => sc + 1);
          sfx.playStitchConnect();
          
          // Flash of sparks at connector centers
          createExplosion(stateRef.current.rope.startX, stateRef.current.rope.startY, '#2dd4bf', 15);
          createExplosion(stateRef.current.rope.endX, stateRef.current.rope.endY, '#4ade80', 15);
        }
      } else if (!keysPressed.current['Space'] && stateRef.current.rope.active) {
        // Released rope
        stateRef.current.rope.active = false;
        stateRef.current.rope.startX = undefined;
        stateRef.current.rope.startY = undefined;
        stateRef.current.rope.endX = undefined;
        stateRef.current.rope.endY = undefined;
      }

      // Time-decay for Active Stitch Rope
      const rp = stateRef.current.rope;
      if (rp.active && rp.remainingLifetime !== undefined) {
        rp.remainingLifetime -= dt / 1000; // subtract elapsed seconds
        if (rp.remainingLifetime <= 0) {
          rp.active = false;
          const sx = rp.startX;
          const sy = rp.startY;
          const ex = rp.endX;
          const ey = rp.endY;
          rp.startX = undefined;
          rp.startY = undefined;
          rp.endX = undefined;
          rp.endY = undefined;
          
          if (sx !== undefined && sy !== undefined && ex !== undefined && ey !== undefined) {
            createExplosion(sx, sy, '#ef4444', 15);
            createExplosion(ex, ey, '#ef4444', 15);
            createExplosion((sx + ex) / 2, (sy + ey) / 2, '#ef4444', 20);
          }
          sfx.playRopeBreak();
        }
      }

      if (keysPressed.current['ArrowUp'] || keysPressed.current['KeyW'] || keysPressed.current['KeyK'] || keysPressed.current['KeyI'] || keysPressed.current['KeyZ']) {
        p.jumpBuffer = 6; // frames
      } else {
        p.jumpBuffer = Math.max(0, p.jumpBuffer - 1);
      }

      // Jump Execution
      if (p.jumpBuffer > 0 && p.coyoteTime > 0) {
        p.vy = JUMP_FORCE;
        p.isGrounded = false;
        p.coyoteTime = 0;
        p.jumpBuffer = 0;
        sfx.playJump();

        // Launch dust clouds
        createExplosion(p.x + p.width / 2, p.y + p.height, 'rgba(255,255,255,0.4)', 8);
      }

      // Apply Gravity
      p.vy += GRAVITY;

      // Terminal speed
      if (p.vy > 12) p.vy = 12;

      // Temporary store old position for collision resolving
      const prevX = p.x;
      const prevY = p.y;

      // Move player
      p.x += p.vx;
      p.y += p.vy;

      // Boundary rules
      if (p.x < 0) { p.x = 0; p.vx = 0; }
      if (p.x > 800 - p.width) { p.x = 800 - p.width; p.vx = 0; }

      // Dead fall zone
      if (p.y > 550) {
        resetStage();
        return;
      }

      // Tick platform disappearing timers
      Object.keys(platStateRef.current).forEach(id => {
        const pstate = platStateRef.current[id];
        if (pstate.state === 'disappeared') {
          // countdown to recover
          pstate.timer -= 16.66;
          if (pstate.timer <= 0) {
            pstate.state = 'normal';
          }
        }
      });

      // Platform collisions
      p.isGrounded = false;
      const plats = stateRef.current.platforms;

      plats.forEach(plat => {
        // Disappearing check
        const pStateObj = platStateRef.current[plat.id];
        if (pStateObj && pStateObj.state === 'disappeared') {
          return; // Skip completely, non-collidible
        }

        // Basic axis-aligned bounding box collision
        const isColliding = 
          p.x < plat.x + plat.width &&
          p.x + p.width > plat.x &&
          p.y < plat.y + plat.height &&
          p.y + p.height > plat.y;

        if (isColliding) {
          // Resolve vertical vs horizontal collisions depending on overlap depths
          const overlapX = Math.min(p.x + p.width - plat.x, plat.x + plat.width - p.x);
          const overlapY = Math.min(p.y + p.height - plat.y, plat.y + plat.height - p.y);

          if (overlapX > overlapY) {
            // Vertical collision
            if (p.vy > 0 && prevY + p.height <= plat.y) {
              // Landing on top!
              p.y = plat.y - p.height;
              p.vy = 0;
              p.isGrounded = true;

              // Check if trampoline platform
              if (plat.type === 'bounce') {
                p.vy = -12.5; // mega automatic jump
                sfx.playCatapult();
                createExplosion(p.x + p.width / 2, plat.y, '#a855f7', 15);
              }

              // Disappearing triggers
              if (plat.type === 'disappear' && pStateObj && pStateObj.state === 'normal') {
                // start disappearance sequence
                pStateObj.state = 'disappeared';
                pStateObj.timer = 1800; // 1.8 seconds disappeared
                // Particle visual cue
                createExplosion(plat.x + plat.width/2, plat.y + plat.height/2, '#f59e0b', 12);
              }

              // Checkpoint saving activation
              if (plat.type === 'checkpoint') {
                if (!activeCheckpoint.current || activeCheckpoint.current.x !== plat.x + plat.width/2) {
                  activeCheckpoint.current = { x: plat.x + plat.width/2, y: plat.y - p.height - 2 };
                  sfx.playStitchConnect();
                  createExplosion(plat.x + plat.width/2, plat.y, '#38bdf8', 20);
                }
              }

            } else if (p.vy < 0 && prevY >= plat.y + plat.height) {
              // Hitting ceiling
              p.y = plat.y + plat.height;
              p.vy = 0;
            }
          } else {
            // Horizontal collision
            if (p.vx > 0 && prevX + p.width <= plat.x) {
              p.x = plat.x - p.width;
              p.vx = 0;
            } else if (p.vx < 0 && prevX >= plat.x + plat.width) {
              p.x = plat.x + plat.width;
              p.vx = 0;
            }
          }

          // Special Hazard trigger
          if (plat.type === 'hazard') {
            resetStage();
            return;
          }
        }
      });

      // Rope stitching physics interaction
      if (rp.active && g.active && rp.startX !== undefined && rp.startY !== undefined && rp.endX !== undefined && rp.endY !== undefined) {
        // Let's test player collision with the fixed/anchored stitch rope
        const ropeStart = { x: rp.startX, y: rp.startY };
        const ropeEnd = { x: rp.endX, y: rp.endY };

        // We'll test the player feet's distance to the rope segment
        const testRes = getDistanceToLineSegment(p.x + p.width / 2, p.y + p.height, ropeStart.x, ropeStart.y, ropeEnd.x, ropeEnd.y);
        
        if (testRes.dist < 14) {
          // Calculate normal vector of the rope pointing toward the player
          const dx = rp.endX - rp.startX;
          const dy = rp.endY - rp.startY;
          const len = Math.hypot(dx, dy);
          
          let nx = 0;
          let ny = -1; // Default to straight up if rope is invalid
          
          if (len > 0.1) {
            const tx = dx / len;
            const ty = dy / len;
            
            // Standard perpendicular normal candidate nx = -ty, ny = tx
            nx = -ty;
            ny = tx;
            
            // Vector from collision point on rope to player center
            const rx = (p.x + p.width / 2) - testRes.x;
            const ry = (p.y + p.height / 2) - testRes.y;
            
            // Reverse direction of normal if it is pointing away from the player
            if (nx * rx + ny * ry < 0) {
              nx = -nx;
              ny = -ny;
            } else if (Math.abs(nx * rx + ny * ry) < 0.01) {
              // Tie-breaker: prefer launching upwards
              if (ny > 0) {
                nx = -nx;
                ny = -ny;
              }
            }
          }

          const normalDot = p.vx * nx + p.vy * ny;
          const approachSpeed = -normalDot; // Positive when moving towards the rope

          if (p.vy > 4 || approachSpeed > 4) {
            // Deduct usage durability
            let ropeBroke = false;
            if (rp.remainingUses !== undefined) {
              rp.remainingUses--;
              if (rp.remainingUses <= 0) {
                ropeBroke = true;
              }
            }

            // Catapult bounce! Launch in the exact normal direction
            // Limit the maximum bounce force (e.g., 18.0) to prevent infinite jump amplification
            const rawBounce = Math.max(12.5, Math.max(approachSpeed, p.vy) * 1.5);
            const bounceForce = Math.min(18.0, rawBounce);
            p.vx = nx * bounceForce;
            p.vy = ny * bounceForce;
            p.isGrounded = false;
            p.coyoteTime = 0;
            
            // Flash explosion of time particles! (Using green/teal if intact, using explosive red if it breaks!)
            createExplosion(testRes.x, testRes.y, ropeBroke ? '#f43f5e' : '#4ade80', 25);

            // Add dynamic normal-directed particles for a gorgeous directional burst
            const list: Particle[] = [];
            for (let i = 0; i < 15; i++) {
              const baseAngle = Math.atan2(ny, nx);
              const angle = baseAngle + (Math.random() * 0.8 - 0.4);
              const speed = 2.0 + Math.random() * 6.0;
              list.push({
                x: testRes.x,
                y: testRes.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2.0 + Math.random() * 3.0,
                color: ropeBroke ? '#ef4444' : '#2dd4bf', // red/teal depending on break
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                glow: true
              });
            }
            stateRef.current.particles.push(...list);
            
            if (ropeBroke) {
              // Destroy the rope entirely!
              rp.active = false;
              const sx = rp.startX;
              const sy = rp.startY;
              const ex = rp.endX;
              const ey = rp.endY;
              rp.startX = undefined;
              rp.startY = undefined;
              rp.endX = undefined;
              rp.endY = undefined;
              
              if (sx !== undefined && sy !== undefined && ex !== undefined && ey !== undefined) {
                createExplosion(sx, sy, '#ef4444', 15);
                createExplosion(ex, ey, '#ef4444', 15);
              }
              // Play rope breaking sound
              sfx.playRopeBreak();
            } else {
              sfx.playCatapult();
            }
          } else if (p.vy >= 0 && Math.abs(ny) > 0.5) {
            // Stand and run on the rope as a solid dynamic bridge (only on reasonable, non-steep slopes)
            p.y = testRes.y - p.height;
            p.vy = 0;
            p.isGrounded = true;
          }
        }
      }

      // Magic core collections
      const coresList = stateRef.current.cores;
      let allCollected = true;

      coresList.forEach(core => {
        if (!core.collected) {
          const dx = (p.x + p.width / 2) - core.x;
          const dy = (p.y + p.height / 2) - core.y;
          const distance = Math.hypot(dx, dy);

          if (distance <= core.radius + 16) {
            core.collected = true;
            sfx.playCoreCollect();
            createExplosion(core.x, core.y, '#e879f9', 24); // pink explosion
          } else {
            allCollected = false;
          }
        }
      });

      // Update game stats
      const collected = coresList.filter(c => c.collected).length;
      setCollectedCount(collected);

      if (allCollected && coresList.length > 0 && !isCleared) {
        setIsCleared(true);
        sfx.playStageClear();
        // Clear frame ticker
        setTimeout(() => {
          onStageCleared(gameTimer);
        }, 1200);
      }

      // Record player trajectory history
      history.push({
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        timestamp: now,
        isGrounded: p.isGrounded,
        facingLeft: p.facingLeft
      });

      // Max size limit to optimize memory (e.g. keep 5 seconds of frame history - roughly 300 frames)
      if (history.length > 400) {
        history.shift();
      }

      // Update ghost position
      calculateGhostPosition(now);

      // Update existing particles
      const parts = stateRef.current.particles;
      for (let i = parts.length - 1; i >= 0; i--) {
        const pt = parts[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= pt.decay;
        if (pt.life <= 0) {
          parts.splice(i, 1);
        }
      }
    };

    const renderFrame = (ctx: CanvasRenderingContext2D) => {
      // Clear
      ctx.fillStyle = '#060a13'; // deep space twilight
      ctx.fillRect(0, 0, 800, 550);

      // Draw Grid (Subtle cosmic grid)
      ctx.strokeStyle = 'rgba(29, 78, 216, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 550);
        ctx.stroke();
      }
      for (let y = 0; y < 550; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }

      // Draw platforms
      const plats = stateRef.current.platforms;
      plats.forEach(plat => {
        const pstate = platStateRef.current[plat.id];
        if (pstate && pstate.state === 'disappeared') return; // Hide

        // Shadow under floor
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(plat.x + 4, plat.y + 4, plat.width, plat.height);

        // Core fill based on type
        ctx.fillStyle = getStyleForPlatform(plat.type);
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Glow outlines
        ctx.strokeStyle = getPlatformBorder(plat.type);
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

        // Add details/stripes for physical platforms
        if (plat.type === 'bounce') {
          // Bouncy arrows / lines inside
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.moveTo(plat.x + 5, plat.y + 10);
          ctx.lineTo(plat.x + plat.width / 2, plat.y + 3);
          ctx.lineTo(plat.x + plat.width - 5, plat.y + 10);
          ctx.stroke();
        } else if (plat.type === 'hazard') {
          // Draws sharp razor hazard spikes along top boundary
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          for (let sx = plat.x; sx < plat.x + plat.width; sx += 12) {
            ctx.moveTo(sx, plat.y + plat.height);
            ctx.lineTo(sx + 6, plat.y);
            ctx.lineTo(sx + 12, plat.y + plat.height);
          }
          ctx.fill();
        } else if (plat.type === 'checkpoint') {
          // Checkpoint active state flag
          const isActive = activeCheckpoint.current && Math.abs(activeCheckpoint.current.x - (plat.x + plat.width/2)) < 5;
          ctx.fillStyle = isActive ? '#10b981' : '#0369a1';
          ctx.beginPath();
          ctx.arc(plat.x + plat.width / 2, plat.y - 12, 5, 0, Math.PI * 2);
          ctx.fill();
          // Flag post
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(plat.x + plat.width / 2, plat.y);
          ctx.lineTo(plat.x + plat.width / 2, plat.y - 12);
          ctx.stroke();

          // Label above
          ctx.fillStyle = '#ffffff';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(isActive ? "SAVED" : "CHECK", plat.x + plat.width / 2, plat.y - 18);
        }
      });

      // Draw historical path trajectory line up to ghost (glowing green dotted line)
      const hist = stateRef.current.history;
      const p = stateRef.current.player;
      const g = stateRef.current.ghost;

      if (hist.length > 5) {
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Travel backwards
        ctx.moveTo(p.x + p.width/2, p.y + p.height/2);
        for (let i = hist.length - 1; i >= 0; i--) {
          ctx.lineTo(hist[i].x + p.width/2, hist[i].y + p.height/2);
        }
        ctx.stroke();
      }

      // Draw Stitching Rope (if active and ghost is active)
      if (stateRef.current.rope.active && g.active) {
        const rp = stateRef.current.rope;
        const pCenterX = rp.startX !== undefined ? rp.startX : p.x + p.width / 2;
        const pCenterY = rp.startY !== undefined ? rp.startY : p.y + p.height / 2;
        const gCenterX = rp.endX !== undefined ? rp.endX : g.x + p.width / 2;
        const gCenterY = rp.endY !== undefined ? rp.endY : g.y + p.height / 2;

        const useRatio = rp.remainingUses !== undefined && rp.maxUses !== undefined ? rp.remainingUses / rp.maxUses : 1;
        const timeRatio = rp.remainingLifetime !== undefined && rp.maxLifetime !== undefined ? Math.max(0, rp.remainingLifetime / rp.maxLifetime) : 1;
        const health = Math.min(useRatio, timeRatio);

        // Color interpolation based on health (green/teal -> yellow -> flashing red)
        let outerColor = 'rgba(34, 197, 94, 0.4)'; // green
        let innerColor = 'rgba(45, 212, 191, 0.7)'; // teal
        let sparkColor = '#34d399'; // green spark
        let coreColor = '#ffffff';

        if (health < 0.4) {
          // Dangerous critical condition (very red, flashing)
          const flash = Math.sin(Date.now() / 40) > 0 ? 1.0 : 0.4;
          outerColor = `rgba(239, 68, 68, ${0.45 * flash})`;
          innerColor = `rgba(244, 63, 94, ${0.85 * flash})`;
          sparkColor = '#ef4444';
          coreColor = '#ffdddd';
        } else if (health < 0.7) {
          // Warning condition (yellow-orange)
          outerColor = 'rgba(234, 179, 8, 0.4)'; // yellow
          innerColor = 'rgba(249, 115, 22, 0.75)'; // orange
          sparkColor = '#facc15';
          coreColor = '#fffae0';
        }

        // Outer neon blur glow
        ctx.strokeStyle = outerColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(pCenterX, pCenterY);
        ctx.lineTo(gCenterX, gCenterY);
        ctx.stroke();

        ctx.strokeStyle = innerColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(pCenterX, pCenterY);
        ctx.lineTo(gCenterX, gCenterY);
        ctx.stroke();

        // Core line
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pCenterX, pCenterY);
        ctx.lineTo(gCenterX, gCenterY);
        ctx.stroke();

        // Draw small floating HUD for the rope at its center
        const midX = (pCenterX + gCenterX) / 2;
        const midY = (pCenterY + gCenterY) / 2;
        
        ctx.fillStyle = health < 0.4 ? '#f43f5e' : (health < 0.7 ? '#fb923c' : '#2dd4bf');
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        
        const rUses = rp.remainingUses !== undefined ? rp.remainingUses : 0;
        const rTime = rp.remainingLifetime !== undefined ? Math.max(0, rp.remainingLifetime).toFixed(1) : '0.0';
        
        ctx.fillText(`STITCH [${rUses} Bounce | ${rTime}s]`, midX, midY - 14);

        // Emit small electric sparks along rope (increase sparkle frequency as health decays)
        const sparkChance = health < 0.4 ? 0.7 : 0.4;
        if (Math.random() < sparkChance) {
          const ratio = Math.random();
          const sparkX = pCenterX + ratio * (gCenterX - pCenterX);
          const sparkY = pCenterY + ratio * (gCenterY - pCenterY);
          stateRef.current.particles.push({
            x: sparkX,
            y: sparkY,
            vx: Math.random() * 1.6 - 0.8,
            vy: Math.random() * 1.6 - 0.8,
            size: 1 + Math.random() * 2,
            color: sparkColor,
            life: 0.7,
            decay: 0.05
          });
        }
      }

      // Draw Ghost of the past (green hologram glow)
      if (g.active) {
        ctx.save();
        const isFrozen = stateRef.current.rope.active;
        ctx.fillStyle = isFrozen ? 'rgba(16, 185, 129, 0.65)' : 'rgba(34, 197, 94, 0.45)';
        ctx.strokeStyle = isFrozen ? 'rgba(255, 255, 255, 0.95)' : 'rgba(52, 211, 153, 0.9)';
        ctx.lineWidth = isFrozen ? 3 : 2;

        // Box shadow glow
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = isFrozen ? 16 : 10;

        // Draw ghost player body
        ctx.fillRect(g.x, g.y, p.width, p.height);
        ctx.strokeRect(g.x, g.y, p.width, p.height);

        // Hologram scanning line inside ghost
        const scanY = g.y + ((Date.now() / 15) % p.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(g.x, scanY);
        ctx.lineTo(g.x + p.width, scanY);
        ctx.stroke();

        // Face / looking direction indicator
        ctx.fillStyle = '#ffffff';
        const eyeX = g.vx >= 0 ? g.x + 14 : g.x + 4;
        ctx.fillRect(eyeX, g.y + 6, 4, 4);

        if (isFrozen) {
          ctx.restore();
          
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("STITCH ANCHOR", g.x + p.width / 2, g.y - 10);
        } else {
          ctx.restore();
        }

        // Trail of faint particles
        if (Math.random() < (isFrozen ? 0.6 : 0.25)) {
          stateRef.current.particles.push({
            x: g.x + p.width / 2,
            y: g.y + p.height / 2,
            vx: Math.random() * 0.8 - 0.4,
            vy: Math.random() * 0.8 - 0.4,
            size: isFrozen ? 2 + Math.random() * 2 : 1.5 + Math.random() * 2,
            color: isFrozen ? '#10b981' : 'rgba(52, 211, 153, 0.5)',
            life: 0.7,
            decay: isFrozen ? 0.02 : 0.03
          });
        }
      }

      // Draw Player Character (cyan cyber pilot)
      ctx.save();
      ctx.fillStyle = '#06b6d4'; // Cyan neon
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      // Glow effect
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;

      // Squish & Stretch effect based on velocity
      const squishX = 0;
      const squishY = 0;

      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.strokeRect(p.x, p.y, p.width, p.height);

      // Eye highlight depending on horizontal velocity / direction
      ctx.fillStyle = '#ffffff';
      const pEyeX = p.facingLeft ? p.x + 4 : p.x + 14;
      ctx.fillRect(pEyeX, p.y + 7, 5, 5);

      // Band along helmet
      const bandY = p.y + 16;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, bandY);
      ctx.lineTo(p.x + p.width, bandY);
      ctx.stroke();

      ctx.restore();

      // Draw Magic Cores
      const cores = stateRef.current.cores;
      const baseTime = Date.now();

      cores.forEach(core => {
        if (core.collected) return;

        // Micro-floating effect
        const bounceOffset = Math.sin(baseTime / 240 + core.x) * 4;
        const cy = core.y + bounceOffset;

        // Core glow
        const radGrad = ctx.createRadialGradient(core.x, cy, 1, core.x, cy, 22);
        radGrad.addColorStop(0, 'rgba(232, 121, 249, 0.6)');
        radGrad.addColorStop(1, 'rgba(232, 121, 249, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(core.x, cy, 22, 0, Math.PI * 2);
        ctx.fill();

        // Inner core geometric diamond
        ctx.fillStyle = '#f472b6';
        ctx.save();
        ctx.translate(core.x, cy);
        ctx.rotate(baseTime / 600);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const rx = core.radius * (i % 2 === 0 ? 1.3 : 0.8);
          const ry = core.radius * (i % 2 === 0 ? 1.3 : 0.8);
          ctx.lineTo(Math.cos(angle) * rx, Math.sin(angle) * ry);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Idle orbit micro-particles
        if (Math.random() < 0.1) {
          const orbitAngle = Math.random() * Math.PI * 2;
          const dist = 14 + Math.random() * 8;
          stateRef.current.particles.push({
            x: core.x + Math.cos(orbitAngle) * dist,
            y: cy + Math.sin(orbitAngle) * dist,
            vx: -Math.sin(orbitAngle) * 0.8,
            vy: Math.cos(orbitAngle) * 0.8,
            size: 1 + Math.random() * 1.5,
            color: '#f472b6',
            life: 0.6,
            decay: 0.03
          });
        }
      });

      // Draw active particles
      const parts = stateRef.current.particles;
      parts.forEach(pt => {
        ctx.save();
        if (pt.glow) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = pt.color;
        }
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.life;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Show focused overlay if frame has lost direct focus
      if (!isFocused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, 800, 550);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ここをクリックして操作を有効化', 400, 260);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('ACTIVE KEYBOARD EVENTS', 400, 290);
      }
    };

    const getStyleForPlatform = (type: string) => {
      switch (type) {
        case 'hazard': return '#7f1d1d';
        case 'bounce': return '#581c87';
        case 'disappear': return '#78350f';
        case 'checkpoint': return '#0c4a6e';
        case 'ice': return '#115e59';
        default: return '#1e293b'; // soft slate
      }
    };

    const getPlatformBorder = (type: string) => {
      switch (type) {
        case 'hazard': return '#ef4444';
        case 'bounce': return '#c084fc';
        case 'disappear': return '#f59e0b';
        case 'checkpoint': return '#38bdf8';
        case 'ice': return '#2dd4bf';
        default: return '#475569';
      }
    };

    // Spin up game timeline loop
    animFrameIdRef.current = requestAnimationFrame(gameTick);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };

  }, [isPaused, isCleared, isFocused]);

  return (
    <div className="flex flex-col items-center select-none w-full" ref={containerRef}>
      {/* Game HUD Status Bar */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-4xl bg-slate-900 border border-slate-800 p-4 rounded-t-2xl gap-4">
        <div className="flex items-center gap-3">
          <span className="py-1 px-3 bg-teal-950 text-teal-400 font-extrabold rounded-lg text-xs tracking-wider uppercase border border-teal-800">
            {isCustomLevel ? "カスタム" : `STAGE ${currentLevel.id}`}
          </span>
          <h2 className="text-base font-bold text-white tracking-tight">
            {currentLevel.name}
          </h2>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-6 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">CORES:</span>
            <span className="text-pink-400 font-extrabold text-sm flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-pink-500 rounded-full animate-ping" />
              {collectedCount} / {totalCores}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">TIME:</span>
            <span className="text-teal-400 font-bold text-sm">
              {(gameTimer / 1000).toFixed(2)}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">STITCHES:</span>
            <span className="text-emerald-400 font-bold">{stitchesCreated}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">DEATHS:</span>
            <span className={`font-bold ${deaths > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {deaths}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Interactive Stage */}
      <div className="relative w-full max-w-4xl border-x border-b border-slate-800 bg-black overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={800}
          height={550}
          className="mx-auto block aspect-[800/550] w-full cursor-pointer focus:outline-none"
          tabIndex={0}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onClick={() => setIsFocused(true)}
          id="game-play-canvas"
        />

        {/* Level Complete celebratory splash */}
        {isCleared && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur flex flex-col items-center justify-center text-center p-6 animate-fade-in z-20">
            <div className="bg-gradient-to-b from-amber-400 to-yellow-500 inline-flex items-center justify-center p-4 rounded-full shadow-lg shadow-amber-500/20 mb-4 animate-bounce">
              <Award className="w-10 h-10 text-slate-950" />
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 uppercase tracking-widest mb-1">
              STAGE CLEARED!
            </h1>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              時空の糸をすべて紡ぎ切った！
            </p>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-64 space-y-2 mb-6 font-mono text-sm text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">クリアタイム:</span>
                <span className="text-teal-400 font-bold">{(gameTimer / 1000).toFixed(2)}秒</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">縫合回数 (SPACE):</span>
                <span className="text-emerald-400 font-bold">{stitchesCreated}回</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">デス数:</span>
                <span className="text-rose-400 font-bold">{deaths}回</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 animate-pulse font-bold">次のステージに進んでいます...</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Actions & Audio Belt (Desktop layout) */}
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-4xl bg-slate-900/60 border border-slate-800/80 mt-3 p-4 rounded-xl gap-4">
        {/* Help Tip HUD */}
        <div className="text-[11.5px] leading-relaxed text-slate-400 max-w-md">
          <span className="text-teal-400 font-bold">💡 タイム・ステッチの極意：</span>{' '}
          {currentLevel.hint || "SPACEキーで3秒前の残像（ゴースト）へロープを繋ぎましょう。上にのる、あるいは下へ飛び込んで大バウンス！"}
        </div>

        {/* Live Audio sliders */}
        <div className="flex items-center gap-4 text-xs">
          {/* Music Toggle */}
          <button
            onClick={toggleMusic}
            id="btn-music-toggle"
            className={`p-2 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
              musicOn
                ? 'bg-slate-800 hover:bg-slate-755 border-slate-600 text-teal-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            BGM: {musicOn ? 'ON' : 'OFF'}
          </button>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-mono">BGM VOLUME</span>
            <input
              id="slider-music-vol"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={handleMusicVolumeChange}
              className="w-24 h-1 bg-slate-800 accent-teal-400 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-mono">SFX VOLUME</span>
            <input
              id="slider-sfx-vol"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={handleSfxVolumeChange}
              className="w-24 h-1 bg-slate-800 accent-teal-400 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Retry Button */}
          <button
            id="btn-retry-stage"
            onClick={resetStage}
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg transition border border-slate-700 flex items-center gap-1"
            title="リスタートする"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry
          </button>

          <button
            id="btn-exit-to-menu"
            onClick={onExitToMenu}
            className="p-2 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            ステージ選択へ戻る
          </button>
        </div>
      </div>
    </div>
  );
}
