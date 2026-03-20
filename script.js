// ======================================
// settings
const width = window.innerWidth;
const height = window.innerHeight;
const half_width = width / 2;
const half_height = height / 2;

// Mini-map e Player
const player_position = [7, 7];
const player_angle = 0;
const player_speed = 0.005;
const player_rot_speed = 0.003; 
const player_size_scale = 0.2;

// Mouse
const mouse_sensitivity = 0.002;
const mouse_max_rel = 40;

// Colors
const floor_color = "rgb(30,30,30)";
const texture_size = 225;

// ======================================
// Game Class
class Game {
  constructor() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = width;
    this.canvas.height = height;

    this.deltaTime = 1;
    this.lastTime = performance.now();

    this.newGame();
    this.initPointerLock();
    this.run();
  }

  newGame() {
    this.map = new Map(this);
    this.player = new Player(this);
    this.raycasting = new RayCasting(this);
    this.objectRenderer = new ObjectRenderer(this);
  }

  // Ativa o controle pelo mouse ao clicar no canvas
  initPointerLock() {
    this.canvas.addEventListener("click", () => {
      this.canvas.requestPointerLock();
    });
  }

  update() {
    const now = performance.now();
    this.deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.player.update();
    this.raycasting.update();
  }

  draw() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, width, height);
    
    this.objectRenderer.draw();
    //this.map.draw();
    //this.player.draw();
  }

  run() {
    const loop = () => {
      this.update();
      this.draw();
      requestAnimationFrame(loop);
    };
    loop();
  }
}

// ======================================
// Player Class
class Player {
  constructor(game) {
    this.game = game;
    this.x = player_position[0];
    this.y = player_position[1];
    this.angle = player_angle;
    this.rel = 0; // Movimento relativo do mouse

    this.keys = {};
    window.addEventListener("keydown", e => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", e => this.keys[e.key.toLowerCase()] = false);
    
    document.addEventListener("mousemove", e => {
      if (document.pointerLockElement === this.game.canvas) {
        this.rel = e.movementX;
        this.mouseControl();
      }
    });
  }

  mouseControl() {
    const clamped = Math.max(-mouse_max_rel, Math.min(mouse_max_rel, this.rel));
    this.angle += clamped * mouse_sensitivity;
  }

  movement() {
    const sin_a = Math.sin(this.angle);
    const cos_a = Math.cos(this.angle);
    let dx = 0, dy = 0;

    const speed = player_speed * this.game.deltaTime;
    
    if (this.keys["w"]) { dx += cos_a * speed; dy += sin_a * speed; }
    if (this.keys["s"]) { dx -= cos_a * speed; dy -= sin_a * speed; }
    if (this.keys["a"]) { dx += sin_a * speed; dy -= cos_a * speed; }
    if (this.keys["d"]) { dx -= sin_a * speed; dy += cos_a * speed; }

    this.checkWallCollision(dx, dy);

    if (this.keys["arrowleft"]) this.angle -= player_rot_speed * this.game.deltaTime;
    if (this.keys["arrowright"]) this.angle += player_rot_speed * this.game.deltaTime;
    
    this.angle %= (Math.PI * 2);
  }

  checkWall(x, y) {
    return !(`${Math.floor(x)},${Math.floor(y)}` in this.game.map.worldMap);
  }

  checkWallCollision(dx, dy) {
    // Colisão simples com "padding"
    if (this.checkWall(this.x + dx * 2, this.y)) this.x += dx;
    if (this.checkWall(this.x, this.y + dy * 2)) this.y += dy;
  }

  update() {
    this.movement();
    this.rel = 0; // Reseta o movimento do mouse após o frame
  }

  draw() {
    const s = 10; // Escala do mini-mapa
    this.game.ctx.strokeStyle = "yellow";
    this.game.ctx.beginPath();
    this.game.ctx.moveTo(this.x * s, this.y * s);
    this.game.ctx.lineTo(this.x * s + Math.cos(this.angle) * 20, this.y * s + Math.sin(this.angle) * 20);
    this.game.ctx.stroke();

    this.game.ctx.fillStyle = "green";
    this.game.ctx.beginPath();
    this.game.ctx.arc(this.x * s, this.y * s, 4, 0, Math.PI * 2);
    this.game.ctx.fill();
  }

  get position() { return [this.x, this.y]; }
  get mapPosition() { return [Math.floor(this.x), Math.floor(this.y)]; }
}

// ======================================
// Map & Raycasting
const _ = 0;
const mini_map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1, _, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, _, _, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, 1],
    [1, 1, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, 1, _, _, _, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, _, _, _, 1, _, _, _, _, _, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 2, 1, 1, 1, _, _, _, 1, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1],
    [1, 1, _, _, _, _, _, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1],
    [1, 1, _, _, _, _, _, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1],
    [1, 1, _, _, _, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1],
    [1, 1, _, _, _, _, _, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1],
    [1, 1, _, _, _, _, _, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, _, _, _, _, _, _, _, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, _, _, _, _, _, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, _, _, _, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

class Map {
  constructor(game) {
    this.game = game;
    this.worldMap = {};
    mini_map.forEach((row, j) => {
      row.forEach((value, i) => {
        if (value !== 0) this.worldMap[`${i},${j}`] = value;
      });
    });
  }

  draw() {
    const s = 10;
    this.game.ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
    for (let key in this.worldMap) {
      const [x, y] = key.split(",").map(Number);
      this.game.ctx.fillRect(x * s, y * s, s - 1, s - 1);
    }
  }
}

class RayCasting {
  constructor(game) {
    this.game = game;
    this.objectsToRender = [];
  }

  update() {
    this.rayCast();
  }

  rayCast() {
    this.objectsToRender = [];
    const [ox, oy] = this.game.player.position;
    const [xMap, yMap] = this.game.player.mapPosition;
    
    const fov = Math.PI / 3;
    const numRays = width; 
    const deltaAngle = fov / numRays;
    let rayAngle = this.game.player.angle - (fov / 2);

    const screenDist = half_width / Math.tan(fov / 2);

    for (let i = 0; i < numRays; i++) {
      const sinA = Math.sin(rayAngle);
      const cosA = Math.cos(rayAngle);

      // Horizontais
      let yHor = sinA > 0 ? yMap + 1 : yMap - 1e-6;
      let dy = sinA > 0 ? 1 : -1;
      let depthHor = (yHor - oy) / sinA;
      let xHor = ox + depthHor * cosA;
      let dDepth = dy / sinA;
      let dx = dDepth * cosA;

      let texH = 1;
      for (let j = 0; j < 20; j++) {
        let tile = `${Math.floor(xHor)},${Math.floor(yHor)}`;
        if (tile in this.game.map.worldMap) {
          texH = this.game.map.worldMap[tile];
          break;
        }
        xHor += dx; yHor += dy; depthHor += dDepth;
      }

      // Verticais
      let xVert = cosA > 0 ? xMap + 1 : xMap - 1e-6;
      dx = cosA > 0 ? 1 : -1;
      let depthVert = (xVert - ox) / cosA;
      let yVert = oy + depthVert * sinA;
      dDepth = dx / cosA;
      dy = dDepth * sinA;

      let texV = 1;
      for (let j = 0; j < 20; j++) {
        let tile = `${Math.floor(xVert)},${Math.floor(yVert)}`;
        if (tile in this.game.map.worldMap) {
          texV = this.game.map.worldMap[tile];
          break;
        }
        xVert += dx; yVert += dy; depthVert += dDepth;
      }

      let depth, offset, tex;
      if (depthVert < depthHor) {
        depth = depthVert;
        tex = texV;
        offset = yVert % 1;
      } else {
        depth = depthHor;
        tex = texH;
        offset = xHor % 1;
      }

      // Fish-eye
      depth *= Math.cos(this.game.player.angle - rayAngle);
      const projHeight = screenDist / (depth + 0.0001);

      this.objectsToRender.push({
        depth,
        projHeight,
        texture: tex,
        offset,
        x: i
      });

      rayAngle += deltaAngle;
    }
  }
}

class ObjectRenderer {
  constructor(game) {
    this.game = game;
    this.wallTextures = {
      1: this.loadTex("osaka.png"),
      2: this.loadTex("zawarudo.png")
    };
    this.sky = this.loadTex("windows95image.png");
    this.skyOffset = 0;
  }

  loadTex(path) {
    const img = new Image();
    img.src = path;
    return img;
  }

  draw() {
    // Background
    this.game.ctx.fillStyle = "#444"; // Teto
    this.game.ctx.fillRect(0, 0, width, half_height);
    this.game.ctx.fillStyle = floor_color;
    this.game.ctx.fillRect(0, half_height, width, half_height);

    // Walls
    const rays = this.game.raycasting.objectsToRender;
    rays.forEach(obj => {
      const tex = this.wallTextures[obj.texture];
      if (tex && tex.complete) {
        const sx = obj.offset * texture_size;
        this.game.ctx.drawImage(
          tex, 
          sx, 0, 1, texture_size, 
          obj.x, half_height - obj.projHeight / 2, 1, obj.projHeight
        );
      } else {
        // Fallback se a imagem não carregar
        const color = 255 / (1 + obj.depth * 0.2);
        this.game.ctx.fillStyle = `rgb(${color},${color},${color})`;
        this.game.ctx.fillRect(obj.x, half_height - obj.projHeight / 2, 1, obj.projHeight);
      }
    });
  }
}

// Start
window.onload = () => new Game();