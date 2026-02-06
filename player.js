// player.js - Player data, drawing, damage with detailed animations

const player = {
    x: 100, y: 300,
    vx: 0, vy: 0,
    w: 20, h: 40,  // Increased size for more detail
    grounded: false,
    facing: 1,
    animTimer: 0,
    hitTimer: 0,
    shakeTimer: 0,
    hasSword: false,
    isAttacking: false,
    attackTimer: 0,
    attackCooldown: 0,
    hp: 3,
    squash: 1,
    stretch: 1,
    capeNodes: Array(8).fill().map(() => ({x: 100, y: 300})),  // More nodes for better cape flow
    dashCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    glowIntensity: 0,  // For hit/damage glow effects
    moveDir: 0,  // For walk animation direction
    // Pistol state
    hasPistol: false,
    pistolAmmo: 0,
    pistolMaxAmmo: PISTOL_MAX_AMMO,
    pistolCooldown: 0,
    pistolReload: 0,

    // Momentum movement module
    hasMomentumModule: false,      // unlocked in Runner Shrine
    momentumNotifyTimer: 0,       // UI celebration timer
    momentumCharge: 0,            // builds when dashing/wallrunning and used to boost jumps
    isSliding: false,
    slideTimer: 0,
    isWallRunning: false,
    wallrunTimer: 0,
    momentumDashUpgrade: false
};

const camera = { x: 0, y: 0, targetX: 0, targetY: 0, lerp: 0.15 };

function drawPlayer(ctx, px, py) {
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(player.facing, 1);

    // Apply squash and stretch for juice
    ctx.scale(player.stretch, player.squash);
    ctx.translate(-player.w/2, -player.h/2);

    // Glow effect when hit
    if (player.hitTimer > 0) {
        player.glowIntensity = player.hitTimer / 50;
        ctx.shadowBlur = 15 * player.glowIntensity;
        ctx.shadowColor = `rgba(255, 100, 100, ${0.6 * player.glowIntensity})`;
    }

    if (typeof HIGH_DETAIL_SPRITES !== 'undefined' && HIGH_DETAIL_SPRITES) {
        // High-detail vector player
        // subtle body gradient
        const gx = ctx.createLinearGradient(0, 0, 0, player.h);
        gx.addColorStop(0, '#f0d6a0');
        gx.addColorStop(1, '#d4a574');

        // Head
        ctx.fillStyle = gx;
        ctx.beginPath();
        ctx.ellipse(player.w/2, player.h/4 - 2, 7, 7.5, 0, 0, Math.PI*2);
        ctx.fill();

        // small helmet rim
        ctx.strokeStyle = 'rgba(40,30,20,0.7)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(player.w/2, player.h/4 - 2, 8, 3.6, 0, Math.PI, 0); ctx.stroke();

        // Eyes with subtle glow and lids
        const eyeOffset = Math.sin(player.animTimer * 0.08) * 0.6;
        ctx.fillStyle = 'rgba(12,12,12,0.95)';
        roundRect(ctx, player.w/2 - 5 + eyeOffset, player.h/4 - 3, 3, 3, 1);
        roundRect(ctx, player.w/2 + 3 + eyeOffset, player.h/4 - 3, 3, 3, 1);
        ctx.fillStyle = 'rgba(140,240,200,0.9)';
        ctx.fillRect(player.w/2 - 4 + eyeOffset, player.h/4 - 2.2, 1.5, 1.5);
        ctx.fillRect(player.w/2 + 4 + eyeOffset, player.h/4 - 2.2, 1.5, 1.5);

        // Torso layered armor
        ctx.fillStyle = '#e8c24e';
        roundRect(ctx, player.w/2 - 7, player.h/4 + 6, 14, 14, 3);
        ctx.fillStyle = '#c9a442';
        roundRect(ctx, player.w/2 - 3, player.h/4 + 8, 6, 6, 2);

        // Arms / sliding / wallrun visuals
        const armSwing = Math.sin(player.animTimer * 0.12) * Math.max(Math.abs(player.vx) * 0.3, 2);

        if (player.isSliding) {
            // slide pose: low torso, arms tucked
            ctx.save();
            ctx.translate(player.w/2, player.h/4 + 10);
            ctx.rotate(player.facing * -0.3);
            roundRect(ctx, -10, -2, 20, 8, 4); // low sliding torso
            ctx.fillStyle = '#7a5236'; roundRect(ctx, -8, 6, 6, 3, 1); roundRect(ctx, 2, 6, 6, 3, 1);
            ctx.restore();

            // sliding legs blur
            ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(60,40,30,0.9)';
            ctx.fillRect(player.w/2 - 12, player.h/4 + 18, 24, 6);
            ctx.restore();

            // dust trail
            if (Math.random() < 0.6) spawnParticle(world.getRoom(Math.floor(player.x / WORLD_W), Math.floor(player.y / WORLD_H)), player.x + player.w/2 - player.facing * 6, player.y + player.h, 'dash');
        } else if (player.isWallRunning) {
            // wall-run pose: torso lean and arm brace
            ctx.save();
            ctx.translate(player.w/2, player.h/4 + 4);
            ctx.rotate(player.facing * -0.45);
            roundRect(ctx, -6, -6, 14, 14, 3);
            ctx.fillStyle = '#7a5236'; roundRect(ctx, -6, 6, 4, 6, 2);
            ctx.restore();

            // small sparks
            if (Math.random() < 0.2) spawnParticle(world.getRoom(Math.floor(player.x / WORLD_W), Math.floor(player.y / WORLD_H)), player.x + (player.facing * 10), player.y + player.h/2, 'dash');
        } else {
            // regular arms and gauntlets
            ctx.save(); ctx.translate(player.w/2 - 8, player.h/4 + 9); ctx.rotate(armSwing * 0.35);
            roundRect(ctx, -2, 0, 4, 11, 2); ctx.fillStyle = '#7a5236'; roundRect(ctx, -1, 8, 2, 3, 1); ctx.restore();
            ctx.save(); ctx.translate(player.w/2 + 8, player.h/4 + 9); ctx.rotate(-armSwing * 0.35);
            roundRect(ctx, -2, 0, 4, 11, 2); ctx.fillStyle = '#7a5236'; roundRect(ctx, -1, 8, 2, 3, 1); ctx.restore();

            // Legs with shading and boots
            const legSwing = Math.sin(player.animTimer * 0.15) * Math.max(Math.abs(player.vx) * 0.4, 1);
            ctx.fillStyle = '#3f2b22'; roundRect(ctx, player.w/2 - 6, player.h/4 + 18, 5, 12 + Math.abs(legSwing), 2);
            roundRect(ctx, player.w/2 + 1, player.h/4 + 18, 5, 12 - Math.abs(legSwing), 2);
        }

        // Cape with layered shading
        if (player.capeNodes.length > 0) {
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = 'rgba(40,80,120,0.22)';
            ctx.beginPath();
            ctx.moveTo(player.capeNodes[0].x - camera.x, player.capeNodes[0].y - camera.y);
            for (let i = 1; i < player.capeNodes.length; i++) ctx.lineTo(player.capeNodes[i].x - camera.x, player.capeNodes[i].y - camera.y);
            ctx.lineTo(player.capeNodes[player.capeNodes.length - 1].x - camera.x, player.capeNodes[player.capeNodes.length - 1].y - camera.y + 6);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        // Weapon glint when idle or on attack
        ctx.save();
        ctx.translate(player.w/2 + (player.isAttacking?8:0), player.h/4 + 3);
        ctx.fillStyle = 'rgba(220,220,220,0.98)';
        roundRect(ctx, -2, -1, 22, 3, 2);
        if (player.isAttacking) {
            ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.beginPath(); ctx.arc(6, 0, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        // Rim highlight to pop silhouette
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.strokeRect(player.w/2 - 12, player.h/4 - 6, 24, 48);

    } else {
        // fallback: original simple drawing
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.arc(player.w/2, player.h/4, 6, 0, Math.PI * 2);
        ctx.fill();

        const eyeOffset = Math.sin(player.animTimer * 0.08) * 0.5;
        ctx.fillStyle = '#000';
        ctx.fillRect(player.w/2 - 4 + eyeOffset, player.h/4 - 2, 2, 2);
        ctx.fillRect(player.w/2 + 2 + eyeOffset, player.h/4 - 2, 2, 2);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (player.isDashing) {
            ctx.arc(player.w/2, player.h/4 + 3, 2, 0, Math.PI);
        } else if (player.isAttacking) {
            ctx.moveTo(player.w/2 - 2, player.h/4 + 2);
            ctx.lineTo(player.w/2 + 2, player.h/4 + 3);
        } else {
            ctx.moveTo(player.w/2 - 1, player.h/4 + 2);
            ctx.lineTo(player.w/2 + 1, player.h/4 + 2);
        }
        ctx.stroke();

        ctx.fillStyle = '#e8c24e';
        ctx.fillRect(player.w/2 - 5, player.h/4 + 6, 10, 12);

        const armSwing = Math.sin(player.animTimer * 0.12) * Math.max(Math.abs(player.vx) * 0.3, 2);
        ctx.fillStyle = '#d4a574';
        ctx.save();
        ctx.translate(player.w/2 - 6, player.h/4 + 8);
        ctx.rotate(armSwing * 0.3);
        ctx.fillRect(-2, 0, 4, 10);
        ctx.fillStyle = '#c9a442';
        ctx.fillRect(-1, 9, 2, 2);
        ctx.restore();
        ctx.fillStyle = '#d4a574';
        ctx.save();
        ctx.translate(player.w/2 + 6, player.h/4 + 8);
        ctx.rotate(-armSwing * 0.3);
        ctx.fillRect(-2, 0, 4, 10);
        ctx.fillStyle = '#c9a442';
        ctx.fillRect(-1, 9, 2, 2);
        ctx.restore();

        const legSwing = Math.sin(player.animTimer * 0.15) * Math.max(Math.abs(player.vx) * 0.4, 1);
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(player.w/2 - 4, player.h/4 + 18, 4, 12 + Math.abs(legSwing));
        ctx.fillRect(player.w/2, player.h/4 + 18, 4, 12 - Math.abs(legSwing));
    }

    ctx.restore();
}

// small helper: rounded rect
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}
    
    // Draw sword if attacking
    if (player.isAttacking && player.hasSword) {
        const attackAngle = (18 - player.attackTimer) / 18 * Math.PI;
        ctx.save();
        ctx.translate(player.w/2 + 8, player.h/4 + 10);
        ctx.rotate(attackAngle);
        
        // Sword blade with gradient
        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 20);
        ctx.stroke();
        
        // Sword glow during attack
        ctx.strokeStyle = `rgba(255, 200, 100, ${0.7 * (1 - player.attackTimer / 18)})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 20);
        ctx.stroke();
        
        // Sword hilt
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-2, 0, 4, 3);
        ctx.fillStyle = '#c9a442';
        ctx.fillRect(-3, 2, 6, 1);
        
        ctx.restore();
    }
    
    // Dash trail/speed lines
    if (player.isDashing) {
        ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 * (1 - player.dashTimer / 10)})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(player.w/2 - 8 - i * 3, player.h/2 + (Math.random() - 0.5) * 4);
            ctx.lineTo(player.w/2 - 12 - i * 3, player.h/2 + (Math.random() - 0.5) * 4);
            ctx.stroke();
        }
    }
    
    ctx.restore();
}

function takeDamage() {
    if (player.hitTimer > 0 || player.isDashing) return;
    player.hp--;
    player.hitTimer = 50; 
    player.shakeTimer = 30;
    player.vx = -player.facing * 7;
    player.vy = -4;
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('hit');
    if (player.hp <= 0) {
        player.hp = 3;
        player.x = 100; player.y = 300;
        player.vx = 0; player.vy = 0;
    }
}