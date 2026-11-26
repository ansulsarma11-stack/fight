/**
 * Arena Clash - Stadium Arena & Particle Effects Engine
 */

import { Particle, Projectile } from './types';

export class Arena {
  public width: number = 1280;
  public height: number = 720;
  public groundY: number = 580;

  // Particle systems
  public particles: Particle[] = [];
  public projectiles: Projectile[] = [];

  // Screen shake
  public shakeDuration: number = 0;
  public shakeIntensity: number = 0;
  public shakeX: number = 0;
  public shakeY: number = 0;

  // Atmosphere timers
  private time: number = 0;
  private cameraFlashes: { x: number; y: number; life: number }[] = [];

  // Spotlights
  private spotlights = [
    { baseAngle: -0.3, speed: 0.015, color: 'rgba(255, 80, 80, 0.12)', x: 200 },
    { baseAngle: 0.2, speed: 0.018, color: 'rgba(80, 180, 255, 0.14)', x: 640 },
    { baseAngle: -0.15, speed: 0.012, color: 'rgba(255, 230, 100, 0.12)', x: 1080 }
  ];

  constructor(w: number = 1280, h: number = 720) {
    this.width = w;
    this.height = h;
  }

  public triggerShake(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  public update() {
    this.time++;

    // Update screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= 0.9;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }

    // Random camera flashes in crowd
    if (Math.random() < 0.07) {
      this.cameraFlashes.push({
        x: 100 + Math.random() * (this.width - 200),
        y: 280 + Math.random() * 160,
        life: 5
      });
    }
    for (let i = this.cameraFlashes.length - 1; i >= 0; i--) {
      this.cameraFlashes[i].life--;
      if (this.cameraFlashes[i].life <= 0) {
        this.cameraFlashes.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.type === 'spark') {
        p.vy += 0.35; // gravity on sparks
        p.vx *= 0.96;
      } else if (p.type === 'dust') {
        p.size *= 1.03;
        p.vy *= 0.94;
      } else if (p.type === 'ring') {
        p.size += 4;
      } else if (p.type === 'fire' || p.type === 'ice') {
        p.size *= 0.95;
        p.vy -= 0.2; // floats upward
      }

      if (p.life >= p.maxLife || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.trailTimer++;

      // Emit trail particle
      if (proj.trailTimer % 2 === 0) {
        this.addParticle({
          x: proj.x,
          y: proj.y,
          vx: -proj.vx * 0.2 + (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 3,
          size: proj.radius * (0.6 + Math.random() * 0.5),
          color: proj.color,
          alpha: 0.8,
          decay: 0.05,
          type: proj.ownerId === 'p1' ? 'fire' : 'ice',
          life: 0,
          maxLife: 20
        });
      }

      // Despawn offscreen
      if (proj.x < -100 || proj.x > this.width + 100 || !proj.active) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  // --- PARTICLE EMITTERS ---

  public addParticle(p: Particle) {
    this.particles.push(p);
  }

  public spawnHitSparks(x: number, y: number, color: string = '#ffd700', count: number = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color: Math.random() > 0.4 ? color : '#ffffff',
        alpha: 1,
        decay: 0.05,
        type: 'spark',
        life: 0,
        maxLife: 16 + Math.floor(Math.random() * 12)
      });
    }

    // Shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 10,
      color,
      alpha: 0.85,
      decay: 0.08,
      type: 'ring',
      life: 0,
      maxLife: 15
    });
  }

  public spawnDustPuff(x: number, y: number, count: number = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y - 2,
        vx: (Math.random() - 0.5) * 4,
        vy: -0.8 - Math.random() * 1.5,
        size: 7 + Math.random() * 8,
        color: 'rgba(180, 175, 170, 0.45)',
        alpha: 0.6,
        decay: 0.04,
        type: 'dust',
        life: 0,
        maxLife: 22
      });
    }
  }

  public spawnSpecialExplosion(x: number, y: number, color: string) {
    this.triggerShake(14, 25);
    // Huge burst of elemental particles
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 14;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 8,
        color: Math.random() > 0.3 ? color : '#ffffff',
        alpha: 1,
        decay: 0.04,
        type: 'spark',
        life: 0,
        maxLife: 28
      });
    }
    // Expanding blast shockwave
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 15,
      color: '#ffffff',
      alpha: 1,
      decay: 0.05,
      type: 'ring',
      life: 0,
      maxLife: 22
    });
  }

  // --- RENDERING ---

  public renderBackground(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // 1. Dark dramatic arena sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#090a14');
    skyGrad.addColorStop(0.45, '#131525');
    skyGrad.addColorStop(0.8, '#1b1c30');
    skyGrad.addColorStop(1, '#0e101d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. High stadium roof steel trusses & industrial beams
    this.drawTrusses(ctx);

    // 3. Sweeping Spotlights
    this.drawSpotlights(ctx);

    // 4. Roaring Crowd Silhouettes
    this.drawCrowd(ctx);

    // 5. Camera flashes in the crowd
    this.cameraFlashes.forEach((flash) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, 18, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 6. Arena Billboard Banner
    this.drawBillboard(ctx);

    // 7. Ring posts & steel cables
    this.drawRingRopes(ctx);

    // 8. Cracked Concrete Floor
    this.drawConcreteFloor(ctx);

    ctx.restore();
  }

  private drawTrusses(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#1b1e33';
    ctx.lineWidth = 4;
    // Horizontal beam
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.lineTo(this.width, 80);
    ctx.moveTo(0, 130);
    ctx.lineTo(this.width, 130);
    // Diagonal cross struts
    for (let x = 0; x < this.width; x += 80) {
      ctx.moveTo(x, 80);
      ctx.lineTo(x + 40, 130);
      ctx.lineTo(x + 80, 80);
    }
    ctx.stroke();

    // Floodlight lamp clusters on the trusses
    [220, 520, 760, 1060].forEach((lampX) => {
      ctx.fillStyle = '#2a2f4c';
      ctx.fillRect(lampX - 25, 65, 50, 18);
      // Bright lamp bulbs
      ctx.fillStyle = 'rgba(255, 250, 220, 0.85)';
      ctx.fillRect(lampX - 20, 78, 40, 6);
      // Glow halo
      ctx.fillStyle = 'rgba(255, 240, 180, 0.08)';
      ctx.beginPath();
      ctx.arc(lampX, 85, 45, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawSpotlights(ctx: CanvasRenderingContext2D) {
    this.spotlights.forEach((spot, idx) => {
      const angle = spot.baseAngle + Math.sin(this.time * spot.speed + idx) * 0.45;
      const beamLength = 650;
      const targetX = spot.x + Math.sin(angle) * beamLength;
      const targetY = 100 + Math.cos(angle) * beamLength;

      ctx.save();
      const grad = ctx.createLinearGradient(spot.x, 90, targetX, targetY);
      grad.addColorStop(0, spot.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(spot.x - 15, 85);
      ctx.lineTo(targetX - 140, targetY);
      ctx.lineTo(targetX + 140, targetY);
      ctx.lineTo(spot.x + 15, 85);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  private drawCrowd(ctx: CanvasRenderingContext2D) {
    // Back crowd tier (darker, smaller heads)
    ctx.fillStyle = '#111322';
    for (let x = 0; x < this.width; x += 22) {
      const bob = Math.sin(this.time * 0.06 + x * 0.1) * 3;
      ctx.beginPath();
      ctx.arc(x + 10, 360 + bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x, 368 + bob, 20, 50);
    }

    // Mid crowd tier (more animated, raising arms)
    ctx.fillStyle = '#171a2e';
    for (let x = 5; x < this.width; x += 32) {
      const bob = Math.sin(this.time * 0.09 + x * 0.2) * 5;
      ctx.beginPath();
      ctx.arc(x + 14, 410 + bob, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 2, 422 + bob, 26, 60);

      // Random raised cheer hands
      if ((x % 64) === 5) {
        ctx.fillRect(x - 4, 385 + bob, 6, 25);
        ctx.fillRect(x + 26, 385 + bob, 6, 25);
      }
    }

    // Front barrier row
    ctx.fillStyle = '#1f233d';
    ctx.fillRect(0, 475, this.width, 24);
    ctx.fillStyle = '#292e4e';
    ctx.fillRect(0, 480, this.width, 4);
  }

  private drawBillboard(ctx: CanvasRenderingContext2D) {
    const bannerX = this.width / 2 - 200;
    const bannerY = 160;

    ctx.save();
    // Metal frame
    ctx.fillStyle = '#1a1c2e';
    ctx.strokeStyle = '#323654';
    ctx.lineWidth = 3;
    ctx.roundRect(bannerX, bannerY, 400, 54, 6);
    ctx.fill();
    ctx.stroke();

    // Glowing Neon Text
    const glow = Math.sin(this.time * 0.08) * 0.3 + 0.7;
    ctx.font = 'bold 22px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 45, 85, ${glow})`;
    ctx.shadowColor = '#ff2d55';
    ctx.shadowBlur = 15;
    ctx.fillText('ARENA CLASH', this.width / 2, bannerY + 27);
    ctx.restore();
  }

  private drawRingRopes(ctx: CanvasRenderingContext2D) {
    // 3 Tension Ropes spanning the arena behind fighters
    const ropeY1 = 490;
    const ropeY2 = 525;
    const ropeY3 = 560;

    [ropeY1, ropeY2, ropeY3].forEach((ry, idx) => {
      ctx.save();
      ctx.strokeStyle = idx === 0 ? '#e11d48' : idx === 1 ? '#ffffff' : '#2563eb';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      // Slight sag in middle
      ctx.moveTo(0, ry);
      ctx.quadraticCurveTo(this.width / 2, ry + 12, this.width, ry);
      ctx.stroke();
      ctx.restore();
    });

    // Arena Corner Turnbuckle Pads
    [30, this.width - 30].forEach((postX) => {
      ctx.fillStyle = '#e11d48';
      ctx.roundRect(postX - 12, 470, 24, 110, 4);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  private drawConcreteFloor(ctx: CanvasRenderingContext2D) {
    // Stage base
    const floorGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    floorGrad.addColorStop(0, '#2d313d');
    floorGrad.addColorStop(0.3, '#21242d');
    floorGrad.addColorStop(1, '#15171e');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

    // Hazard warning stripe border along the apron top
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, this.groundY, this.width, 10);
    ctx.clip();
    for (let x = -20; x < this.width + 40; x += 28) {
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x, this.groundY, 14, 10);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x + 14, this.groundY, 14, 10);
    }
    ctx.restore();

    // Floor highlight edge
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY + 11);
    ctx.lineTo(this.width, this.groundY + 11);
    ctx.stroke();

    // Concrete slabs & cracks
    ctx.strokeStyle = '#181a20';
    ctx.lineWidth = 2;
    // Tile seams
    for (let x = 160; x < this.width; x += 240) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY + 12);
      ctx.lineTo(x - 40, this.height);
      ctx.stroke();
    }

    // Impact crack decals in center
    ctx.beginPath();
    ctx.moveTo(600, this.groundY + 25);
    ctx.lineTo(625, this.groundY + 45);
    ctx.lineTo(660, this.groundY + 40);
    ctx.lineTo(685, this.groundY + 70);
    ctx.moveTo(625, this.groundY + 45);
    ctx.lineTo(620, this.groundY + 68);
    ctx.stroke();

    // Arena center logo / ring emblem
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.groundY + 55, 180, 45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  public renderForegroundAndParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();

    // Render Projectiles
    this.projectiles.forEach((proj) => {
      ctx.save();
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 20;

      // Outer fireball / energy orb
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner intense core
      ctx.fillStyle = proj.coreColor;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Trailing flare spikes
      const dir = proj.vx > 0 ? -1 : 1;
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y - proj.radius);
      ctx.lineTo(proj.x + dir * proj.radius * 2.2, proj.y);
      ctx.lineTo(proj.x, proj.y + proj.radius);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // Render Particles
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'fire' || p.type === 'ice') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    ctx.restore();
  }
}
