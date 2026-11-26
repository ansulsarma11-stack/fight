/**
 * Arena Clash - 2D Retro Arcade Fighting Game
 * Main Application Component with Responsive Canvas, Web Audio, and Full Combat Flow.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Download, 
  Play, 
  Pause, 
  Swords, 
  Users, 
  Bot, 
  Sparkles, 
  Trophy,
  Gamepad2,
  ChevronRight
} from 'lucide-react';
import { soundEngine } from './audio';
import { Fighter } from './fighter';
import { Arena } from './arena';
import { FighterAI } from './ai';
import { GameMode, GamePhase, MatchStats, FighterConfig } from './types';
import { downloadStandaloneFile } from './exportHtml';

const P1_CONFIG: FighterConfig = {
  id: 'p1',
  name: 'BLAZE',
  title: 'Crimson Titan',
  skinTone: '#d49b73',
  hairColor: '#1c1917',
  hairStyle: 'spiky',
  outfitPrimary: '#dc2626',
  outfitSecondary: '#ffffff',
  glovesColor: '#b91c1c',
  specialName: 'METEOR BURST',
  specialColor: '#ff3b30'
};

const P2_CONFIG: FighterConfig = {
  id: 'p2',
  name: 'FROST',
  title: 'Cobalt Striker',
  skinTone: '#c58b68',
  hairColor: '#1e293b',
  hairStyle: 'headband',
  outfitPrimary: '#2563eb',
  outfitSecondary: '#f8fafc',
  glovesColor: '#1d4ed8',
  specialName: 'GLACIAL SURGE',
  specialColor: '#38bdf8'
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game UI State
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('1P_NORMAL');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(60);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);

  // Engine references
  const fightersRef = useRef<{ p1: Fighter; p2: Fighter } | null>(null);
  const arenaRef = useRef<Arena | null>(null);
  const aiRef = useRef<FighterAI | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const bannerRef = useRef<{ text: string; sub: string; scale: number; timer: number }>({
    text: '',
    sub: '',
    scale: 1,
    timer: 0
  });

  // Combat Stats Tracking
  const statsTrackerRef = useRef<{
    p1Damage: number;
    p2Damage: number;
    p1MaxCombo: number;
    p2MaxCombo: number;
    startTime: number;
  }>({
    p1Damage: 0,
    p2Damage: 0,
    p1MaxCombo: 0,
    p2MaxCombo: 0,
    startTime: Date.now()
  });

  // Slow motion state for final knockout
  const slowMoRef = useRef<{ active: boolean; timer: number; speed: number }>({
    active: false,
    timer: 0,
    speed: 1.0
  });

  // Hit-stop freeze frames for crunchy impacts
  const hitStopRef = useRef<number>(0);

  // Setup / Initialize Game Entities
  useEffect(() => {
    const p1 = new Fighter(P1_CONFIG, 360, 1);
    const p2 = new Fighter(P2_CONFIG, 920, -1);
    const arena = new Arena(1280, 720);
    const ai = new FighterAI(p2, p1, gameMode);

    fightersRef.current = { p1, p2 };
    arenaRef.current = arena;
    aiRef.current = ai;
  }, []);

  // Update AI when gameMode changes
  useEffect(() => {
    if (aiRef.current) {
      aiRef.current.setMode(gameMode);
    }
  }, [gameMode]);

  // Audio mute toggling
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.enabled = !next;
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;

      // Map arrow keys
      if (e.key === 'ArrowUp') keysRef.current['arrowup'] = true;
      if (e.key === 'ArrowDown') keysRef.current['arrowdown'] = true;
      if (e.key === 'ArrowLeft') keysRef.current['arrowleft'] = true;
      if (e.key === 'ArrowRight') keysRef.current['arrowright'] = true;

      // Pause toggle
      if (key === 'escape' || key === 'p') {
        setPhase((current) => {
          if (current === 'FIGHTING') return 'PAUSED';
          if (current === 'PAUSED') return 'FIGHTING';
          return current;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;
      if (e.key === 'ArrowUp') keysRef.current['arrowup'] = false;
      if (e.key === 'ArrowDown') keysRef.current['arrowdown'] = false;
      if (e.key === 'ArrowLeft') keysRef.current['arrowleft'] = false;
      if (e.key === 'ArrowRight') keysRef.current['arrowright'] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Start new match
  const startNewMatch = useCallback((mode: GameMode = gameMode) => {
    setGameMode(mode);
    setP1Wins(0);
    setP2Wins(0);
    setRoundNumber(1);
    statsTrackerRef.current = {
      p1Damage: 0,
      p2Damage: 0,
      p1MaxCombo: 0,
      p2MaxCombo: 0,
      startTime: Date.now()
    };
    startRound(1, 0, 0);
  }, [gameMode]);

  // Start round
  const startRound = useCallback((round: number, currentP1Wins: number, currentP2Wins: number) => {
    if (!fightersRef.current || !arenaRef.current) return;
    const { p1, p2 } = fightersRef.current;

    p1.reset(360, 1);
    p2.reset(920, -1);
    arenaRef.current.particles = [];
    arenaRef.current.projectiles = [];

    setRoundNumber(round);
    setRoundTimeLeft(60);
    setPhase('ROUND_INTRO');

    bannerRef.current = {
      text: `ROUND ${round}`,
      sub: 'READY...',
      scale: 1.6,
      timer: 85
    };

    soundEngine.playRoundBell();
  }, []);

  // Round End Handler
  const endRound = useCallback((winnerId: 'p1' | 'p2' | 'draw', reason: string) => {
    setPhase('ROUND_OVER');
    bannerRef.current = {
      text: reason,
      sub: winnerId === 'p1' ? 'BLAZE WINS!' : winnerId === 'p2' ? 'FROST WINS!' : 'DRAW GAME!',
      scale: 2.0,
      timer: 130
    };

    let nextP1Wins = p1Wins;
    let nextP2Wins = p2Wins;

    if (winnerId === 'p1') {
      nextP1Wins += 1;
      setP1Wins(nextP1Wins);
    } else if (winnerId === 'p2') {
      nextP2Wins += 1;
      setP2Wins(nextP2Wins);
    }

    // Check match completion (First to 2 wins)
    setTimeout(() => {
      if (nextP1Wins >= 2 || nextP2Wins >= 2) {
        const matchWinner = nextP1Wins >= 2 ? 'p1' : 'p2';
        const duration = Math.round((Date.now() - statsTrackerRef.current.startTime) / 1000);
        setMatchStats({
          p1DamageDealt: statsTrackerRef.current.p1Damage,
          p2DamageDealt: statsTrackerRef.current.p2Damage,
          p1MaxCombo: statsTrackerRef.current.p1MaxCombo,
          p2MaxCombo: statsTrackerRef.current.p2MaxCombo,
          p1RoundsWon: nextP1Wins,
          p2RoundsWon: nextP2Wins,
          durationSeconds: duration,
          winner: matchWinner
        });
        setPhase('MATCH_OVER');
        soundEngine.playVictoryFanfare();
      } else {
        startRound(roundNumber + 1, nextP1Wins, nextP2Wins);
      }
    }, 2200);
  }, [p1Wins, p2Wins, roundNumber, startRound]);

  // Main Loop
  useEffect(() => {
    let animId: number;
    let timerFrameCounter = 0;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const fighters = fightersRef.current;
      const arena = arenaRef.current;
      const ai = aiRef.current;

      if (!canvas || !ctx || !fighters || !arena || !ai) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }

      const { p1, p2 } = fighters;
      const keys = keysRef.current;

      // Handle hit-stop (brief freeze frames on impact)
      if (hitStopRef.current > 0) {
        hitStopRef.current--;
        // Still render current scene
        renderScene(ctx, p1, p2, arena);
        animId = requestAnimationFrame(gameLoop);
        return;
      }

      // Handle slow-mo during knockout
      if (slowMoRef.current.active) {
        slowMoRef.current.timer--;
        if (slowMoRef.current.timer <= 0) {
          slowMoRef.current.active = false;
          slowMoRef.current.speed = 1.0;
        }
      }

      // Update Arena elements (spotlights, crowd, particles)
      arena.update();

      // Phase State Handling
      if (phase === 'ROUND_INTRO') {
        const b = bannerRef.current;
        b.timer--;
        b.scale = Math.max(1.0, b.scale - 0.012);

        if (b.timer === 28) {
          b.text = 'FIGHT!';
          b.sub = '';
          b.scale = 2.2;
          soundEngine.playPunch();
        }
        if (b.timer <= 0) {
          setPhase('FIGHTING');
        }
      } else if (phase === 'FIGHTING') {
        // Round Timer countdown (every 60 frames = 1s)
        timerFrameCounter++;
        if (timerFrameCounter >= 60) {
          timerFrameCounter = 0;
          setRoundTimeLeft((prev) => {
            if (prev <= 1) {
              // Time's Up! Decide winner by HP
              if (p1.health > p2.health) endRound('p1', 'TIME UP!');
              else if (p2.health > p1.health) endRound('p2', 'TIME UP!');
              else endRound('draw', 'TIME UP!');
              return 0;
            }
            return prev - 1;
          });
        }

        // --- P1 INPUTS ---
        if (keys['a']) p1.move(-1);
        else if (keys['d']) p1.move(1);
        else p1.stopMoving();

        if (keys['w']) p1.jump();
        if (keys['f']) { p1.punch(); keys['f'] = false; }
        if (keys['g']) { p1.kick(); keys['g'] = false; }
        p1.block(Boolean(keys['h']));
        if (keys['r']) {
          if (p1.special()) {
            arena.spawnSpecialExplosion(p1.x + p1.facing * 50, p1.y - 90, p1.config.specialColor);
          }
          keys['r'] = false;
        }

        // --- P2 INPUTS ---
        if (gameMode === '2P') {
          if (keys['arrowleft']) p2.move(-1);
          else if (keys['arrowright']) p2.move(1);
          else p2.stopMoving();

          if (keys['arrowup']) p2.jump();
          if (keys['k']) { p2.punch(); keys['k'] = false; }
          if (keys['l']) { p2.kick(); keys['l'] = false; }
          p2.block(Boolean(keys['j']));
          if (keys['u']) {
            if (p2.special()) {
              arena.spawnSpecialExplosion(p2.x + p2.facing * 50, p2.y - 90, p2.config.specialColor);
            }
            keys['u'] = false;
          }
        } else {
          // AI CPU update
          ai.update();
        }

        // Update Fighters
        p1.update(arena.width, p2.x);
        p2.update(arena.width, p1.x);

        // Character body collision / pushing (prevent walking through each other)
        const dist = Math.abs(p1.x - p2.x);
        const minDist = 55;
        if (dist < minDist && p1.isGrounded && p2.isGrounded) {
          const overlap = (minDist - dist) / 2;
          if (p1.x < p2.x) {
            p1.x -= overlap;
            p2.x += overlap;
          } else {
            p1.x += overlap;
            p2.x -= overlap;
          }
        }

        // Combat Collision Checks
        handleAttackCollision(p1, p2, arena);
        handleAttackCollision(p2, p1, arena);

        // Check Knockouts
        if (p1.health <= 0 && p1.state === 'KNOCKED_DOWN' && p1.stateTime > 30) {
          endRound('p2', 'K.O.');
        } else if (p2.health <= 0 && p2.state === 'KNOCKED_DOWN' && p2.stateTime > 30) {
          endRound('p1', 'K.O.');
        }
      } else if (phase === 'ROUND_OVER') {
        const b = bannerRef.current;
        b.timer--;
        p1.update(arena.width, p2.x);
        p2.update(arena.width, p1.x);
      }

      // Render Scene
      renderScene(ctx, p1, p2, arena);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [phase, gameMode, endRound]);

  // Attack collision handling helper
  const handleAttackCollision = (att: Fighter, def: Fighter, arena: Arena) => {
    const hitbox = att.getHitbox();
    if (!hitbox) return;

    const hurtbox = def.getHurtbox();

    // AABB intersection check
    if (
      hitbox.x < hurtbox.x + hurtbox.w &&
      hitbox.x + hitbox.w > hurtbox.x &&
      hitbox.y < hurtbox.y + hurtbox.h &&
      hitbox.y + hitbox.h > hurtbox.y
    ) {
      att.attackHasHit = true;
      att.comboCount++;
      att.comboTimer = 75; // 1.25s window

      // Track max combo
      if (att.config.id === 'p1') {
        statsTrackerRef.current.p1MaxCombo = Math.max(statsTrackerRef.current.p1MaxCombo, att.comboCount);
      } else {
        statsTrackerRef.current.p2MaxCombo = Math.max(statsTrackerRef.current.p2MaxCombo, att.comboCount);
      }

      // Combo scaling bonus (1.1x per hit up to 1.5x)
      const comboMultiplier = Math.min(1.5, 1.0 + (att.comboCount - 1) * 0.1);

      let baseDamage = 8;
      let knockbackForce = att.facing * 7;
      let isSpecial = false;

      if (att.state === 'PUNCH') {
        baseDamage = 8;
        knockbackForce = att.facing * 7;
      } else if (att.state === 'KICK') {
        baseDamage = 16;
        knockbackForce = att.facing * 12;
      } else if (att.state === 'SPECIAL') {
        baseDamage = 34;
        knockbackForce = att.facing * 20;
        isSpecial = true;
      }

      const totalDmg = Math.round(baseDamage * comboMultiplier);
      const hitResult = def.takeHit(totalDmg, knockbackForce, isSpecial);

      // Track Damage
      if (att.config.id === 'p1') {
        statsTrackerRef.current.p1Damage += hitResult.finalDamage;
      } else {
        statsTrackerRef.current.p2Damage += hitResult.finalDamage;
      }

      // Super meter fill on landed attack (+8)
      att.power = Math.min(att.maxPower, att.power + 8);

      // Visual effects: Sparks, dust, shake, hit-stop
      const impactX = (hitbox.x + hitbox.w / 2 + hurtbox.x + hurtbox.w / 2) / 2;
      const impactY = (hitbox.y + hitbox.h / 2 + hurtbox.y + hurtbox.h / 2) / 2;

      if (hitResult.wasBlocked) {
        arena.spawnHitSparks(impactX, impactY, '#ffffff', 10);
        arena.triggerShake(4, 8);
        hitStopRef.current = 2; // brief blockstop
      } else {
        const sparkColor = isSpecial ? att.config.specialColor : '#facc15';
        arena.spawnHitSparks(impactX, impactY, sparkColor, isSpecial ? 30 : 18);
        arena.triggerShake(isSpecial ? 16 : (att.state === 'KICK' ? 9 : 5), isSpecial ? 24 : 12);
        hitStopRef.current = isSpecial ? 8 : (att.state === 'KICK' ? 5 : 3);

        // Knockout trigger slow motion
        if (def.health <= 0) {
          slowMoRef.current = { active: true, timer: 75, speed: 0.25 };
        }
      }
    }
  };

  // Rendering Helper
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    p1: Fighter,
    p2: Fighter,
    arena: Arena
  ) => {
    ctx.save();

    // Screen Shake Offset
    if (arena.shakeIntensity > 0.5) {
      ctx.translate(arena.shakeX, arena.shakeY);
    }

    // 1. Arena Background (Sky, trusses, crowd, ropes, concrete floor)
    arena.renderBackground(ctx);

    // 2. Render Fighters
    p1.render(ctx);
    p2.render(ctx);

    // 3. Foreground particles, blasts, impact rings
    arena.renderForegroundAndParticles(ctx);

    // 4. Overlays & Banners
    if (phase === 'ROUND_INTRO' || phase === 'ROUND_OVER') {
      const b = bannerRef.current;
      ctx.save();
      ctx.translate(arena.width / 2, arena.height / 2 - 40);
      ctx.scale(b.scale, b.scale);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Dramatic Banner Text with Glow
      ctx.font = 'bold 54px "Press Start 2P", monospace';
      ctx.fillStyle = '#ff2d55';
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 25;
      ctx.fillText(b.text, 0, 0);

      if (b.sub) {
        ctx.font = 'bold 26px "Chakra Petch", sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 15;
        ctx.fillText(b.sub, 0, 52);
      }
      ctx.restore();
    }

    // 5. In-game combo counter rendered on canvas
    if (p1.comboCount > 1) {
      ctx.save();
      ctx.font = 'bold 30px "Press Start 2P", monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 12;
      ctx.fillText(`${p1.comboCount} HITS!`, 75, 140);
      ctx.restore();
    }
    if (p2.comboCount > 1) {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = 'bold 30px "Press Start 2P", monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.fillText(`${p2.comboCount} HITS!`, arena.width - 75, 140);
      ctx.restore();
    }

    ctx.restore();
  };

  // Virtual touch control button triggers
  const triggerTouchAction = (player: 'p1' | 'p2', action: string, active: boolean) => {
    const f = player === 'p1' ? fightersRef.current?.p1 : fightersRef.current?.p2;
    if (!f) return;

    if (action === 'left') {
      if (active) f.move(-1);
      else f.stopMoving();
    } else if (action === 'right') {
      if (active) f.move(1);
      else f.stopMoving();
    } else if (action === 'jump' && active) {
      f.jump();
    } else if (action === 'punch' && active) {
      f.punch();
    } else if (action === 'kick' && active) {
      f.kick();
    } else if (action === 'block') {
      f.block(active);
    } else if (action === 'special' && active) {
      if (f.special() && arenaRef.current) {
        arenaRef.current.spawnSpecialExplosion(f.x + f.facing * 50, f.y - 90, f.config.specialColor);
      }
    }
  };

  // Health and Power percentages for HUD
  const p1Health = fightersRef.current?.p1.health ?? 100;
  const p1Power = fightersRef.current?.p1.power ?? 0;
  const p2Health = fightersRef.current?.p2.health ?? 100;
  const p2Power = fightersRef.current?.p2.power ?? 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#07080f] text-slate-100 select-none overflow-x-hidden font-sans">
      {/* Top Bar Contract: Brand title, nav links, primary action */}
      <header className="w-full max-w-7xl flex items-center justify-between gap-8 px-6 py-3 border-b border-slate-800 bg-[#0d0f1a]/80 backdrop-blur-md z-30">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <Swords className="w-6 h-6 text-rose-500" />
          <span className="font-extrabold tracking-wider text-xl uppercase font-['Black_Ops_One'] text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-sky-400">
            Arena Clash
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">2D Retro Fighter</span>
        </div>

        {/* Zone 2: Navigation / Info */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button 
            onClick={() => setShowControlsModal(true)} 
            className="hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4 text-sky-400" />
            <span>Controls Guide</span>
          </button>
          <button 
            onClick={() => setShowTouchControls(!showTouchControls)} 
            className="hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{showTouchControls ? 'Hide On-Screen Controls' : 'Show On-Screen Controls'}</span>
          </button>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>60 FPS</span>
            <span>·</span>
            <span>Web Audio Synthesizer</span>
          </div>
        </nav>

        {/* Zone 3: Primary Action & Audio controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={downloadStandaloneFile}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 rounded-lg shadow-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            title="Download complete game as a standalone HTML file you can play anywhere"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML File</span>
          </button>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="w-full max-w-6xl p-3 md:p-6 flex flex-col items-center">
        {/* Arena Canvas Container with HUD overlay */}
        <div className="relative w-full aspect-video max-w-[1280px] bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-slate-800">
          {/* HTML5 Canvas */}
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Real-Time HTML Top Fighting HUD (Synced with Canvas) */}
          {phase !== 'TITLE' && (
            <div className="absolute top-0 left-0 w-full p-4 md:p-6 pointer-events-none flex justify-between items-start">
              {/* P1 Bar (Left) */}
              <div className="flex flex-col w-[42%] max-w-[420px]">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base md:text-lg tracking-wider text-rose-400 font-['Chakra_Petch']">
                      BLAZE
                    </span>
                    <span className="text-xs text-rose-300/80 font-mono">P1</span>
                  </div>
                  {/* Round win dots */}
                  <div className="flex gap-1.5 items-center">
                    <div className={`w-3 h-3 rounded-full border border-slate-600 transition-colors ${p1Wins >= 1 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-slate-800'}`} />
                    <div className={`w-3 h-3 rounded-full border border-slate-600 transition-colors ${p1Wins >= 2 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-slate-800'}`} />
                  </div>
                </div>

                {/* Health Bar (Depletes from right to left) */}
                <div className="w-full h-5 md:h-6 bg-slate-900 border-2 border-slate-700 overflow-hidden shadow-inner flex justify-end">
                  <div 
                    className="h-full bg-gradient-to-l from-rose-600 via-red-500 to-amber-500 transition-all duration-100 ease-out"
                    style={{ width: `${Math.max(0, p1Health)}%` }}
                  />
                </div>

                {/* Power Bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">Power</span>
                  <div className="flex-1 h-2.5 bg-slate-900/90 border border-slate-700 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-75 ${p1Power >= 100 ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-white animate-pulse shadow-[0_0_10px_#f59e0b]' : 'bg-gradient-to-r from-amber-600 to-orange-500'}`}
                      style={{ width: `${p1Power}%` }}
                    />
                  </div>
                  {p1Power >= 100 && (
                    <span className="text-[10px] font-extrabold text-amber-300 animate-bounce tracking-wider font-mono">
                      MAX! [R]
                    </span>
                  )}
                </div>
              </div>

              {/* Center Match Timer */}
              <div className="flex flex-col items-center mx-2 z-10">
                <div className="bg-[#0b0e1a] border-2 border-slate-600 px-4 py-1.5 rounded-md shadow-lg flex items-center justify-center">
                  <span className={`font-['Press_Start_2P'] text-xl md:text-2xl tabular-nums ${roundTimeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-100'}`}>
                    {String(roundTimeLeft).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-1">
                  Round {roundNumber}
                </span>
              </div>

              {/* P2 Bar (Right) */}
              <div className="flex flex-col w-[42%] max-w-[420px] items-end">
                <div className="flex justify-between items-baseline mb-1 w-full">
                  {/* Round win dots */}
                  <div className="flex gap-1.5 items-center">
                    <div className={`w-3 h-3 rounded-full border border-slate-600 transition-colors ${p2Wins >= 2 ? 'bg-sky-500 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-800'}`} />
                    <div className={`w-3 h-3 rounded-full border border-slate-600 transition-colors ${p2Wins >= 1 ? 'bg-sky-500 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-800'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-sky-300/80 font-mono">
                      {gameMode === '2P' ? 'P2' : `CPU (${gameMode.replace('1P_', '')})`}
                    </span>
                    <span className="font-extrabold text-base md:text-lg tracking-wider text-sky-400 font-['Chakra_Petch']">
                      FROST
                    </span>
                  </div>
                </div>

                {/* Health Bar (Depletes from left to right) */}
                <div className="w-full h-5 md:h-6 bg-slate-900 border-2 border-slate-700 overflow-hidden shadow-inner flex justify-start">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-600 via-blue-500 to-cyan-400 transition-all duration-100 ease-out"
                    style={{ width: `${Math.max(0, p2Health)}%` }}
                  />
                </div>

                {/* Power Bar */}
                <div className="flex items-center gap-2 mt-1.5 w-full justify-end">
                  {p2Power >= 100 && (
                    <span className="text-[10px] font-extrabold text-cyan-300 animate-bounce tracking-wider font-mono">
                      MAX! [U]
                    </span>
                  )}
                  <div className="flex-1 h-2.5 bg-slate-900/90 border border-slate-700 overflow-hidden flex justify-end">
                    <div 
                      className={`h-full transition-all duration-75 ${p2Power >= 100 ? 'bg-gradient-to-l from-cyan-400 via-sky-300 to-white animate-pulse shadow-[0_0_10px_#38bdf8]' : 'bg-gradient-to-l from-sky-600 to-blue-500'}`}
                      style={{ width: `${p2Power}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">Power</span>
                </div>
              </div>
            </div>
          )}

          {/* Title Screen Overlay */}
          {phase === 'TITLE' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-300 to-sky-400 font-['Black_Ops_One'] drop-shadow-[0_10px_20px_rgba(244,63,94,0.4)]">
                Arena Clash
              </h1>
              <p className="text-sky-300 font-['Press_Start_2P'] text-xs md:text-sm tracking-widest mt-2 mb-6">
                HYPER 2D SHOWDOWN
              </p>

              {/* Mode Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl w-full mb-8">
                {/* 1 Player Modes */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center">
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg mb-2">
                    <Bot className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-100 mb-1">1-Player (vs AI)</h3>
                  <p className="text-xs text-slate-400 mb-3">Fight against the CPU with selectable difficulty</p>
                  
                  <div className="flex gap-2 w-full justify-center">
                    <button
                      onClick={() => startNewMatch('1P_EASY')}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Easy
                    </button>
                    <button
                      onClick={() => startNewMatch('1P_NORMAL')}
                      className="px-2.5 py-1 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-sm"
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => startNewMatch('1P_HARD')}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Hard
                    </button>
                  </div>
                </div>

                {/* 2 Player Local Mode */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center">
                  <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg mb-2">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-100 mb-1">2-Player (Local)</h3>
                  <p className="text-xs text-slate-400 mb-3">Share keyboard on the same screen</p>
                  
                  <button
                    onClick={() => startNewMatch('2P')}
                    className="w-full py-1.5 text-xs font-bold rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors cursor-pointer shadow-sm"
                  >
                    Start 2P Clash
                  </button>
                </div>
              </div>

              {/* Start CTA */}
              <button
                onClick={() => startNewMatch('1P_NORMAL')}
                className="px-8 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-sm md:text-base rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START FIGHT (NORMAL AI)</span>
              </button>

              <button
                onClick={() => setShowControlsModal(true)}
                className="mt-4 text-xs text-slate-400 hover:text-slate-200 transition-colors underline cursor-pointer"
              >
                View Fighter Controls & Combos
              </button>
            </div>
          )}

          {/* Pause Overlay */}
          {phase === 'PAUSED' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl max-w-sm w-full text-center shadow-2xl">
                <h2 className="text-2xl font-black tracking-wider uppercase font-['Black_Ops_One'] text-slate-100 mb-4">
                  GAME PAUSED
                </h2>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => setPhase('FIGHTING')}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    Resume Match
                  </button>
                  <button
                    onClick={() => startNewMatch(gameMode)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    Restart Match
                  </button>
                  <button
                    onClick={() => setPhase('TITLE')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    Return to Title
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Match Victory / Summary Modal */}
          {phase === 'MATCH_OVER' && matchStats && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl max-w-lg w-full shadow-2xl">
                <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 rounded-full mb-3">
                  <Trophy className="w-8 h-8" />
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-wider font-['Black_Ops_One'] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500 mb-1">
                  {matchStats.winner === 'p1' ? 'BLAZE WINS!' : 'FROST WINS!'}
                </h2>
                <p className="text-xs text-slate-400 font-mono mb-6">
                  Match duration: {matchStats.durationSeconds}s · Best of 3 Rounds
                </p>

                {/* Match Stats Grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 mb-6 text-left text-xs">
                  <div>
                    <span className="text-rose-400 font-bold block mb-1">P1 (BLAZE)</span>
                    <div className="text-slate-300">Rounds: <strong className="text-white">{matchStats.p1RoundsWon}</strong></div>
                    <div className="text-slate-300">Damage Dealt: <strong className="text-white">{matchStats.p1DamageDealt}</strong></div>
                    <div className="text-slate-300">Max Combo: <strong className="text-amber-400">{matchStats.p1MaxCombo} Hits</strong></div>
                  </div>
                  <div>
                    <span className="text-sky-400 font-bold block mb-1">P2 (FROST)</span>
                    <div className="text-slate-300">Rounds: <strong className="text-white">{matchStats.p2RoundsWon}</strong></div>
                    <div className="text-slate-300">Damage Dealt: <strong className="text-white">{matchStats.p2DamageDealt}</strong></div>
                    <div className="text-slate-300">Max Combo: <strong className="text-sky-400">{matchStats.p2MaxCombo} Hits</strong></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => startNewMatch(gameMode)}
                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Rematch</span>
                  </button>
                  <button
                    onClick={() => setPhase('TITLE')}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    Change Mode
                  </button>
                  <button
                    onClick={downloadStandaloneFile}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                    title="Export single HTML file"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Game</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Optional Virtual Touch / Mouse Controller Bar */}
        {showTouchControls && (
          <div className="w-full max-w-4xl mt-4 p-4 bg-slate-900/90 border border-slate-800 rounded-xl grid grid-cols-2 gap-4">
            {/* P1 Controls */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Player 1 (Blaze)</span>
              <div className="flex gap-2 mb-2">
                <button
                  onMouseDown={() => triggerTouchAction('p1', 'left', true)}
                  onMouseUp={() => triggerTouchAction('p1', 'left', false)}
                  onTouchStart={() => triggerTouchAction('p1', 'left', true)}
                  onTouchEnd={() => triggerTouchAction('p1', 'left', false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold active:bg-rose-600"
                >
                  ◀ Left (A)
                </button>
                <button
                  onClick={() => triggerTouchAction('p1', 'jump', true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold active:bg-rose-600"
                >
                  ▲ Jump (W)
                </button>
                <button
                  onMouseDown={() => triggerTouchAction('p1', 'right', true)}
                  onMouseUp={() => triggerTouchAction('p1', 'right', false)}
                  onTouchStart={() => triggerTouchAction('p1', 'right', true)}
                  onTouchEnd={() => triggerTouchAction('p1', 'right', false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold active:bg-rose-600"
                >
                  ▶ Right (D)
                </button>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => triggerTouchAction('p1', 'punch', true)}
                  className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-600 rounded text-xs font-bold"
                >
                  Punch (F)
                </button>
                <button
                  onClick={() => triggerTouchAction('p1', 'kick', true)}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 rounded text-xs font-bold"
                >
                  Kick (G)
                </button>
                <button
                  onMouseDown={() => triggerTouchAction('p1', 'block', true)}
                  onMouseUp={() => triggerTouchAction('p1', 'block', false)}
                  onTouchStart={() => triggerTouchAction('p1', 'block', true)}
                  onTouchEnd={() => triggerTouchAction('p1', 'block', false)}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold"
                >
                  Block (H)
                </button>
                <button
                  onClick={() => triggerTouchAction('p1', 'special', true)}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-xs font-bold text-black"
                >
                  Super (R)
                </button>
              </div>
            </div>

            {/* P2 Controls */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">Player 2 (Frost)</span>
              <div className="flex gap-2 mb-2">
                <button
                  onMouseDown={() => triggerTouchAction('p2', 'left', true)}
                  onMouseUp={() => triggerTouchAction('p2', 'left', false)}
                  onTouchStart={() => triggerTouchAction('p2', 'left', true)}
                  onTouchEnd={() => triggerTouchAction('p2', 'left', false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold active:bg-sky-600"
                >
                  ◀ Left
                </button>
                <button
                  onClick={() => triggerTouchAction('p2', 'jump', true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold active:bg-sky-600"
                >
                  ▲ Jump
                </button>
                <button
                  onMouseDown={() => triggerTouchAction('p2', 'right', true)}
                  onMouseUp={() => triggerTouchAction('p2', 'right', false)}
                  onTouchStart={() => triggerTouchAction('p2', 'right', true)}
                  onTouchEnd={() => triggerTouchAction('p2', 'right', false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold active:bg-sky-600"
                >
                  ▶ Right
                </button>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => triggerTouchAction('p2', 'punch', true)}
                  className="px-2.5 py-1.5 bg-sky-700 hover:bg-sky-600 rounded text-xs font-bold"
                >
                  Punch (K)
                </button>
                <button
                  onClick={() => triggerTouchAction('p2', 'kick', true)}
                  className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 rounded text-xs font-bold"
                >
                  Kick (L)
                </button>
                <button
                  onMouseDown={() => triggerTouchAction('p2', 'block', true)}
                  onMouseUp={() => triggerTouchAction('p2', 'block', false)}
                  onTouchStart={() => triggerTouchAction('p2', 'block', true)}
                  onTouchEnd={() => triggerTouchAction('p2', 'block', false)}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold"
                >
                  Block (J)
                </button>
                <button
                  onClick={() => triggerTouchAction('p2', 'special', true)}
                  className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 rounded text-xs font-bold text-black"
                >
                  Super (U)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Keyboard Reference Banner */}
        <div className="w-full max-w-4xl mt-4 px-4 py-3 bg-[#0d101d] rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <strong className="text-rose-400">P1 (Blaze):</strong>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">A/D</kbd> Move</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">W</kbd> Jump</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">F</kbd> Punch</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">G</kbd> Kick</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">H</kbd> Block</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded font-mono">R</kbd> Super</span>
          </div>

          <div className="flex items-center gap-2">
            <strong className="text-sky-400">P2 (Frost):</strong>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">←/→</kbd> Move</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">↑</kbd> Jump</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">K</kbd> Punch</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">L</kbd> Kick</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono">J</kbd> Block</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono">U</kbd> Super</span>
          </div>
        </div>
      </main>

      {/* Controls & Mechanics Modal */}
      {showControlsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-rose-500" />
                <span>Combat System & Controls</span>
              </h3>
              <button 
                onClick={() => setShowControlsModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                <h4 className="font-bold text-amber-400 mb-1">Combat Rules & Damage</h4>
                <ul className="space-y-1 text-slate-400">
                  <li>• <strong>Punch (Light):</strong> 8 base damage. Quick execution with fast recovery.</li>
                  <li>• <strong>Kick (Medium):</strong> 16 base damage. Greater reach and knockdown knockback.</li>
                  <li>• <strong>Block (Defense):</strong> Reduces incoming attack damage by 80% and negates knockback.</li>
                  <li>• <strong>Combo Multipliers:</strong> Successive hits inside 1.25s boost damage by 1.1x up to 1.5x!</li>
                  <li>• <strong>Super Meter:</strong> Charges on landed hits (+8) and hits taken (+5). At 100% (MAX), unleash your Special Move!</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-rose-950/20 rounded-lg border border-rose-900/40">
                  <span className="font-bold text-rose-400 block mb-1">Player 1: BLAZE</span>
                  <div>Move: <kbd className="font-mono text-slate-200">A / D</kbd></div>
                  <div>Jump: <kbd className="font-mono text-slate-200">W</kbd></div>
                  <div>Punch: <kbd className="font-mono text-slate-200">F</kbd></div>
                  <div>Kick: <kbd className="font-mono text-slate-200">G</kbd></div>
                  <div>Block: <kbd className="font-mono text-slate-200">H</kbd></div>
                  <div>Super: <kbd className="font-mono text-amber-300">R</kbd> (Meteor Burst)</div>
                </div>

                <div className="p-3 bg-sky-950/20 rounded-lg border border-sky-900/40">
                  <span className="font-bold text-sky-400 block mb-1">Player 2: FROST</span>
                  <div>Move: <kbd className="font-mono text-slate-200">Left / Right</kbd></div>
                  <div>Jump: <kbd className="font-mono text-slate-200">Up</kbd></div>
                  <div>Punch: <kbd className="font-mono text-slate-200">K</kbd></div>
                  <div>Kick: <kbd className="font-mono text-slate-200">L</kbd></div>
                  <div>Block: <kbd className="font-mono text-slate-200">J</kbd></div>
                  <div>Super: <kbd className="font-mono text-cyan-300">U</kbd> (Glacial Surge)</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
