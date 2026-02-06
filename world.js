// world.js - Rooms, generation, drawing world elements with enhanced graphics

class Room {
    constructor(gx, gy, type = "forest") {
        this.gx = gx;
        this.gy = gy;
        this.type = type;
        this.width = ROOM_WIDTH_TILES;
        this.height = ROOM_HEIGHT_TILES;
        this.tiles = Array(this.height).fill().map(() => Array(this.width).fill(0));

        this.brush = [];
        this.props = [];
        this.godRays = [];
        this.enemies = [];
        this.items = [];
        this.particles = [];

        this.centerX = (gx * this.width * TILE_SIZE) + (this.width * TILE_SIZE / 2);
        this.centerY = (gy * this.height * TILE_SIZE) + (this.height * TILE_SIZE / 2);
    }

    setTile(tx, ty, val) {
        if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
            this.tiles[ty][tx] = val;
        }
    }

    fillArea(x, y, w, h, val) {
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                this.setTile(i, j, val);
            }
        }
    }

    generateAtmosphere() {
        let trunkCount, rayCount, rayOpacity, rayColor, brushType = 'grass', brushDensity = 0.6;

        if (this.type === "town_edge" || this.type === "mini_boss_room") {
            let count = this.type === "mini_boss_room" ? 8 : 15;
            for (let i = 0; i < count; i++) {
                this.props.push({
                    x: Math.random() * (this.width * TILE_SIZE),
                    y: 0,
                    w: 40 + Math.random() * 50,
                    h: this.height * TILE_SIZE,
                    color: '#0a0e0c',
                    type: 'building',
                    animTimer: Math.random() * 100
                });
            }
            brushType = 'moss';
        } else if (this.type === "ruined_outskirts") {
            for (let i = 0; i < 12; i++) {
                this.props.push({
                    x: Math.random() * (this.width * TILE_SIZE),
                    y: (30 + Math.random() * 8) * TILE_SIZE,
                    w: 50 + Math.random() * 70,
                    h: 25 + Math.random() * 45,
                    color: '#1a1a1a',
                    type: 'ruin',
                    rot: (Math.random() - 0.5) * 0.4
                });
            }
            brushType = 'moss';
        } else if (this.type === "forest_trap") {
            trunkCount = 25;
            brushType = 'moss';
            brushDensity = 0.8;
            rayCount = 3;
            rayOpacity = 0.02 + Math.random() * 0.01;
            rayColor = '100, 130, 110';
        } else {
            trunkCount = this.type === "combat_intro" ? 18 : 12;
        }

        if (trunkCount) {
            for (let i = 0; i < trunkCount; i++) {
                this.props.push({
                    x: Math.random() * (this.width * TILE_SIZE),
                    y: 0,
                    w: 30 + Math.random() * 55,
                    h: this.height * TILE_SIZE,
                    color: this.type === "combat_intro" ? '#070b09' : '#0a120f',
                    type: 'trunk'
                });
            }
        }

        rayCount = rayCount || (this.type === "ruined_outskirts" ? 4 : (this.type === "town_edge" ? 3 : 2));
        for (let i = 0; i < rayCount; i++) {
            this.godRays.push({
                x: Math.random() * (this.width * TILE_SIZE),
                w: 80 + Math.random() * 120,
                opacity: rayOpacity || 0.04 + Math.random() * 0.02,
                color: rayColor || (this.type === "ruined_outskirts"
                    ? '100, 130, 110'
                    : (this.type === "town_edge"
                        ? '150, 200, 180'
                        : '124, 252, 0'))
            });
        }

        // surface brush placement with enhanced detail
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] === 1) {
                    const isSurface = y > 0 && this.tiles[y - 1][x] === 0;
                    if (isSurface && Math.random() < brushDensity) {
                        this.brush.push({
                            type: brushType,
                            x: x * TILE_SIZE + Math.random() * 12,
                            y: y * TILE_SIZE,
                            w: 8 + Math.random() * 14,
                            h: 4 + Math.random() * 8
                        });
                    }
                }
            }
        }
    }
}

// ======================================================
// WORLD STORAGE
// ======================================================
const world = {
    grid: {},
    getRoom: (gx, gy) => world.grid[`${gx},${gy}`]
};

// ======================================================
// WORLD GENERATION
// ======================================================
function generateWorld() {
    world.grid = {};

    // Room 1: spawn forest
    const r1 = new Room(0, 0, "forest");
    r1.fillArea(0, 40, r1.width, 20, 1);
    r1.fillArea(12, 32, 8, 2, 1);
    r1.fillArea(30, 28, 10, 2, 1);
    r1.fillArea(50, 35, 10, 2, 1);
    r1.fillArea(65, 25, 10, 2, 1);

    // Room 2: combat intro
    const r2 = new Room(1, 0, "combat_intro");
    r2.fillArea(0, 42, r2.width, 18, 1);
    r2.fillArea(20, 34, 12, 2, 1);
    r2.fillArea(50, 30, 10, 2, 1);

    // Room 3: ruined outskirts
    const r3 = new Room(2, 0, "ruined_outskirts");
    r3.fillArea(0, 44, r3.width, 16, 1);
    r3.fillArea(14, 36, 14, 2, 1);
    r3.fillArea(44, 32, 12, 2, 1);
    r3.fillArea(70, 26, 10, 2, 1);

    // Room 4: town edge
    const r4 = new Room(3, 0, "town_edge");
    r4.fillArea(0, 45, r4.width, 15, 1);
    r4.fillArea(10, 38, 10, 2, 1);
    r4.fillArea(35, 34, 14, 2, 1);
    r4.fillArea(65, 28, 12, 2, 1);

    // Room 5: mini boss room
    const r5 = new Room(4, 0, "mini_boss_room");
    r5.fillArea(0, 46, r5.width, 14, 1);
    r5.fillArea(20, 38, 20, 2, 1);
    r5.fillArea(55, 32, 12, 2, 1);
    // spawn a mini "root titan" boss in this room for the mini-boss encounter
    r5.enemies.push({ type: 'root_titan', x: 420, y: 240, hp: 20, maxHp: 20, facing: 1, h: 60 });

    // Room 6: forest continuation
    const r6 = new Room(0, 1, "forest");
    r6.fillArea(0, 44, r6.width, 16, 1);
    r6.fillArea(8, 36, 10, 2, 1);
    r6.fillArea(30, 30, 12, 2, 1);
    r6.fillArea(55, 35, 10, 2, 1);

    // Room 7: forest trap room
    const r7 = new Room(1, 1, "forest_trap");
    r7.fillArea(0, 46, r7.width, 14, 1);
    r7.fillArea(18, 38, 14, 2, 1);
    r7.fillArea(42, 34, 14, 2, 1);
    r7.fillArea(68, 30, 10, 2, 1);

    // Room 8: broken gate passage (cooldown + reward)
    const r8 = new Room(5, 0, "ruined_outskirts");
    r8.fillArea(0, 46, r8.width, 14, 1);
    r8.fillArea(18, 36, 20, 2, 1);  // big mid platform
    r8.fillArea(55, 28, 18, 2, 1);  // high ledge
    r8.fillArea(10, 40, 6, 2, 1);   // small stepping stones
    r8.fillArea(44, 34, 6, 2, 1);
    r8.fillArea(70, 20, 4, 26, 1);  // "gate wall" pillar blocks
    r8.fillArea(74, 24, 3, 22, 1);
    r8.items.push({
        x: 62 * TILE_SIZE,
        y: 26 * TILE_SIZE,
        type: "core",
        color: "rgba(120,255,180,0.85)"
    });

    // Room 9: flooded tunnels (trap + vertical platforming)
    const r9 = new Room(6, 0, "forest_trap");
    r9.fillArea(0, 48, r9.width, 12, 1);
    r9.fillArea(8, 40, 10, 2, 1);   // low platforms
    r9.fillArea(28, 36, 12, 2, 1);
    r9.fillArea(50, 32, 12, 2, 1);
    r9.fillArea(70, 28, 10, 2, 1);
    r9.fillArea(0, 0, r9.width, 6, 1);  // ceiling block to make it feel like a tunnel
    r9.fillArea(35, 49, 20, 1, 0);  // carve a gap in floor for spikes pit zone
    r9.items.push({
        x: 42 * TILE_SIZE,
        y: 47 * TILE_SIZE,
        type: "trap_marker",
        color: "rgba(255,80,80,0.6)"
    });
    r9.enemies.push({ type: "crawler", x: 500, y: 520, vx: 0, vy: 0, hp: 4 });
    r9.enemies.push({ type: "flyer", x: 750, y: 280, vx: 0, vy: 0, hp: 3 });
    r9.enemies.push({ type: "flyer", x: 350, y: 250, vx: 0, vy: 0, hp: 3 });

    // Room 10: overgrown shrine (setup room, dramatic + safe-ish)
    const r10 = new Room(7, 0, "forest");
    r10.fillArea(0, 46, r10.width, 14, 1);
    r10.fillArea(20, 38, 40, 2, 1);  // shrine base (wide flat arena)
    r10.fillArea(25, 20, 3, 26, 1);  // tall pillars (ruin vibe)
    r10.fillArea(52, 20, 3, 26, 1);
    r10.fillArea(10, 30, 12, 2, 1);  // upper ledges
    r10.fillArea(68, 30, 12, 2, 1);
    r10.fillArea(38, 28, 20, 2, 1);  // center shrine platform
    r10.items.push({
        x: 48 * TILE_SIZE,
        y: 26 * TILE_SIZE,
        type: "shrine",
        color: "rgba(160,255,200,0.75)"
    });
    r10.enemies.push({ type: "crawler", x: 600, y: 520, vx: 0, vy: 0, hp: 3 });

    // Room 11: THE SPLIT HOLLOW (Exploration / Light Combat)
    // Two main platforms: upper route and lower route with vertical tree-trunk divider
    const r11 = new Room(8, 0, "forest_split");
    r11.fillArea(0, 46, r11.width, 14, 1);  // base floor

    // Upper route (right side)
    r11.fillArea(45, 32, 20, 2, 1);  // upper right platform
    r11.fillArea(55, 26, 15, 2, 1);  // mid-upper ledge
    r11.fillArea(68, 20, 10, 2, 1);  // high ledge with loot

    // Lower route (left side)
    r11.fillArea(8, 38, 15, 2, 1);   // lower left platform
    r11.fillArea(25, 34, 12, 2, 1);  // mid-lower platform

    // Central divider (tree trunk wall)
    r11.fillArea(35, 30, 2, 20, 1);  // vertical trunk dividing routes

    // Small gaps to force controlled jumps
    r11.fillArea(22, 40, 3, 2, 1);   // gap jumps on left
    r11.fillArea(40, 36, 3, 2, 1);   // gap on center
    r11.fillArea(65, 32, 3, 2, 1);   // gap on right

    // Optional loot in upper route (hidden reward)
    r11.items.push({
        x: 70 * TILE_SIZE,
        y: 18 * TILE_SIZE,
        type: "core",
        color: "rgba(120,255,180,0.85)"
    });

    // Enemies: 4-6 normal swarms + 1 fast swarm guarding loot
    r11.enemies.push({ type: "flyer", x: 300, y: 350, vx: 0, vy: 0, hp: 2 });
    r11.enemies.push({ type: "flyer", x: 500, y: 400, vx: 0, vy: 0, hp: 2 });
    r11.enemies.push({ type: "flyer", x: 700, y: 320, vx: 0, vy: 0, hp: 2 });
    r11.enemies.push({ type: "flyer", x: 850, y: 300, vx: 0, vy: 0, hp: 2 });
    r11.enemies.push({ type: "flyer", x: 600, y: 500, vx: 0, vy: 0, hp: 2 });
    r11.enemies.push({ type: "flyer", x: 900, y: 250, vx: 0, vy: 0, hp: 3 });  // fast swarm on loot

    // Room 12: THORN LADDER (Hazard Room - Vertical Climb)
    // Stacked platforms like stairs with spikes below
    const r12 = new Room(9, 0, "thorn_climb");
    r12.fillArea(0, 48, r12.width, 12, 1);  // base floor

    // Stepping stone platforms (stacked vertically)
    r12.fillArea(10, 42, 12, 2, 1);   // step 1
    r12.fillArea(25, 36, 12, 2, 1);   // step 2
    r12.fillArea(40, 30, 12, 2, 1);   // step 3
    r12.fillArea(55, 24, 12, 2, 1);   // step 4
    r12.fillArea(70, 18, 12, 2, 1);   // step 5 (top)

    // Safe "rest platform" mid-room
    r12.fillArea(35, 38, 20, 2, 1);   // wide rest platform

    // Spike pits below most ledges (gaps below platforms)
    r12.fillArea(8, 44, 3, 1, 0);     // gap for spike zone 1
    r12.fillArea(23, 38, 3, 1, 0);    // gap for spike zone 2
    r12.fillArea(38, 32, 3, 1, 0);    // gap for spike zone 3
    r12.fillArea(53, 26, 3, 1, 0);    // gap for spike zone 4
    r12.fillArea(68, 20, 3, 1, 0);    // gap for spike zone 5

    // Reward near the top
    r12.items.push({
        x: 75 * TILE_SIZE,
        y: 16 * TILE_SIZE,
        type: "shrine",
        color: "rgba(160,255,200,0.75)"
    });

    // Enemies: 2 fast swarms (pressure) + 3 mini swarms (annoyance)
    r12.enemies.push({ type: "flyer", x: 300, y: 380, vx: 0, vy: 0, hp: 3 });  // fast pressure
    r12.enemies.push({ type: "flyer", x: 700, y: 250, vx: 0, vy: 0, hp: 3 });  // fast pressure
    r12.enemies.push({ type: "crawler", x: 400, y: 420, vx: 0, vy: 0, hp: 2 }); // mini annoyance
    r12.enemies.push({ type: "crawler", x: 550, y: 350, vx: 0, vy: 0, hp: 2 }); // mini annoyance
    r12.enemies.push({ type: "crawler", x: 750, y: 320, vx: 0, vy: 0, hp: 2 }); // mini annoyance

    // Room 13: RUINED GATE (Combat Arena Intro - Wave System)
    // Wide flat arena with 2-3 raised platforms, locked gate exit
    const r13 = new Room(10, 0, "ruined_gate");
    r13.fillArea(0, 46, r13.width, 14, 1);  // base floor

    // Raised platforms for combat
    r13.fillArea(15, 36, 18, 2, 1);   // left platform
    r13.fillArea(55, 36, 18, 2, 1);   // right platform
    r13.fillArea(35, 30, 16, 2, 1);   // center raised arena

    // Gate background wall (visual separator)
    r13.fillArea(80, 20, 3, 28, 1);   // gate pillar structure
    r13.fillArea(76, 24, 3, 24, 1);

    // Wave system (spawned when player enters room)
    r13.locked = false;              // set true when player enters
    r13.waveIndex = -1;              // -1 = not started yet
    r13.waveTimer = 0;               // timer between waves
    r13.waves = [
        // Wave 0: six mini crawlers
        [
            { type: "crawler", x: 200, y: 500, hp: 1 },
            { type: "crawler", x: 400, y: 520, hp: 1 },
            { type: "crawler", x: 600, y: 500, hp: 1 },
            { type: "crawler", x: 750, y: 520, hp: 1 },
            { type: "crawler", x: 850, y: 500, hp: 1 },
            { type: "crawler", x: 950, y: 520, hp: 1 }
        ],
        // Wave 1: three flyers + two fast flyers
        [
            { type: "flyer", x: 300, y: 350, hp: 2 },
            { type: "flyer", x: 500, y: 360, hp: 2 },
            { type: "flyer", x: 700, y: 340, hp: 2 },
            { type: "flyer", x: 400, y: 300, hp: 3 },
            { type: "flyer", x: 800, y: 290, hp: 3 }
        ],
        // Wave 2: elite (gloom-like) enemy
        [
            { type: "gloom_weaver", x: 600, y: 200, hp: 8 }
        ]
    ];

    // gate remains visually represented by pillars; reward spawns after waves are cleared
    r13.reward = { x: 45 * TILE_SIZE, y: 28 * TILE_SIZE, spawned: false, item: { type: "core", color: "rgba(120,255,180,0.85)" } };

    // Room 14: Hunter's Clearing (pistol tutorial)
    const r14 = new Room(11, 0, "hunter_clearing");
    r14.fillArea(0, 46, r14.width, 14, 1);
    // a few stumps/platforms
    r14.props.push({ type: 'platform', x: 140, y: 480, w: 40, h: 8 });
    r14.props.push({ type: 'platform', x: 300, y: 460, w: 40, h: 8 });
    r14.props.push({ type: 'platform', x: 760, y: 460, w: 40, h: 8 });
    // pistol sits on stump (no enemies until pickup)
    r14.items.push({ x: 300, y: 440, type: 'pistol', color: 'rgba(200,200,255,0.95)', picked: false });
    r14.pistolEvent = null; // will be created when player picks up the pistol

    // Room 15: Bramble Range (ranged test)
    const r15 = new Room(12, 0, "bramble_range");
    r15.fillArea(0, 46, r15.width, 14, 1); // floor
    // ledges above pits/spikes
    r15.fillArea(30, 36, 12, 2, 1);
    r15.fillArea(90, 36, 12, 2, 1);
    r15.fillArea(150, 36, 12, 2, 1);
    // pits/spikes (visual & gameplay)
    r15.props.push({ type: 'spike', x: 60, y: 520, w: 40, h: 12 });
    r15.props.push({ type: 'spike', x: 120, y: 520, w: 40, h: 12 });
    // enemies (encouraging ranged)
    r15.enemies.push({ type: 'crawler', x: 80, y: 500, hp: 2 });
    r15.enemies.push({ type: 'crawler', x: 360, y: 500, hp: 2 });
    r15.enemies.push({ type: 'crawler', x: 640, y: 500, hp: 2 });
    r15.enemies.push({ type: 'flyer', x: 240, y: 350, hp: 2 });
    r15.enemies.push({ type: 'flyer', x: 520, y: 320, hp: 2 });

    // Room 16: The Shattered Watchpost (first ranged enemy)
    const r16 = new Room(13, 0, "shattered_watchpost");
    r16.fillArea(0, 46, r16.width, 14, 1); // base
    r16.fillArea(40, 36, 12, 2, 1);
    r16.fillArea(80, 30, 12, 2, 1);
    r16.fillArea(140, 26, 12, 2, 1);
    // platforms and open mid-zone
    r16.enemies.push({ type: 'watcher', x: 220, y: 320, hp: 4 });
    r16.enemies.push({ type: 'watcher', x: 720, y: 320, hp: 4 });
    r16.enemies.push({ type: 'crawler', x: 360, y: 500, hp: 2 });
    r16.enemies.push({ type: 'crawler', x: 640, y: 500, hp: 2 });
    r16.enemies.push({ type: 'flyer', x: 480, y: 300, hp: 2 });
    // pistol upgrade reward sits in the tower center (increases pistol ammo)
    r16.items.push({ x: 480, y: 220, type: 'pistol_upgrade', color: 'rgba(200,180,255,0.95)' });

    // Room 17: The Windpass (speed pressure)
    const r17 = new Room(14, 0, 'windpass');
    r17.fillArea(0, 46, r17.width, 14, 1);
    // spaced platforms and landing stones
    r17.fillArea(30, 36, 6, 2, 1); r17.fillArea(70, 36, 6, 2, 1); r17.fillArea(120, 36, 6, 2, 1);
    r17.props.push({ type: 'platform', x: 200, y: 420, w: 36, h: 8 }); r17.props.push({ type: 'platform', x: 380, y: 420, w: 36, h: 8 });
    // enemies: 5 normal swarms + 3 fast spawns
    for (let i = 0; i < 5; i++) r17.enemies.push(spawnSwarm(100 + i * 160, 500, 'swarm'));

    // Room 18: Hanging Canopy (vertical climb)
    const r18 = new Room(15, 0, 'hanging_canopy');
    r18.fillArea(0, 38, r18.width, 22, 1); // base lower floor
    r18.fillArea(10, 28, 10, 2, 1); r18.fillArea(30, 22, 10, 2, 1); r18.fillArea(50, 16, 10, 2, 1); r18.fillArea(70, 10, 10, 2, 1);
    // vines props (visuals + obstacles)
    r18.props.push({ type: 'vine', x: 40, y: 60 }); r18.props.push({ type: 'vine', x: 200, y: 120 });
    // hazards: falling debris triggers and spike patches
    r18.props.push({ type: 'fall_trigger', x: 60, y: 30, w: 40, h: 12 });
    r18.props.push({ type: 'spike', x: 120, y: 480, w: 40, h: 12 });
    // enemies
    for (let i = 0; i < 6; i++) r18.enemies.push(spawnSwarm(80 + i * 80, 380, 'mini_swarm'));
    r18.enemies.push(spawnSwarm(240, 300, 'swarm')); r18.enemies.push(spawnSwarm(560, 260, 'swarm'));
    r18.items.push({ x: 480, y: 120, type: 'pistol_upgrade', color: 'rgba(200,220,255,0.95)' });

    // Room 19: The Broken Overpass (upper risky path)
    const r19 = new Room(16, 0, 'broken_overpass');
    r19.fillArea(0, 40, r19.width, 20, 1); // lower floor and underpass
    r19.fillArea(0, 20, 20, 2, 1); r19.fillArea(30, 16, 40, 2, 1); r19.fillArea(100, 12, 40, 2, 1); // upper bridge sections
    // upper watchers + mini swarms
    r19.enemies.push({ type: 'watcher', x: 150, y: 120, hp: 4 }); r19.enemies.push({ type: 'watcher', x: 520, y: 120, hp: 4 });
    for (let i = 0; i < 4; i++) r19.enemies.push(spawnSwarm(90 + i * 80, 140, 'mini_swarm'));
    // lower path enemies
    for (let i = 0; i < 6; i++) r19.enemies.push(spawnSwarm(60 + i * 90, 500, 'swarm'));
    r19.enemies.push(spawnSwarm(600, 480, 'fast_swarm')); r19.enemies.push(spawnSwarm(720, 480, 'fast_swarm'));
    // hidden item on upper route
    r19.secretFound = false;

    // Room 20: Runner Shrine (momentum module unlock/tutorial)
    const r20 = new Room(17, 0, 'runner_shrine');
    // Sections A/B/C laid out along x-axis
    r20.fillArea(0, 44, r20.width, 16, 1);
    // Section A: Slide tunnel (low ceiling)
    r20.fillArea(10, 40, 20, 4, 1); // low ceiling area (height reduced)
    r20.props.push({ type: 'low_ceiling', x: 60, y: 360, w: 180, h: 20 });
    // Section B: wallrun walls
    r20.fillArea(220, 20, 2, 32, 1); r20.fillArea(300, 20, 2, 32, 1);
    // Section C: momentum jump platform
    r20.fillArea(380, 34, 8, 2, 1);
    // Momentum Module sits on a pedestal
    r20.items.push({ x: 420, y: 260, type: 'momentum_module', color: 'rgba(140,255,140,0.95)', picked: false });
    r20.momentumUnlocked = false; r20.momentumRewardSpawned = false;

    // Room 21: Overgrown Gauntlet
    const r21 = new Room(18, 0, 'overgrown_gauntlet');
    r21.fillArea(0, 46, r21.width, 14, 1);
    // alternating high / low routes
    r21.fillArea(20, 36, 14, 2, 1); r21.fillArea(70, 32, 14, 2, 1); r21.fillArea(120, 36, 14, 2, 1);
    // wallrun walls and spikes
    r21.props.push({ type: 'wallrun', x: 40, y: 100 }); r21.props.push({ type: 'wallrun', x: 240, y: 100 });
    for (let i = 0; i < 5; i++) r21.enemies.push(spawnSwarm(80 + i * 120, 480, 'fast_swarm'));
    for (let i = 0; i < 6; i++) r21.enemies.push(spawnSwarm(120 + i * 80, 500, 'mini_swarm'));
    r21.enemies.push({ type: 'watcher', x: 420, y: 180, hp: 4 }); r21.enemies.push({ type: 'watcher', x: 640, y: 180, hp: 4 });
    r21.chaseActive = false; r21.chaseTimer = 0;

    // Room 22: The Canopy Break (setpiece)
    const r22 = new Room(19, 0, 'canopy_break');
    r22.fillArea(0, 30, r22.width, 24, 1);
    r22.fillArea(10, 24, 12, 2, 1); r22.fillArea(40, 18, 12, 2, 1); r22.fillArea(70, 12, 12, 2, 1); // fragile branches
    r22.props.push({ type: 'fragile', x: 60, y: 120, w: 40, h: 8 });
    r22.collapseTriggered = false; r22.collapsePhaseStarted = false;

    // Reward choice on completion
    r22.reward = { x: 520, y: 140, spawned: false, item: { type: 'momentum_dash', color: 'rgba(200,255,180,0.95)' } };

    // store rooms
    world.grid["0,0"] = r1;
    world.grid["1,0"] = r2;
    world.grid["2,0"] = r3;
    world.grid["3,0"] = r4;
    world.grid["4,0"] = r5;
    world.grid["0,1"] = r6;
    world.grid["1,1"] = r7;
    world.grid["5,0"] = r8;
    world.grid["6,0"] = r9;
    world.grid["7,0"] = r10;
    world.grid["8,0"] = r11;
    world.grid["9,0"] = r12;
    world.grid["10,0"] = r13;
    world.grid["11,0"] = r14;
    world.grid["12,0"] = r15;
    world.grid["13,0"] = r16;

// (Duplicate room block removed - new rooms 17-22 are defined earlier.)


// Room 25: Gloom Grove - Mixed combat + gloom weaver teaser
const r25 = new Room(22, 0, "echo_grove");
r25.fillArea(0, 44, r25.width, 16, 1);
r25.fillArea(20, 34, 24, 2, 1);
r25.fillArea(50, 30, 20, 2, 1);
r25.enemies.push({ type: "gloom_weaver", x: 500, y: 280, hp: 18, mini: true }); // weaker version
r25.enemies.push({ type: "flyer", x: 300, y: 340, hp: 4 });
r25.enemies.push({ type: "watcher", x: 700, y: 320, hp: 6 });
r25.items.push({ x: 48 * TILE_SIZE, y: 26 * TILE_SIZE, type: "pistol_ammo" });
world.grid["22,0"] = r25;

// Room 26: Broken Canopy - Large open arena before next major setpiece
const r26 = new Room(23, 0, "pistol_arena");
r26.fillArea(0, 42, r26.width, 18, 1);
// scattered high platforms
r26.fillArea(10, 34, 16, 2, 1);
r26.fillArea(40, 28, 20, 2, 1);
r26.fillArea(70, 32, 14, 2, 1);
r26.fillArea(25, 18, 12, 2, 1);     // high reward platform
r26.enemies.push({ type: "watcher", x: 300, y: 300, hp: 7 });
r26.enemies.push({ type: "watcher", x: 600, y: 260, hp: 7 });
r26.enemies.push({ type: "flyer", x: 450, y: 180, hp: 5 });
r26.enemies.push({ type: "flyer", x: 750, y: 220, hp: 5 });
r26.items.push({ x: 31 * TILE_SIZE, y: 16 * TILE_SIZE, type: "core" });
world.grid["23,0"] = r26;

// Atmosphere pass for new rooms
[r17,r18,r19,r20,r21,r22,r23,r24,r25,r26].forEach(r => {
    if (r) r.generateAtmosphere();
});

    // atmosphere pass
    for (let key in world.grid) {
        world.grid[key].generateAtmosphere();
    }

    // basic enemy placement
    r2.enemies.push({ type: "crawler", x: 400, y: 500, vx: 0, vy: 0, hp: 3 });
    r2.enemies.push({ type: "crawler", x: 700, y: 500, vx: 0, vy: 0, hp: 3 });

    r3.enemies.push({ type: "flyer", x: 600, y: 300, vx: 0, vy: 0, hp: 2 });

    r5.enemies.push({ type: "gloom_weaver", x: 600, y: 400, vx: 0, vy: 0, hp: 20, boss: true });

    r7.enemies.push({ type: "crawler", x: 500, y: 520, vx: 0, vy: 0, hp: 4 });
    r7.enemies.push({ type: "flyer", x: 720, y: 280, vx: 0, vy: 0, hp: 3 });
}

// ======================================================
// WORLD DRAWING WITH ENHANCED GRAPHICS
// ======================================================
function drawWorld() {
    for (let key in world.grid) {
        const room = world.grid[key];

        const ox = room.gx * WORLD_W;
        const oy = room.gy * WORLD_H;

        // draw god rays with enhanced visuals
        for (const ray of room.godRays) {
            ctx.fillStyle = `rgba(${ray.color}, ${ray.opacity})`;
            ctx.fillRect(ox + ray.x - cameraX, oy - cameraY, ray.w, WORLD_H);
            
            // Ray shimmer effect
            ctx.fillStyle = `rgba(${ray.color}, ${ray.opacity * 0.5})`;
            ctx.fillRect(ox + ray.x + 20 - cameraX, oy - cameraY, ray.w * 0.6, WORLD_H);
        }

        // draw props with enhanced details
        for (const prop of room.props) {
            ctx.save();
            ctx.translate(ox + prop.x - cameraX, oy + prop.y - cameraY);

            // subtle twitch for intro props (tw field)
            if (prop.tw && prop.tw > 0) {
                const drift = Math.sin(Date.now() / 120) * prop.tw * 0.6;
                ctx.translate(0, -drift);
                prop.tw = Math.max(0, prop.tw - 0.08);
            }

            if (prop.rot) ctx.rotate(prop.rot);

            // Base color with gradient effect
            ctx.fillStyle = prop.color;
            ctx.fillRect(-prop.w / 2, 0, prop.w, prop.h);
            
            // Shadow detail
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(-prop.w / 2, 0, 3, prop.h);

            // subtle windows for town buildings with animation
            if (prop.type === "building") {
                for (let i = 0; i < 6; i++) {
                    const flicker = Math.sin((Date.now() / 200) + i) * 0.2;
                    ctx.fillStyle = `rgba(60,90,70,${0.15 + flicker})`;
                    ctx.fillRect(-prop.w / 2 + 8, 20 + i * 40, prop.w - 16, 12);
                    
                    // Window highlights
                    ctx.fillStyle = `rgba(120, 160, 140, ${0.1 + flicker})`;
                    ctx.fillRect(-prop.w / 2 + 10, 22 + i * 40, 3, 8);
                }
            } else if (prop.type === 'intro_sword') {
                // small half-buried sword for intro cutscene
                const tw = prop.tw || 0;
                ctx.save();
                ctx.translate(0, -Math.abs(tw));
                // blade
                ctx.fillStyle = 'rgba(200,200,200,0.95)';
                ctx.fillRect(-prop.w/2, -prop.h/2, prop.w, 2);
                // hilt
                ctx.fillStyle = 'rgba(120,80,50,0.95)';
                ctx.fillRect(-4, -prop.h/2 + 2, 8, 3);
                ctx.restore();
            }

            ctx.restore();
        }

        // draw tiles with enhanced shading and detail
        for (let y = 0; y < room.height; y++) {
            for (let x = 0; x < room.width; x++) {
                if (room.tiles[y][x] === 1) {
                    const px = ox + x * TILE_SIZE - cameraX;
                    const py = oy + y * TILE_SIZE - cameraY;

                    // base ground color
                    ctx.fillStyle = "#0b0f0d";
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                    // darker edges for depth
                    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
                    ctx.fillRect(px, py, 2, TILE_SIZE);
                    ctx.fillRect(px, py, TILE_SIZE, 2);

                    // top highlight and detail
                    if (y > 0 && room.tiles[y - 1][x] === 0) {
                        ctx.fillStyle = "rgba(90,140,110,0.15)";
                        ctx.fillRect(px, py, TILE_SIZE, 4);

                        // cracks / moss speckle with more detail
                        ctx.fillStyle = "rgba(0,0,0,0.18)";
                        for (let i = 0; i < 2; i++) {
                            ctx.fillRect(px + Math.random() * TILE_SIZE, py + 6, 5 + Math.random() * 7, 2);
                        }
                        
                        // Lighter spots
                        ctx.fillStyle = "rgba(255,255,255,0.05)";
                        ctx.fillRect(px + Math.random() * TILE_SIZE, py + Math.random() * 3, 3, 1);
                    }
                }
            }
        }

        // draw brush with enhanced detail
        for (const b of room.brush) {
            const bx = ox + b.x - cameraX;
            const by = oy + b.y - cameraY;

            if (b.type === "grass") {
                ctx.fillStyle = "rgba(70,160,90,0.35)";
                ctx.fillRect(bx, by - b.h, b.w, b.h);
                // grass highlight
                ctx.fillStyle = "rgba(100,190,120,0.25)";
                ctx.fillRect(bx, by - b.h, b.w / 3, b.h);
            } else if (b.type === "moss") {
                ctx.fillStyle = "rgba(90,150,110,0.28)";
                ctx.fillRect(bx, by - b.h, b.w, b.h);
                // moss texture
                ctx.fillStyle = "rgba(60,120,80,0.15)";
                for (let i = 0; i < 2; i++) {
                    ctx.fillRect(bx + Math.random() * b.w, by - b.h + Math.random() * b.h, 2, 2);
                }
            } else {
                ctx.fillStyle = "rgba(70,160,90,0.25)";
                ctx.fillRect(bx, by - b.h, b.w, b.h);
            }
        }

        // draw items with enhanced glow and animation
        for (const item of room.items) {
            const ix = ox + item.x - cameraX;
            const iy = oy + item.y - cameraY;
            const bob = Math.sin(Date.now() / 400 + item.x) * 2;

            if (item.type === "core") {
                // Crystal core with pulsing energy
                const coreGlow = 0.2 + Math.sin(Date.now() / 300) * 0.15;
                
                // Large outer aura
                ctx.fillStyle = `rgba(120,255,180,${coreGlow * 0.3})`;
                ctx.beginPath();
                ctx.arc(ix, iy + bob, 30, 0, Math.PI * 2);
                ctx.fill();
                
                // Mid aura
                ctx.fillStyle = `rgba(120,255,180,${coreGlow * 0.5})`;
                ctx.beginPath();
                ctx.arc(ix, iy + bob, 20, 0, Math.PI * 2);
                ctx.fill();
                
                // Crystal body with facets
                ctx.save();
                ctx.translate(ix, iy + bob);
                ctx.rotate(Date.now() / 2000);
                
                ctx.fillStyle = item.color || "rgba(120,255,180,0.95)";
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(10, -6);
                ctx.lineTo(10, 6);
                ctx.lineTo(0, 12);
                ctx.lineTo(-10, 6);
                ctx.lineTo(-10, -6);
                ctx.closePath();
                ctx.fill();
                
                // Crystal shine
                ctx.fillStyle = "rgba(255,255,255,0.6)";
                ctx.fillRect(-3, -8, 6, 6);
                
                // Inner core glow
                ctx.fillStyle = `rgba(200,255,220,${0.7 + coreGlow * 0.3})`;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
                
            } else if (item.type === "shrine") {
                // Glowing shrine altar with sacred geometry
                const shrineGlow = 0.4 + Math.sin(Date.now() / 400) * 0.2;
                
                // Sacred aura rings
                ctx.strokeStyle = `rgba(160,255,200,${shrineGlow * 0.4})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(ix, iy + bob, 25, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.strokeStyle = `rgba(160,255,200,${shrineGlow * 0.25})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(ix, iy + bob, 35, 0, Math.PI * 2);
                ctx.stroke();
                
                // Shrine base/pedestal
                ctx.fillStyle = item.color || "rgba(160,255,200,0.85)";
                ctx.fillRect(ix - 10, iy + bob - 4, 20, 14);
                
                // Top ornament
                ctx.beginPath();
                ctx.moveTo(ix - 12, iy + bob - 6);
                ctx.lineTo(ix, iy + bob - 14);
                ctx.lineTo(ix + 12, iy + bob - 6);
                ctx.fill();
                
                // Center symbol (cross)
                ctx.fillStyle = "rgba(255,255,255,0.7)";
                ctx.fillRect(ix - 2, iy + bob, 4, 8);
                ctx.fillRect(ix - 4, iy + bob + 2, 8, 4);
                
                // Sacred glow particles
                for (let i = 0; i < 3; i++) {
                    const angle = (Date.now() / 1000 + i * Math.PI * 2 / 3);
                    const px = ix + Math.cos(angle) * 20;
                    const py = iy + bob + Math.sin(angle) * 20;
                    ctx.fillStyle = `rgba(160,255,200,${0.6 * shrineGlow})`;
                    ctx.beginPath();
                    ctx.arc(px, py, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
            } else if (item.type === "trap_marker") {
                // Danger warning marker with animated spikes
                const danger = 0.5 + Math.sin(Date.now() / 200) * 0.3;
                
                // Warning aura (pulsing red)
                ctx.fillStyle = `rgba(255,80,80,${danger * 0.25})`;
                ctx.beginPath();
                ctx.arc(ix, iy + bob, 28, 0, Math.PI * 2);
                ctx.fill();
                
                // Spike formation
                ctx.fillStyle = `rgba(255,80,80,${0.8 * danger})`;
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI / 3);
                    ctx.save();
                    ctx.translate(ix, iy + bob);
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-4, 12);
                    ctx.lineTo(4, 12);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
                
                // Center warning symbol
                ctx.fillStyle = "rgba(255,150,150,0.9)";
                ctx.beginPath();
                ctx.arc(ix, iy + bob, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = "rgba(255,80,80,0.8)";
                ctx.fillRect(ix - 2, iy + bob - 3, 4, 6);
                
            } else {
                // Default item rendering
                const glowIntensity = 0.15 + Math.sin(Date.now() / 500) * 0.1;
                ctx.fillStyle = `rgba(120,255,160,${glowIntensity})`;
                ctx.beginPath();
                ctx.arc(ix, iy + bob, 22, 0, Math.PI * 2);
                ctx.fill();

                // Item body
                ctx.fillStyle = item.color || "rgba(120,255,160,0.95)";
                ctx.fillRect(ix - 8, iy + bob - 8, 16, 16);
                
                // Item shine
                ctx.fillStyle = "rgba(255,255,255,0.4)";
                ctx.fillRect(ix - 6, iy + bob - 6, 4, 4);
            }
        }

        // draw enemies with enhanced visuals
        for (const e of room.enemies) {
            const ex = ox + e.x - cameraX;
            const ey = oy + e.y - cameraY;

            if (e.type === "crawler") {
                if (typeof HIGH_DETAIL_SPRITES !== 'undefined' && HIGH_DETAIL_SPRITES) {
                    // Detailed shell with subtle gradients
                    const grad = ctx.createLinearGradient(ex - 16, ey - 8, ex + 16, ey + 8);
                    grad.addColorStop(0, 'rgba(40,85,60,0.95)'); grad.addColorStop(1, 'rgba(70,120,90,0.95)');
                    ctx.fillStyle = grad;
                    roundRect(ctx, ex - 18, ey - 12, 36, 20, 6);

                    // Shell ridge
                    ctx.strokeStyle = 'rgba(20,40,30,0.6)'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(ex - 12, ey - 6); ctx.quadraticCurveTo(ex, ey - 16, ex + 12, ey - 6); ctx.stroke();

                    // Eyes
                    ctx.fillStyle = 'rgba(150,255,200,0.95)'; ctx.beginPath(); ctx.arc(ex - 6, ey - 3, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(ex + 6, ey - 3, 3, 0, Math.PI * 2); ctx.fill();

                    // legs with segmented joints
                    ctx.strokeStyle = 'rgba(30,70,50,0.9)'; ctx.lineWidth = 2.5;
                    for (let i = 0; i < 3; i++) {
                        const lx = ex - 10 + i * 10;
                        ctx.beginPath(); ctx.moveTo(lx, ey + 10); ctx.lineTo(lx - 4, ey + 18); ctx.lineTo(lx + 4, ey + 18); ctx.stroke();
                    }

                } else {
                    // Enhanced crawler with legs and detail
                    ctx.fillStyle = "rgba(50,95,70,0.95)";
                    ctx.fillRect(ex - 16, ey - 10, 32, 18);

                    // Shell shine
                    ctx.fillStyle = "rgba(100,150,120,0.4)";
                    ctx.fillRect(ex - 12, ey - 8, 24, 4);

                    // Eyes with glow
                    ctx.fillStyle = "rgba(150,255,200,0.8)";
                    ctx.beginPath();
                    ctx.arc(ex - 6, ey - 3, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(ex + 6, ey - 3, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Legs
                    ctx.strokeStyle = "rgba(50,95,70,0.7)";
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 3; i++) {
                        const legX = -10 + i * 10;
                        ctx.beginPath();
                        ctx.moveTo(ex + legX, ey + 8);
                    ctx.lineTo(ex + legX - 2, ey + 15);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(ex + legX, ey + 8);
                    ctx.lineTo(ex + legX + 2, ey + 15);
                    ctx.stroke();
                }

            } else if (e.type === "flyer") {
                // Enhanced flyer with wings and detail
                ctx.save();
                
                // Wing animation
                const wingFlap = Math.sin(Date.now() / 100 + e.y) * 0.4;
                ctx.translate(ex, ey);
                ctx.rotate(wingFlap);

                // Wings
                ctx.fillStyle = "rgba(60,100,80,0.5)";
                ctx.beginPath();
                ctx.ellipse(-12, 0, 10, 6, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(12, 0, 10, 6, 0.3, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                // Body
                ctx.fillStyle = "rgba(40,80,60,0.9)";
                ctx.beginPath();
                ctx.arc(ex, ey, 14, 0, Math.PI * 2);
                ctx.fill();

                // Eyes with glow
                ctx.fillStyle = "rgba(150,255,200,0.7)";
                ctx.beginPath();
                ctx.arc(ex - 4, ey - 2, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(ex + 4, ey - 2, 2, 0, Math.PI * 2);
                ctx.fill();

                // Energy aura
                ctx.strokeStyle = "rgba(120,255,200,0.3)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(ex, ey, 24, 0, Math.PI * 2);
                ctx.stroke();

            } else if (e.type === "root_titan") {
                // Rooted Colossus high-detail rendering
                if (typeof HIGH_DETAIL_SPRITES !== 'undefined' && HIGH_DETAIL_SPRITES) {
                    // body mass with layered rings
                    ctx.save();
                    const g = ctx.createRadialGradient(ex, ey - 10, 8, ex, ey - 10, 80);
                    g.addColorStop(0, 'rgba(90,180,120,0.95)');
                    g.addColorStop(1, 'rgba(18,40,18,0.9)');
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.ellipse(ex, ey - 6, e.w/2 + 6, e.h/2 + 8, 0, 0, Math.PI*2); ctx.fill();

                    // core glow
                    ctx.fillStyle = `rgba(100,255,160,${0.45 + (1 - e.hp / e.maxHp) * 0.55})`;
                    ctx.beginPath(); ctx.arc(ex, ey - 22, 20 + (e.charge ? 8 : 0), 0, Math.PI*2); ctx.fill();
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.fillStyle = `rgba(100,255,160,${0.12 + (1 - e.hp / e.maxHp) * 0.25})`;
                    ctx.beginPath(); ctx.arc(ex, ey - 22, 36, 0, Math.PI*2); ctx.fill();
                    ctx.globalCompositeOperation = 'source-over';

                    // root tendrils
                    ctx.strokeStyle = 'rgba(24,50,30,0.7)'; ctx.lineWidth = 2.5;
                    for (let i = 0; i < 5; i++) {
                        const ang = i / 5 * Math.PI * 2 + (Date.now() / 600);
                        ctx.beginPath(); ctx.moveTo(ex + Math.cos(ang) * 6, ey + Math.sin(ang) * 2);
                        ctx.quadraticCurveTo(ex + Math.cos(ang) * 24, ey + Math.sin(ang) * 18, ex + Math.cos(ang) * 48, ey + Math.sin(ang) * 28);
                        ctx.stroke();
                    }

                    // cracks and bark detail with small highlights
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'rgba(10,30,12,0.6)';
                    for (let i=0;i<6;i++) {
                        ctx.beginPath(); ctx.moveTo(ex + (Math.random()-0.5)*40, ey + (Math.random()-0.5)*20);
                        ctx.lineTo(ex + (Math.random()-0.5)*74, ey + (Math.random()-0.5)*44); ctx.stroke();
                    }

                    // hp bar
                    ctx.fillStyle = 'rgba(0,0,0,0.66)'; ctx.fillRect(ex - 54, ey - 84, 108, 10);
                    ctx.fillStyle = 'rgba(120,255,160,0.95)'; ctx.fillRect(ex - 52, ey - 82, 104 * (Math.max(0,e.hp)/e.maxHp), 6);
                    ctx.restore();
                } else {
                    // Rooted Colossus rendering (fallback)
                    const bossGlow = 0.25 + Math.sin(Date.now() / 200) * 0.2;
                    ctx.fillStyle = `rgba(30,70,40,0.95)`;
                    ctx.beginPath();
                    ctx.ellipse(ex, ey, e.w/2, e.h/2, 0, 0, Math.PI*2);
                    ctx.fill();
                    // core glow
                    ctx.fillStyle = `rgba(100,255,160,${0.4 + (1 - e.hp / e.maxHp) * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(ex, ey - 20, 18 + (e.charge ? 6 : 0), 0, Math.PI*2);
                    ctx.fill();
                    // root cracks
                    ctx.strokeStyle = `rgba(20,40,20,0.6)`;
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 4; i++) {
                        ctx.beginPath();
                        ctx.moveTo(ex, ey - 8);
                        ctx.lineTo(ex + Math.cos(i / 4 * Math.PI * 2) * (30 + i * 4), ey + Math.sin(i / 4 * Math.PI * 2) * (20 + i * 4));
                        ctx.stroke();
                    }
                    // hp bar above boss
                    ctx.fillStyle = "rgba(0,0,0,0.6)";
                    ctx.fillRect(ex - 50, ey - 72, 100, 8);
                    ctx.fillStyle = "rgba(120,255,160,0.9)";
                    ctx.fillRect(ex - 48, ey - 70, 96 * (Math.max(0,e.hp)/e.maxHp), 4);
                }
            } else if (e.type === "gloom_weaver") {
                // Enhanced boss with menacing appearance
                const bossGlow = 0.3 + Math.sin(Date.now() / 300) * 0.2;

                // Outer aura
                ctx.fillStyle = `rgba(90,255,170,${bossGlow * 0.25})`;
                ctx.beginPath();
                ctx.arc(ex, ey, 70, 0, Math.PI * 2);
                ctx.fill();

                // Core body
                ctx.fillStyle = "rgba(20,35,30,0.98)";
                ctx.beginPath();
                ctx.arc(ex, ey, 32, 0, Math.PI * 2);
                ctx.fill();

                // Eyes with intensity
                ctx.fillStyle = `rgba(150,255,180,${0.7 + bossGlow * 0.3})`;
                ctx.fillRect(ex - 16, ey - 8, 8, 8);
                ctx.fillRect(ex + 8, ey - 8, 8, 8);
                
                // Center eye
                ctx.beginPath();
                ctx.arc(ex, ey + 8, 5, 0, Math.PI * 2);
                ctx.fill();

                // Menacing tendrils
                ctx.strokeStyle = `rgba(150,200,180,${0.5 * bossGlow})`;
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI / 2) + (Date.now() / 1000);
                    ctx.beginPath();
                    ctx.moveTo(ex, ey);
                    ctx.quadraticCurveTo(
                        ex + Math.cos(angle) * 25,
                        ey + Math.sin(angle) * 25,
                        ex + Math.cos(angle) * 40,
                        ey + Math.sin(angle) * 40
                    );
                    ctx.stroke();
                }
            }

            // hp bar for bosses with detail
            if (e.boss) {
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(ex - 40, ey - 60, 80, 8);
                
                ctx.fillStyle = "rgba(150,255,180,0.3)";
                ctx.fillRect(ex - 38, ey - 58, 76, 4);

                ctx.fillStyle = "rgba(120,255,160,0.8)";
                const hpPct = Math.max(0, e.hp) / 20;
                ctx.fillRect(ex - 38, ey - 58, 76 * hpPct, 4);
                
                // HP text
                ctx.fillStyle = "rgba(120,255,160,0.9)";
                ctx.font = 'bold 8px Arial';
                ctx.fillText(`${Math.ceil(Math.max(0, e.hp))} / 20`, ex - 20, ey - 65);
            }

            // Draw arena lock indicator (if room has locked waves)
            if (room.waves && room.locked) {
                ctx.fillStyle = 'rgba(255,80,80,0.06)';
                ctx.fillRect(ox, oy, WORLD_W, WORLD_H);
                ctx.fillStyle = 'rgba(255,80,80,0.12)';
                ctx.font = 'bold 10px Arial';
                ctx.fillText('ARENA LOCKED', ox + WORLD_W/2 - 36 - cameraX, oy + 16 - cameraY);
            }
        }
        // draw particles with enhanced visuals
        for (const p of room.particles) {
            const px = ox + p.x - cameraX;
            const py = oy + p.y - cameraY;

            ctx.save();
            ctx.globalAlpha = p.alpha ?? 0.6;

            ctx.fillStyle = p.color || "rgba(120,255,160,0.6)";
            
            // Particle glow
            ctx.shadowBlur = (p.size || 2) * 1.5;
            ctx.shadowColor = p.color || "rgba(120,255,160,0.8)";
            
            ctx.beginPath();
            ctx.arc(px, py, (p.size || 2), 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}

// ======================================================
// ENEMY + PARTICLE UPDATES
// ======================================================
function spawnWave(room, index) {
    if (!room.waves || index < 0 || index >= room.waves.length) return;
    const wave = room.waves[index];
    for (const spec of wave) {
        const e = { x: spec.x, y: spec.y, vx: 0, vy: 0, type: spec.type, hp: spec.hp };
        if (spec.type === 'gloom_weaver') {
            e.boss = true;
            e.maxHp = spec.hp;
            e.animTimer = Math.random() * 100;
        }
        room.enemies.push(e);
        // spawn a little burst to indicate arrival
        room.particles.push({ x: e.x, y: e.y, vx: 0, vy: 0, alpha: 0.9, size: 3, life: 30, color: 'rgba(255,200,150,0.6)' });
    }
    // play a spawn sound when wave spawns
    if (typeof AudioManager !== 'undefined') AudioManager.playSFX('spawn');
}

function updateEnemiesAndParticles(room) {
    // Handle arena waves (trigger when player first enters)
    if (room.waves) {
        // find player in this room
        const playerRX = Math.floor((player.x + player.w/2) / WORLD_W);
        const playerRY = Math.floor((player.y + player.h/2) / WORLD_H);
        if (!room.locked && room.gx === playerRX && room.gy === playerRY) {
            room.locked = true;
            room.waveIndex = 0;
            room.waveTimer = 0;
            spawnWave(room, 0);
        }

        // Progress arena waves if started and no enemies remain
        if (room.locked && room.waveIndex >= 0) {
            if (room.enemies.length === 0) {
                room.waveTimer++;
                if (room.waveTimer > 120) {
                    room.waveIndex++;
                    room.waveTimer = 0;
                    if (room.waveIndex < room.waves.length) {
                        spawnWave(room, room.waveIndex);
                    } else {
                        // all waves cleared: spawn reward
                        if (room.reward && !room.reward.spawned) {
                            room.items.push({ x: room.reward.x, y: room.reward.y, ...room.reward.item });
                            room.reward.spawned = true;
                            room.locked = false;
                        }
                    }
                }
            }
        }
    }

    // Pistol pickup event waves (slow waves after pickup in certain room)
    if (room.pistolEvent) {
        // When room is clear of enemies, advance timer and spawn next wave slowly
        if (room.enemies.length === 0) {
            room.pistolEvent.waveTimer++;
            if (room.pistolEvent.waveTimer > 90) { // slow cadence
                const wi = room.pistolEvent.waveIndex;
                if (wi >= 0 && wi < room.pistolEvent.waves.length) {
                    const wave = room.pistolEvent.waves[wi];
                    for (const spec of wave) {
                        room.enemies.push({ x: spec.x, y: spec.y, vx: 0, vy: 0, type: spec.type, hp: spec.hp });
                        room.particles.push({ x: spec.x, y: spec.y, vx: 0, vy: 0, life: 30, color: 'rgba(255,200,150,0.6)', size: 3 });
                    }
                    room.pistolEvent.waveIndex++;
                    room.pistolEvent.waveTimer = 0;
                } else {
                    // finished pistol event
                    room.pistolEvent = null;
                }
            }
        }
    }

    // Room-type special mechanics
    if (room.type === 'windpass') {
        // gentle lateral wind and leaf particles
        const dir = 1; // push to the right (could be room-specified)
        player.vx += WIND_FORCE * dir;
        if (Math.random() < 0.05) spawnWindLeaf(room, room.gx * WORLD_W + (Math.random() * WORLD_W), room.gy * WORLD_H + Math.random() * WORLD_H, dir);

        // occasional fast swarm spawn ahead of the player
        if (Math.random() < 0.01) {
            const px = Math.floor(player.x + player.facing * 200);
            room.enemies.push(spawnSwarm(px - room.gx * WORLD_W, 420, 'fast_swarm'));
        }
    }

    if (room.type === 'hanging_canopy') {
        // vertical ambience: vines & falling debris chances
        if (Math.random() < 0.02) {
            const vx = room.gx * WORLD_W + Math.random() * WORLD_W;
            const vy = room.gy * WORLD_H + Math.random() * WORLD_H/2;
            spawnParticle(room, vx - room.gx * WORLD_W, vy - room.gy * WORLD_H, 'fog');
        }
    }

    if (room.type === 'broken_overpass') {
        // secret upper reward: detect if player reached high area and reveal hidden item
        if (!room.secretFound && player.y < room.gy * WORLD_H + 160) {
            room.secretFound = true;
            room.items.push({ x: 220, y: 140, type: 'pistol_upgrade', color: 'rgba(220,180,255,0.95)' });
        }
    }

    if (room.type === 'runner_shrine') {
        // If player collected momentum module item, spawn the exit wave
        if (room.momentumUnlocked && !room.momentumRewardSpawned && room.enemies.length === 0) {
            // spawn exit wave once
            for (let i = 0; i < 8; i++) {
                room.enemies.push(spawnSwarm(120 + i * 60, 480, 'mini_swarm'));
            }
            room.momentumRewardSpawned = true;
        }
    }

    if (room.type === 'overgrown_gauntlet') {
        // chase segment: trigger spike floor when player reaches midline
        if (!room.chaseActive && (player.x - room.gx * WORLD_W) > WORLD_W/2) {
            room.chaseActive = true; room.chaseTimer = 0;
            // turn on spike props (simple toggle)
            for (const p of room.props) if (p.type === 'spike') p.active = true;
        }
        if (room.chaseActive) {
            room.chaseTimer++;
            if (room.chaseTimer > 300) {
                room.chaseActive = false;
                for (const p of room.props) if (p.type === 'spike') p.active = false;
            }
        }
    }

    if (room.type === 'canopy_break') {
        if (!room.collapseTriggered && (player.x - room.gx * WORLD_W) > WORLD_W/3 && player.y < room.gy * WORLD_H + WORLD_H/2) {
            room.collapseTriggered = true; room.collapseTimer = 0;
        }
        if (room.collapseTriggered && !room.collapsePhaseStarted) {
            room.collapseTimer++;
            if (room.collapseTimer > 100) {
                // start collapse
                room.collapsePhaseStarted = true;
                // spawn debris across top
                for (let i=0;i<12;i++) spawnCollapseDebris(room, room.gx * WORLD_W + 120 + i * 60, room.gy * WORLD_H + 80, 4);
                player.shakeTimer = 40;
                // spawn phase 2 enemies shortly after
                setTimeout(()=>{
                    for (let i=0;i<3;i++) room.enemies.push(spawnSwarm(120 + i * 160, 520, 'fast_swarm'));
                    for (let i=0;i<6;i++) room.enemies.push(spawnSwarm(80 + i * 80, 480, 'mini_swarm'));
                    room.enemies.push({ type: 'mini_boss', x: 520, y: 440, hp: 6, maxHp: 6 });
                }, 600);
            }
        }
    }

    // props interactions: breakable platforms and fall triggers
    if (room.props) {
        for (let pi = room.props.length - 1; pi >= 0; pi--) {
            const p = room.props[pi];
            if (p.type === 'breakable' && !p.broken) {
                const px = room.gx * WORLD_W + p.x;
                const py = room.gy * WORLD_H + p.y;
                if (player.x + player.w > px - p.w/2 && player.x < px + p.w/2 && player.y + player.h > py && player.y < py + p.h) {
                    // break it
                    p.broken = true;
                    for (let i = 0; i < 6; i++) {
                        const d = spawnDebris(px + Math.random() * p.w - p.w/2, py + Math.random() * p.h - p.h/2);
                        room.enemies.push(d);
                        room.particles.push({ x: d.x, y: d.y, vx: d.vx, vy: d.vy, alpha: 0.9, size: 3, life: 40, color: 'rgba(160,120,80,0.6)' });
                    }
                }
            }
            if (p.type === 'fall_trigger' && !p.triggered) {
                const px = room.gx * WORLD_W + p.x;
                const py = room.gy * WORLD_H + p.y;
                if (player.x + player.w > px && player.x < px + p.w && player.y + player.h > py && player.y < py + p.h) {
                    p.triggered = true;
                    // spawn falling debris from above
                    for (let i = 0; i < 6; i++) {
                        const d = spawnDebris(px + Math.random() * p.w, 0);
                        room.enemies.push(d);
                    }
                }
            }
            if (p.type === 'spike' && !p.hidden) {
                // spike is static, handled in player collision code
            }
        }
    }

    // enemy AI
    for (let i = room.enemies.length - 1; i >= 0; i--) {
        const e = room.enemies[i];

        // Boss special handling
        if (e.type === 'root_titan') {
            updateBoss(e, room);
            continue; // skip normal enemy handling
        }

        // basic gravity for crawlers and debris pieces
        if (e.type === "crawler" || e.type === 'debris') {
            e.vy += 0.4;
            e.x += e.vx || 0;
            e.y += e.vy || 0;

            if (!e.dir && e.type === 'crawler') e.dir = Math.random() < 0.5 ? -1 : 1;
            if (e.type === 'crawler') e.vx = e.dir * 0.8;

            // floor collision (super simple)
            if (e.y > (ROOM_HEIGHT_TILES * TILE_SIZE) - 80) {
                e.y = (ROOM_HEIGHT_TILES * TILE_SIZE) - 80;
                e.vy = 0;
            }

            // bounce direction sometimes
            if (Math.random() < 0.01 && e.type === 'crawler') e.dir *= -1;
        }

        // flyers hover + chase
        if (e.type === "flyer") {
            if (!e.baseY) e.baseY = e.y;

            e.t = (e.t || 0) + 0.04;
            e.y = e.baseY + Math.sin(e.t) * 20;

            // mild player attraction
            const dx = player.x - (room.gx * WORLD_W + e.x);
            if (Math.abs(dx) < 350) {
                e.x += Math.sign(dx) * 0.8;
            }
        }

        // watcher husk (ranged turret)
        if (e.type === 'watcher' || e.type === 'watcher_husk') {
            e.t = (e.t || 0) + 0.02;
            e.cooldown = e.cooldown || 0;
            if (e.cooldown > 0) e.cooldown--;

            const dx = player.x - (room.gx * WORLD_W + e.x);
            const dy = player.y - (room.gy * WORLD_H + e.y);
            const dist = Math.hypot(dx, dy);

            // Fire when player in range and cooldown ready
            if (dist < 350 && e.cooldown <= 0) {
                const angle = Math.atan2(dy, dx);
                const bx = room.gx * WORLD_W + e.x + Math.cos(angle) * 10;
                const by = room.gy * WORLD_H + e.y + Math.sin(angle) * 10;
                const speed = 6;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                spawnBullet(bx, by, vx, vy, 1, 'enemy');
                room.particles.push({ x: e.x, y: e.y, vx: (Math.random() - 0.5) * 1, vy: (Math.random() - 0.5) * 1, life: 30, color: 'rgba(120,255,100,0.5)' });
                e.cooldown = 90; // 1.5s cooldown
            }

            // retreat slightly when player gets close
            if (dist < 80) {
                e.x -= Math.sign(dx) * 1.5;
            }
        }

        // gloom weaver boss
        if (e.type === "gloom_weaver") {
            e.t = (e.t || 0) + 0.03;

            // floaty movement
            e.y += Math.sin(e.t) * 0.5;

            const dx = player.x - (room.gx * WORLD_W + e.x);
            if (Math.abs(dx) < 500) {
                e.x += Math.sign(dx) * 0.5;
            }

            // attack particles
            if (Math.random() < 0.05) {
                room.particles.push({
                    x: e.x + (Math.random() - 0.5) * 40,
                    y: e.y + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    alpha: 0.6,
                    size: 3,
                    life: 50,
                    color: "rgba(120,255,170,0.4)"
                });
            }
        }

        // Boss update is implemented in `boss_ai.js` and called globally
        // (keeps `world.js` focused on world mechanics and avoids nested function definitions)
        // The function `updateBoss(e, room)` is loaded earlier by `index.js` and is available globally.
        // (No inline boss function here.)

        // remove dead enemies
        if (e.hp !== undefined && e.hp <= 0) {
            // death burst
            for (let j = 0; j < 15; j++) {
                room.particles.push({
                    x: e.x,
                    y: e.y,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    alpha: 0.8,
                    size: 2 + Math.random() * 3,
                    life: 40,
                    color: "rgba(120,255,170,0.5)"
                });
            }

            room.enemies.splice(i, 1);
        }
    }

    // After enemy loop, handle waves progression
    if (room.waves) {
        if (room.enemies.length === 0) {
            if (room.waveIndex >= 0 && room.waveIndex < room.waves.length - 1) {
                // next wave after a short delay
                room.waveTimer = (room.waveTimer || 0) + 1;
                if (room.waveTimer > 90) {
                    room.waveIndex++;
                    spawnWave(room, room.waveIndex);
                    room.waveTimer = 0;
                }
            } else if (room.waveIndex === room.waves.length - 1) {
                // all waves cleared => reward and unlock
                if (!room.reward.spawned) {
                    room.items.push(room.reward.item);
                    room.reward.spawned = true;
                }
                room.locked = false;
                room.waveIndex = -2; // mark as finished
            }
        }
    }

    // particles update
    for (let i = room.particles.length - 1; i >= 0; i--) {
        const p = room.particles[i];

        p.x += p.vx || 0;
        p.y += p.vy || 0;

        p.vx *= 0.98;
        p.vy *= 0.98;

        if (p.life !== undefined) {
            p.life--;
            p.alpha = (p.life / 50);
        }

        if (p.life !== undefined && p.life <= 0) {
            room.particles.splice(i, 1);
        }
    }
}
