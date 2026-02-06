// render.js - Enhanced drawing functions for world, enemies, items, and effects

function drawWorld() {
    const curRX = Math.floor((player.x + player.w/2) / WORLD_W);
    const curRY = Math.floor((player.y + player.h/2) / WORLD_H);
    const room = world.getRoom(curRX, curRY);
    
    if (!room) return;
    
    const gx = room.gx * WORLD_W;
    const gy = room.gy * WORLD_H;
    
    // Draw background with gradient
    drawRoomBackground(ctx, room, gx, gy);
    
    // Draw tiles
    for (let y = 0; y < ROOM_HEIGHT_TILES; y++) {
        for (let x = 0; x < ROOM_WIDTH_TILES; x++) {
            const tileId = room.tiles[y]?.[x] || 0;
            if (tileId !== 0) {
                drawTile(ctx, gx + x * TILE_SIZE, gy + y * TILE_SIZE, tileId);
            }
        }
    }
    
    // Draw props with details
    room.props.forEach(prop => {
        drawProp(ctx, prop, gx, gy);
    });
    
    // Draw items with glow
    room.items.forEach(item => {
        if (!item.picked) {
            drawItem(ctx, item, gx, gy);
        }
    });

    // Draw bullets that are inside this room
    for (let b of bullets) {
        if (b.x >= gx && b.x < gx + WORLD_W && b.y >= gy && b.y < gy + WORLD_H) {
            const bx = b.x - cameraX;
            const by = b.y - cameraY;
            ctx.fillStyle = b.owner === 'player' ? '#ffd166' : '#7ee787';
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Draw enemies
    room.enemies.forEach(enemy => {
        drawEnemy(ctx, {
            ...enemy,
            x: gx + enemy.x,
            y: gy + enemy.y
        }, player.animTimer);
    });
    
    // Draw particles
    room.particles.forEach(particle => {
        drawParticle(ctx, {
            ...particle,
            x: gx + particle.x,
            y: gy + particle.y
        });
    });
}

function drawRoomBackground(ctx, room, gx, gy) {
    // Base background color varies by room type
    let bgColor = '#1a1a1a';
    let accentColor = '#333333';
    
    if (room.type === 'ancient_forest' || room.type === 'forest_trap') {
        bgColor = '#0d3d0d';
        accentColor = '#1a5a1a';
    } else if (room.type === 'ruined_outskirts') {
        bgColor = '#2d2420';
        accentColor = '#3d3430';
    } else if (room.type === 'shrine') {
        bgColor = '#1a1a2e';
        accentColor = '#2d2550';
    }
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(gx, gy, WORLD_W, WORLD_H);
    
    // Add parallax-like background elements
    ctx.fillStyle = accentColor;
    for (let i = 0; i < 5; i++) {
        const x = gx + (i * WORLD_W / 5);
        const y = gy + WORLD_H - 40;
        ctx.fillRect(x, y, WORLD_W / 5, 2);
    }

    // Wind visual for Windpass
    if (room.type === 'windpass') {
        ctx.fillStyle = 'rgba(200,230,200,0.06)';
        for (let i = 0; i < 12; i++) {
            const wx = gx + (Date.now()/200 + i*60) % WORLD_W;
            const wy = gy + 40 + (i % 3) * 20 + Math.sin(Date.now()/300 + i) * 6;
            ctx.beginPath(); ctx.ellipse(wx, wy, 60, 6, 0, 0, Math.PI*2); ctx.fill();
        }
    }

    // Vines / hanging canopy hints
    if (room.type === 'hanging_canopy' || room.type === 'canopy_break') {
        ctx.strokeStyle = 'rgba(40,90,40,0.7)'; ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const vx = gx + 40 + i * 80;
            const vy1 = gy + 10 + (i % 3) * 10;
            const vy2 = vy1 + 60 + Math.sin(Date.now()/200 + i) * 10;
            ctx.beginPath(); ctx.moveTo(vx, vy1); ctx.lineTo(vx, vy2); ctx.stroke();
        }
    }

    // Runner shrine runes
    if (room.type === 'runner_shrine') {
        ctx.fillStyle = 'rgba(140,255,140,0.05)';
        ctx.beginPath(); ctx.arc(gx + WORLD_W/2, gy + 100, 160, 0, Math.PI*2); ctx.fill();
    }
}

function drawTile(ctx, baseX, baseY, tileId) {
    if (tileId === 0) return;
    
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
    }
}

function drawProp(ctx, prop, gx, gy) {
    const x = gx + prop.x;
    const y = gy + prop.y;
    
    if (prop.type === 'spike') {
        // Detailed spike with shading
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.moveTo(x + prop.w/2, y);
        ctx.lineTo(x + prop.w, y + prop.h);
        ctx.lineTo(x, y + prop.h);
        ctx.fill();
        
        // Spike highlight
        ctx.strokeStyle = '#e8c490';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + prop.w/2, y + 2);
        ctx.lineTo(x + prop.w - 2, y + prop.h - 2);
        ctx.stroke();
        
        // Danger glow
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + prop.w/2, y - 2);
        ctx.lineTo(x + prop.w + 2, y + prop.h + 2);
        ctx.lineTo(x - 2, y + prop.h + 2);
        ctx.closePath();
        ctx.stroke();
    } else if (prop.type === 'platform') {
        // Detailed platform with texture
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(x, y, prop.w, prop.h);
        
        // Top surface highlight
        ctx.fillStyle = '#ab8f67';
        ctx.fillRect(x, y, prop.w, 2);
        
        // Wood grain texture
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < prop.w; i += 4) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i, y + prop.h);
            ctx.stroke();
        }
    } else if (prop.type === 'vine') {
        // hanging vine: braided rope with leaves
        ctx.strokeStyle = 'rgba(40,90,40,0.95)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 80); ctx.stroke();
        ctx.fillStyle = 'rgba(70,160,70,0.9)'; ctx.beginPath(); ctx.arc(x, y + 48, 6, 0, Math.PI*2); ctx.fill();
    } else if (prop.type === 'fragile') {
        // fragile branch: cracks suggest collapse
        ctx.fillStyle = '#6b5e3e'; ctx.fillRect(x, y, prop.w, prop.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.moveTo(x+4, y+2); ctx.lineTo(x+prop.w-4, y+prop.h-2); ctx.stroke();
    } else if (prop.type === 'low_ceiling') {
        ctx.fillStyle = '#3b3b2f'; ctx.fillRect(x, y, prop.w, prop.h);
        ctx.fillStyle = 'rgba(80,160,120,0.1)'; ctx.fillRect(x, y, prop.w, prop.h);
    } else if (prop.type === 'wallrun') {
        ctx.fillStyle = '#4e704e'; ctx.fillRect(x, y, 8, 120);
        ctx.fillStyle = '#cedfd0'; ctx.fillRect(x+2, y+20, 4, 80);
    }
}

}

function drawItem(ctx, item, gx, gy) {
    const x = gx + item.x;
    const y = gy + item.y;
    const bobbing = Math.sin(Date.now() / 500) * 2;

    if (item.type === 'sword') {
        // Glowing sword with rotation
        const rotation = (Date.now() / 30) % (Math.PI * 2);

        // Glow aura
        ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y + bobbing, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(x, y + bobbing);
        ctx.rotate(rotation);

        // Sword blade
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(-2, -8, 4, 16);

        // Blade shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(-1, -7, 2, 14);

        // Sword hilt
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-3, 6, 6, 3);
        ctx.fillStyle = '#c9a442';
        ctx.fillRect(-3, 8, 6, 1);

        ctx.restore();

    } else if (item.type === 'potion') {
        // Glowing potion bottle
        ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y + bobbing, 10, 0, Math.PI * 2);
        ctx.fill();

        // Bottle outline
        ctx.strokeStyle = '#c9425c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(x - 4, y + bobbing - 6, 8, 12);
        ctx.stroke();

        // Bottle cap
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(x - 3, y + bobbing - 8, 6, 2);

        // Liquid fill with animation
        const fillHeight = 8 + Math.sin(Date.now() / 300) * 1;
        ctx.fillStyle = 'rgba(255, 150, 150, 0.7)';
        ctx.fillRect(x - 3, y + bobbing - 6 + (12 - fillHeight), 6, fillHeight);

    } else if (item.type === 'pistol') {
        // pistol drawn with barrel and small glow
        ctx.fillStyle = 'rgba(200,200,200,0.95)';
        ctx.fillRect(x - 10, y + bobbing - 4, 20, 6);
        ctx.fillStyle = '#333'; ctx.fillRect(x + 6, y + bobbing - 6, 12, 4);
        ctx.fillStyle = 'rgba(200,200,255,0.12)'; ctx.beginPath(); ctx.arc(x, y + bobbing, 18, 0, Math.PI*2); ctx.fill();

    } else if (item.type === 'momentum_module') {
        // glowing core of momentum tech
        ctx.fillStyle = 'rgba(140,255,140,0.12)'; ctx.beginPath(); ctx.arc(x, y + bobbing, 24, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(140,255,140,0.95)'; ctx.beginPath(); ctx.moveTo(x, y + bobbing - 10); ctx.lineTo(x + 8, y + bobbing); ctx.lineTo(x, y + bobbing + 10); ctx.lineTo(x - 8, y + bobbing); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 4, y + bobbing - 2, 8, 4);

    } else if (item.type === 'momentum_dash') {
        // module upgrade icon — small shard with pulse
        const pulse = 0.8 + Math.sin(Date.now()/200) * 0.2;
        ctx.fillStyle = `rgba(200,255,180,${pulse})`;
        ctx.beginPath(); ctx.moveTo(x, y + bobbing - 8); ctx.lineTo(x + 6, y + bobbing); ctx.lineTo(x, y + bobbing + 8); ctx.lineTo(x - 6, y + bobbing); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 2, y + bobbing - 2, 4, 4);

    } else {
        // Default item rendering
        const glowIntensity = 0.15 + Math.sin(Date.now() / 500) * 0.1;
        ctx.fillStyle = `rgba(120,255,160,${glowIntensity})`;
        ctx.beginPath();
        ctx.arc(x, y + bobbing, 22, 0, Math.PI * 2);
        ctx.fill();

        // Item body
        ctx.fillStyle = item.color || "rgba(120,255,160,0.95)";
        ctx.fillRect(x - 8, y + bobbing - 8, 16, 16);

        // Item shine
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillRect(x - 6, y + bobbing - 6, 4, 4);
    }
}

// Enhanced UI drawing
function drawEnhancedHUD(ctx, player, room) {
    // Health with detailed display
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('HP', 10, 25);
    
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < player.hp ? '#ff4444' : 'rgba(255, 68, 68, 0.2)';
        ctx.beginPath();
        ctx.arc(35 + i * 18, 20, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Heart highlight
        if (i < player.hp) {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
            ctx.beginPath();
            ctx.arc(35 + i * 18, 18, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Dash cooldown indicator
    ctx.fillStyle = '#4ade80';
    ctx.fillText('DASH', 10, 55);
    ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.fillRect(10, 60, 60, 6);
    if (player.dashCooldown > 0) {
        ctx.fillStyle = '#64c8ff';
        ctx.fillRect(10, 60, 60 * (1 - player.dashCooldown / DASH_COOLDOWN), 6);
    } else {
        ctx.fillStyle = '#64c8ff';
        ctx.fillRect(10, 60, 60, 6);
    }
    
    // Sword indicator
    if (player.hasSword) {
        ctx.fillStyle = '#4ade80';
        ctx.fillText('⚔', WORLD_W - 30, 25);
    }

    // Pistol ammo / cooldown
    if (player.hasPistol) {
        ctx.fillStyle = '#ffd166';
        ctx.fillText('PISTOL', 10, 95);
        const maxAmmo = player.pistolMaxAmmo || PISTOL_MAX_AMMO;
        const displayAmmo = Math.min(maxAmmo, 12);
        for (let i = 0; i < displayAmmo; i++) {
            const ox = 10 + i * 8;
            const oy = 100;
            ctx.fillStyle = i < player.pistolAmmo ? '#ffd166' : 'rgba(255, 209, 102, 0.18)';
            ctx.fillRect(ox, oy, 6, 6);
        }
        // reload progress
        if (player.pistolReload > 0) {
            ctx.fillStyle = 'rgba(255,80,80,0.9)';
            ctx.fillRect(10, 108, 60 * (1 - player.pistolReload / PISTOL_RELOAD_FRAMES), 6);
        }
    }

    // Momentum module HUD
    if (player.hasMomentumModule) {
        if (player.momentumNotifyTimer > 0) {
            ctx.fillStyle = '#9be564';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('MOMENTUM DRIVE ONLINE', WORLD_W/2 - 80, 24);
        }
        ctx.fillStyle = '#b8ff9a';
        ctx.fillText('MOMENTUM', 10, 130);
        // charge bar
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(10, 134, 80, 8);
        ctx.fillStyle = '#7ee787'; ctx.fillRect(10, 134, 80 * player.momentumCharge, 8);
        // dash upgrade icon
        if (player.momentumDashUpgrade) {
            ctx.fillStyle = '#c0ffc8';
            ctx.fillText('DASH+', 100, 130);
        }
    }
}

// Update enemy drawing in render
function drawEnemyWithDetails(ctx, enemy, animTimer) {
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
        case 'watcher':
            drawWatcherEnemy(ctx, enemy, animTimer);
            break;
    }
    
    ctx.restore();
}

function drawWatcherEnemy(ctx, enemy, animTimer) {
    // enemy.x/y are already translated by caller
    const ex = enemy.x;
    const ey = enemy.y;

    // compute angle to player for turret barrel
    const dx = player.x + player.w/2 - ex;
    const dy = player.y + player.h/2 - ey;
    const angle = Math.atan2(dy, dx);

    // Body
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#6b7f3a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // barrel
    ctx.fillStyle = '#333';
    ctx.fillRect(6, -3, 14, 6);

    // eye (lens)
    ctx.fillStyle = '#9ff3a6';
    ctx.beginPath();
    ctx.arc(-4, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
