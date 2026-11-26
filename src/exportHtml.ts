/**
 * Arena Clash - Standalone HTML Generator
 * Packages the complete 2D fighting game into a single self-contained .html file.
 */

export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARENA CLASH - 2D Retro Arcade Fighter</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Chakra+Petch:ital,wght@0,600;0,700;1,700&family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: #080911;
      color: #fff;
      font-family: 'Chakra Petch', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    #game-container {
      position: relative;
      width: 100%;
      max-width: 1280px;
      aspect-ratio: 16 / 9;
      background: #000;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(225, 29, 72, 0.25);
      border: 3px solid #272738;
      border-radius: 8px;
      overflow: hidden;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
      image-rendering: auto;
    }
    /* Controls Footer Bar */
    .controls-bar {
      margin-top: 10px;
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #94a3b8;
      background: #111322;
      padding: 8px 18px;
      border-radius: 6px;
      border: 1px solid #1f233d;
    }
    .badge {
      display: inline-block;
      background: #1e293b;
      color: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: bold;
      border: 1px solid #334155;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="gameCanvas" width="1280" height="720"></canvas>
  </div>
  <div class="controls-bar">
    <div><strong>Player 1 (Blaze):</strong> <span class="badge">A/D</span> Move <span class="badge">W</span> Jump <span class="badge">F</span> Punch <span class="badge">G</span> Kick <span class="badge">H</span> Block <span class="badge">R</span> Special</div>
    <div><strong>Player 2 (Frost):</strong> <span class="badge">←/→</span> Move <span class="badge">↑</span> Jump <span class="badge">K</span> Punch <span class="badge">L</span> Kick <span class="badge">J</span> Block <span class="badge">U</span> Special</div>
  </div>

  <script>
    // --- WEB AUDIO ENGINE ---
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.enabled = true;
      }
      init() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      }
      playRoundBell() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        [0, 0.28, 0.56].forEach((delay) => {
          [880, 1760, 2640].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0.3 / (idx + 1), now + delay);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.8);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.85);
          });
        });
      }
      playPunch() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
      playKick() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
      playBlock() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        [1250, 2400].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.3 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.2);
        });
      }
      playWhoosh() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      }
      playSpecialCharge() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
      playSpecialBlast() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      }
      playKnockout() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 1.1);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 1.2);
      }
    }
    const audio = new SoundEngine();

    // --- GAME ENGINE ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const W = 1280;
    const H = 720;
    const GROUND_Y = 580;

    let gameMode = '1P_NORMAL'; // '1P_NORMAL' or '2P'
    let phase = 'TITLE'; // 'TITLE', 'ROUND_INTRO', 'FIGHTING', 'ROUND_OVER', 'MATCH_OVER'
    let roundNum = 1;
    let roundTimer = 60;
    let timerTick = 0;
    let p1RoundsWon = 0;
    let p2RoundsWon = 0;
    let bannerText = '';
    let bannerSub = '';
    let bannerScale = 1;
    let bannerTimer = 0;
    let shakeIntensity = 0;
    let slowMoTimer = 0;
    let matchWinner = '';

    // Particles & Projectiles
    let particles = [];
    let projectiles = [];

    function addShake(val) {
      shakeIntensity = Math.max(shakeIntensity, val);
    }

    function spawnHitSparks(x, y, color) {
      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 4 + Math.random() * 8;
        particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: 3 + Math.random() * 3,
          color: Math.random() > 0.4 ? color : '#fff',
          alpha: 1,
          type: 'spark',
          life: 0,
          maxLife: 20
        });
      }
    }

    function spawnDust(x, y) {
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y - 2,
          vx: (Math.random() - 0.5) * 3,
          vy: -1 - Math.random(),
          size: 8 + Math.random() * 6,
          color: 'rgba(180, 175, 170, 0.4)',
          alpha: 0.6,
          type: 'dust',
          life: 0,
          maxLife: 20
        });
      }
    }

    // --- FIGHTER OBJECT ---
    function createFighter(id, name, startX, facing, skin, hair, shorts, gloves, specialColor) {
      return {
        id, name,
        x: startX, y: GROUND_Y,
        vx: 0, vy: 0,
        facing,
        health: 100, maxHealth: 100,
        power: 0, maxPower: 100,
        state: 'IDLE',
        stateTime: 0,
        animFrame: 0,
        isGrounded: true,
        hitStun: 0,
        comboCount: 0,
        comboTimer: 0,
        isAttacking: false,
        attackHasHit: false,
        skin, hair, shorts, gloves, specialColor,
        reset(x, f) {
          this.x = x;
          this.y = GROUND_Y;
          this.vx = 0;
          this.vy = 0;
          this.facing = f;
          this.health = 100;
          this.power = 0;
          this.state = 'IDLE';
          this.stateTime = 0;
          this.hitStun = 0;
          this.comboCount = 0;
          this.comboTimer = 0;
          this.isAttacking = false;
          this.attackHasHit = false;
        },
        move(dir) {
          if (this.hitStun > 0 || this.state === 'KNOCKED_DOWN' || this.isAttacking) return;
          this.vx = dir * 6;
          this.state = (dir * this.facing > 0) ? 'WALK_FWD' : 'WALK_BACK';
        },
        stop() {
          if (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') {
            this.state = 'IDLE';
            this.vx = 0;
          }
        },
        jump() {
          if (!this.isGrounded || this.hitStun > 0 || this.state === 'KNOCKED_DOWN' || this.isAttacking) return;
          this.vy = -20;
          this.state = 'JUMP';
          this.isGrounded = false;
          audio.playWhoosh();
          spawnDust(this.x, this.y);
        },
        punch() {
          if (this.hitStun > 0 || this.state === 'KNOCKED_DOWN' || this.isAttacking) return;
          this.state = 'PUNCH';
          this.stateTime = 0;
          this.isAttacking = true;
          this.attackHasHit = false;
          audio.playWhoosh();
        },
        kick() {
          if (this.hitStun > 0 || this.state === 'KNOCKED_DOWN' || this.isAttacking) return;
          this.state = 'KICK';
          this.stateTime = 0;
          this.isAttacking = true;
          this.attackHasHit = false;
          audio.playWhoosh();
        },
        block(on) {
          if (this.hitStun > 0 || this.state === 'KNOCKED_DOWN' || this.isAttacking) return;
          if (on) {
            this.state = 'BLOCK';
            this.vx = 0;
          } else if (this.state === 'BLOCK') {
            this.state = 'IDLE';
          }
        },
        special() {
          if (this.hitStun > 0 || this.state === 'KNOCKED_DOWN' || this.isAttacking || this.power < this.maxPower) return false;
          this.state = 'SPECIAL';
          this.stateTime = 0;
          this.isAttacking = true;
          this.attackHasHit = false;
          this.power = 0;
          audio.playSpecialCharge();
          addShake(12);
          return true;
        },
        takeHit(dmg, knockX, isSpecial = false) {
          if (this.state === 'KNOCKED_DOWN') return;
          const blocked = this.state === 'BLOCK';
          let finalDmg = dmg;
          if (blocked) {
            finalDmg = Math.max(1, Math.round(dmg * 0.2));
            this.power = Math.min(100, this.power + 3);
            this.vx = knockX * 0.3;
            audio.playBlock();
            spawnHitSparks(this.x + this.facing * 30, this.y - 90, '#fff');
          } else {
            this.health = Math.max(0, this.health - finalDmg);
            this.power = Math.min(100, this.power + 6);
            this.hitStun = isSpecial ? 30 : 18;
            this.state = 'HIT';
            this.stateTime = 0;
            this.isAttacking = false;
            this.vx = knockX;
            if (dmg < 12) audio.playPunch();
            else if (dmg < 25) audio.playKick();
            else audio.playSpecialBlast();
            spawnHitSparks(this.x, this.y - 100, this.specialColor);
            addShake(dmg > 20 ? 14 : 7);

            if (this.health <= 0) {
              this.state = 'KNOCKED_DOWN';
              this.vx = knockX * 1.5;
              this.vy = -12;
              audio.playKnockout();
              slowMoTimer = 60;
            }
          }
        },
        getHurtbox() {
          return { x: this.x - 40, y: this.y - 170, w: 80, h: 170 };
        },
        getHitbox() {
          if (!this.isAttacking || this.attackHasHit) return null;
          const r = this.facing === 1 ? 1 : -1;
          if (this.state === 'PUNCH' && this.stateTime >= 4 && this.stateTime <= 12) {
            return { x: r === 1 ? this.x + 25 : this.x - 95, y: this.y - 130, w: 70, h: 40, dmg: 8, knock: r * 8, name: 'Punch' };
          }
          if (this.state === 'KICK' && this.stateTime >= 6 && this.stateTime <= 16) {
            return { x: r === 1 ? this.x + 30 : this.x - 110, y: this.y - 105, w: 80, h: 45, dmg: 16, knock: r * 12, name: 'Kick' };
          }
          if (this.state === 'SPECIAL' && this.stateTime >= 12 && this.stateTime <= 26) {
            return { x: r === 1 ? this.x + 35 : this.x - 145, y: this.y - 145, w: 110, h: 80, dmg: 32, knock: r * 18, name: 'Special' };
          }
          return null;
        },
        update(oppX) {
          this.stateTime++;
          this.animFrame++;
          if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) this.comboCount = 0;
          }
          if (this.state === 'IDLE' || this.state === 'WALK_FWD' || this.state === 'WALK_BACK' || this.state === 'JUMP') {
            this.facing = this.x < oppX ? 1 : -1;
          }
          if (this.hitStun > 0) {
            this.hitStun--;
            this.vx *= 0.88;
            if (this.hitStun <= 0 && this.health > 0) {
              this.state = 'IDLE';
            }
          }
          this.x += this.vx;
          this.y += this.vy;
          if (this.y < GROUND_Y) {
            this.vy += 1.25;
            this.isGrounded = false;
          } else {
            this.y = GROUND_Y;
            this.vy = 0;
            this.isGrounded = true;
            if (this.state === 'JUMP') this.state = 'IDLE';
          }
          if (this.isGrounded && this.state !== 'WALK_FWD' && this.state !== 'WALK_BACK' && this.state !== 'HIT') {
            this.vx *= 0.75;
          }
          if (this.x < 50) this.x = 50;
          if (this.x > W - 50) this.x = W - 50;

          // Attack timeouts
          if (this.state === 'PUNCH' && this.stateTime >= 18) { this.state = 'IDLE'; this.isAttacking = false; }
          if (this.state === 'KICK' && this.stateTime >= 24) { this.state = 'IDLE'; this.isAttacking = false; }
          if (this.state === 'SPECIAL' && this.stateTime >= 36) { this.state = 'IDLE'; this.isAttacking = false; }
        },
        render(c) {
          c.save();
          // Shadow
          const shadowScale = Math.max(0.3, 1 - (GROUND_Y - this.y) / 400);
          c.beginPath();
          c.ellipse(this.x, GROUND_Y + 4, 45 * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
          c.fillStyle = 'rgba(0,0,0,0.45)';
          c.fill();

          c.translate(this.x, this.y);
          c.scale(this.facing, 1);

          const breath = Math.sin(this.animFrame * 0.08) * 2;
          const walkBob = (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') ? Math.sin(this.animFrame * 0.25) * 4 : 0;
          c.translate(0, walkBob);

          // Power glow
          if (this.power >= 100) {
            c.strokeStyle = this.specialColor;
            c.lineWidth = 3;
            c.beginPath();
            c.ellipse(0, -85, 45 + Math.sin(this.animFrame * 0.2) * 6, 90, 0, 0, Math.PI * 2);
            c.stroke();
          }

          if (this.state === 'KNOCKED_DOWN') {
            // Flat on ground
            c.rotate(Math.PI * 0.48);
            c.fillStyle = this.skin;
            c.roundRect(-24, -30, 48, 28, 4);
            c.fill();
            c.fillStyle = this.shorts;
            c.fillRect(-20, -2, 18, 55);
            c.fillRect(4, -2, 18, 50);
            c.fillStyle = this.skin;
            c.beginPath(); c.arc(0, -45, 16, 0, Math.PI * 2); c.fill();
            c.fillStyle = this.hair;
            c.beginPath(); c.arc(0, -50, 16, Math.PI, Math.PI * 2); c.fill();
          } else {
            // Legs
            c.fillStyle = this.shorts;
            if (this.state === 'KICK') {
              c.roundRect(-18, -60, 20, 45, 6);
              c.fillRect(-18, 2, 24, 12);
              c.save();
              c.translate(10, -50);
              c.rotate(-0.15);
              const ext = Math.sin((this.stateTime / 24) * Math.PI) * 80;
              c.roundRect(0, -14, 45 + ext * 0.5, 24, 6);
              c.fillRect(40 + ext, -18, 30, 26);
              c.restore();
            } else {
              const step = (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') ? Math.sin(this.animFrame * 0.25) * 16 : 0;
              c.roundRect(-24 + step * 0.5, -62, 20, 38, 6);
              c.roundRect(-22 + step, -26, 18, 30, 6);
              c.fillRect(-24 + step, 2, 24, 12);

              c.roundRect(4 - step * 0.5, -62, 22, 38, 6);
              c.roundRect(6 - step, -26, 20, 30, 6);
              c.fillRect(4 - step, 2, 26, 12);
            }

            // Muscular Torso
            const torsoY = -120 + breath;
            c.fillStyle = this.shorts;
            c.roundRect(-24, -68, 48, 28, 4);
            c.fill();

            c.fillStyle = this.skin;
            c.beginPath();
            c.moveTo(-32, torsoY);
            c.lineTo(32, torsoY);
            c.lineTo(24, -68);
            c.lineTo(-24, -68);
            c.closePath();
            c.fill();

            // Pectoral lines & abs
            c.strokeStyle = 'rgba(0,0,0,0.22)';
            c.lineWidth = 2.5;
            c.beginPath();
            c.ellipse(-14, torsoY + 22, 12, 10, -0.1, 0, Math.PI);
            c.ellipse(14, torsoY + 22, 12, 10, 0.1, 0, Math.PI);
            c.moveTo(0, torsoY + 12); c.lineTo(0, -68);
            [-44, -30, -16].forEach(ay => {
              c.moveTo(-10, torsoY + 54 + ay + 44);
              c.lineTo(10, torsoY + 54 + ay + 44);
            });
            c.stroke();

            // Head
            const headY = -148 + breath;
            c.fillStyle = this.skin;
            c.fillRect(-10, headY + 14, 20, 16);
            c.beginPath();
            c.moveTo(-16, headY); c.lineTo(16, headY); c.lineTo(12, headY + 16); c.lineTo(0, headY + 24); c.lineTo(-12, headY + 16);
            c.closePath(); c.fill();

            // Spiky Hair
            c.fillStyle = this.hair;
            c.beginPath();
            c.moveTo(-17, headY - 2); c.lineTo(-24, headY - 14); c.lineTo(-12, headY - 20); c.lineTo(-2, headY - 26);
            c.lineTo(8, headY - 22); c.lineTo(18, headY - 16); c.lineTo(17, headY - 2);
            c.closePath(); c.fill();

            // Arms
            const shoulderY = -118 + breath;
            if (this.state === 'PUNCH') {
              const ext = Math.sin((this.stateTime / 18) * Math.PI) * 75;
              c.fillStyle = this.skin;
              c.arc(22, shoulderY + 4, 15, 0, Math.PI * 2); c.fill();
              c.roundRect(24, shoulderY - 8, 30 + ext * 0.6, 22, 8); c.fill();
              c.fillStyle = this.gloves;
              c.beginPath(); c.ellipse(55 + ext, shoulderY + 2, 20, 16, 0, 0, Math.PI * 2); c.fill();
            } else if (this.state === 'BLOCK') {
              c.fillStyle = this.skin;
              c.ellipse(14, shoulderY + 6, 10, 22, -0.4, 0, Math.PI * 2); c.fill();
              c.ellipse(18, shoulderY + 6, 10, 22, 0.4, 0, Math.PI * 2); c.fill();
              c.fillStyle = this.gloves;
              c.beginPath(); c.arc(14, shoulderY - 8, 14, 0, Math.PI * 2); c.arc(22, shoulderY - 6, 14, 0, Math.PI * 2); c.fill();
            } else {
              // Guard
              c.fillStyle = this.skin;
              c.ellipse(-18, shoulderY + 12, 11, 16, -0.2, 0, Math.PI * 2); c.fill();
              c.ellipse(26, shoulderY + 22, 12, 17, 0.2, 0, Math.PI * 2); c.fill();
              c.fillStyle = this.gloves;
              c.beginPath(); c.arc(-8, shoulderY + 14, 13, 0, Math.PI * 2); c.fill();
              c.beginPath(); c.arc(44, shoulderY + 6, 15, 0, Math.PI * 2); c.fill();
            }
          }
          c.restore();
        }
      };
    }

    const p1 = createFighter('p1', 'BLAZE', 350, 1, '#d49b73', '#222', '#dc2626', '#e11d48', '#ff3b30');
    const p2 = createFighter('p2', 'FROST', 930, -1, '#c58b68', '#1e293b', '#2563eb', '#1d4ed8', '#38bdf8');

    // --- KEYS INPUT ---
    const keys = {};
    window.addEventListener('keydown', (e) => {
      audio.init();
      keys[e.key.toLowerCase()] = true;
      if (e.key === 'ArrowUp') keys['arrowup'] = true;
      if (e.key === 'ArrowDown') keys['arrowdown'] = true;
      if (e.key === 'ArrowLeft') keys['arrowleft'] = true;
      if (e.key === 'ArrowRight') keys['arrowright'] = true;

      if (phase === 'TITLE') {
        if (e.key === '1') { gameMode = '1P_NORMAL'; startMatch(); }
        if (e.key === '2') { gameMode = '2P'; startMatch(); }
        if (e.key === 'Enter' || e.key === ' ') { startMatch(); }
      } else if (phase === 'MATCH_OVER') {
        if (e.key === 'Enter' || e.key === ' ') { startMatch(); }
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
      if (e.key === 'ArrowUp') keys['arrowup'] = false;
      if (e.key === 'ArrowDown') keys['arrowdown'] = false;
      if (e.key === 'ArrowLeft') keys['arrowleft'] = false;
      if (e.key === 'ArrowRight') keys['arrowright'] = false;
    });

    function startMatch() {
      p1RoundsWon = 0;
      p2RoundsWon = 0;
      roundNum = 1;
      startRound();
    }

    function startRound() {
      p1.reset(350, 1);
      p2.reset(930, -1);
      roundTimer = 60;
      timerTick = 0;
      phase = 'ROUND_INTRO';
      bannerText = 'ROUND ' + roundNum;
      bannerSub = 'READY...';
      bannerTimer = 90;
      bannerScale = 1.5;
      audio.playRoundBell();
    }

    // --- AI CPU ---
    let aiTimer = 0;
    function updateAI() {
      if (gameMode === '2P') return;
      if (p2.health <= 0 || p2.state === 'KNOCKED_DOWN' || p2.hitStun > 0) return;
      const dist = Math.abs(p2.x - p1.x);
      aiTimer--;

      // React block
      if (p1.isAttacking && dist < 160 && Math.random() < 0.6) {
        p2.block(true);
        return;
      } else if (p2.state === 'BLOCK' && !p1.isAttacking) {
        p2.block(false);
      }

      // Special
      if (p2.power >= 100 && dist < 300 && Math.random() < 0.7) {
        p2.special();
        return;
      }

      if (aiTimer <= 0) {
        aiTimer = 16 + Math.floor(Math.random() * 12);
        if (Math.random() < 0.08 && p2.isGrounded) p2.jump();
        if (dist > 140) {
          p2.move(p2.x < p1.x ? 1 : -1);
        } else {
          if (Math.random() < 0.5) p2.punch();
          else if (Math.random() < 0.85) p2.kick();
          else p2.stop();
        }
      }
    }

    // --- GAME LOOP ---
    function update() {
      if (shakeIntensity > 0) shakeIntensity *= 0.9;
      if (slowMoTimer > 0) slowMoTimer--;

      if (phase === 'ROUND_INTRO') {
        bannerTimer--;
        bannerScale = Math.max(1, bannerScale - 0.01);
        if (bannerTimer === 30) {
          bannerText = 'FIGHT!';
          bannerSub = '';
          bannerScale = 2;
        }
        if (bannerTimer <= 0) {
          phase = 'FIGHTING';
        }
      } else if (phase === 'FIGHTING') {
        // Timer
        timerTick++;
        if (timerTick >= 60) {
          timerTick = 0;
          roundTimer--;
          if (roundTimer <= 0) {
            endRound('TIME UP!');
          }
        }

        // P1 Inputs
        if (keys['a']) p1.move(-1);
        else if (keys['d']) p1.move(1);
        else p1.stop();

        if (keys['w']) p1.jump();
        if (keys['f']) { p1.punch(); keys['f'] = false; }
        if (keys['g']) { p1.kick(); keys['g'] = false; }
        p1.block(Boolean(keys['h']));
        if (keys['r']) { p1.special(); keys['r'] = false; }

        // P2 Inputs (if 2P)
        if (gameMode === '2P') {
          if (keys['arrowleft']) p2.move(-1);
          else if (keys['arrowright']) p2.move(1);
          else p2.stop();

          if (keys['arrowup']) p2.jump();
          if (keys['k']) { p2.punch(); keys['k'] = false; }
          if (keys['l']) { p2.kick(); keys['l'] = false; }
          p2.block(Boolean(keys['j']));
          if (keys['u']) { p2.special(); keys['u'] = false; }
        } else {
          updateAI();
        }

        p1.update(p2.x);
        p2.update(p1.x);

        // Check Collisions
        checkCombat(p1, p2);
        checkCombat(p2, p1);

        // Check Round End
        if (p1.health <= 0 && p1.state === 'KNOCKED_DOWN') {
          endRound('K.O.', 'p2');
        } else if (p2.health <= 0 && p2.state === 'KNOCKED_DOWN') {
          endRound('K.O.', 'p1');
        }
      } else if (phase === 'ROUND_OVER') {
        bannerTimer--;
        p1.update(p2.x);
        p2.update(p1.x);
        if (bannerTimer <= 0) {
          if (p1RoundsWon >= 2 || p2RoundsWon >= 2) {
            phase = 'MATCH_OVER';
            matchWinner = p1RoundsWon >= 2 ? p1.name : p2.name;
          } else {
            roundNum++;
            startRound();
          }
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (p.type === 'spark') p.vy += 0.35;
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
    }

    function checkCombat(att, def) {
      const hit = att.getHitbox();
      if (!hit) return;
      const hurt = def.getHurtbox();

      if (hit.x < hurt.x + hurt.w && hit.x + hit.w > hurt.x &&
          hit.y < hurt.y + hurt.h && hit.y + hit.h > hurt.y) {
        att.attackHasHit = true;
        att.comboCount++;
        att.comboTimer = 70;
        att.power = Math.min(100, att.power + 8);
        def.takeHit(hit.dmg, hit.knock, hit.name === 'Special');
      }
    }

    function endRound(reason, winnerId) {
      phase = 'ROUND_OVER';
      bannerText = reason;
      bannerTimer = 120;
      bannerScale = 2;
      if (winnerId === 'p1') {
        p1RoundsWon++;
        bannerSub = 'BLAZE WINS!';
      } else if (winnerId === 'p2') {
        p2RoundsWon++;
        bannerSub = 'FROST WINS!';
      } else {
        if (p1.health > p2.health) { p1RoundsWon++; bannerSub = 'BLAZE WINS!'; }
        else if (p2.health > p1.health) { p2RoundsWon++; bannerSub = 'FROST WINS!'; }
        else { bannerSub = 'DRAW!'; }
      }
    }

    // --- DRAW ---
    function draw() {
      ctx.save();
      if (shakeIntensity > 1) {
        const sx = (Math.random() - 0.5) * shakeIntensity;
        const sy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(sx, sy);
      }

      // Background Sky & Trusses
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#090a14');
      sky.addColorStop(0.5, '#131525');
      sky.addColorStop(1, '#0e101d');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Spotlights
      [250, 640, 1030].forEach((sx, i) => {
        const ang = Math.sin(Date.now() * 0.0015 + i) * 0.35;
        const grad = ctx.createLinearGradient(sx, 70, sx + ang * 500, 600);
        grad.addColorStop(0, i === 1 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(225, 29, 72, 0.1)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx - 20, 70);
        ctx.lineTo(sx + ang * 500 - 120, 600);
        ctx.lineTo(sx + ang * 500 + 120, 600);
        ctx.lineTo(sx + 20, 70);
        ctx.fill();
      });

      // Crowd
      ctx.fillStyle = '#141624';
      for (let x = 0; x < W; x += 25) {
        const b = Math.sin(Date.now() * 0.005 + x) * 4;
        ctx.beginPath(); ctx.arc(x + 12, 400 + b, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x + 2, 412 + b, 20, 70);
      }
      ctx.fillStyle = '#1e2238';
      ctx.fillRect(0, 480, W, 20);

      // Ropes
      [490, 525, 560].forEach((ry, idx) => {
        ctx.strokeStyle = idx === 0 ? '#e11d48' : idx === 1 ? '#fff' : '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.quadraticCurveTo(W / 2, ry + 10, W, ry);
        ctx.stroke();
      });

      // Floor
      const flr = ctx.createLinearGradient(0, GROUND_Y, 0, H);
      flr.addColorStop(0, '#2d313d');
      flr.addColorStop(1, '#15171e');
      ctx.fillStyle = flr;
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

      // Hazard border
      for (let x = 0; x < W; x += 28) {
        ctx.fillStyle = '#eab308';
        ctx.fillRect(x, GROUND_Y, 14, 8);
        ctx.fillStyle = '#111827';
        ctx.fillRect(x + 14, GROUND_Y, 14, 8);
      }

      // Fighters
      p1.render(ctx);
      p2.render(ctx);

      // Particles
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // HUD (Health & Power Bars, Timer, Round Dots)
      if (phase !== 'TITLE') {
        drawHUD();
      }

      // Overlays
      if (phase === 'TITLE') {
        drawTitleScreen();
      } else if (phase === 'ROUND_INTRO' || phase === 'ROUND_OVER') {
        drawBanner();
      } else if (phase === 'MATCH_OVER') {
        drawMatchOver();
      }

      ctx.restore();
    }

    function drawHUD() {
      // P1 Health
      ctx.fillStyle = '#1e202e';
      ctx.fillRect(60, 40, 420, 24);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(60 + (420 * (1 - p1.health / 100)), 40, 420 * (p1.health / 100), 24);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.strokeRect(60, 40, 420, 24);

      // P1 Power
      ctx.fillStyle = '#111';
      ctx.fillRect(60, 70, 240, 12);
      ctx.fillStyle = p1.power >= 100 ? '#ffd700' : '#f97316';
      ctx.fillRect(60, 70, 240 * (p1.power / 100), 12);
      ctx.strokeRect(60, 70, 240, 12);

      // P1 Name & Round Dots
      ctx.font = 'bold 18px "Chakra Petch", sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(p1.name, 60, 32);
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(360 + i * 22, 26, 7, 0, Math.PI * 2);
        ctx.fillStyle = i < p1RoundsWon ? '#e11d48' : '#334155';
        ctx.fill();
        ctx.stroke();
      }

      // P2 Health
      ctx.fillStyle = '#1e202e';
      ctx.fillRect(W - 480, 40, 420, 24);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(W - 480, 40, 420 * (p2.health / 100), 24);
      ctx.strokeRect(W - 480, 40, 420, 24);

      // P2 Power
      ctx.fillStyle = '#111';
      ctx.fillRect(W - 300, 70, 240, 12);
      ctx.fillStyle = p2.power >= 100 ? '#ffd700' : '#38bdf8';
      ctx.fillRect(W - 60 - (240 * (p2.power / 100)), 70, 240 * (p2.power / 100), 12);
      ctx.strokeRect(W - 300, 70, 240, 12);

      // P2 Name & Round Dots
      ctx.textAlign = 'right';
      ctx.fillText(p2.name + (gameMode.startsWith('1P') ? ' (CPU)' : ''), W - 60, 32);
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(W - 360 - i * 22, 26, 7, 0, Math.PI * 2);
        ctx.fillStyle = i < p2RoundsWon ? '#2563eb' : '#334155';
        ctx.fill();
        ctx.stroke();
      }
      ctx.textAlign = 'left';

      // Timer in Center
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(W / 2 - 45, 25, 90, 50);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(W / 2 - 45, 25, 90, 50);
      ctx.font = 'bold 32px "Press Start 2P", monospace';
      ctx.fillStyle = roundTimer <= 10 ? '#ef4444' : '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(String(roundTimer).padStart(2, '0'), W / 2, 62);
      ctx.textAlign = 'left';

      // Combo Display
      if (p1.comboCount > 1) {
        ctx.font = 'bold 28px "Press Start 2P"';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(p1.comboCount + ' HITS!', 80, 140);
      }
      if (p2.comboCount > 1) {
        ctx.textAlign = 'right';
        ctx.font = 'bold 28px "Press Start 2P"';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(p2.comboCount + ' HITS!', W - 80, 140);
        ctx.textAlign = 'left';
      }
    }

    function drawBanner() {
      ctx.save();
      ctx.translate(W / 2, H / 2 - 50);
      ctx.scale(bannerScale, bannerScale);
      ctx.textAlign = 'center';
      ctx.font = 'bold 50px "Press Start 2P", monospace';
      ctx.fillStyle = '#ff2d55';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 10;
      ctx.fillText(bannerText, 0, 0);

      if (bannerSub) {
        ctx.font = 'bold 24px "Chakra Petch", sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(bannerSub, 0, 48);
      }
      ctx.restore();
    }

    function drawTitleScreen() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = 'center';
      ctx.font = 'bold 56px "Black Ops One", cursive';
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 25;
      ctx.fillText('ARENA CLASH', W / 2, 220);

      ctx.font = 'bold 20px "Press Start 2P"';
      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillText('HYPER 2D SHOWDOWN', W / 2, 280);

      ctx.shadowBlur = 0;
      ctx.font = 'bold 18px "Chakra Petch"';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Press [1] for 1-PLAYER MODE (vs AI)   |   Press [2] for 2-PLAYER LOCAL', W / 2, 380);
      ctx.fillText('Or Press [ENTER / SPACE] to Start', W / 2, 420);

      // Controls preview
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(W / 2 - 400, 470, 800, 130);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(W / 2 - 400, 470, 800, 130);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px "Chakra Petch"';
      ctx.fillText('PLAYER 1: [A/D] Move  [W] Jump  [F] Punch  [G] Kick  [H] Block  [R] Super Move', W / 2, 515);
      ctx.fillText('PLAYER 2: [←/→] Move  [↑] Jump  [K] Punch  [L] Kick  [J] Block  [U] Super Move', W / 2, 555);
    }

    function drawMatchOver() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = 'center';
      ctx.font = 'bold 50px "Black Ops One"';
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 20;
      ctx.fillText('MATCH WINNER: ' + matchWinner + '!', W / 2, 280);

      ctx.shadowBlur = 0;
      ctx.font = 'bold 22px "Chakra Petch"';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText('FINAL SCORE: ' + p1RoundsWon + ' - ' + p2RoundsWon, W / 2, 340);
      ctx.fillText('Press [ENTER / SPACE] to Play Again', W / 2, 420);
    }

    // Animation runner
    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  </script>
</body>
</html>`;
}

export function downloadStandaloneFile() {
  const content = generateStandaloneHtml();
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'arena_clash_game.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
