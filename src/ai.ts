/**
 * Arena Clash - Fighter AI Controller
 */

import { Fighter } from './fighter';
import { GameMode } from './types';

export class FighterAI {
  private p2: Fighter;
  private p1: Fighter;
  private mode: GameMode;
  private decisionTimer: number = 0;
  private currentAction: 'IDLE' | 'APPROACH' | 'RETREAT' | 'BLOCK' = 'IDLE';

  constructor(p2: Fighter, p1: Fighter, mode: GameMode) {
    this.p2 = p2;
    this.p1 = p1;
    this.mode = mode;
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
  }

  public update() {
    if (this.mode === '2P') return; // Human controlled
    if (this.p2.health <= 0 || this.p2.state === 'KNOCKED_DOWN' || this.p2.hitStun > 0) {
      return;
    }

    const dist = Math.abs(this.p2.x - this.p1.x);
    const p1Attacking = this.p1.isAttacking;
    this.decisionTimer--;

    // Reaction parameters based on difficulty
    let blockChance = 0.3;
    let attackFreq = 18;
    let jumpChance = 0.05;
    let specialAggression = 0.6;

    if (this.mode === '1P_EASY') {
      blockChance = 0.25;
      attackFreq = 26;
      jumpChance = 0.02;
      specialAggression = 0.4;
    } else if (this.mode === '1P_NORMAL') {
      blockChance = 0.55;
      attackFreq = 16;
      jumpChance = 0.06;
      specialAggression = 0.75;
    } else if (this.mode === '1P_HARD') {
      blockChance = 0.82;
      attackFreq = 10;
      jumpChance = 0.12;
      specialAggression = 0.95;
    }

    // 1. Reactive Blocking: If player 1 attacks and is close enough to hit
    if (p1Attacking && dist < 160) {
      if (Math.random() < blockChance) {
        this.p2.block(true);
        return;
      }
    } else if (this.p2.state === 'BLOCK' && !p1Attacking) {
      this.p2.block(false);
    }

    // 2. Special Move usage
    if (this.p2.power >= this.p2.maxPower && dist < 320 && Math.random() < specialAggression) {
      const fired = this.p2.special();
      if (fired) return;
    }

    // 3. Periodic Decision Making
    if (this.decisionTimer <= 0) {
      this.decisionTimer = 10 + Math.floor(Math.random() * attackFreq);

      // Random jump in or dodge
      if (Math.random() < jumpChance && this.p2.isGrounded) {
        this.p2.jump();
      }

      if (dist > 150) {
        // Far away: approach
        this.currentAction = 'APPROACH';
      } else if (dist < 60) {
        // Too close: back off slightly or attack
        this.currentAction = Math.random() < 0.4 ? 'RETREAT' : 'IDLE';
      } else {
        // In striking pocket
        this.currentAction = 'IDLE';
        // Attack probability
        const attackRoll = Math.random();
        if (attackRoll < 0.48) {
          this.p2.punch();
        } else if (attackRoll < 0.85) {
          this.p2.kick();
        } else {
          this.p2.block(true);
          setTimeout(() => {
            if (this.p2.state === 'BLOCK') this.p2.block(false);
          }, 250);
        }
      }
    }

    // 4. Execute Current Movement Action
    const moveDir = this.p2.x < this.p1.x ? 1 : -1;

    if (this.currentAction === 'APPROACH') {
      this.p2.move(moveDir);
    } else if (this.currentAction === 'RETREAT') {
      this.p2.move(-moveDir);
    } else if (this.currentAction === 'IDLE' && this.p2.state !== 'BLOCK') {
      this.p2.stopMoving();
    }
  }
}
