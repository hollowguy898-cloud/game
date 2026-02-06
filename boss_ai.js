// boss_ai.js - Boss update logic separated from world.js

function updateBoss(e, room) {
    // extracted from world.js; maintains same behavior as before
    e.timer = e.timer || 0; e.timer++;
    if (e.invuln > 0) e.invuln--;

    // if player enters room start fight
    const playerRX = Math.floor((player.x + player.w/2) / WORLD_W);
    const playerRY = Math.floor((player.y + player.h/2) / WORLD_H);
    if (!room.bossActive && room.gx === playerRX && room.gy === playerRY) {
        room.bossActive = true;
        room.locked = true; // keep player in arena
        e.state = 'active';
        e.timer = 0;
    }

    // phase transitions
    e.phase = e.phase || 1;
    const hpPct = e.hp / e.maxHp;
    if (hpPct < 0.3 && e.phase < 3) { e.phase = 3; e.timer = 0; e.charge = 0; e.spawnCooldown = 0; }
    else if (hpPct < 0.65 && e.phase < 2) { e.phase = 2; e.timer = 0; e.spawnCooldown = 0; }

    // rage increases with time and when hit
    e.rage = Math.min(100, (e.rage || 0) + 0.01 + (e.maxHp - e.hp) * 0.0008);

    // AI think rhythm
    if (!e._think || e._think <= 0) {
        e._think = 60;
        const px = player.x - (room.gx * WORLD_W);
        const dist = Math.abs(px - e.x);
        if (dist < 180 && Math.random() < 0.6) e.nextAction = 'root_slam';
        else if (dist < 350 && Math.random() < 0.5) e.nextAction = 'lunge';
        else e.nextAction = 'seed_barrage';

        if (e.phase === 2 && Math.random() < 0.25) e.nextAction = 'altar_pulse';
        if (e.phase === 3 && Math.random() < 0.35) e.nextAction = 'lunge';
    }
    e._think--;

    // Execute actions
    switch (e.nextAction) {
        case 'root_slam':
            if (!e._attackTimer) { e._attackTimer = 40; e.state = 'windup'; e._anim = 'slam'; room.particles.push({ x: e.x, y: e.y, life: 30, color: 'rgba(200,120,80,0.8)' }); }
            e._attackTimer--;
            if (e._attackTimer === 18) {
                const hitX = room.gx * WORLD_W + e.x + (e.facing === 1 ? 40 : -80);
                const hitY = room.gy * WORLD_H + e.y + e.h;
                if (player.x + player.w/2 > hitX - 40 && player.x < hitX + 40 && Math.abs(player.y - hitY) < 40) {
                    takeDamage();
                    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
                }
                for (let i = 0; i < 4; i++) {
                    room.props.push({ x: e.x + (i*24 - 36) + (e.facing===1?40:-80), y: e.y + e.h, w: 8, h: 12, color: '#550000', type: 'spike' });
                }
            }
            if (e._attackTimer <= 0) { e._attackTimer = 0; e.nextAction = null; }
            break;

        case 'lunge':
            if (!e._lungeTimer) { e._lungeTimer = 36; e.state = 'lungeWind'; e.vx = (player.x - (room.gx * WORLD_W) - e.x) > 0 ? 6 : -6; }
            e._lungeTimer--;
            e.x += e.vx;
            if (e._lungeTimer === 0) {
                if (Math.abs(player.x - (room.gx * WORLD_W + e.x)) < 120) { takeDamage(); if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit'); }
                for (let i=0;i<6;i++) spawnDebris(room.gx*WORLD_W + e.x + (Math.random()-0.5)*60, room.gy*WORLD_H + e.y + e.h);
                e._lungeTimer = 0;
                e.nextAction = null;
            }
            break;

        case 'seed_barrage':
            if (!e._barrageTimer) { e._barrageTimer = 80; e.state = 'barrageWind'; }
            e._barrageTimer--;
            if (e._barrageTimer % 12 === 0) {
                const seed = {
                    x: e.x + (Math.random()-0.5)*40,
                    y: e.y + 20 + (Math.random()*20),
                    vx: (Math.random()-0.5)*2 + (player.x - (room.gx*WORLD_W) - e.x) * 0.002,
                    vy: -2 + Math.random()*0.4,
                    life: 120,
                    type: 'seed'
                };
                room.particles.push(seed);
            }
            if (e._barrageTimer <= 0) { e._barrageTimer = 0; e.nextAction = null; }
            break;

        case 'altar_pulse':
            if (!e._pulseTimer) { e._pulseTimer = 100; e.state = 'charging'; e.charge = 100; }
            e._pulseTimer--;
            if (e._pulseTimer === 20) {
                if (Math.abs(player.x - (room.gx*WORLD_W + 30*TILE_SIZE)) < 220) { takeDamage(); if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit'); }
                for (let i=0;i<6;i++) {
                    const px = 20*TILE_SIZE + i*16 + Math.random()*8;
                    room.props.push({ x: px, y: 36*TILE_SIZE + 8, w: 12, h: 8, color: '#2a1f0f', type: 'crack' });
                }
            }
            if (e._pulseTimer <= 0) { e._pulseTimer = 0; e.nextAction = null; e.charge = 0; }
            break;

        default:
            if (Math.random() < 0.01) e.facing *= -1;
            if (e.spawnCooldown <= 0 && Math.random() < 0.02) {
                e.spawnCooldown = 180;
                room.enemies.push(spawnSwarm(40, 30*TILE_SIZE, 'fast_swarm'));
                room.enemies.push(spawnSwarm(560, 30*TILE_SIZE, 'mini_swarm'));
            }
            e.spawnCooldown--;
            break;
    }

    // seed projectile handling (same as original)
    for (let si = room.particles.length - 1; si >= 0; si--) {
        const pr = room.particles[si];
        if (pr.type === 'seed') {
            pr.x += pr.vx;
            pr.y += pr.vy;
            pr.vy += 0.08;
            pr.life--;
            const wx = room.gx*WORLD_W + pr.x;
            const wy = room.gy*WORLD_H + pr.y;
            if (Math.abs(player.x + player.w/2 - wx) < 12 && Math.abs(player.y + player.h/2 - wy) < 12) { takeDamage(); room.particles.splice(si,1); continue; }
            if (pr.life <= 0) {
                for (let k=0;k<2;k++) room.enemies.push(spawnSwarm(pr.x + (Math.random()-0.5)*24, pr.y + (Math.random()-0.5)*24, 'mini_swarm'));
                room.particles.splice(si, 1);
            }
        }
    }

    // clamp boss position to arena bounds
    e.x = Math.max(30, Math.min(e.x, ROOM_WIDTH_TILES * TILE_SIZE - 80));

    // Unlock room if boss died
    if (e.hp <= 0) {
        room.locked = false;
        room.bossActive = false;
        if (typeof AudioManager !== 'undefined') AudioManager.playSFX('boss_die');
    }
}
