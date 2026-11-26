/**
 * Arena Clash - Fighter Class & Muscular Anatomy Canvas Renderer
 */

import { FighterConfig, FighterState, Box } from './types';
import { soundEngine } from './audio';

export class Fighter {
  public config: FighterConfig;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public facing: number = 1; // 1 = right, -1 = left

  public health: number = 100;
  public maxHealth: number = 100;
  public power: number = 0;
  public maxPower: number = 100;

  public state: FighterState = 'IDLE';
  public stateTime: number = 0; // frames in current state
  public animFrame: number = 0;
  public isGrounded: boolean = true;

  public hitStun: number = 0;
  public invincibleTimer: number = 0;
  public blockSparkTimer: number = 0;

  public comboCount: number = 0;
  public comboTimer: number = 0; // resets combo if no hit within window
  public lastDamageTaken: number = 0;
  public isAttacking: boolean = false;
  public attackHasHit: boolean = false;

  // Visual constants
  public width: number = 90;
  public height: number = 175;
  public groundY: number = 580;

  constructor(config: FighterConfig, startX: number, facing: number) {
    this.config = config;
    this.x = startX;
    this.facing = facing;
    this.y = this.groundY;
  }

  public reset(startX: number, facing: number) {
    this.x = startX;
    this.y = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.health = this.maxHealth;
    this.power = 0;
    this.state = 'IDLE';
    this.stateTime = 0;
    this.hitStun = 0;
    this.invincibleTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.isAttacking = false;
    this.attackHasHit = false;
  }

  public update(arenaWidth: number, opponentX: number) {
    this.stateTime++;
    this.animFrame++;

    // Face opponent automatically when idle/walking/jumping
    if (this.state === 'IDLE' || this.state === 'WALK_FWD' || this.state === 'WALK_BACK' || this.state === 'JUMP') {
      this.facing = this.x < opponentX ? 1 : -1;
    }

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Invincible / block spark counters
    if (this.invincibleTimer > 0) this.invincibleTimer--;
    if (this.blockSparkTimer > 0) this.blockSparkTimer--;

    // Hit stun handling
    if (this.hitStun > 0) {
      this.hitStun--;
      this.state = 'HIT';
      // Apply friction
      this.vx *= 0.88;
      if (this.hitStun <= 0 && this.health > 0) {
        this.state = 'IDLE';
        this.isAttacking = false;
      }
    }

    // Knocked down state
    if (this.state === 'KNOCKED_DOWN') {
      this.vx *= 0.9;
    }

    // Physics (Gravity & Movement)
    this.x += this.vx;
    this.y += this.vy;

    if (this.y < this.groundY) {
      this.vy += 1.25; // Gravity
      this.isGrounded = false;
    } else {
      this.y = this.groundY;
      this.vy = 0;
      this.isGrounded = true;
      if (this.state === 'JUMP') {
        this.state = 'IDLE';
      }
    }

    // Ground friction when not actively moving
    if (this.isGrounded && this.state !== 'WALK_FWD' && this.state !== 'WALK_BACK' && this.state !== 'HIT') {
      this.vx *= 0.75;
    }

    // Arena boundary limits
    const margin = 50;
    if (this.x < margin) {
      this.x = margin;
      this.vx = 0;
    } else if (this.x > arenaWidth - margin) {
      this.x = arenaWidth - margin;
      this.vx = 0;
    }

    // Attack state durations & transitions
    this.updateAttackStates();
  }

  private updateAttackStates() {
    if (this.state === 'PUNCH') {
      // 18 frames total: 4 startup, 6 active, 8 recovery
      if (this.stateTime >= 18) {
        this.state = 'IDLE';
        this.isAttacking = false;
        this.attackHasHit = false;
      }
    } else if (this.state === 'KICK') {
      // 24 frames total: 6 startup, 8 active, 10 recovery
      if (this.stateTime >= 24) {
        this.state = 'IDLE';
        this.isAttacking = false;
        this.attackHasHit = false;
      }
    } else if (this.state === 'SPECIAL') {
      // 36 frames total: 12 startup flash, 14 active blast, 10 recovery
      if (this.stateTime >= 36) {
        this.state = 'IDLE';
        this.isAttacking = false;
        this.attackHasHit = false;
      }
    }
  }

  // --- ACTIONS ---

  public move(direction: number) {
    if (this.hitStun > 0 || this.state === 'KNOCKED_DOWN' || this.isAttacking) return;
    
    const speed = 6.0;
    this.vx = direction * speed;

    if (this.isGrounded) {
      if ((direction > 0 && this.facing === 1) || (direction < 0 && this.facing === -1)) {
        this.state = 'WALK_FWD';
      } else {
        this.state = 'WALK_BACK';
      }
    }
  }

  public stopMoving() {
    if (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') {
      this.state = 'IDLE';
      this.vx = 0;
    }
  }

  public jump() {
    if (!this.isGrounded || this.hitStun > 0 || this.state === 'KNOCKED_DOWN' || this.isAttacking) return;
    this.vy = -20;
    this.state = 'JUMP';
    this.isGrounded = false;
    soundEngine.playWhoosh();
  }

  public punch() {
    if (!this.canAct()) return;
    this.state = 'PUNCH';
    this.stateTime = 0;
    this.isAttacking = true;
    this.attackHasHit = false;
    soundEngine.playWhoosh();
  }

  public kick() {
    if (!this.canAct()) return;
    this.state = 'KICK';
    this.stateTime = 0;
    this.isAttacking = true;
    this.attackHasHit = false;
    soundEngine.playWhoosh();
  }

  public block(isBlocking: boolean) {
    if (this.hitStun > 0 || this.state === 'KNOCKED_DOWN' || this.isAttacking) return;
    if (isBlocking) {
      this.state = 'BLOCK';
      this.vx = 0;
    } else if (this.state === 'BLOCK') {
      this.state = 'IDLE';
    }
  }

  public special(): boolean {
    if (!this.canAct() || this.power < this.maxPower) return false;
    this.state = 'SPECIAL';
    this.stateTime = 0;
    this.isAttacking = true;
    this.attackHasHit = false;
    this.power = 0; // Consume meter
    soundEngine.playSpecialCharge();
    return true;
  }

  private canAct(): boolean {
    return this.hitStun <= 0 && this.state !== 'KNOCKED_DOWN' && !this.isAttacking;
  }

  public takeHit(damage: number, knockbackX: number, isSpecial: boolean = false): { wasBlocked: boolean; finalDamage: number } {
    if (this.invincibleTimer > 0 || this.state === 'KNOCKED_DOWN') {
      return { wasBlocked: false, finalDamage: 0 };
    }

    const wasBlocked = this.state === 'BLOCK';
    let finalDamage = damage;

    if (wasBlocked) {
      finalDamage = Math.max(1, Math.round(damage * 0.2)); // 80% reduction
      this.power = Math.min(this.maxPower, this.power + 2);
      this.blockSparkTimer = 10;
      soundEngine.playBlock();
      // Slight pushback on block
      this.vx = knockbackX * 0.3;
    } else {
      this.health = Math.max(0, this.health - finalDamage);
      this.power = Math.min(this.maxPower, this.power + 5);
      this.hitStun = isSpecial ? 30 : 18;
      this.state = 'HIT';
      this.stateTime = 0;
      this.isAttacking = false;
      this.vx = knockbackX;

      if (damage < 12) {
        soundEngine.playPunch();
      } else if (damage < 25) {
        soundEngine.playKick();
      } else {
        soundEngine.playSpecialBlast();
      }

      if (this.health <= 0) {
        this.knockout(knockbackX);
      }
    }

    this.lastDamageTaken = finalDamage;
    return { wasBlocked, finalDamage };
  }

  public knockout(knockbackX: number) {
    this.state = 'KNOCKED_DOWN';
    this.stateTime = 0;
    this.hitStun = 999;
    this.vx = knockbackX * 1.5;
    this.vy = -12;
    soundEngine.playKnockout();
  }

  public getHurtbox(): Box {
    // Standard body collision box
    if (this.state === 'KNOCKED_DOWN') {
      return {
        x: this.x - 70,
        y: this.y - 45,
        w: 140,
        h: 45
      };
    }
    return {
      x: this.x - 40,
      y: this.y - this.height + 10,
      w: 80,
      h: this.height - 10
    };
  }

  public getHitbox(): Box | null {
    if (!this.isAttacking || this.attackHasHit) return null;

    const reach = this.facing === 1 ? 1 : -1;

    if (this.state === 'PUNCH') {
      // Active during frames 4 to 12
      if (this.stateTime >= 4 && this.stateTime <= 12) {
        return {
          x: reach === 1 ? this.x + 25 : this.x - 95,
          y: this.y - this.height + 45,
          w: 70,
          h: 40
        };
      }
    } else if (this.state === 'KICK') {
      // Active during frames 6 to 16
      if (this.stateTime >= 6 && this.stateTime <= 16) {
        return {
          x: reach === 1 ? this.x + 30 : this.x - 110,
          y: this.y - this.height + 70,
          w: 80,
          h: 45
        };
      }
    } else if (this.state === 'SPECIAL') {
      // Active during frames 12 to 26
      if (this.stateTime >= 12 && this.stateTime <= 26) {
        return {
          x: reach === 1 ? this.x + 35 : this.x - 145,
          y: this.y - this.height + 25,
          w: 110,
          h: 90
        };
      }
    }

    return null;
  }

  // --- RENDERING ---

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Ground shadow
    const jumpOffset = this.groundY - this.y;
    const shadowScale = Math.max(0.3, 1 - jumpOffset / 400);
    ctx.beginPath();
    ctx.ellipse(this.x, this.groundY + 4, 45 * shadowScale, 14 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    // Position at character feet
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    // Subtle breathing / idle bobbing
    const breath = Math.sin(this.animFrame * 0.08) * 2;
    const walkBob = (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') 
      ? Math.sin(this.animFrame * 0.25) * 4 
      : 0;

    // Special power glow aura when power is full
    if (this.power >= this.maxPower) {
      this.drawPowerAura(ctx);
    }

    // Block shield aura
    if (this.state === 'BLOCK') {
      this.drawBlockShield(ctx);
    }

    if (this.state === 'KNOCKED_DOWN') {
      this.drawKnockedDownBody(ctx);
    } else {
      this.drawMuscularFighter(ctx, breath, walkBob);
    }

    // Special move startup flash
    if (this.state === 'SPECIAL' && this.stateTime < 14) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.sin(this.stateTime) * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, -90, 75, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawMuscularFighter(ctx: CanvasRenderingContext2D, breath: number, walkBob: number) {
    const isHit = this.state === 'HIT';
    const hitTilt = isHit ? -0.22 : 0;

    ctx.save();
    ctx.translate(0, walkBob);
    ctx.rotate(hitTilt);

    // Legs animation
    this.drawLegs(ctx);

    // Torso with muscular definition
    this.drawMuscularTorso(ctx, breath);

    // Head, Hair & Expression
    this.drawHead(ctx, breath);

    // Arms, Fists, Gloves & Attacks
    this.drawArms(ctx, breath);

    ctx.restore();
  }

  private drawMuscularTorso(ctx: CanvasRenderingContext2D, breath: number) {
    const { skinTone, outfitPrimary, outfitSecondary } = this.config;
    const torsoY = -120 + breath;

    // Pelvis & Martial Shorts / Pants waist
    ctx.fillStyle = outfitPrimary;
    ctx.beginPath();
    ctx.roundRect(-24, -68, 48, 28, 4);
    ctx.fill();

    // Belt / Sash
    ctx.fillStyle = outfitSecondary;
    ctx.fillRect(-26, -72, 52, 10);
    // Belt knot flutter
    ctx.beginPath();
    const flutter = Math.sin(this.animFrame * 0.15) * 4;
    ctx.moveTo(0, -66);
    ctx.lineTo(8 + flutter, -45);
    ctx.lineTo(2 + flutter, -44);
    ctx.lineTo(-4, -66);
    ctx.fill();

    // Muscular Bare Torso (or Gi/top)
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    // V-taper silhouette (wide shoulders tapering down to waist)
    ctx.moveTo(-32, torsoY); // Left deltoid junction
    ctx.lineTo(32, torsoY);  // Right deltoid junction
    ctx.lineTo(24, -68);     // Right waist
    ctx.lineTo(-24, -68);    // Left waist
    ctx.closePath();
    ctx.fill();

    // Pectoral muscles (Chest definition)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 2.5;

    // Left Pec
    ctx.beginPath();
    ctx.ellipse(-14, torsoY + 22, 13, 10, -0.1, 0, Math.PI);
    ctx.stroke();

    // Right Pec
    ctx.beginPath();
    ctx.ellipse(14, torsoY + 22, 13, 10, 0.1, 0, Math.PI);
    ctx.stroke();

    // Center sternum line
    ctx.beginPath();
    ctx.moveTo(0, torsoY + 12);
    ctx.lineTo(0, -68);
    ctx.stroke();

    // Six-pack abdominal grooves
    [-44, -30, -16].forEach((absY) => {
      ctx.beginPath();
      ctx.moveTo(-12, torsoY + 54 + (absY + 44));
      ctx.lineTo(12, torsoY + 54 + (absY + 44));
      ctx.stroke();
    });

    // Ribcage / serratus muscles shading
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    [-12, -4, 4].forEach((yOff) => {
      ctx.beginPath();
      ctx.moveTo(-21, torsoY + 36 + yOff);
      ctx.lineTo(-16, torsoY + 40 + yOff);
      ctx.stroke();
    });

    // Broad Trapezius & Collarbones
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, torsoY + 6);
    ctx.lineTo(-4, torsoY + 12);
    ctx.moveTo(24, torsoY + 6);
    ctx.lineTo(4, torsoY + 12);
    ctx.stroke();
  }

  private drawHead(ctx: CanvasRenderingContext2D, breath: number) {
    const { skinTone, hairColor, hairStyle, outfitSecondary } = this.config;
    const headY = -148 + breath;

    // Thick neck
    ctx.fillStyle = skinTone;
    ctx.fillRect(-12, headY + 14, 24, 18);
    // Neck muscle shading
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, headY + 14);
    ctx.lineTo(-4, headY + 28);
    ctx.moveTo(8, headY + 14);
    ctx.lineTo(4, headY + 28);
    ctx.stroke();

    // Chiseled jaw / head base
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.moveTo(-16, headY);
    ctx.lineTo(16, headY);
    ctx.lineTo(13, headY + 16);
    ctx.lineTo(0, headY + 24); // Sharp chin
    ctx.lineTo(-13, headY + 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nose
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, headY + 6);
    ctx.lineTo(6, headY + 11);
    ctx.lineTo(1, headY + 12);
    ctx.stroke();

    // Battle mouth / Grimace
    ctx.strokeStyle = '#222';
    ctx.beginPath();
    if (this.state === 'HIT' || this.state === 'SPECIAL') {
      // Open shouting mouth
      ctx.fillStyle = '#6a0000';
      ctx.roundRect(-4, headY + 15, 10, 6, 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.moveTo(-4, headY + 16);
      ctx.lineTo(6, headY + 16);
      ctx.stroke();
    }

    // Fierce Eyes & Eyebrows
    ctx.fillStyle = '#111';
    ctx.fillRect(4, headY + 4, 6, 3);
    // Eyebrows angled fierce
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(0, headY + 3);
    ctx.lineTo(12, headY + 1);
    ctx.lineTo(12, headY - 2);
    ctx.lineTo(0, headY);
    ctx.fill();

    // Hair / Headband
    if (hairStyle === 'headband') {
      // Martial Arts Headband
      ctx.fillStyle = outfitSecondary;
      ctx.fillRect(-17, headY - 4, 34, 8);
      // Headband tails streaming back
      const tailFlutter = Math.sin(this.animFrame * 0.2) * 6;
      ctx.beginPath();
      ctx.moveTo(-17, headY);
      ctx.lineTo(-38 + tailFlutter, headY - 6);
      ctx.lineTo(-36 + tailFlutter, headY + 4);
      ctx.lineTo(-17, headY + 4);
      ctx.fill();
    }

    // Spiky Hair on top
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(-17, headY - 2);
    ctx.lineTo(-24, headY - 14);
    ctx.lineTo(-12, headY - 20);
    ctx.lineTo(-2, headY - 26);
    ctx.lineTo(8, headY - 22);
    ctx.lineTo(18, headY - 16);
    ctx.lineTo(17, headY - 2);
    ctx.closePath();
    ctx.fill();
  }

  private drawArms(ctx: CanvasRenderingContext2D, breath: number) {
    const { skinTone, glovesColor } = this.config;
    const shoulderY = -118 + breath;

    if (this.state === 'PUNCH') {
      this.drawPunchingArm(ctx, shoulderY, skinTone, glovesColor);
    } else if (this.state === 'KICK') {
      this.drawKickingArms(ctx, shoulderY, skinTone, glovesColor);
    } else if (this.state === 'BLOCK') {
      this.drawBlockingArms(ctx, shoulderY, skinTone, glovesColor);
    } else if (this.state === 'SPECIAL') {
      this.drawSpecialMovePose(ctx, shoulderY, skinTone, glovesColor);
    } else {
      // Guard stance / Idle breathing fists
      this.drawGuardArms(ctx, shoulderY, skinTone, glovesColor);
    }
  }

  private drawGuardArms(ctx: CanvasRenderingContext2D, shoulderY: number, skin: string, glove: string) {
    // Back arm (slightly dimmed)
    ctx.fillStyle = skin;
    // Bicep
    ctx.beginPath();
    ctx.ellipse(-18, shoulderY + 12, 11, 16, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Forearm up
    ctx.beginPath();
    ctx.ellipse(-12, shoulderY + 28, 9, 14, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Glove
    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.arc(-8, shoulderY + 14, 13, 0, Math.PI * 2);
    ctx.fill();

    // Front arm (Lead Guard)
    ctx.fillStyle = skin;
    // Front Deltoid
    ctx.beginPath();
    ctx.arc(24, shoulderY + 6, 14, 0, Math.PI * 2);
    ctx.fill();
    // Front Bicep
    ctx.beginPath();
    ctx.ellipse(26, shoulderY + 22, 12, 17, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Forearm angled forward
    ctx.beginPath();
    ctx.ellipse(36, shoulderY + 18, 10, 16, -0.6, 0, Math.PI * 2);
    ctx.fill();
    // Lead Glove / Knuckle Fist
    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.arc(44, shoulderY + 6, 15, 0, Math.PI * 2);
    ctx.fill();
    // Glove strap / highlights
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(42, shoulderY + 5, 8, -Math.PI * 0.5, 0);
    ctx.stroke();
  }

  private drawPunchingArm(ctx: CanvasRenderingContext2D, shoulderY: number, skin: string, glove: string) {
    const punchProgress = this.stateTime / 18;
    const extension = Math.sin(punchProgress * Math.PI) * 75;

    // Rear arm kept tight in guard
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(-16, shoulderY + 16, 10, 15, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.arc(-10, shoulderY + 18, 12, 0, Math.PI * 2);
    ctx.fill();

    // Massive extended punching arm
    ctx.fillStyle = skin;
    // Huge Deltoid
    ctx.beginPath();
    ctx.arc(22, shoulderY + 4, 16, 0, Math.PI * 2);
    ctx.fill();
    // Stretched Bicep & Forearm
    ctx.beginPath();
    ctx.roundRect(24, shoulderY - 8, 30 + extension * 0.6, 22, 8);
    ctx.fill();

    // Muscle line on arm
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(34, shoulderY + 3);
    ctx.lineTo(54 + extension * 0.5, shoulderY + 3);
    ctx.stroke();

    // Massive clenched boxing glove / fist punching forward
    const fistX = 55 + extension;
    const fistY = shoulderY + 2;

    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.ellipse(fistX, fistY, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Speed lines trailing the punch
    if (this.stateTime >= 4 && this.stateTime <= 10) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fistX - 45, fistY - 8);
      ctx.lineTo(fistX - 10, fistY - 8);
      ctx.moveTo(fistX - 60, fistY + 8);
      ctx.lineTo(fistX - 15, fistY + 8);
      ctx.stroke();
    }
  }

  private drawKickingArms(ctx: CanvasRenderingContext2D, shoulderY: number, skin: string, glove: string) {
    // Torso leans back, arms counterbalance
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(-26, shoulderY + 10, 10, 16, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.arc(-32, shoulderY + 24, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(14, shoulderY + 20, 11, 16, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.arc(18, shoulderY + 34, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBlockingArms(ctx: CanvasRenderingContext2D, shoulderY: number, skin: string, glove: string) {
    // Both arms brought together into an "X" Guard right in front of chest/head
    ctx.fillStyle = skin;
    // Left forearm
    ctx.beginPath();
    ctx.ellipse(14, shoulderY + 6, 10, 22, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Right forearm
    ctx.beginPath();
    ctx.ellipse(18, shoulderY + 6, 10, 22, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Crossed Gloves
    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.arc(12, shoulderY - 8, 14, 0, Math.PI * 2);
    ctx.arc(22, shoulderY - 6, 14, 0, Math.PI * 2);
    ctx.fill();

    // Heavy guard border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  private drawSpecialMovePose(ctx: CanvasRenderingContext2D, shoulderY: number, skin: string, glove: string) {
    const specialProgress = this.stateTime / 36;
    const { specialColor } = this.config;

    // Gathering energy then flying thrust
    if (this.stateTime < 12) {
      // Power surge stance: fists pulled back with energy vortex
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.ellipse(-24, shoulderY + 8, 12, 16, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = glove;
      ctx.beginPath();
      ctx.arc(-32, shoulderY + 10, 16, 0, Math.PI * 2);
      ctx.fill();

      // Energy orb forming at fist
      ctx.fillStyle = specialColor;
      ctx.beginPath();
      ctx.arc(-32, shoulderY + 10, 12 + Math.sin(this.stateTime * 0.8) * 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Full power flying thrust
      const surgeX = 60 + Math.sin(specialProgress * Math.PI) * 40;
      ctx.fillStyle = skin;
      ctx.fillRect(20, shoulderY - 10, surgeX - 10, 26);

      ctx.fillStyle = glove;
      ctx.beginPath();
      ctx.arc(surgeX + 15, shoulderY + 3, 24, 0, Math.PI * 2);
      ctx.fill();

      // Blazing fist aura
      ctx.fillStyle = specialColor;
      ctx.beginPath();
      ctx.arc(surgeX + 15, shoulderY + 3, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(surgeX + 15, shoulderY + 3, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLegs(ctx: CanvasRenderingContext2D) {
    const { outfitPrimary, outfitSecondary } = this.config;
    const isJumping = !this.isGrounded;
    const isKicking = this.state === 'KICK';

    if (isKicking) {
      this.drawKickingLegs(ctx, outfitPrimary, outfitSecondary);
      return;
    }

    if (isJumping) {
      // Airborne tucked legs
      ctx.fillStyle = outfitPrimary;
      // Left leg tucked
      ctx.beginPath();
      ctx.roundRect(-22, -62, 18, 40, 8);
      ctx.fill();
      // Right leg tucked
      ctx.beginPath();
      ctx.roundRect(6, -58, 20, 36, 8);
      ctx.fill();

      // Boots
      ctx.fillStyle = outfitSecondary;
      ctx.fillRect(-22, -22, 18, 16);
      ctx.fillRect(6, -22, 20, 16);
      return;
    }

    // Walking / Stance Leg Cycle
    let legOffset1 = 0;
    let legOffset2 = 0;
    if (this.state === 'WALK_FWD' || this.state === 'WALK_BACK') {
      const step = Math.sin(this.animFrame * 0.25) * 16;
      legOffset1 = step;
      legOffset2 = -step;
    }

    // Back leg (Left)
    ctx.fillStyle = outfitPrimary;
    // Thigh
    ctx.beginPath();
    ctx.roundRect(-24 + legOffset1 * 0.5, -62, 20, 38, 8);
    ctx.fill();
    // Muscular Calf
    ctx.fillStyle = outfitPrimary;
    ctx.beginPath();
    ctx.roundRect(-22 + legOffset1, -26, 18, 30, 6);
    ctx.fill();
    // Heavy combat boot / foot
    ctx.fillStyle = outfitSecondary;
    ctx.beginPath();
    ctx.roundRect(-24 + legOffset1, 2, 24, 12, 4);
    ctx.fill();

    // Front leg (Right)
    ctx.fillStyle = outfitPrimary;
    // Thigh
    ctx.beginPath();
    ctx.roundRect(4 + legOffset2 * 0.5, -62, 22, 38, 8);
    ctx.fill();
    // Muscular Calf
    ctx.beginPath();
    ctx.roundRect(6 + legOffset2, -26, 20, 30, 6);
    ctx.fill();
    // Heavy boot
    ctx.fillStyle = outfitSecondary;
    ctx.beginPath();
    ctx.roundRect(4 + legOffset2, 2, 26, 12, 4);
    ctx.fill();
  }

  private drawKickingLegs(ctx: CanvasRenderingContext2D, primary: string, secondary: string) {
    const kickProgress = this.stateTime / 24;
    const extension = Math.sin(kickProgress * Math.PI) * 85;

    // Planted support leg
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.roundRect(-20, -60, 22, 45, 6);
    ctx.roundRect(-18, -18, 20, 24, 6);
    ctx.fill();
    ctx.fillStyle = secondary;
    ctx.roundRect(-20, 2, 26, 12, 4);
    ctx.fill();

    // Massive extended high kick leg!
    ctx.save();
    ctx.translate(10, -50);
    ctx.rotate(-0.15);

    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.roundRect(0, -14, 45 + extension * 0.5, 24, 8);
    ctx.fill();

    // Boot kicking out
    const footX = 40 + extension;
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.roundRect(footX, -18, 30, 26, 6);
    ctx.fill();

    // Kick speed slash arc
    if (this.stateTime >= 6 && this.stateTime <= 16) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(footX - 10, -5, 38, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawKnockedDownBody(ctx: CanvasRenderingContext2D) {
    const { skinTone, hairColor, outfitPrimary, outfitSecondary, glovesColor } = this.config;

    ctx.save();
    ctx.translate(-20, 6);
    ctx.rotate(Math.PI * 0.48); // Flat on ground

    // Torso flat
    ctx.fillStyle = skinTone;
    ctx.roundRect(-26, -30, 52, 28, 6);
    ctx.fill();

    // Legs sprawled
    ctx.fillStyle = outfitPrimary;
    ctx.fillRect(-20, -2, 18, 55);
    ctx.fillRect(4, -2, 18, 50);

    // Boots
    ctx.fillStyle = outfitSecondary;
    ctx.fillRect(-22, 50, 22, 12);
    ctx.fillRect(4, 46, 22, 12);

    // Head on ground
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(0, -45, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(0, -50, 16, Math.PI, Math.PI * 2);
    ctx.fill();

    // Arms sprawled
    ctx.fillStyle = glovesColor;
    ctx.beginPath();
    ctx.arc(-24, -20, 14, 0, Math.PI * 2);
    ctx.arc(24, -15, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawPowerAura(ctx: CanvasRenderingContext2D) {
    const { specialColor } = this.config;
    const pulse = Math.sin(this.animFrame * 0.2) * 8;
    ctx.save();
    ctx.strokeStyle = specialColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = specialColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(0, -85, 46 + pulse, 92 + pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawBlockShield(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const isHit = this.blockSparkTimer > 0;
    ctx.strokeStyle = isHit ? 'rgba(255, 255, 200, 0.95)' : 'rgba(90, 200, 255, 0.65)';
    ctx.lineWidth = isHit ? 5 : 3;
    ctx.shadowColor = isHit ? '#ffffaa' : '#38bdf8';
    ctx.shadowBlur = 20;

    // Hexagonal energy barrier arc
    ctx.beginPath();
    ctx.arc(25, -90, 65, -Math.PI * 0.38, Math.PI * 0.38);
    ctx.stroke();

    if (isHit) {
      // Spark burst on the barrier
      for (let i = 0; i < 6; i++) {
        const angle = -0.5 + Math.random();
        const dist = 55 + Math.random() * 20;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(25 + Math.cos(angle) * dist, -90 + Math.sin(angle) * dist, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
