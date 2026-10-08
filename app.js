const $=s=>document.querySelector(s);let cfg={},phases=[],idx=0,remaining=0,paused=false,timer=null,sound=true;
const setup=$("#setupView"),timerView=$("#timerView"),card=$("#timerCard"),phaseEl=$("#phase"),timeEl=$("#time"),setEl=$("#setLabel"),cycleEl=$("#cycleLabel"),bar=$("#progressBar"),estimate=$("#estimate"),pauseBtn=$("#pauseBtn");
function val(id){return Math.max(0,parseInt($(id).value,10)||0)}
function fmt(s){s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}
function calcTotal(){const p=val("#prep"),w=val("#work"),r=val("#rest"),sets=Math.max(1,val("#sets")),cycles=Math.max(1,val("#cycles"));let per=w*sets+r*Math.max(0,sets-1);return p+per*cycles}
function updateEstimate(){estimate.textContent=fmt(calcTotal())}
["#prep","#work","#rest","#sets","#cycles"].forEach(id=>$(id).addEventListener("input",updateEstimate));updateEstimate();
function beep(freq=700,duration=.08){if(!sound)return;try{const C=window.AudioContext||window.webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;o.connect(g);g.connect(c.destination);g.gain.setValueAtTime(.05,c.currentTime);o.start();o.stop(c.currentTime+duration)}catch(e){}}
function build(){phases=[];for(let c=1;c<=cfg.cycles;c++){if(cfg.prep&&c===1)phases.push({name:"PREPARAÇÃO",sec:cfg.prep,type:"prep",cycle:c,set:1});for(let s=1;s<=cfg.sets;s++){phases.push({name:"EXERCÍCIO",sec:cfg.work,type:"work",cycle:c,set:s});if(s<cfg.sets&&cfg.rest)phases.push({name:"DESCANSO",sec:cfg.rest,type:"rest",cycle:c,set:s})}}}
function render(){const p=phases[idx];if(!p){finish();return}phaseEl.textContent=p.name;timeEl.textContent=fmt(remaining);setEl.textContent=p.type==="prep"?"COMEÇANDO":`SET ${p.set}/${cfg.sets}`;cycleEl.textContent=`CICLO ${p.cycle}/${cfg.cycles}`;card.className="timer-card "+p.type+"-state";const pct=remaining/p.sec;bar.style.transform=`scaleX(${pct})`;pauseBtn.textContent=paused?"CONTINUAR":"PAUSAR"}
function tick(){if(paused)return;remaining--;if(remaining<=0){beep(900,.13);idx++;if(phases[idx]){remaining=phases[idx].sec;beep(600,.08)}else{finish();return}}else if(remaining<=3)beep(1000,.05);render()}
function start(){clearInterval(timer);timer=setInterval(tick,1000);render()}
function finish(){clearInterval(timer);beep(1100,.3);phaseEl.textContent="TREINO CONCLUÍDO";timeEl.textContent="00:00";setEl.textContent="EXCELENTE TRABALHO";bar.style.transform="scaleX(0)";pauseBtn.textContent="FINALIZADO"}
$("#setupForm").addEventListener("submit",e=>{e.preventDefault();cfg={prep:val("#prep"),work:val("#work"),rest:val("#rest"),sets:Math.max(1,val("#sets")),cycles:Math.max(1,val("#cycles"))};build();idx=0;remaining=phases[0].sec;paused=false;setup.classList.remove("active");timerView.classList.add("active");start()});
pauseBtn.addEventListener("click",()=>{if(idx>=phases.length)return;paused=!paused;render()});
$("#restartBtn").addEventListener("click",()=>{idx=0;remaining=phases[0]?.sec||0;paused=false;start()});
$("#skipBtn").addEventListener("click",()=>{if(idx<phases.length-1){idx++;remaining=phases[idx].sec;beep(650,.08);render()}});
$("#backBtn").addEventListener("click",()=>{clearInterval(timer);timerView.classList.remove("active");setup.classList.add("active")});
$("#soundBtn").addEventListener("click",()=>{sound=!sound;$("#soundBtn").textContent=sound?"🔊":"🔇"});
