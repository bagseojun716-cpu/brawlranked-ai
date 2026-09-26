// ===== 🌍 언어 =====
const text = {
  ko:{title:"브롤 픽 AI",team:"우리팀",enemy:"상대팀",btn:"추천",mode:"모드",map:"맵"},
  en:{title:"Brawl Pick AI",team:"Team",enemy:"Enemy",btn:"Recommend",mode:"Mode",map:"Map"}
};

// ===== 🗺️ 맵 =====
const maps = {
  ko: {
    "젬그랩": ["하드락 광산","크리스탈 아케이드","더블 스우시","보석 요새"],
    "브롤볼": ["백야드 볼","슈퍼 스타디움","핀볼 꿈","센터 스테이지"],
    "하이스트": ["세이프 존","핫 포테이토","브리지 투 파","피트 스탑"],
    "녹아웃": ["골드암 협곡","벨스 록","포스 필드","딥 엔드"],
    "핫존": ["링 오브 파이어","듀얼 존","오픈 존","스플릿"]
  },
  en: {
    "Gem Grab": ["Hard Rock Mine","Crystal Arcade","Double Swoosh","Gem Fort"],
    "Brawl Ball": ["Backyard Bowl","Super Stadium","Pinball Dreams","Center Stage"],
    "Heist": ["Safe Zone","Hot Potato","Bridge Too Far","Pit Stop"],
    "Knockout": ["Goldarm Gulch","Belle's Rock","Flaring Phoenix","Deep End"],
    "Hot Zone": ["Ring of Fire","Dueling Beetles","Open Zone","Split"]
  }
};

let brawlers = [];
let team = [];
let enemy = [];
let tierData = [];

// ===== 💾 저장소 (사생활 모드 등에서 실패해도 동작) =====
function getLang(){
  try{ return localStorage.getItem("lang") || "ko"; }catch(e){ return currentLang; }
}
let currentLang = "ko";

// ===== 🌍 언어 설정 =====
function setLang(lang){
  currentLang = lang;
  try{ localStorage.setItem("lang",lang); }catch(e){}
  languageScreen.style.display="none";
  mainUI.classList.remove("hidden");
  load();
}

// 🌍 언어 다시 선택
function changeLang(){
  mainUI.classList.add("hidden");
  languageScreen.style.display="";
}

// 저장된 언어가 있으면 언어 선택 화면 건너뛰기
window.addEventListener("DOMContentLoaded",()=>{
  let saved=null;
  try{ saved=localStorage.getItem("lang"); }catch(e){}
  if(saved) setLang(saved);
});

// ===== 🚀 초기 로드 =====
function load(){
  const lang = getLang();
  const t = text[lang];

  title.innerText = t.title;
  teamText.innerText = t.team;
  enemyText.innerText = t.enemy;
  btn.innerText = t.btn;
  modeText.innerText = t.mode;
  mapText.innerText = t.map;

  setupMode(lang);
  if(!brawlers.length) loadBrawlers(); else createGrid();
  setupDrop();
  loadTier(); // 🔥 AI 데이터
}

// ===== 🗺️ 모드 =====
function setupMode(lang){
  const mode = document.getElementById("mode");
  mode.innerHTML="";

  Object.keys(maps[lang]).forEach((m,i)=>{
    const o=document.createElement("option");
    o.value=i;
    o.textContent=m;
    mode.appendChild(o);
  });

  updateMaps();
}

// ===== 🗺️ 맵 =====
function updateMaps(){
  const lang = getLang();
  const modeIdx = Number(document.getElementById("mode").value);
  const map = document.getElementById("map");

  map.innerHTML="";

  const koMaps = Object.values(maps.ko)[modeIdx];
  Object.values(maps[lang])[modeIdx].forEach((m,i)=>{
    const o=document.createElement("option");
    o.value=koMaps[i]; // 추천 데이터는 한국어 맵 이름 기준
    o.textContent=m;
    map.appendChild(o);
  });
}

// ===== 🔥 브롤러 로드 =====
async function loadBrawlers(){
  const grid = document.getElementById("brawlerGrid");
  grid.innerText = "⏳ Loading...";
  try{
    const res = await fetch("https://api.brawlify.com/v1/brawlers");
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();

    brawlers = data.list
      .filter(b=>b.name!=="Buzz Lightyear")
      .sort((a,b)=>a.rarity.id-b.rarity.id);
  }catch(e){
    // API 실패 시 내장 목록으로 동작 (이미지는 이름 글자로 대체)
    console.log("❌ 브롤러 API 실패, 내장 목록 사용", e);
    brawlers = FALLBACK_BRAWLERS.map((name,i)=>({id:"f"+i, name, imageUrl2:""}));
  }

  createGrid();
}

const FALLBACK_BRAWLERS = [
  "Shelly","Colt","Bull","Brock","Rico","Spike","Barley","Jessie","Nita","Dynamike",
  "El Primo","Mortis","Crow","Poco","Bo","Piper","Pam","Tara","Darryl","Penny",
  "Frank","Gene","Tick","Leon","Rosa","Carl","Bibi","8-Bit","Sandy","Bea",
  "Emz","Mr. P","Max","Jacky","Gale","Nani","Sprout","Surge","Colette","Amber",
  "Lou","Byron","Edgar","Ruffs","Stu","Belle","Squeak","Grom","Buzz","Griff",
  "Ash","Meg","Lola","Fang","Eve","Janet","Bonnie","Otis","Sam","Gus",
  "Buster","Chester","Gray","Mandy","R-T","Willow","Maisie","Hank","Cordelius","Doug",
  "Pearl","Chuck","Charlie","Mico","Kit","Larry & Lawrie","Melodie","Angelo","Draco","Lily"
];

// 이미지 없으면 이름 첫 글자 표시
function brawlerImg(b){
  if(b.imageUrl2) return `<img src="${b.imageUrl2}" alt="${b.name}">`;
  return `<div class="noimg">${b.name.slice(0,2)}</div>`;
}

// ===== 🎴 카드 생성 =====
function createGrid(){
  const grid = document.getElementById("brawlerGrid");
  grid.innerHTML="";

  brawlers.forEach(b=>{
    const div=document.createElement("div");
    div.className="card";
    div.draggable=true;

    div.innerHTML=`
      ${brawlerImg(b)}
      <div>${b.name}</div>
    `;

    div.ondragstart=(e)=>{
      e.dataTransfer.setData("id", b.id);
    };

    // 📱 모바일: 탭하면 우리팀 → 꽉 차면 상대팀에 추가
    div.onclick=()=>{
      if(team.length<3) addPick("team", b.id);
      else addPick("enemy", b.id);
    };

    grid.appendChild(div);
  });
}

// ===== 🧲 드래그 =====
function setupDrop(){
  const teamBox=document.getElementById("teamBox");
  const enemyBox=document.getElementById("enemyBox");

  [teamBox, enemyBox].forEach(box=>{
    box.ondragover=(e)=>{
      e.preventDefault();
      box.classList.add("dragover");
    };

    box.ondrop=(e)=>{
      e.preventDefault();
      box.classList.remove("dragover");

      const id=e.dataTransfer.getData("id");
      addPick(box===teamBox ? "team" : "enemy", id);
    };

    box.ondragleave=()=>box.classList.remove("dragover");
  });
}

// ===== ➕ 픽 추가 =====
function addPick(side, id){
  const b=brawlers.find(x=>x.id==id);
  if(!b) return;
  if(team.find(x=>x.id==id) || enemy.find(x=>x.id==id)) return;

  const list = side==="team" ? team : enemy;
  if(list.length>=3) return alert(getLang()==="ko" ? "3명까지!" : "Max 3!");
  list.push(b);
  render();
}

// ===== 🖼️ 렌더 =====
function render(){
  teamBox.innerHTML="";
  enemyBox.innerHTML="";

  team.forEach((b,i)=>{
    const div=document.createElement("div");
    div.className="pick team";
    div.innerHTML=brawlerImg(b);

    div.onclick=()=>{
      team.splice(i,1);
      render();
    };

    teamBox.appendChild(div);
  });

  enemy.forEach((b,i)=>{
    const div=document.createElement("div");
    div.className="pick enemy";
    div.innerHTML=brawlerImg(b);

    div.onclick=()=>{
      enemy.splice(i,1);
      render();
    };

    enemyBox.appendChild(div);
  });
}

// ===== 🔥 티어 가져오기 =====
async function loadTier(){
  if(!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  try{
    const res = await fetch("http://localhost:3000/tier");
    tierData = await res.json();
    console.log("🔥 티어 데이터:", tierData);
  }catch(e){
    console.log("❌ 티어 실패");
  }
}

// ===== 🧠 AI 추천 =====
function recommend(){

  const map = document.getElementById("map").value;

  // 🔥 맵별 강캐
  const mapMeta = {

    // 젬그랩
    "하드락 광산": ["Gene","Sandy","Crow"],
    "크리스탈 아케이드": ["Spike","Pam","Max"],
    "더블 스우시": ["Bo","Tara","Sandy"],
    "보석 요새": ["Gene","Max","Crow"],

    // 브롤볼
    "백야드 볼": ["Fang","Bibi","Max"],
    "슈퍼 스타디움": ["Bull","El Primo","Bibi"],
    "핀볼 꿈": ["Mortis","Fang","Stu"],
    "센터 스테이지": ["Max","Janet","Bea"],

    // 하이스트
    "세이프 존": ["Colt","Colette","Spike"],
    "핫 포테이토": ["Bull","Darryl","Colt"],
    "브리지 투 파": ["Brock","Belle","Colt"],
    "피트 스탑": ["Jessie","Colt","8-Bit"],

    // 녹아웃
    "골드암 협곡": ["Piper","Nani","Bea"],
    "벨스 록": ["Belle","Piper","Brock"],
    "포스 필드": ["Gray","Gene","Max"],
    "딥 엔드": ["Tick","Sprout","Grom"],

    // 핫존
    "링 오브 파이어": ["Lou","Amber","Bo"],
    "듀얼 존": ["Sandy","Emz","Pam"],
    "오픈 존": ["Max","Crow","Spike"],
    "스플릿": ["Jessie","Penny","Nita"]
  };

  // 🔥 브롤러 역할
  const roles = {
    "Tank":["El Primo","Bull","Frank","Jacky","Rosa"],
    "Sniper":["Piper","Bea","Nani","Brock","Belle"],
    "Assassin":["Mortis","Leon","Edgar","Fang"],
    "Thrower":["Barley","Dynamike","Tick","Sprout","Grom"],
    "Damage":["Colt","Spike","Amber","Colette"]
  };

  // 🔥 카운터 관계 (핵심)
  const counter = {
    "Tank":["Damage","Sniper"],
    "Sniper":["Assassin"],
    "Thrower":["Assassin"],
    "Damage":["Tank"]
  };

  function getRole(name){
    for(let r in roles){
      if(roles[r].includes(name)) return r;
    }
    return "Damage";
  }

  let scores = [];

  brawlers.forEach(b=>{

    if(team.find(t=>t.id===b.id) || enemy.find(e=>e.id===b.id)) return;

    let score = 0;
    const role = getRole(b.name);

    // ===== 🔥 1. 맵 =====
    if(mapMeta[map] && mapMeta[map].includes(b.name)){
      score += 15;
    }

    // ===== 🔥 2. 상대 카운터 =====
    enemy.forEach(e=>{
      const enemyRole = getRole(e.name);

      if(counter[enemyRole] && counter[enemyRole].includes(role)){
        score += 10;
      }
    });

    // ===== 🔥 티어 (보조)
    tierData.forEach(t=>{
      if(t.name === b.name){
        if(t.tier==="S") score+=8;
        else if(t.tier==="A") score+=5;
      }
    });

    score += Math.random();

    scores.push({name:b.name, score});
  });

  scores.sort((a,b)=>b.score-a.score);

  const picks = scores.slice(0,5);

  const label = getLang()==="ko" ? "🔥 추천: " : "🔥 Picks: ";
  result.innerText = label + picks.map(p=>p.name).join(", ");
}