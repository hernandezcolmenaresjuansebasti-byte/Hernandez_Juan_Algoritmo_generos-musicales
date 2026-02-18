// =====================
// 1) Datos
// =====================

const generos = [
"Pop","Rock","Hip-Hop","Rap","Trap","Reggaetón","Salsa","Bachata",
"Merengue","Cumbia","Electrónica","EDM","Techno","House",
"Jazz","Blues","Lo-fi","Música Clásica","Ópera","Indie",
"K-pop","Metal","Punk","R&B","Gospel","Country",
"Folk","Flamenco","Reggae","Afrobeats",
"Synthwave","Drill","Ska","Grunge",
"Disco","Funk","Soul","Ambient",
"Instrumental","Balada","Bolero"
];

const segmentos = {
"J1":"Adolescentes",
"J2":"Universitarios",
"A1":"Adultos trabajadores",
"F":"Fiesta",
"R":"Relajación",
"E":"Entrenamiento",
"S":"Estudio",
"V":"Viajes"
};

const contextos = {
"G":"¿Qué género recomiendas en general?",
"M":"¿Cuál genera más energía?",
"C":"¿Cuál es más influyente culturalmente?",
"L":"¿Cuál es mejor para concentración?",
"P":"¿Cuál es más popular actualmente?"
};

const RATING_INICIAL = 1000;
const K = 32;
const STORAGE_KEY = "musicmash_state_v1";

function defaultState(){
  const buckets = {};
  for (const seg of Object.keys(segmentos)){
    for (const ctx of Object.keys(contextos)){
      const key = `${seg}__${ctx}`;
      buckets[key] = {};
      generos.forEach(g => buckets[key][g] = RATING_INICIAL);
    }
  }
  return { buckets };
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try { return JSON.parse(raw); }
  catch { return defaultState(); }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function expectedScore(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, a, b, winner){
  const ra = bucket[a], rb = bucket[b];
  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  const sa = (winner === "A") ? 1 : 0;
  const sb = (winner === "B") ? 1 : 0;

  bucket[a] = ra + K * (sa - ea);
  bucket[b] = rb + K * (sb - eb);
}

function randomPair(){
  const a = generos[Math.floor(Math.random()*generos.length)];
  let b = a;
  while(b===a){
    b = generos[Math.floor(Math.random()*generos.length)];
  }
  return [a,b];
}

function bucketKey(seg,ctx){ return `${seg}__${ctx}`; }

function topN(bucket,n=10){
  const arr = Object.entries(bucket).map(([g,r])=>({g,r}));
  arr.sort((x,y)=>y.r-x.r);
  return arr.slice(0,n);
}

// UI
const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const questionEl = document.getElementById("question");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const btnA = document.getElementById("btnA");
const btnB = document.getElementById("btnB");
const btnNewPair = document.getElementById("btnNewPair");
const btnShowTop = document.getElementById("btnShowTop");
const topBox = document.getElementById("topBox");
const btnReset = document.getElementById("btnReset");

let currentA = null;
let currentB = null;

function fillSelect(selectEl,obj){
  selectEl.innerHTML="";
  for(const [k,v] of Object.entries(obj)){
    const opt=document.createElement("option");
    opt.value=k;
    opt.textContent=`${k} — ${v}`;
    selectEl.appendChild(opt);
  }
}

fillSelect(segmentSelect,segmentos);
fillSelect(contextSelect,contextos);

function refreshQuestion(){
  questionEl.textContent=contextos[contextSelect.value];
}

function newDuel(){
  [currentA,currentB]=randomPair();
  labelA.textContent=currentA;
  labelB.textContent=currentB;
  refreshQuestion();
}

function renderTop(){
  const seg=segmentSelect.value;
  const ctx=contextSelect.value;
  const bucket=state.buckets[bucketKey(seg,ctx)];
  const rows=topN(bucket,10);

  topBox.innerHTML=rows.map((r,i)=>`
  <div class="toprow">
  <div><b>${i+1}.</b> ${r.g}</div>
  <div>${r.r.toFixed(1)}</div>
  </div>
  `).join("");
}

function vote(winner){
  const seg=segmentSelect.value;
  const ctx=contextSelect.value;
  const bucket=state.buckets[bucketKey(seg,ctx)];
  updateElo(bucket,currentA,currentB,winner);
  saveState();
  renderTop();
  newDuel();
}

btnA.addEventListener("click",()=>vote("A"));
btnB.addEventListener("click",()=>vote("B"));
btnNewPair.addEventListener("click",newDuel);
btnShowTop.addEventListener("click",renderTop);

btnReset.addEventListener("click",()=>{
  if(!confirm("Se reiniciarán todos los rankings. ¿Continuar?")) return;
  state=defaultState();
  saveState();
  renderTop();
  newDuel();
});

newDuel();
renderTop();
refreshQuestion();
