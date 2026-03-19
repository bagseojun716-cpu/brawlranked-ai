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

// ===== 🌍 언어 설정 =====
function setLang(lang){
  localStorage.setItem("lang",lang);
  languageScreen.style.display="none";
  mainUI.classList.remove("hidden");
  load();
}

// ===== 🚀 초기 로드 =====
function load(){
  const lang = localStorage.getItem("lang") || "ko";
  const t = text[lang];

  title.innerText = t.title;
  teamText.innerText = t.team;
  enemyText.innerText = t.enemy;
  btn.innerText = t.btn;
  modeText.innerText = t.mode;
  mapText.innerText = t.map;

  setupMode(lang);
  loadBrawlers();
  setupDrop();
  loadTier(); // 🔥 AI 데이터
}

// ===== 🗺️ 모드 =====
function setupMode(lang){
  const mode = document.getElementById("mode");
  mode.innerHTML="";

  Object.keys(maps[lang]).forEach(m=>{
    const o=document.createElement("option");
    o.value=m;
    o.textContent=m;
    mode.appendChild(o);
  });

  updateMaps();
}

// ===== 🗺️ 맵 =====
function updateMaps(){
  const lang = localStorage.getItem("lang") || "ko";
  const mode = document.getElementById("mode").value;
  const map = document.getElementById("map");

  map.innerHTML="";

  maps[lang][mode].forEach(m=>{
    const o=document.createElement("option");
    o.textContent=m;
    map.appendChild(o);
  });
}

// ===== 🔥 브롤러 로드 =====
async function loadBrawlers(){
  const res = await fetch("https://api.brawlify.com/v1/brawlers");
  const data = await res.json();

  brawlers = data.list
    .filter(b=>b.name!=="Buzz Lightyear")
    .sort((a,b)=>a.rarity.id-b.rarity.id);

  createGrid();
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
      <img src="${b.imageUrl2}">
      <div>${b.name}</div>
    `;

    div.ondragstart=(e)=>{
      e.dataTransfer.setData("id", b.id);
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
      const b=brawlers.find(x=>x.id==id);

      if(box===teamBox){
        if(team.length>=3) return alert("3명까지!");
        if(!team.find(x=>x.id==id)) team.push(b);
      }else{
        if(enemy.length>=3) return alert("3명까지!");
        if(!enemy.find(x=>x.id==id)) enemy.push(b);
      }

      render();
    };
  });
}

// ===== 🖼️ 렌더 =====
function render(){
  teamBox.innerHTML="";
  enemyBox.innerHTML="";

  team.forEach((b,i)=>{
    const div=document.createElement("div");
    div.className="pick team";
    div.innerHTML=`<img src="${b.imageUrl2}">`;

    div.onclick=()=>{
      team.splice(i,1);
      render();
    };

    teamBox.appendChild(div);
  });

  enemy.forEach((b,i)=>{
    const div=document.createElement("div");
    div.className="pick enemy";
    div.innerHTML=`<img src="${b.imageUrl2}">`;

    div.onclick=()=>{
      enemy.splice(i,1);
      render();
    };

    enemyBox.appendChild(div);
  });
}

// ===== 🔥 티어 가져오기 =====
async function loadTier(){
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

  result.innerText = "🔥 추천: " + picks.map(p=>p.name).join(", ");
}