// audio.js - Simple AudioManager for music and SFX

const AudioManager = {
    music: null,
    sfx: {},
    muted: false,
    volume: 0.9,

    load() {
        // Minimal set of sounds; provide safe fallbacks
        this.sfx.hit = new Audio(); this.sfx.hit.src = 'https://cdn.example.com/sfx/hit.mp3';
        this.sfx.spawn = new Audio(); this.sfx.spawn.src = 'https://cdn.example.com/sfx/spawn.mp3';
        this.sfx.boss_die = new Audio(); this.sfx.boss_die.src = 'https://cdn.example.com/sfx/boss_die.mp3';

        this.music = new Audio(); this.music.src = 'https://cdn.example.com/music/ambient_loop.mp3';
        this.music.loop = true; this.music.volume = 0.5;
    },

    playMusic() {
        if (this.muted) return;
        try { this.music.play(); } catch (e) { /* play blocked until user gesture */ }
    },

    stopMusic() {
        if (this.music) this.music.pause();
    },

    playSFX(name) {
        if (this.muted) return;
        const s = this.sfx[name];
        if (!s) return;
        try {
            const clone = s.cloneNode();
            clone.volume = this.volume;
            clone.play();
        } catch (e) {
            // ignore
        }
    },

    toggleMute() { this.muted = !this.muted; if (this.muted) this.stopMusic(); else this.playMusic(); },
    setVolume(v) { this.volume = v; if (this.music) this.music.volume = v * 0.6; }
};

// Auto-load assets and attempt to start music on user interaction
window.addEventListener('load', () => { AudioManager.load(); });
window.addEventListener('pointerdown', () => { if (AudioManager && !AudioManager.muted) AudioManager.playMusic(); }, { once: true });
