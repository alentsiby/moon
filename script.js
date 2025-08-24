// --- Math utilities ---
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const frac = x => x - Math.floor(x);

// Julian Date from local Date (not UTC) so the phase aligns with your local day
function toJulian(date){
  return date.getTime()/86400000 + 2440587.5; // Unix epoch (UTC) to JD
}

// Basic moon phase model using a reference new moon (2000-01-06 18:14 UTC ≈ JD 2451550.1)
// Returns object: {phase: [0..1), ageDays, illum: [0..1]}
function moonPhase(date){
  const jd = toJulian(date);
  const synodic = 29.530588853; // days
  const k = (jd - 2451550.1) / synodic;
  const p = frac(k); // 0=new, 0.5=full
  const age = p * synodic;
  const illum = 0.5 * (1 - Math.cos(TAU * p)); // fraction lit
  return { phase: p, ageDays: age, illum };
}

// Phase name from fraction
function phaseName(p){
  // Boundaries in cycle fraction
  if (p < 0.03 || p > 0.97) return 'New Moon';
  if (p < 0.22) return 'Waxing Crescent';
  if (p < 0.28) return 'First Quarter';
  if (p < 0.47) return 'Waxing Gibbous';
  if (p < 0.53) return 'Full Moon';
  if (p < 0.72) return 'Waning Gibbous';
  if (p < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

// SVG generator for a moon phase icon.
function moonSVG(p, size=160){
  const r = size/2;
  const x = 2*p - 1;
  const absx = Math.abs(x);
  const dir = x >= 0 ? 1 : -1; // +1=waxing/right-lit, -1=waning/left-lit

  const scaleX = 1 - absx;
  const shift = dir * r * 0.65;

  const id = 'm' + Math.random().toString(36).slice(2);
  return `
  <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="moonSVG" aria-label="Moon icon">
    <defs>
      <radialGradient id="g-${id}" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="#f8fbff"/>
        <stop offset="60%" stop-color="#e6ebff"/>
        <stop offset="100%" stop-color="#c7d2ff"/>
      </radialGradient>
      <filter id="shadow-${id}" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.6"/>
      </filter>
      <clipPath id="clip-${id}">
        <circle cx="${r}" cy="${r}" r="${r}" />
      </clipPath>
      <mask id="mask-${id}">
        <rect width="100%" height="100%" fill="black"/>
        <g transform="translate(${r+shift}, ${r}) scale(${scaleX}, 1)">
          <circle cx="0" cy="0" r="${r}" fill="white" />
        </g>
      </mask>
    </defs>
    <circle cx="${r}" cy="${r}" r="${r}" fill="#0a0f22" stroke="#1c2752" stroke-width="2" filter="url(#shadow-${id})"/>
    <g clip-path="url(#clip-${id})" mask="url(#mask-${id})">
      <circle cx="${r}" cy="${r}" r="${r}" fill="url(#g-${id})"/>
    </g>
    <circle cx="${r}" cy="${r}" r="${r-1.5}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="3"/>
  </svg>`;
}

function fmtDate(d){
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtShort(d){
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function percent(n){ return (n*100).toFixed(1) + '%'; }

function renderToday(){
  const now = new Date();
  const { phase, ageDays, illum } = moonPhase(now);

  document.getElementById('now').textContent = now.toLocaleString();
  document.getElementById('todayMoon').innerHTML = moonSVG(phase, 160);
  document.getElementById('todayLabel').textContent = phaseName(phase);
  document.getElementById('todayDate').textContent = fmtDate(now);
  document.getElementById('todayIllum').textContent = percent(illum);
  document.getElementById('todayAge').textContent = ageDays.toFixed(1) + ' days';
}

function render7(){
  const grid = document.getElementById('grid7');
  grid.innerHTML = '';
  const base = new Date();
  for(let i=1;i<=7;i++){
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate()+i);
    const { phase, illum } = moonPhase(d);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      ${moonSVG(phase, 120)}
      <div class="label">${phaseName(phase)}</div>
      <div class="date">${fmtShort(d)}</div>
      <div class="illum">${percent(illum)} lit</div>
    `;
    grid.appendChild(card);
  }
}

// Toggle panel
const toggleBtn = document.getElementById('toggle7');
const sevenPanel = document.getElementById('sevenPanel');
toggleBtn.addEventListener('click', () => {
  const show = sevenPanel.style.display === 'none';
  sevenPanel.style.display = show ? 'block' : 'none';
  toggleBtn.textContent = show ? '▼ Hide Next 7 Days' : '▶ Next 7 Days';
  if (show) render7();
});

// Initial render
renderToday();

// Refresh every minute
setInterval(() => {
  const before = document.getElementById('todayDate').textContent;
  renderToday();
  if (sevenPanel.style.display !== 'none') render7();
  const after = document.getElementById('todayDate').textContent;
}, 60 * 1000);

