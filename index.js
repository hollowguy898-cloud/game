// main.js (PURE JS BOOTSTRAP)

(() => {
  // -----------------------------
  // Page setup
  // -----------------------------
  document.documentElement.lang = "en";
  document.title = "Ancient Forest: Town Edge";

  const metaCharset = document.createElement("meta");
  metaCharset.setAttribute("charset", "UTF-8");

  const metaViewport = document.createElement("meta");
  metaViewport.name = "viewport";
  metaViewport.content = "width=device-width, initial-scale=1.0";

  document.head.appendChild(metaCharset);
  document.head.appendChild(metaViewport);

  // -----------------------------
  // Styles
  // -----------------------------
  const style = document.createElement("style");
  style.textContent = `
    body { 
      margin: 0; 
      background: #020403; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      height: 100vh; 
      color: white; 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      overflow: hidden; 
    }

    #canvas-container {
      position: relative;
      box-shadow: 0 0 60px rgba(0,0,0,1);
      border: 2px solid #141c18;
      background: #050807;
    }

    canvas { 
      display: block;
      image-rendering: pixelated; 
    }

    .ui { 
      position: absolute; 
      top: -25px; 
      left: 0; 
      width: 100%;
      pointer-events: none; 
      display: flex;
      justify-content: space-between;
    }

    .stats { 
      font-size: 10px; 
      color: #4ade80; 
      opacity: 0.6; 
      text-transform: uppercase; 
      letter-spacing: 2px;
    }

    .controls-hint { 
      margin-top: 15px; 
      font-size: 12px; 
      color: #2d3d36; 
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  `;
  document.head.appendChild(style);

  // -----------------------------
  // Body content
  // -----------------------------
  document.body.innerHTML = "";

  const container = document.createElement("div");
  container.id = "canvas-container";

  const ui = document.createElement("div");
  ui.className = "ui";

  const leftStats = document.createElement("div"); leftStats.style.display = 'flex'; leftStats.style.gap = '12px';

  const roomLabel = document.createElement("div");
  roomLabel.className = "stats";
  roomLabel.id = "roomLabel";
  roomLabel.textContent = "ZONE: ANCIENT FOREST [0,0]";

  const fpsCounter = document.createElement("div");
  fpsCounter.className = "stats";
  fpsCounter.id = "fpsCounter";
  fpsCounter.textContent = "60 FPS";

  leftStats.appendChild(roomLabel);
  leftStats.appendChild(fpsCounter);

  const audioControls = document.createElement('div'); audioControls.style.pointerEvents = 'auto'; audioControls.style.display = 'flex'; audioControls.style.gap = '8px'; audioControls.style.alignItems = 'center';
  const muteBtn = document.createElement('button'); muteBtn.textContent = '🔊'; muteBtn.title = 'Toggle audio'; muteBtn.style.padding = '6px'; muteBtn.style.fontSize = '12px';
  const vol = document.createElement('input'); vol.type = 'range'; vol.min = 0; vol.max = 1; vol.step = 0.05; vol.value = 0.9; vol.title = 'Volume'; vol.style.width = '80px';

  muteBtn.onclick = () => { if (typeof AudioManager !== 'undefined') { AudioManager.toggleMute(); muteBtn.textContent = AudioManager.muted ? '🔇' : '🔊'; } };
  vol.oninput = () => { if (typeof AudioManager !== 'undefined') AudioManager.setVolume(parseFloat(vol.value)); };
  audioControls.appendChild(muteBtn); audioControls.appendChild(vol);

  ui.appendChild(leftStats);
  ui.appendChild(audioControls);

  const canvas = document.createElement("canvas");
  canvas.id = "gameCanvas";

  container.appendChild(ui);
  container.appendChild(canvas);

  const controlsHint = document.createElement("div");
  controlsHint.className = "controls-hint";
  controlsHint.textContent = "WASD • SPACE • J (ATTACK) • SHIFT (DASH) • S (SLIDE) • K (PISTOL)";

  document.body.appendChild(container);
  document.body.appendChild(controlsHint);

  // -----------------------------
  // Script loader
  // -----------------------------
  const scripts = [
    "ult.js",
    "player.js",
    "world.js",
    "boss_ai.js",
    "audio.js",
    "render.js",
    "game.js"
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load script: " + src));
      document.body.appendChild(s);
    });
  }

  (async () => {
    for (const src of scripts) {
      await loadScript(src);
    }
  })();
})();
