const $=s=>document.querySelector(s);
let cfg={},phases=[],idx=0,remaining=0,paused=false,timer=null,sound=true,wakeLock=null,expectedAt=0;

const setup=$("#setupView"),timerView=$("#timerView"),card=$("#timerCard"),phaseEl=$("#phase"),timeEl=$("#time"),setEl=$("#setLabel"),cycleEl=$("#cycleLabel"),bar=$("#progressBar"),estimate=$("#estimate"),pauseBtn=$("#pauseBtn"),nextPhaseEl=$("#nextPhase");

function val(id){return Math.max(0,parseInt($(id).value,10)||0)}
function fmt(s){s=Math.max(0,Math.ceil(s));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function calcTotal(){const p=val("#prep"),w=val("#work"),r=val("#rest"),sets=Math.max(1,val("#sets")),cycles=Math.max(1,val("#cycles"));return p+(w*sets+r*Math.max(0,sets-1))*cycles}
function updateEstimate(){estimate.textContent=fmt(calcTotal())}
["#prep","#work","#rest","#sets","#cycles"].forEach(id=>$(id).addEventListener("input",updateEstimate));updateEstimate();

function beep(freq=700,duration=.08){if(!sound)return;try{const C=window.AudioContext||window.webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;o.connect(g);g.connect(c.destination);g.gain.setValueAtTime(.05,c.currentTime);o.start();o.stop(c.currentTime+duration)}catch(e){}}

function build(){
  phases=[];
  for(let c=1;c<=cfg.cycles;c++){
    if(cfg.prep&&c===1)phases.push({name:"PREPARAÇÃO",sec:cfg.prep,type:"prep",cycle:c,set:1});
    for(let s=1;s<=cfg.sets;s++){
      phases.push({name:"EXERCÍCIO",sec:cfg.work,type:"work",cycle:c,set:s});
      if(s<cfg.sets&&cfg.rest)phases.push({name:"DESCANSO",sec:cfg.rest,type:"rest",cycle:c,set:s});
    }
  }
}
function nextLabel(){
  const n=phases[idx+1];
  if(!n){nextPhaseEl.textContent="ÚLTIMA ETAPA";nextPhaseEl.className="next-phase";return}
  nextPhaseEl.textContent="PRÓXIMO — "+n.name;
  nextPhaseEl.className="next-phase "+n.type;
}
function render(){
  const p=phases[idx];if(!p){finish();return}
  phaseEl.textContent=p.name;timeEl.textContent=fmt(remaining);
  setEl.textContent=p.type==="prep"?"PREPARAÇÃO":"SET "+p.set+"/"+cfg.sets;
  cycleEl.textContent="CICLO "+p.cycle+"/"+cfg.cycles;
  card.className="timer-card "+p.type+"-state";
  bar.style.transform="scaleX("+Math.max(0,Math.min(1,remaining/p.sec))+")";
  pauseBtn.textContent=paused?"CONTINUAR":"PAUSAR";nextLabel();
}
async function requestWakeLock(){if("wakeLock" in navigator){try{wakeLock=await navigator.wakeLock.request("screen");wakeLock.addEventListener("release",()=>{wakeLock=null})}catch(e){}}}
async function releaseWakeLock(){try{if(wakeLock)await wakeLock.release()}catch(e){}wakeLock=null}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&!paused&&timerView.classList.contains("active"))requestWakeLock()});

function enterPhase(initial=false){const p=phases[idx];remaining=p.sec;expectedAt=performance.now()+1000;if(!initial)beep(p.type==="work"?900:600,.1);render()}
function tick(){
  if(paused)return;
  const now=performance.now();
  remaining=Math.max(0,Math.ceil((expectedAt-now)/1000));
  if(remaining<=0){
    idx++;
    if(phases[idx]){enterPhase(false);return}
    finish();return;
  }
  if(remaining<=3&&remaining>=1)beep(1000,.05);
  render();
}
function start(){clearInterval(timer);timer=setInterval(tick,100);render();requestWakeLock()}
function finish(){clearInterval(timer);timer=null;releaseWakeLock();phaseEl.textContent="TREINO CONCLUÍDO";timeEl.textContent="00:00";setEl.textContent="EXCELENTE TRABALHO";bar.style.transform="scaleX(0)";pauseBtn.textContent="FINALIZADO";nextPhaseEl.textContent="APEX TRAINING SYSTEM";nextPhaseEl.className="next-phase";beep(1100,.16);setTimeout(()=>beep(1300,.22),180)}

$("#setupForm").addEventListener("submit",e=>{e.preventDefault();cfg={prep:val("#prep"),work:val("#work"),rest:val("#rest"),sets:Math.max(1,val("#sets")),cycles:Math.max(1,val("#cycles"))};build();idx=0;paused=false;timerView.classList.add("active");setup.classList.remove("active");enterPhase(true);start()});
pauseBtn.addEventListener("click",()=>{if(!phases.length)return;paused=!paused;if(paused){clearInterval(timer);timer=null;releaseWakeLock();render()}else{expectedAt=performance.now()+remaining*1000;start();beep(800,.07)}});
$("#restartBtn").addEventListener("click",()=>{idx=0;paused=false;enterPhase(true);start()});
$("#skipBtn").addEventListener("click",()=>{if(idx<phases.length-1){idx++;paused=false;enterPhase(false);beep(650,.08);render()}});
$("#backBtn").addEventListener("click",()=>{clearInterval(timer);timer=null;releaseWakeLock();timerView.classList.remove("active");setup.classList.add("active");phases=[];idx=0;paused=false});
$("#soundBtn").addEventListener("click",()=>{sound=!sound;$("#soundBtn").textContent=sound?"🔊":"🔇"});
document.addEventListener("keydown",e=>{if(!timerView.classList.contains("active"))return;if(e.code==="Space"){e.preventDefault();pauseBtn.click()}if(e.key.toLowerCase()==="s")$("#skipBtn").click();if(e.key.toLowerCase()==="r")$("#restartBtn").click()});
