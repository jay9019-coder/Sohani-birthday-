/* =========================================================
   Sohani's Birthday — Cinematic Interactive Experience
   Vanilla JS + GSAP + Canvas. No external images/audio needed.
   ========================================================= */

/* ---------- Global particle system (petals + golden dust) ---------- */
const fx = document.getElementById('fx');
const ctx = fx.getContext('2d');
let W, H, DPR;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = fx.width = window.innerWidth * DPR;
  H = fx.height = window.innerHeight * DPR;
  fx.style.width = window.innerWidth + 'px';
  fx.style.height = window.innerHeight + 'px';
}
window.addEventListener('resize', resize);
resize();

const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
const PETAL_COUNT = isMobile ? 16 : 30;
const DUST_COUNT = isMobile ? 14 : 26;

function rand(a,b){ return a + Math.random()*(b-a); }

class Petal{
  constructor(){ this.reset(true); }
  reset(initial){
    this.x = rand(0, W);
    this.y = initial ? rand(-H, H) : -30*DPR;
    this.size = rand(10, 20)*DPR;
    this.speedY = rand(0.4, 1.1)*DPR;
    this.speedX = rand(-0.4, 0.4)*DPR;
    this.rot = rand(0, 360);
    this.rotSpeed = rand(-1, 1);
    this.sway = rand(0.4, 1.4);
    this.phase = rand(0, Math.PI*2);
    this.opacity = rand(0.5, 0.95);
  }
  update(){
    this.phase += 0.01;
    this.y += this.speedY;
    this.x += this.speedX + Math.sin(this.phase)*this.sway;
    this.rot += this.rotSpeed;
    if(this.y > H + 40*DPR){ this.reset(false); }
  }
  draw(){
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot * Math.PI/180);
    ctx.globalAlpha = this.opacity;
    ctx.font = `${this.size}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🌸', 0, 0);
    ctx.restore();
  }
}

class Dust{
  constructor(){ this.reset(true); }
  reset(initial){
    this.x = rand(0, W);
    this.y = initial ? rand(0, H) : H + 10*DPR;
    this.r = rand(1.2, 3)*DPR;
    this.speed = rand(0.3, 0.9)*DPR;
    this.drift = rand(-0.3,0.3);
    this.tw = rand(0, Math.PI*2);
    this.opacity = rand(0.3, 0.8);
  }
  update(){
    this.tw += 0.03;
    this.y -= this.speed;
    this.x += this.drift;
    if(this.y < -10*DPR) this.reset(false);
  }
  draw(){
    const o = this.opacity * (0.5 + 0.5*Math.sin(this.tw));
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r*4);
    g.addColorStop(0, `rgba(255,220,150,${o})`);
    g.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r*4, 0, Math.PI*2);
    ctx.fill();
  }
}

let petals = Array.from({length: PETAL_COUNT}, ()=> new Petal());
let dust = Array.from({length: DUST_COUNT}, ()=> new Dust());
let intensity = 1;

function loop(){
  ctx.clearRect(0,0,W,H);
  dust.forEach(d=>{ d.update(); d.draw(); });
  const active = Math.round(petals.length * intensity);
  for(let i=0;i<active;i++){ petals[i].update(); petals[i].draw(); }
  requestAnimationFrame(loop);
}
loop();

/* ---------- Scene manager ---------- */
const scenes = ['intro','blossom','game','joke','favorites','letter','final'];
let currentIndex = 0;
const dotsWrap = document.getElementById('sceneDots');
scenes.forEach((s,i)=>{
  const d = document.createElement('span');
  if(i===0) d.classList.add('active');
  dotsWrap.appendChild(d);
});

function goToScene(name){
  const idx = scenes.indexOf(name);
  if(idx === -1) return;
  currentIndex = idx;
  document.querySelectorAll('.scene').forEach(el=> el.classList.remove('active'));
  const target = document.getElementById('scene-'+name);
  target.classList.add('active');
  [...dotsWrap.children].forEach((d,i)=> d.classList.toggle('active', i===idx));
  window.scrollTo(0,0);
  playSceneAnimation(name);
  if(name === 'final') intensity = 1.6;
}

/* ---------- Audio (generated, no external files) ---------- */
let actx = null, musicOn = false, musicNodes = null;
function ensureAudio(){
  if(!actx){
    actx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if(actx.state === 'suspended') actx.resume();
}
function playTone(freq, dur=0.18, type='sine', vol=0.06, delay=0){
  if(!actx) return;
  const t0 = actx.currentTime + delay;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(actx.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}
function sfxClick(){ playTone(880, 0.12, 'sine', 0.05); }
function sfxJump(){ playTone(520, 0.14, 'triangle', 0.06); playTone(780, 0.1, 'sine', 0.04, 0.05); }
function sfxScore(){ playTone(1046, 0.12, 'sine', 0.045); }
function sfxCelebrate(){
  [523,659,784,1046].forEach((f,i)=> playTone(f, 0.4, 'triangle', 0.05, i*0.1));
}

const pentatonic = [261.6,293.7,329.6,392.0,440.0,523.3,587.3,659.3];
let musicInterval = null;
function startMusic(){
  ensureAudio();
  if(musicInterval) return;
  // soft ambient pad
  const pad = actx.createOscillator();
  const padGain = actx.createGain();
  pad.type = 'sine'; pad.frequency.value = 130.8;
  padGain.gain.value = 0.02;
  pad.connect(padGain).connect(actx.destination);
  pad.start();
  const pad2 = actx.createOscillator();
  const pad2Gain = actx.createGain();
  pad2.type = 'sine'; pad2.frequency.value = 196.0;
  pad2Gain.gain.value = 0.012;
  pad2.connect(pad2Gain).connect(actx.destination);
  pad2.start();
  musicNodes = [ {osc:pad,gain:padGain}, {osc:pad2,gain:pad2Gain} ];
  musicInterval = setInterval(()=>{
    if(!musicOn) return;
    const f = pentatonic[Math.floor(Math.random()*pentatonic.length)];
    playTone(f, 1.6, 'sine', 0.025);
  }, 1400);
}
function stopMusicNodes(){
  if(musicNodes){
    musicNodes.forEach(n=>{ try{ n.gain.gain.linearRampToValueAtTime(0, actx.currentTime+0.5); n.osc.stop(actx.currentTime+0.6); }catch(e){} });
    musicNodes = null;
  }
  if(musicInterval){ clearInterval(musicInterval); musicInterval = null; }
}

const musicToggle = document.getElementById('musicToggle');
musicToggle.addEventListener('click', ()=>{
  ensureAudio();
  musicOn = !musicOn;
  musicToggle.textContent = musicOn ? '🔊' : '🔈';
  if(musicOn) startMusic(); else stopMusicNodes();
});

/* ---------- Button click sfx (delegate) ---------- */
document.addEventListener('click', (e)=>{
  if(e.target.closest('.btn')) sfxClick();
});

/* ---------- Scene entrance animations ---------- */
function splitWords(el){
  const text = el.textContent;
  el.innerHTML = text.split(' ').map(w=>`<span class="word">${w}&nbsp;</span>`).join('');
}

function playSceneAnimation(name){
  if(name === 'intro') playIntro();
  if(name === 'blossom') playBlossom();
  if(name === 'joke') playJoke();
  if(name === 'favorites') playFavorites();
  if(name === 'letter') playLetter();
  if(name === 'final') playFinal();
}

function playIntro(){
  const lines = document.querySelectorAll('#scene-intro .intro-line');
  gsap.set(lines, {opacity:0, y: 16, scale: 0.96});
  const tl = gsap.timeline({delay:0.3});
  lines.forEach((l,i)=>{
    tl.to(l, {opacity:1, y:0, scale:1, duration:0.9, ease:'power3.out'}, i*1.1)
      .to(l, {opacity: i===lines.length-1?1:0, duration:0.7, ease:'power2.in'}, i*1.1 + 1.6);
  });
}

function playBlossom(){
  gsap.fromTo('#scene-blossom .tree-wrap', {opacity:0, scale:0.9}, {opacity:1, scale:1, duration:1.4, ease:'power2.out'});
  gsap.fromTo('#scene-blossom .headline', {opacity:0, y:24}, {opacity:1, y:0, duration:1, delay:0.5});
  gsap.fromTo('#scene-blossom .sub', {opacity:0, y:20}, {opacity:1, y:0, duration:1, delay:0.8});
  gsap.fromTo('#scene-blossom .rose-row span', {opacity:0, y:20}, {opacity:1, y:0, duration:0.8, stagger:0.15, delay:1});
  gsap.fromTo('#scene-blossom .btn', {opacity:0, y:20}, {opacity:1, y:0, duration:0.8, delay:1.3});
}

function playJoke(){
  const lines = document.querySelectorAll('#scene-joke .joke-line');
  gsap.set(lines, {opacity:0, y:20});
  const tl = gsap.timeline({delay:0.2});
  lines.forEach((l,i)=>{
    tl.to(l, {opacity:1, y:0, duration:0.7, ease:'back.out(1.6)'}, i*1.0);
  });
  tl.to('#scene-joke .btn', {opacity:1, y:0, duration:0.6}, lines.length*1.0);
  gsap.set('#scene-joke .btn', {opacity:0, y:20});
}

function playFavorites(){
  gsap.fromTo('#scene-favorites .fav-card', {opacity:0, y:40, rotateX:10}, {opacity:1, y:0, rotateX:0, duration:0.9, stagger:0.25, ease:'power3.out', delay:0.2});
}

function playLetter(){
  const el = document.getElementById('letterBody');
  if(!el.dataset.split){
    splitWords(el);
    el.dataset.split = '1';
  }
  const words = el.querySelectorAll('.word');
  gsap.set(words, {opacity:0});
  gsap.to(words, {opacity:1, duration:0.05, stagger:0.035, ease:'none', delay:0.4});
}

function playFinal(){
  gsap.fromTo('#scene-final .headline', {opacity:0, scale:0.85}, {opacity:1, scale:1, duration:1.2, ease:'power3.out'});
  gsap.fromTo('#scene-final .script', {opacity:0, y:20}, {opacity:1, y:0, duration:1, delay:0.7});
  gsap.fromTo('#scene-final .sub2', {opacity:0, y:20}, {opacity:1, y:0, duration:1, delay:1.2});
  gsap.fromTo('#scene-final .btn', {opacity:0, y:20}, {opacity:1, y:0, duration:1, delay:1.6});
  gsap.fromTo('#scene-final .roses-edge span', {opacity:0, scale:0.5}, {opacity:0.85, scale:1, duration:1, stagger:0.15, delay:0.3});
  sfxCelebrate();
}

/* ---------- Navigation buttons ---------- */
document.getElementById('btnEnterWorld').addEventListener('click', ()=>{ ensureAudio(); goToScene('game'); });
document.getElementById('btnEnoughJoke').addEventListener('click', ()=> goToScene('favorites'));
document.getElementById('btnToLetter').addEventListener('click', ()=> goToScene('letter'));
document.getElementById('btnToFinal').addEventListener('click', ()=> goToScene('final'));
document.getElementById('btnReplay').addEventListener('click', ()=>{
  intensity = 1;
  resetGame();
  goToScene('intro');
});
document.getElementById('btnSkipGame').addEventListener('click', ()=> goToScene('joke'));

/* ---------- Mini Game: Golden Summer Runner ---------- */
const canvas = document.getElementById('gameCanvas');
const gctx = canvas.getContext('2d');
let gw, gh, gdpr;
function fitCanvas(){
  gdpr = Math.min(window.devicePixelRatio||1, 2);
  const rect = canvas.getBoundingClientRect();
  gw = canvas.width = rect.width * gdpr;
  gh = canvas.height = rect.height * gdpr;
}
window.addEventListener('resize', fitCanvas);

const GROUND_RATIO = 0.82;
let game = {
  running:false, over:false, score:0, best:0, speed: 5, gravity: 0.9,
  player:{ xCss: 55, y:0, vy:0, sizeCss: 32, onGround:true, rot:0, inited:false },
  obstacles: [], spawnTimer: 0, threshold: 15, celebrated:false, frame:0
};
const OBSTACLE_EMOJI = ['🌹','🪵','☁️','🎈'];

function resetGame(){
  game.running=false; game.over=false; game.score=0; game.speed=5;
  game.obstacles=[]; game.spawnTimer=0; game.celebrated=false; game.frame=0;
  game.player.vy=0; game.player.onGround=true; game.player.rot=0; game.player.inited=false;
  document.getElementById('scoreVal').textContent = '0';
  document.getElementById('gameOverlay').classList.remove('hidden');
  document.getElementById('overlayTitle').textContent = 'Golden Summer Runner';
  document.getElementById('overlaySub').textContent = 'Help her jump over roses & branches. Tap JUMP or press Space.';
  document.getElementById('btnStartGame').classList.remove('hidden');
  document.getElementById('btnRetryGame').classList.add('hidden');
  document.getElementById('btnSkipGame').classList.remove('hidden');
}

function startGame(){
  fitCanvas();
  game.running = true; game.over = false;
  document.getElementById('gameOverlay').classList.add('hidden');
}

function jump(){
  if(!game.running) return;
  if(game.player.onGround){
    game.player.vy = -15.5;
    game.player.onGround = false;
    sfxJump();
  }
}
document.getElementById('jumpBtn').addEventListener('click', jump);
document.getElementById('jumpBtn').addEventListener('touchstart', (e)=>{ e.preventDefault(); jump(); }, {passive:false});
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); jump(); }, {passive:false});
canvas.addEventListener('mousedown', jump);
window.addEventListener('keydown', (e)=>{
  if(e.code === 'Space' && document.getElementById('scene-game').classList.contains('active')){
    e.preventDefault(); jump();
  }
});
document.getElementById('btnStartGame').addEventListener('click', startGame);
document.getElementById('btnRetryGame').addEventListener('click', ()=>{ resetGame(); startGame(); });

function spawnObstacle(){
  const emoji = OBSTACLE_EMOJI[Math.floor(Math.random()*OBSTACLE_EMOJI.length)];
  const isFlying = emoji === '☁️' || emoji === '🎈';
  game.obstacles.push({
    x: gw + 40*gdpr,
    emoji,
    size: rand(26,34)*gdpr,
    flying: isFlying,
    yOffset: isFlying ? rand(60,110)*gdpr : 0
  });
}

function updateGame(){
  if(!game.running) return;
  game.frame++;
  const groundY = gh*GROUND_RATIO;

  // player physics (all values kept in device-pixel space)
  const p = game.player;
  const size = p.sizeCss*gdpr;
  const floorY = groundY - size;
  if(!p.inited){ p.y = floorY; p.inited = true; }
  p.vy += game.gravity*gdpr;
  p.y += p.vy;
  if(p.y >= floorY){ p.y = floorY; p.vy = 0; p.onGround = true; }
  p.rot = p.onGround ? 0 : Math.max(-25, Math.min(25, p.vy*1.5));

  // spawn obstacles
  game.spawnTimer--;
  if(game.spawnTimer <= 0){
    spawnObstacle();
    const gap = Math.max(48, 95 - game.score*1.3);
    game.spawnTimer = gap + Math.random()*30;
  }

  // move obstacles
  for(let i=game.obstacles.length-1;i>=0;i--){
    const o = game.obstacles[i];
    o.x -= game.speed*gdpr;
    if(o.x < -50*gdpr){
      game.obstacles.splice(i,1);
      game.score++;
      document.getElementById('scoreVal').textContent = game.score;
      sfxScore();
      if(game.score >= game.threshold && !game.celebrated){
        game.celebrated = true;
        winGame();
      }
    }
  }

  // collision
  const px = p.xCss*gdpr, py = p.y, ps = size;
  for(const o of game.obstacles){
    const oy = o.flying ? groundY - o.yOffset - o.size : groundY - o.size;
    const dx = Math.abs((o.x) - (px + ps/2));
    const dy = Math.abs((oy + o.size/2) - (py + ps/2));
    if(dx < (o.size*0.55 + ps*0.4) && dy < (o.size*0.55 + ps*0.4)){
      gameOver();
      break;
    }
  }

  if(game.frame % 90 === 0) game.speed = Math.min(11, game.speed + 0.4);
}

function drawGame(){
  gctx.clearRect(0,0,gw,gh);
  const groundY = gh*GROUND_RATIO;
  // sky gradient
  const sky = gctx.createLinearGradient(0,0,0,gh);
  sky.addColorStop(0,'#fff0c9'); sky.addColorStop(0.6,'#ffc06e'); sky.addColorStop(1,'#ff9a5a');
  gctx.fillStyle = sky; gctx.fillRect(0,0,gw,gh);
  // sun
  gctx.save();
  const sunG = gctx.createRadialGradient(gw*0.82, gh*0.22, 5, gw*0.82, gh*0.22, 90*gdpr);
  sunG.addColorStop(0,'rgba(255,255,230,0.95)'); sunG.addColorStop(1,'rgba(255,220,150,0)');
  gctx.fillStyle = sunG; gctx.beginPath(); gctx.arc(gw*0.82, gh*0.22, 90*gdpr, 0, Math.PI*2); gctx.fill();
  gctx.restore();
  // ground
  gctx.fillStyle = '#7a3b1a';
  gctx.fillRect(0, groundY, gw, gh-groundY);
  gctx.fillStyle = 'rgba(255,255,255,0.15)';
  for(let x = -(game.frame*game.speed*gdpr)%(40*gdpr); x<gw; x+=40*gdpr){
    gctx.fillRect(x, groundY, 20*gdpr, 3*gdpr);
  }
  // obstacles
  gctx.textAlign='center'; gctx.textBaseline='middle';
  for(const o of game.obstacles){
    const oy = o.flying ? groundY - o.yOffset - o.size/2 : groundY - o.size/2;
    gctx.font = `${o.size}px serif`;
    gctx.fillText(o.emoji, o.x, oy);
  }
  // player (glowing avatar)
  const p = game.player;
  const size = p.sizeCss*gdpr;
  const cx = p.xCss*gdpr + size/2, cy = (p.y||0) + size/2;
  gctx.save();
  gctx.translate(cx, cy);
  gctx.rotate((p.rot||0)*Math.PI/180);
  const glow = gctx.createRadialGradient(0,0,2,0,0,size*0.9);
  glow.addColorStop(0,'rgba(255,235,180,0.9)'); glow.addColorStop(1,'rgba(255,235,180,0)');
  gctx.fillStyle = glow; gctx.beginPath(); gctx.arc(0,0,size*0.9,0,Math.PI*2); gctx.fill();
  gctx.font = `${size}px serif`;
  gctx.fillText('🌟', 0, 0);
  gctx.restore();
}

function gameLoopTick(){
  if(document.getElementById('scene-game').classList.contains('active')){
    updateGame();
    drawGame();
  }
  requestAnimationFrame(gameLoopTick);
}
requestAnimationFrame(gameLoopTick);

function gameOver(){
  game.running = false; game.over = true;
  document.getElementById('gameOverlay').classList.remove('hidden');
  document.getElementById('overlayTitle').textContent = 'Oops! 🌸';
  document.getElementById('overlaySub').textContent = `Score: ${game.score}. Try again to reach ${game.threshold}!`;
  document.getElementById('btnStartGame').classList.add('hidden');
  document.getElementById('btnRetryGame').classList.remove('hidden');
  document.getElementById('btnSkipGame').classList.remove('hidden');
}

function winGame(){
  game.running = false;
  sfxCelebrate();
  document.getElementById('gameOverlay').classList.remove('hidden');
  document.getElementById('overlayTitle').textContent = '🎉 You made it! 🎉';
  document.getElementById('overlaySub').textContent = `Final score: ${game.score}`;
  document.getElementById('btnStartGame').classList.add('hidden');
  document.getElementById('btnRetryGame').classList.add('hidden');
  document.getElementById('btnSkipGame').classList.add('hidden');
  const cont = document.getElementById('btnContinueGame');
  cont.classList.remove('hidden');
}
document.getElementById('btnContinueGame').addEventListener('click', ()=> goToScene('joke'));

/* ---------- Init ---------- */
window.addEventListener('load', ()=>{
  fitCanvas();
  resetGame();
  goToScene('intro');
});
document.getElementById('btnBegin').addEventListener('click', ()=>{
  ensureAudio();
  goToScene('blossom');
});
