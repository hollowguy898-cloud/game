// ult.js - Constants, helpers, spawn functions with enhanced graphics

const TILE_SIZE = 20;  // Increased from 16 for more detail
const ROOM_WIDTH_TILES = 50;  // Adjusted to maintain world size
const ROOM_HEIGHT_TILES = 40; 
const WORLD_W = ROOM_WIDTH_TILES * TILE_SIZE;
const WORLD_H = ROOM_HEIGHT_TILES * TILE_SIZE;

const GRAVITY = 0.42;
const FRICTION = 0.85;
const JUMP_POWER = -9.8; 
const ACCEL = 0.65;
const DASH_POWER = 12;
const DASH_COOLDOWN = 30;
const JUMP_BUFFER_FRAMES = 4;
const DOWN_SHOT_SPEED = 10;
const DOWN_SHOT_BOOST = -4.5;
const DOWN_SHOT_COOLDOWN = 24;

// Pistol weapon constants
const PISTOL_DAMAGE = 1;
const PISTOL_FIRE_RATE = 12; // frames between shots (~0.2s)
const PISTOL_MAX_AMMO = 12;
const PISTOL_RELOAD_FRAMES = 72; // ~1.2s
const PISTOL_BULLET_SPEED = 14;
const PISTOL_SPREAD = 0.08; // radians

// Toggle for higher detail vector sprites (fallback to existing drawings when false)
const HIGH_DETAIL_SPRITES = true;

// Global bullets list
const bullets = [];

function spawnBullet(x, y, vx, vy, damage = 1, owner = 'player') {
    bullets.push({ x, y, vx, vy, damage, owner, life: 120 });
}

function spawnWatcher(x, y) {
    return { x, y, w: 24, h: 28, vx: 0, vy: 0, type: 'watcher', hp: 3, cooldown: 0, animTimer: Math.random() * 100 };
}

// Enhanced tile colors and patterns
const TILE_COLORS = {
    ground: { main: '#3d5a3d', dark: '#2d3a2d', light: '#5d7a5d' },
    stone: { main: '#6b6b6b', dark: '#4b4b4b', light: '#8b8b8b' },
    wood: { main: '#8b6f47', dark: '#6b4f27', light: '#ab8f67' },
    dirt: { main: '#8b7355', dark: '#6b5335', light: '#ab9375' }
};

function spawnSwarm(x, y, variant = 'swarm') {
    let w = 24, h = 24, speedMult = 1;
    if (variant === 'mini_swarm') { w = 16, h = 16; speedMult = 1.5; }
    if (variant === 'fast_swarm') { w = 14, h = 14; speedMult = 2; }
    return { 
        x, y, w, h, vx: 0, vy: 0, 
        type: variant, state: 'patrol', timer: 0, juiceTimer: 0, facing: 1, hp: 1, 
        dashCooldown: 0, animTimer: Math.random() * 100, wingFlap: 0 
    };
}

function spawnDebris(x, y) {
    return {
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: -1 - Math.random() * 2,
        w: 12 + Math.random() * 12,
        h: 12 + Math.random() * 12,
        type: 'debris',
        hp: 1,
        rotation: Math.random() * Math.PI * 2,
        rotVel: (Math.random() - 0.5) * 0.2
    };
}

function spawnParticle(room, x, y, type = 'dust') {
    if (!room) return;
    const baseLife = { dust: 25, dash: 50, debris_hint: 120, fog: 250 };
    room.particles.push({
        x, y,
        vx: (Math.random()-0.5)*3,
        vy: (Math.random()-0.5)*2,
        life: baseLife[type] || 40,
        maxLife: baseLife[type] || 40,
        type,
        scale: 1 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2
    });
}

// Enhanced particle drawing
function drawParticle(ctx, particle) {
    const alpha = particle.life / particle.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    
    switch(particle.type) {
        case 'dust':
            ctx.fillStyle = '#d4c5b9';
            ctx.fillRect(-particle.scale, -particle.scale, particle.scale * 2, particle.scale * 2);
            break;
        case 'dash':
            ctx.fillStyle = '#64c8ff';
            ctx.beginPath();
            ctx.arc(0, 0, particle.scale * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#32a0d0';
            ctx.lineWidth = 1;
            ctx.stroke();
            break;
        case 'debris_hint':
            ctx.fillStyle = '#a89968';
            ctx.fillRect(-particle.scale, -particle.scale * 1.5, particle.scale * 2, particle.scale * 3);
            break;
        case 'fog':
            ctx.fillStyle = `rgba(120, 140, 150, ${0.3 * alpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, particle.scale * 3, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
    ctx.restore();
}

// Enhanced tile drawing with patterns and details
function drawTile(ctx, x, y, tileId) {
    const baseX = x * TILE_SIZE;
    const baseY = y * TILE_SIZE;
    
    if (tileId === 0) return; // Air
    
    // Determine tile type from ID
    let color = TILE_COLORS.stone;
    let pattern = 'stone';
    
    if (tileId === 1) {
        color = TILE_COLORS.ground;
        pattern = 'grass';
    } else if (tileId === 2) {
        color = TILE_COLORS.stone;
        pattern = 'stone';
    } else if (tileId === 3) {
        color = TILE_COLORS.wood;
        pattern = 'wood';
    } else if (tileId === 4) {
        color = TILE_COLORS.dirt;
        pattern = 'dirt';
    }
    
    // Base tile
    ctx.fillStyle = color.main;
    ctx.fillRect(baseX, baseY, TILE_SIZE, TILE_SIZE);
    
    // Add shading and pattern details
    ctx.fillStyle = color.dark;
    ctx.fillRect(baseX, baseY, TILE_SIZE, 2);
    ctx.fillRect(baseX, baseY, 2, TILE_SIZE);
    
    ctx.fillStyle = color.light;
    ctx.fillRect(baseX, baseY + TILE_SIZE - 2, TILE_SIZE, 2);
    ctx.fillRect(baseX + TILE_SIZE - 2, baseY, 2, TILE_SIZE);
    
    // Pattern overlay
    if (pattern === 'grass') {
        ctx.strokeStyle = color.light;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const px = baseX + Math.random() * TILE_SIZE;
            const py = baseY + Math.random() * TILE_SIZE;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + 2, py - 3);
            ctx.stroke();
        }
    } else if (pattern === 'stone') {
        ctx.fillStyle = `rgba(0, 0, 0, 0.1)`;
        for (let i = 0; i < 2; i++) {
            const rx = baseX + Math.random() * TILE_SIZE;
            const ry = baseY + Math.random() * TILE_SIZE;
            ctx.fillRect(rx, ry, 2, 2);
        }
    }
}

// Enhanced enemy drawing with animation
function drawEnemy(ctx, enemy, animTimer) {
    ctx.save();
    ctx.translate(enemy.x + enemy.w/2, enemy.y + enemy.h/2);
    ctx.scale(enemy.facing, 1);
    
    switch(enemy.type) {
        case 'swarm':
            drawSwarmEnemy(ctx, enemy, animTimer);
            break;
        case 'mini_swarm':
            drawMiniSwarmEnemy(ctx, enemy, animTimer);
            break;
        case 'fast_swarm':
            drawFastSwarmEnemy(ctx, enemy, animTimer);
            break;
        case 'mini_boss':
            drawMiniBossEnemy(ctx, enemy, animTimer);
            break;
        case 'debris':
            drawDebrisEnemy(ctx, enemy, animTimer);
            break;
    }
    
    ctx.restore();
}

function drawSwarmEnemy(ctx, enemy, animTimer) {
    const wingBeat = Math.sin((animTimer + enemy.animTimer) * 0.3) * 0.5;
    
    // Body
    ctx.fillStyle = '#2d1f2d';
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.w * 0.35, enemy.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing shadows
    ctx.fillStyle = 'rgba(45, 31, 45, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-enemy.w * 0.2, wingBeat * 3, enemy.w * 0.15, enemy.h * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(enemy.w * 0.2, wingBeat * 3, enemy.w * 0.15, enemy.h * 0.25, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(-3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Glow when attacking
    if (enemy.state === 'attack') {
        ctx.strokeStyle = `rgba(255, 100, 100, ${0.5 * (1 - enemy.timer / 30)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.w * 0.5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Health indicator
    if (enemy.hp < 1) {
        ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.fillRect(-enemy.w/2, -enemy.h/2 - 5, enemy.w, 2);
    }
}

function drawMiniSwarmEnemy(ctx, enemy, animTimer) {
    const wingBeat = Math.sin((animTimer + enemy.animTimer) * 0.35) * 0.4;
    
    ctx.fillStyle = '#1a0f1a';
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.w * 0.3, enemy.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Smaller wings
    ctx.fillStyle = 'rgba(26, 15, 26, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-enemy.w * 0.15, wingBeat * 2, enemy.w * 0.1, enemy.h * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(enemy.w * 0.15, wingBeat * 2, enemy.w * 0.1, enemy.h * 0.2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(-2, -1, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -1, 1, 0, Math.PI * 2);
    ctx.fill();
}

function drawFastSwarmEnemy(ctx, enemy, animTimer) {
    const wingBeat = Math.sin((animTimer + enemy.animTimer) * 0.4) * 0.3;
    
    ctx.fillStyle = '#3d2d3d';
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.w * 0.4, enemy.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(61, 45, 61, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-enemy.w * 0.15, wingBeat * 2, enemy.w * 0.12, enemy.h * 0.18, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(enemy.w * 0.15, wingBeat * 2, enemy.w * 0.12, enemy.h * 0.18, 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Aggressive eyes
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(-2.5, -1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.5, -1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Speed aura
    ctx.strokeStyle = `rgba(255, 100, 100, ${0.3 + Math.sin(animTimer * 0.1) * 0.2})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.w * 0.55, 0, Math.PI * 2);
    ctx.stroke();
}

function drawMiniBossEnemy(ctx, enemy, animTimer) {
    // Large threatening form
    ctx.fillStyle = '#4d2d4d';
    ctx.beginPath();
    ctx.ellipse(0, 0, enemy.w * 0.4, enemy.h * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Multiple eye-like features
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(-6, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Menacing aura
    const auraIntensity = 0.4 + Math.sin(animTimer * 0.08) * 0.3;
    ctx.strokeStyle = `rgba(255, 50, 50, ${auraIntensity})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.w * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    
    // Corrupted tendrils
    ctx.strokeStyle = `rgba(200, 100, 200, ${0.6 * auraIntensity})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        const angle = (animTimer * 0.05 + i * Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
            Math.cos(angle) * 15,
            Math.sin(angle) * 15,
            Math.cos(angle) * 20,
            Math.sin(angle) * 20
        );
        ctx.stroke();
    }
    
    // Health bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-enemy.w/2 - 2, -enemy.h/2 - 8, enemy.w + 4, 4);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(-enemy.w/2, -enemy.h/2 - 6, (enemy.w) * (enemy.hp / enemy.maxHp), 2);
}

function drawDebrisEnemy(ctx, enemy, animTimer) {
    ctx.save();
    ctx.rotate(enemy.rotation || 0);
    
    ctx.fillStyle = '#a89968';
    ctx.fillRect(-enemy.w/2, -enemy.h/2, enemy.w, enemy.h);
    
    // Damage marks
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-enemy.w/2 + 2, -enemy.h/2 + 2, enemy.w/3, enemy.h/3);
    
    ctx.restore();
}

function getTileAt(gx, gy) {
    const rx = Math.floor(gx / WORLD_W);
    const ry = Math.floor(gy / WORLD_H);
    const room = world.getRoom(rx, ry);
    if (!room) return 0;
    let lx = Math.floor((gx % WORLD_W) / TILE_SIZE);
    let ly = Math.floor((gy % WORLD_H) / TILE_SIZE);
    if (lx < 0) lx += ROOM_WIDTH_TILES;
    if (ly < 0) ly += ROOM_HEIGHT_TILES;
    return room.tiles[ly]?.[lx] || 0;
}
