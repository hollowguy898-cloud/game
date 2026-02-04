// game.js - Core loop, update, draw, input with enhanced rendering

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    // Use larger scaling factor for better visibility of detailed graphics
    const baseScale = Math.floor(Math.min(window.innerWidth / WORLD_W, (window.innerHeight - 100) / WORLD_H));
    const finalScale = Math.max(2, baseScale);  // Minimum scale of 2 for crisp rendering
    canvas.width = WORLD_W;
    canvas.height = WORLD_H;
    canvas.style.width = (WORLD_W * finalScale) + "px";
    canvas.style.height = (WORLD_H * finalScale) + "px";
    ctx.imageSmoothingEnabled = false;  // Pixelated rendering
}
window.addEventListener('resize', resize);
resize();

const keys = {};
let jumpBuffer = 0;
let jumpHeld = false;
// basic key state
window.onkeydown = (e) => {
    keys[e.code] = true;
    // allow skipping cutscene with any key
    if (cutscene && cutscene.active && cutscene.skippable) {
        cutscene.skipRequested = true;
    }
};
window.onkeyup = (e) => keys[e.code] = false;

function update() {
    // Cutscene handling (if active, runs timeline and blocks player control until end)
    if (cutscene && cutscene.active) {
        cutscene.timer++;
        // skip requested -> fast-forward to end
        if (cutscene.skipRequested) cutscene.timer = cutscene.duration - 1;

        const t = cutscene.timer;
        const r0 = world.getRoom(0,0); // starting forest room

        // timeline segments (frames at ~60fps)
        // fade control for thin green wash
        if (t < 30) cutscene.fade = Math.min(1, t / 30);
        else if (t < 660) cutscene.fade = 1;
        else cutscene.fade = Math.max(0, 1 - (t - 660) / 60);

        // gentle ambient hints during initial fade
        if (t < 30 && t % 6 === 0) {
            r0.particles.push({ x: Math.random() * WORLD_W, y: Math.random()*40, vx: (Math.random()-0.5)*0.2, vy: 0.2 + Math.random()*0.2, life: 80, color: 'rgba(100,140,110,0.06)' });
        }

        // Visual Beat 1: pan slowly right (30 - 240)
        if (t >= 30 && t < 240) {
            const p = (t - 30) / (240 - 30);
            const startX = r0.centerX - WORLD_W/2 - 120;
            const endX = r0.centerX - WORLD_W/2 + 160;
            camera.targetX = startX + (endX - startX) * easeOutCubic(p);
            camera.targetY = r0.centerY - WORLD_H/2 - 20;
        }

        // Visual Beat 2: lower camera to ground, sword twitch (240 - 420)
        if (t >= 240 && t < 420) {
            const p = (t - 240) / (420 - 240);
            camera.targetY = (r0.centerY - WORLD_H/2) + (40 * easeOutCubic(p));
            // setup intro sword prop on first frame of this segment
            if (!cutscene.swordCreated) {
                cutscene.swordCreated = true;
                r0.props.push({ type: 'intro_sword', x: 120, y: 320, w: 20, h: 6, tw: 0, _intro: true });
            }
            // small twitch near middle
            if (t === 320) {
                for (const p of r0.props) if (p.type === 'intro_sword') p.tw = 8;
            }
        }

        // Visual Beat 3: shadow passes & leaves fall (420 - 540)
        if (t >= 420 && t < 540) {
            // spawn subtle falling leaves
            if (t % 8 === 0) r0.particles.push({ x: Math.random() * WORLD_W, y: -10, vx: (Math.random() - 0.5) * 0.3, vy: 1 + Math.random()*0.5, life: 120, color: 'rgba(200,230,200,0.6)' });
        }

        // Player entry (540 - 660): step in from left
        if (t >= 540 && t < 660) {
            if (!cutscene.playerPlaced) {
                cutscene.playerPlaced = true;
                // place player offscreen left for entrance
                player.x = r0.centerX - WORLD_W/2 - 40; 
                player.y = 300; player.vx = 0; player.vy = 0;
            }
            const p = (t - 540) / (660 - 540);
            const targetX = r0.centerX - WORLD_W/2 + 80;
            player.x = lerp(r0.centerX - WORLD_W/2 - 40, targetX, easeOutCubic(p));
            // player idle only
            player.isAttacking = false; player.isDashing = false;

            // show text briefly (580-620)
            if (t >= 580 && t < 620) {
                cutscene.textAlpha = Math.min(1, (t - 580) / 10);
            } else if (t >= 620 && t < 650) {
                cutscene.textAlpha = Math.max(0, 1 - (t - 620) / 30);
            }
        }

        // Control given (660+)
        if (t >= 660) {
            // remove intro-only props
            for (let i = r0.props.length - 1; i >= 0; i--) if (r0.props[i]._intro) r0.props.splice(i,1);
            cutscene.finishTime = t;
            finishIntroCutscene();
        }

        // animate intro sword twitch decay
        for (const p of r0.props) if (p.type === 'intro_sword') {
            p.tw = Math.max(0, (p.tw || 0) - 0.5);
            p.y -= p.tw * 0.01; // subtle upward twitch motion
        }

        // keep camera smoothing faster in cutscene
        camera.lerp = 0.12;

        // block rest of update while cutscene active
        return;
    }

    const curRX = Math.floor((player.x + player.w/2) / WORLD_W);
    const curRY = Math.floor((player.y + player.h/2) / WORLD_H);
    const room = world.getRoom(curRX, curRY);

    // Room-specific effects with enhanced particles
    if (room) {
        if (room.type === 'ruined_outskirts' && Math.random() < 0.1) {
            room.particles.push({ 
                x: Math.random() * WORLD_W, 
                y: (35 + Math.random() * 10) * TILE_SIZE, 
                vx: -0.5 - Math.random(), 
                vy: (Math.random()-0.5)*0.2, 
                life: 200,
                maxLife: 200,
                type: 'fog',
                scale: 1 + Math.random() * 0.5
            });
        }

        if (room.type === 'forest_trap') {
            if (Math.random() < 0.05) {
                room.particles.push({ 
                    x: Math.random() * WORLD_W, 
                    y: 0, 
                    vx: (Math.random() - 0.5) * 0.5, 
                    vy: 0.5 + Math.random() * 0.5, 
                    life: 100,
                    maxLife: 100,
                    type: 'debris_hint',
                    scale: 1 + Math.random() * 0.5
                });
            }
            if (Math.random() < 0.01) {
                room.enemies.push(spawnDebris(Math.random() * WORLD_W, 0));
            }
        }
    }

    // Player input & combat
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (keys['KeyJ'] && player.hasSword && !player.isAttacking && player.attackCooldown <= 0) {
        player.isAttacking = true;
        player.attackTimer = 18;
        player.attackCooldown = 15;
    }
    if (player.attackTimer > 0) player.attackTimer--;
    else player.isAttacking = false;

    // Dash with enhanced effects
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (keys['ShiftLeft'] && player.dashCooldown <= 0 && !player.isDashing) {
        player.isDashing = true;
        player.dashTimer = 10;
        player.vx = player.facing * DASH_POWER;
        player.dashCooldown = DASH_COOLDOWN;
        player.stretch = 1.6; player.squash = 0.6;
        for(let i=0; i<15; i++) spawnParticle(room, player.x + player.w/2, player.y + player.h / 2, 'dash');
    }
    if (player.isDashing) {
        player.dashTimer--;
        if (player.dashTimer <= 0) player.isDashing = false;
        player.vx *= 0.98;
    } else {
        player.vx *= FRICTION;
    }

    // Pistol handling
    if (player.pistolCooldown > 0) player.pistolCooldown--;
    if (player.pistolReload > 0) {
        player.pistolReload--;
        if (player.pistolReload <= 0) {
            player.pistolAmmo = player.pistolMaxAmmo;
        }
    }

    if (keys['KeyK'] && player.hasPistol && player.pistolAmmo > 0 && player.pistolCooldown <= 0 && player.pistolReload <= 0) {
        const dir = player.facing;
        const bx = player.x + player.w/2 + dir * 8;
        const by = player.y + player.h/2 - 4;
        const spread = (Math.random() - 0.5) * PISTOL_SPREAD;
        const angle = Math.atan2(0, dir) + spread;
        const vx = Math.cos(angle) * dir * PISTOL_BULLET_SPEED;
        const vy = Math.sin(angle) * PISTOL_BULLET_SPEED;
        spawnBullet(bx + room.gx * WORLD_W, by + room.gy * WORLD_H, vx, vy, PISTOL_DAMAGE, 'player');
        player.pistolAmmo--;
        player.pistolCooldown = PISTOL_FIRE_RATE;
        player.vx -= dir * 0.6; // recoil
        spawnParticle(room, bx, by, 'dash'); // muzzle flash
        if (player.pistolAmmo <= 0) player.pistolReload = PISTOL_RELOAD_FRAMES;
    }

    // Downward shot ability
    if (player.downShotCooldown > 0) player.downShotCooldown--;
    const downShotInput = keys['KeyS'] || keys['ArrowDown'];
    if (player.hasDownShot && downShotInput && player.downShotCooldown <= 0 && !player.grounded) {
        const bx = player.x + player.w / 2;
        const by = player.y + player.h;
        spawnBullet(bx + room.gx * WORLD_W, by + room.gy * WORLD_H, 0, DOWN_SHOT_SPEED, 1, 'player');
        player.vy = Math.min(player.vy, DOWN_SHOT_BOOST);
        player.downShotCooldown = DOWN_SHOT_COOLDOWN;
        spawnParticle(room, bx, by, 'dash');
    }

    // Bullets update (global bullets array)
    for (let bI = bullets.length - 1; bI >= 0; bI--) {
        const b = bullets[bI];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        // Enemy bullets can hit player
        if (b.owner === 'enemy') {
            const px = player.x + player.w/2;
            const py = player.y + player.h/2;
            const distToPlayer = Math.hypot(px - b.x, py - b.y);
            if (distToPlayer < 12) {
                takeDamage();
                bullets.splice(bI, 1);
                continue;
            }
        }

        // Tile collision
        if (getTileAt(b.x, b.y) !== 0) {
            const brx = Math.floor(b.x / WORLD_W);
            const bry = Math.floor(b.y / WORLD_H);
            const roomHit = world.getRoom(brx, bry);
            if (roomHit) roomHit.particles.push({ x: b.x - brx * WORLD_W, y: b.y - bry * WORLD_H, vx: 0, vy: 0, life: 20, color: 'rgba(255,200,120,0.6)', size: 3 });
            bullets.splice(bI, 1);
            continue;
        }

        // Enemy collision (check enemies in same room as bullet)
        const rx = Math.floor(b.x / WORLD_W);
        const ry = Math.floor(b.y / WORLD_H);
        const checkRoom = world.getRoom(rx, ry);
        if (checkRoom) {
            for (let ei = checkRoom.enemies.length - 1; ei >= 0; ei--) {
                const en = checkRoom.enemies[ei];
                const ex = rx * WORLD_W + en.x;
                const ey = ry * WORLD_H + en.y;
                const dist = Math.hypot(ex - b.x, ey - b.y);
                if (dist < 18 && b.owner === 'player') {
                    en.hp = (en.hp || 1) - b.damage;
                    checkRoom.particles.push({ x: en.x, y: en.y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 30, color: 'rgba(255,200,150,0.8)', size: 3 });
                    bullets.splice(bI, 1);
                    break;
                }
            }
        }

    if (b.life <= 0) bullets.splice(bI, 1);
    }

    const jumpInput = keys['Space'] || keys['KeyW'] || keys['ArrowUp'];
    if (jumpInput && !jumpHeld) {
        jumpBuffer = JUMP_BUFFER_FRAMES;
    }
    jumpHeld = jumpInput;

    const tryBufferedJump = () => {
        if (jumpBuffer > 0 && player.grounded) {
            player.vy = JUMP_POWER;
            player.grounded = false;
            jumpBuffer = 0;
            player.stretch = 1.4; player.squash = 0.7;
            for(let i=0; i<8; i++) spawnParticle(room, player.x + player.w/2, player.y + player.h);
        }
    };

    if (keys['ArrowRight'] || keys['KeyD']) { player.vx += ACCEL; player.facing = 1; }
    if (keys['ArrowLeft'] || keys['KeyA']) { player.vx -= ACCEL; player.facing = -1; }
    
    tryBufferedJump();

    player.vy += GRAVITY;

    // Horizontal collision
    player.x += player.vx;
    if (getTileAt(player.x, player.y + 4) || getTileAt(player.x, player.y + player.h - 4)) {
        player.x = Math.ceil(player.x / TILE_SIZE) * TILE_SIZE; player.vx = 0;
    }
    if (getTileAt(player.x + player.w, player.y + 4) || getTileAt(player.x + player.w, player.y + player.h - 4)) {
        player.x = Math.floor((player.x + player.w) / TILE_SIZE) * TILE_SIZE - player.w; player.vx = 0;
    }

    // Vertical collision
    player.y += player.vy;
    let wasGrounded = player.grounded;
    player.grounded = false;
    if (player.vy > 0) { 
        if (getTileAt(player.x + 2, player.y + player.h) || getTileAt(player.x + player.w - 2, player.y + player.h)) {
            player.y = Math.floor((player.y + player.h) / TILE_SIZE) * TILE_SIZE - player.h;
            player.vy = 0; player.grounded = true;
            if (!wasGrounded) {
                player.squash = 1.3; player.stretch = 0.8;
                for(let i=0; i<5; i++) spawnParticle(room, player.x + player.w/2, player.y + player.h);
            }
        }
    } else { 
        if (getTileAt(player.x + 2, player.y) || getTileAt(player.x + player.w - 2, player.y)) {
            player.y = Math.ceil(player.y / TILE_SIZE) * TILE_SIZE; player.vy = 0;
        }
    }

    tryBufferedJump();
    if (jumpBuffer > 0) jumpBuffer--;

    player.squash += (1 - player.squash) * 0.25;
    player.stretch += (1 - player.stretch) * 0.25;

    // Enhanced cape physics with more nodes
    let anchorX = player.x + (player.facing === 1 ? player.w : 0);
    let anchorY = player.y + 15;
    player.capeNodes[0] = {x: anchorX, y: anchorY};
    for(let i=1; i<player.capeNodes.length; i++) {
        let node = player.capeNodes[i];
        let prev = player.capeNodes[i-1];
        node.y += 0.4;
        node.x -= player.vx * 0.3 + player.facing * 0.5;
        let dx = node.x - prev.x;
        let dy = node.y - prev.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            let angle = Math.atan2(dy, dx);
            node.x = prev.x + Math.cos(angle) * 5;
            node.y = prev.y + Math.sin(angle) * 5;
        }
    }

    if (room) {
        // Camera
        camera.targetX = room.centerX - WORLD_W / 2 + (Math.abs(player.vx) > 2 ? player.vx * 15 : 0);
        camera.targetY = room.centerY - WORLD_H / 2;
        document.getElementById('roomLabel').innerText = `ZONE: ${room.type.toUpperCase()} [${curRX}, ${curRY}]`;

        // Items
        room.items.forEach(it => {
            if (!it.picked && Math.abs((player.x + player.w/2) - (room.gx * WORLD_W + it.x)) < 24 && Math.abs(player.y - (room.gy * WORLD_H + it.y)) < 40) {
                it.picked = true;
                if (it.type === 'sword') player.hasSword = true;
                else if (it.type === 'potion') player.hp = Math.min(player.hp + 1, 3);
                else if (it.type === 'pistol') {
                    player.hasPistol = true;
                    player.pistolAmmo = player.pistolMaxAmmo;

                    // start pistol tutorial waves in this room
                    room.pistolEvent = {
                        waveIndex: 0,
                        waveTimer: 0,
                        waves: [
                            [ { type: 'crawler', x: 200, y: 500, hp: 1 }, { type: 'crawler', x: 350, y: 520, hp: 1 } ],
                            [ { type: 'crawler', x: 450, y: 500, hp: 1 }, { type: 'crawler', x: 600, y: 520, hp: 1 } ],
                            [ { type: 'crawler', x: 700, y: 500, hp: 1 }, { type: 'crawler', x: 820, y: 520, hp: 1 } ]
                        ]
                    };
                } else if (it.type === 'pistol_upgrade') {
                    player.pistolMaxAmmo = (player.pistolMaxAmmo || PISTOL_MAX_AMMO) + 6;
                    player.pistolAmmo = player.pistolMaxAmmo;
                }
                player.shakeTimer = 10;
            }
        });

        // Spikes
        room.props.forEach(p => {
            if (p.type === 'spike') {
                const px = room.gx * WORLD_W + p.x;
                const py = room.gy * WORLD_H + p.y;
                if (player.x + player.w > px && player.x < px + p.w &&
                    player.y + player.h > py && player.y < py + p.h) {
                    takeDamage();
                }
            }
        });

        // Enemies & particles
        updateEnemiesAndParticles(room);
    }

    if (player.hitTimer > 0) player.hitTimer--;
    if (player.shakeTimer > 0) player.shakeTimer--;
    player.animTimer += 0.12;

    // first player step twitch (subtle root) after cutscene
    if (cutscene && cutscene.completed && !cutscene.firstStepTriggered) {
        if (keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'] || Math.abs(player.vx) > 0.1) {
            cutscene.firstStepTriggered = true;
            const curRoom = world.getRoom(Math.floor((player.x + player.w/2) / WORLD_W), Math.floor((player.y + player.h/2) / WORLD_H));
            let found = null;
            if (curRoom) {
                for (const p of curRoom.props) if (p.type === 'trunk' || p.type === 'wallrun') { found = p; break; }
                if (found) found.tw = (found.tw || 0) + 8;
                else curRoom.particles.push({ x: player.x + 80, y: player.y - 40, vx: 0, vy: 0, life: 50, color: 'rgba(120,255,120,0.6)', size: 4 });
            }
        }
    }

    camera.x += (camera.targetX - camera.x) * camera.lerp;
    camera.y += (camera.targetY - camera.y) * camera.lerp;
}

function draw() {
    ctx.fillStyle = '#020403';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.save();
    if (player.shakeTimer > 0) ctx.translate((Math.random()-0.5)*player.shakeTimer/2, (Math.random()-0.5)*player.shakeTimer/2);
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

    drawWorld();  // Enhanced world rendering

    drawPlayer(ctx, Math.round(player.x + player.w/2), Math.round(player.y + player.h/2));

    ctx.restore();

    // Cutscene overlays (black -> thin green light, text)
    if (cutscene && (cutscene.active || cutscene.completed && (cutscene.finishTime && (Date.now() / 16) - cutscene.finishTime < 240))) {
        // full black early stage if small timer; otherwise thin green wash
        const t = cutscene.timer || 0;
        if (cutscene.active && t < 30) {
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fillRect(0,0,WORLD_W,WORLD_H);
        }
        // green light wash
        const ga = cutscene.fade * 0.75;
        if (ga > 0.001) {
            ctx.fillStyle = `rgba(40,90,60,${ga})`;
            ctx.fillRect(0,0,WORLD_W,WORLD_H);
        }

        // subtle vignette for tone
        ctx.fillStyle = `rgba(0,0,0,${0.2 * (1 - cutscene.fade)})`;
        ctx.fillRect(0,0,WORLD_W,WORLD_H);

        // fading title text
        if (cutscene.textAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = cutscene.textAlpha;
            ctx.fillStyle = 'rgba(220,240,220,0.95)';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('THE FOREST REMEMBERS', WORLD_W / 2, WORLD_H / 2 + 20);
            ctx.restore();
        }
    }

    // Enhanced HUD (hidden during intro cutscene)
    if (!cutscene.active) {
        drawEnhancedHUD(ctx, player, world.getRoom(
            Math.floor((player.x + player.w/2) / WORLD_W),
            Math.floor((player.y + player.h/2) / WORLD_H)
        ));
    }
}

// Utility easing
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

// Cutscene controller
const cutscene = {
    active: false,
    timer: 0,
    duration: 720, // ~12s at 60fps
    skippable: true,
    skipRequested: false,
    fade: 0,
    textAlpha: 0,
    swordCreated: false,
    playerPlaced: false
};

function startIntroCutscene() {
    cutscene.active = true; cutscene.timer = 0; cutscene.skipRequested = false; cutscene.swordCreated = false; cutscene.playerPlaced = false; cutscene.textAlpha = 0;
    // start camera slightly left of the starting room
    const r0 = world.getRoom(0,0);
    camera.x = r0.centerX - WORLD_W/2 - 120; camera.y = r0.centerY - WORLD_H/2;
    camera.targetX = camera.x; camera.targetY = camera.y;
}

function finishIntroCutscene() {
    cutscene.active = false; cutscene.completed = true; cutscene.fade = 0; cutscene.textAlpha = 0; camera.lerp = 0.15;
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

generateWorld();
// Start intro and let player take control after ~12s (skippable)
startIntroCutscene();
loop();
