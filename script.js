// ---------- stage scaling (keeps every scene pixel-perfect on any screen) ----------
const STAGE_W = 1920;
const STAGE_H = 1080;
const stage = document.getElementById('stage');

function fitStage(){
  // "cover" behavior: scale up until the stage fills the whole screen
  // on every device (mobile portrait, tablet, laptop) — no empty bars,
  // just crops whatever overflows top/bottom or left/right.
  const scale = Math.max(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', fitStage);
window.addEventListener('orientationchange', () => setTimeout(fitStage, 150));
fitStage();

// ---------- scene manager (future scenes plug into this) ----------
const scenes = Array.from(document.querySelectorAll('.scene'));

function goToScene(id){
  scenes.forEach(s => s.classList.toggle('scene--active', s.id === id));
}

// ---------- shared background audio (the couple's song) ----------
const bgAudio = document.getElementById('bgAudio');

function tryPlayAudio(){
  const p = bgAudio.play();
  if (p && p.catch) p.catch(() => { /* browser blocked it silently, user can hit play in scene 4 */ });
}

// ---------- scene 1: seal button ----------
const sealBtn = document.getElementById('sealBtn');

sealBtn.addEventListener('click', () => {
  sealBtn.disabled = true; // prevent double-clicks mid-transition
  goToScene('scene-2');
  tryPlayAudio(); // the seal click is the user gesture that unlocks audio autoplay
});

// ---------- shared backdrop (moments + song): fade the decoration in once, ----------
// and leave it be — it's pinned behind both scenes, so it should never reset
const mmWrap = document.getElementById('mmWrap');

const mmObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      mmWrap.classList.add('mm--in-view');
      mmObserver.unobserve(mmWrap); // only needs to fire once, ever
    }
  });
}, { threshold: 0.05 });

mmObserver.observe(mmWrap);

// ---------- scene 3: replay its entrance every time it scrolls into view ----------
const scene3 = document.getElementById('scene-3');

const scene3Observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    scene3.classList.toggle('scene3--in-view', entry.isIntersecting);
  });
}, { threshold: 0.35 });

scene3Observer.observe(scene3);

// ---------- moments gallery: replay the staggered reveal every time it re-enters view ----------
const momentsGallery = document.getElementById('momentsGallery');

const galleryObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    momentsGallery.classList.toggle('moments-gallery--in-view', entry.isIntersecting);
  });
}, { threshold: 0.12 });

galleryObserver.observe(momentsGallery);

// ---------- scene 4: replay its entrance every time it scrolls into view ----------
const scene4 = document.getElementById('scene-4');

const scene4Observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    scene4.classList.toggle('scene4--in-view', entry.isIntersecting);
  });
}, { threshold: 0.35 });

scene4Observer.observe(scene4);

// ---------- scene 5: replay its entrance every time it scrolls into view ----------
const scene5 = document.getElementById('scene-5');

const scene5Observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    scene5.classList.toggle('scene5--in-view', entry.isIntersecting);
  });
}, { threshold: 0.35 });

scene5Observer.observe(scene5);

// ---------- scene 4: song player (vinyl + waveform + scrub bar + controls) ----------
const vinylDisc   = document.getElementById('vinylDisc');
const tonearm     = document.getElementById('tonearm');
const playBtn     = document.getElementById('playBtn');
const playIcon    = document.getElementById('playIcon');
const pauseIcon   = document.getElementById('pauseIcon');
const prevBtn     = document.getElementById('prevBtn');
const nextBtn     = document.getElementById('nextBtn');
const heartBtn    = document.getElementById('heartBtn');
const waveform    = document.getElementById('waveform');
const progressBar = document.getElementById('progressBar');
const progressFill= document.getElementById('progressFill');
const progressDot = document.getElementById('progressDot');
const timeCurrent = document.getElementById('timeCurrent');
const timeTotal   = document.getElementById('timeTotal');

// build a static-but-organic waveform out of little bars
const BAR_COUNT = 64;
const waveBars = [];
for (let i = 0; i < BAR_COUNT; i++){
  const bar = document.createElement('span');
  // a gentle randomized wave silhouette, not pure noise
  const wave = Math.sin(i / BAR_COUNT * Math.PI * 3) * 0.35;
  const h = 22 + wave * 22 + Math.random() * 14;
  bar.style.height = Math.max(6, Math.min(34, h)) + 'px';
  waveform.appendChild(bar);
  waveBars.push(bar);
}

function formatTime(sec){
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function setPlayingUI(isPlaying){
  playIcon.style.display  = isPlaying ? 'none' : '';
  pauseIcon.style.display = isPlaying ? '' : 'none';
  vinylDisc.classList.toggle('vinyl-disc--spinning', isPlaying);
  tonearm.classList.toggle('tonearm--playing', isPlaying);
}

function updateProgressUI(){
  const dur = bgAudio.duration || 0;
  const cur = bgAudio.currentTime || 0;
  const pct = dur > 0 ? (cur / dur) * 100 : 0;

  progressFill.style.width = pct + '%';
  progressDot.style.left   = pct + '%';
  timeCurrent.textContent  = formatTime(cur);
  timeTotal.textContent    = formatTime(dur);

  const litCount = Math.round((pct / 100) * BAR_COUNT);
  waveBars.forEach((bar, i) => bar.classList.toggle('is-played', i < litCount));
}

bgAudio.addEventListener('loadedmetadata', updateProgressUI);
bgAudio.addEventListener('timeupdate', updateProgressUI);
bgAudio.addEventListener('play',  () => setPlayingUI(true));
bgAudio.addEventListener('pause', () => setPlayingUI(false));

playBtn.addEventListener('click', () => {
  if (bgAudio.paused) tryPlayAudio();
  else bgAudio.pause();
});

prevBtn.addEventListener('click', () => {
  bgAudio.currentTime = Math.max(0, bgAudio.currentTime - 10);
});

nextBtn.addEventListener('click', () => {
  bgAudio.currentTime = Math.min(bgAudio.duration || 0, bgAudio.currentTime + 10);
});

heartBtn.addEventListener('click', () => {
  heartBtn.classList.toggle('is-active');
});

function seekFromEvent(e){
  const rect = progressBar.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  if (bgAudio.duration) bgAudio.currentTime = pct * bgAudio.duration;
}

progressBar.addEventListener('click', seekFromEvent);

// reflect state immediately if audio was already started from scene 1
setPlayingUI(!bgAudio.paused);
updateProgressUI();

// ---------- floating music notes while the record is spinning ----------
const noteFx = document.getElementById('noteFx');
const NOTE_GLYPHS = ['♪', '♫', '♬'];
let noteTimer = null;

function spawnNote(){
  const note = document.createElement('span');
  note.className = 'music-note';
  note.textContent = NOTE_GLYPHS[Math.floor(Math.random() * NOTE_GLYPHS.length)];

  // spawn from around the disc's rim, drift up and outward while fading
  const angle = Math.random() * Math.PI * 2;
  const radius = 34 + Math.random() * 14; // % from center, near the edge
  const nx = 50 + Math.cos(angle) * radius;
  const ny = 50 + Math.sin(angle) * radius;

  note.style.setProperty('--nx', nx + '%');
  note.style.setProperty('--ny', ny + '%');
  note.style.setProperty('--nsize', (16 + Math.random() * 12) + 'px');
  note.style.setProperty('--nrot', (Math.random() * 30 - 15) + 'deg');
  note.style.setProperty('--ndx', (Math.random() * 60 - 30) + 'px');
  note.style.setProperty('--ndur', (2.2 + Math.random() * 1) + 's');

  noteFx.appendChild(note);
  note.addEventListener('animationend', () => note.remove());
}

function startNotes(){
  if (noteTimer) return;
  spawnNote();
  noteTimer = setInterval(spawnNote, 550);
}

function stopNotes(){
  clearInterval(noteTimer);
  noteTimer = null;
}

bgAudio.addEventListener('play',  startNotes);
bgAudio.addEventListener('pause', stopNotes);
bgAudio.addEventListener('ended', stopNotes);

if (!bgAudio.paused) startNotes();
