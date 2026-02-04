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
    }
}

function drawItem(ctx, item, gx, gy) {
    const x = gx + item.x;
    const y = gx + item.y;
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
