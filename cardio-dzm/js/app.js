/* Кардио ДЗМ — тренажёр. Без внешних зависимостей, работает с file:// */
(function(){
"use strict";
var C = window.CARDIO;
var KEY = "cardioDZM.v1";
var LET = ["А","Б","В","Г","Д","Е","Ж","З"];
var app = document.getElementById("app");

/* ---------- utils ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function pad(n){return (n<10?"0":"")+n;}
function dstr(d){d=d||new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function addDays(s,n){var p=s.split("-");var d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()+n);return dstr(d);}
function dayDiff(a,b){var pa=a.split("-"),pb=b.split("-");return Math.round((new Date(+pb[0],+pb[1]-1,+pb[2])-new Date(+pa[0],+pa[1]-1,+pa[2]))/864e5);}
function ruDate(s){var p=s.split("-");return p[2]+"."+p[1]+"."+p[0];}
function mmss(ms){if(ms<0)ms=0;var s=Math.round(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60);s=s%60;return (h?h+":"+pad(m):m)+":"+pad(s);}
function pct(c,n){return n?Math.round(100*c/n):0;}
function toast(t,ms){var d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove();},ms||3500);}
function krTitle(code){var k=C.krMap[code];if(k)return k.title+" ("+(code.indexOf("_")>0?"КР "+code+", ":"")+k.year+")";return C.extraRefs[code]||code;}

/* ---------- index ---------- */
C.krMap={};C.kr.forEach(function(k){C.krMap[k.code]=k;});
C.caseMap={};C.tests.forEach(function(c){C.caseMap[c.id]=c;});
C.zMap={};C.zadachi.forEach(function(z){C.zMap[z.id]=z;});
C.demoKC=C.demoKC||[];C.fmza=C.fmza||[];C.fmzaTopics=C.fmzaTopics||[];

/* ---------- state ---------- */
var S;
function defState(){return {v:2,examSeenQ:{},examSeenC:{},q:{},days:{},exams:[],planDone:{},settings:{remind:"19:00",goal:40,partial:true,sound:true,notif:false},lastRemind:""};}
function load(){try{S=JSON.parse(localStorage.getItem(KEY))||defState();}catch(e){S=defState();}
  var d=defState();for(var k in d)if(S[k]===undefined)S[k]=d[k];for(k in d.settings)if(S.settings[k]===undefined)S.settings[k]=d.settings[k];}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){toast("Не удалось сохранить прогресс: "+e.message);}}
load();

/* SM-2 */
function srsUpdate(r,quality){var s=r.srs||{ef:2.5,int:0,reps:0,lapses:0};
  if(quality<3){s.reps=0;s.int=1;s.lapses=(s.lapses||0)+1;}
  else{s.reps++;s.int=s.reps===1?1:(s.reps===2?3:Math.round(s.int*s.ef));}
  s.ef=Math.max(1.3,s.ef+0.1-(5-quality)*(0.08+(5-quality)*0.02));
  s.due=addDays(dstr(),s.int);r.srs=s;}
function record(qid,score,ms,meta){var r=S.q[qid]||{n:0,c:0,ms:0};r.n++;r.c+=score;r.ms+=Math.min(ms||0,15*60000);
  r.last=dstr();r.ok=score>=0.999;for(var k in meta)r[k]=meta[k];
  srsUpdate(r,r.ok?((ms&&ms<60000)?5:4):(score>=0.5?2:1));S.q[qid]=r;
  var d=S.days[dstr()]||{n:0,c:0};d.n++;d.c+=score;S.days[dstr()]=d;save();}
function metaT(c,qi){return {kr:c.kr,kr2:c.kr2||null,src:"T",dom:c.topic};}
function metaZ(z,qi){return {kr:z.kr,kr2:z.kr2||null,src:"Z",dom:z.topic,sec:z.q[qi].s};}

/* ---------- item accessors (single-choice) ---------- */
function itemOf(it){ // returns {stem, opts, a, e, fr, ref, ctx}
  if(it.src==="T"){var c=C.caseMap[it.cid],q=c.q[it.qi];return {case:c,t:q.t,o:q.o,a:q.a,e:q.e,fr:q.fr,ref:q.ref,meta:metaT(c,it.qi)};}
  if(it.src==="KC"){var d=C.demoKC[it.i];return {t:d.q,o:d.o,a:d.a,e:"Официальный демонстрационный вопрос Кадрового центра ДЗМ (все специальности). Пояснения к ответам в источнике не публикуются.",meta:{src:"KC"}};}
  if(it.src==="F"){var f=C.fmza[it.i];return {t:f[2],o:f[3],a:f[4],e:"Банк ФМЗА (неофициальная копия geetest.ru). Тема: "+C.fmzaTopics[f[1]]+". Проверяйте актуальность по действующим КР.",meta:{src:"F",ft:f[1]}};}
}
function makeOrders(items){ // balanced placement of the correct answer
  var bags={};items.forEach(function(it){var x=itemOf(it),n=x.o.length;
    if(!bags[n]||!bags[n].length){var b=[];for(var r=0;r<Math.max(1,Math.ceil(items.length/n));r++)for(var p=0;p<n;p++)b.push(p);bags[n]=shuffle(b);}
    var pos=bags[n].pop();var others=shuffle(x.o.map(function(_,i){return i;}).filter(function(i){return i!==x.a;}));
    others.splice(pos,0,x.a);it.ord=others;});
  return items;}

/* ---------- audio / notifications ---------- */
var actx=null;
function beep(times){if(!S.settings.sound)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();
  for(var i=0;i<(times||2);i++){var o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;o.connect(g);g.connect(actx.destination);
  var t=actx.currentTime+i*0.35;g.gain.setValueAtTime(0.25,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.start(t);o.stop(t+0.3);}}catch(e){}}
function notify(title,body){try{if(window.Notification&&Notification.permission==="granted")NOTES.push(new Notification(title,{body:body,tag:"cardio-timer"}));}catch(e){}toast(title+(body?" — "+body:""),6000);}

/* ---------- timer ---------- */
var R=null; // current runner session
var tick=null;
function startTimer(){stopTimer();tick=setInterval(onTick,1000);onTick();}
function stopTimer(){if(tick)clearInterval(tick);tick=null;}
var NOTES=[];
function clearToasts(){NOTES.forEach(function(n){try{n.close();}catch(e){}});NOTES=[];var t=document.querySelectorAll(".toast");for(var i=0;i<t.length;i++)t[i].remove();}
function onTick(){if(!R||!R.deadline)return;var left=R.deadline-Date.now();var el=document.getElementById("timer");
  if(el){el.textContent="⏱ "+mmss(left);el.className="timer"+(left<5*60000?" crit":left<10*60000?" warn":"");}
  var cur=R,due=[];(R.alarmMins||[30,10,5]).forEach(function(m){if(left<=m*60000&&!cur.alarms[m]&&cur.total>m*60000){cur.alarms[m]=1;due.push(m);}});
  if(due.length&&left>0){var mm=Math.min.apply(null,due);beep(mm===5?3:2);notify("Осталось "+mm+" мин","Кардио ДЗМ — "+cur.title);}
  if(cur!==R||cur.done)return;
  if(left<=0&&!R.alarms[0]){R.alarms[0]=1;beep(4);notify("Время истекло","Ответы сохранены, этап завершён.");finishRunner(true);}}

/* ---------- router ---------- */
var routes={};
function go(h){location.hash=h;}
function parseHash(){var h=location.hash.replace(/^#/,"")||"home";var p=h.split("?");var q={};(p[1]||"").split("&").forEach(function(kv){if(kv){var a=kv.split("=");q[decodeURIComponent(a[0])]=decodeURIComponent(a[1]||"");}});return {v:p[0],q:q};}
var lastHash="#home";
function route(){var p=parseHash();
  if(R&&!R.done&&R.mode==="exam"&&p.v!=="run"){if(!confirm("Идёт экзамен. Прервать его? Результат не будет засчитан.")){history.replaceState(null,"","#run");return;}stopTimer();R=null;}
  if(p.v!=="run"&&R&&(R.done||R.mode!=="exam")){if(!R.done&&R.answered&&R.mode!=="exam"){} stopTimer();R=null;}
  document.querySelectorAll("#menu a").forEach(function(a){a.classList.toggle("on",a.getAttribute("href")==="#"+p.v);});
  (routes[p.v]||routes.home)(p.q);lastHash=location.hash;window.scrollTo(0,0);}
window.addEventListener("hashchange",route);

/* ---------- shared renderers ---------- */
function labsHTML(labs,texts){var h="";(labs||[]).forEach(function(t){h+='<h4>'+esc(t.h)+'</h4><table><tr><th>Показатель</th><th>Результат</th><th>Референс</th></tr>';
  t.rows.forEach(function(r){var cls=r[3]==="H"?"hi":r[3]==="L"?"lo":"";var ar=r[3]==="H"?" ↑":r[3]==="L"?" ↓":"";
  h+='<tr><td>'+esc(r[0])+'</td><td class="'+cls+'">'+esc(r[1])+ar+'</td><td class="mute">'+esc(r[2]||"")+'</td></tr>';});h+='</table>';});
  (texts||[]).forEach(function(t){h+='<h4>'+esc(t[0])+'</h4><div class="vign">'+esc(t[1])+'</div>';});return h?'<div class="labs">'+h+'</div>':"";}
function caseHTML(c){return '<div class="card sticky"><div class="qhead"><h2>'+esc(c.title||"Клиническая ситуация")+'</h2><span class="tag blue">'+esc(c.id)+'</span></div>'+
  '<div class="small mute">'+esc(krTitle(c.kr))+'</div><p class="vign">'+esc(c.vignette)+'</p>'+labsHTML(c.labs,c.texts)+'</div>';}
function explHTML(x){if(!x.e&&!x.fr)return "";return '<div class="expl"><b>Пояснение.</b> '+esc(x.e||"")+(x.fr?'<div class="fr">🇫🇷 '+esc(x.fr)+'</div>':"")+
  (x.ref||x.meta&&x.meta.kr?'<div class="ref">Источник: '+esc(x.meta&&x.meta.kr?krTitle(x.meta.kr):"")+(x.ref?", "+esc(x.ref):"")+'</div>':"")+'</div>';}

/* ================= SINGLE-CHOICE RUNNER ================= */
function startSingle(items,mode,title,opts){opts=opts||{};stopTimer();clearToasts();
  R={kind:"single",mode:mode,title:title,items:makeOrders(items),idx:0,ans:{},flag:{},tspent:{},shownAt:Date.now(),done:false,alarms:{},onFinish:opts.onFinish,
     total:opts.minutes?opts.minutes*60000:0,deadline:opts.minutes?Date.now()+opts.minutes*60000:0,started:Date.now(),exam:opts.exam,alarmMins:opts.alarms||[30,10,5]};
  if(location.hash!=="#run")go("run");else route();if(R.deadline)startTimer();}
function accTime(){if(!R)return;var i=R.idx;R.tspent[i]=(R.tspent[i]||0)+(Date.now()-R.shownAt);R.shownAt=Date.now();}
function renderSingle(){var it=R.items[R.idx],x=itemOf(it),n=R.items.length,a=R.ans[R.idx];var fb=R.mode!=="exam"&&a!==undefined;
  var h='<div class="card"><div class="qhead"><div><b>'+esc(R.title)+'</b> <span class="mute">· '+(R.mode==="exam"?"экзамен (без проверки до конца)":"тренировка")+'</span></div>'+
    '<div class="row">'+(R.deadline?'<span id="timer" class="timer"></span>':'')+'<span class="tag">Вопрос '+(R.idx+1)+' / '+n+'</span></div></div>';
  if(R.mode==="exam"){h+='<div class="navgrid">';R.items.forEach(function(_,i){h+='<b data-nav="'+i+'" class="'+(R.ans[i]!==undefined?"ans ":"")+(R.flag[i]?"flag ":"")+(i===R.idx?"cur":"")+'">'+(i+1)+'</b>';});h+='</div>';}
  h+='</div>';
  var qh='<div class="card"><div class="qtext">'+esc(x.t)+'</div>';
  it.ord.forEach(function(oi,p){var cls="opt";if(a===oi)cls+=" sel";if(fb){if(oi===x.a)cls+=" ok";else if(a===oi)cls+=" bad";}
    qh+='<div class="'+cls+'" data-opt="'+oi+'"><span class="lt">'+LET[p]+'</span><span>'+esc(x.o[oi])+'</span></div>';});
  if(fb)qh+='<div class="'+(a===x.a?"pass":"fail")+'"><b>'+(a===x.a?"Верно":"Неверно")+'</b></div>'+explHTML(x);
  qh+='<div class="row" style="margin-top:10px">';
  if(R.mode==="exam"){qh+='<button class="btn gray" data-act="prev" '+(R.idx?"":"disabled")+'>← Назад</button><button class="btn gray" data-act="flag">'+(R.flag[R.idx]?"Снять отметку":"⚑ Отметить")+'</button><button class="btn sec" data-act="next" '+(R.idx<n-1?"":"disabled")+'>Далее →</button><button class="btn" data-act="finish">Завершить тестирование</button>';}
  else{qh+=(fb?'<button class="btn" data-act="next">'+(R.idx<n-1?"Далее →":"Результаты")+'</button>':'<span class="mute small">Выберите один ответ</span>')+'<button class="btn gray" data-act="finish">Завершить</button>';}
  qh+='</div></div>';
  var body=x.case?'<div class="split">'+caseHTML(x.case)+'<div>'+qh+'</div></div>':qh;
  app.innerHTML=h+body;onTick();
  app.querySelectorAll("[data-opt]").forEach(function(el){el.onclick=function(){var oi=+el.getAttribute("data-opt");
    if(R.mode==="exam"){R.ans[R.idx]=oi;renderSingle();return;}
    if(R.ans[R.idx]!==undefined)return;R.ans[R.idx]=oi;accTime();record(qidOf(it),oi===x.a?1:0,R.tspent[R.idx],x.meta);renderSingle();};});
  app.querySelectorAll("[data-nav]").forEach(function(el){el.onclick=function(){accTime();R.idx=+el.getAttribute("data-nav");renderSingle();};});
  app.querySelectorAll("[data-act]").forEach(function(el){el.onclick=function(){var act=el.getAttribute("data-act");
    if(act==="prev"){accTime();R.idx--;renderSingle();}
    else if(act==="next"){accTime();if(R.idx<n-1){R.idx++;renderSingle();}else finishRunner();}
    else if(act==="flag"){R.flag[R.idx]=!R.flag[R.idx];renderSingle();}
    else if(act==="finish"){var un=n-Object.keys(R.ans).length;if(R.mode!=="exam"||confirm(un?"Без ответа: "+un+". Завершить тестирование?":"Завершить тестирование?"))finishRunner();}};});}
function qidOf(it){return it.src==="T"?it.cid+"."+it.qi:it.src==="KC"?"KC."+it.i:it.src==="F"?"F."+it.i:it.qid;}
function finishRunner(timeout){if(!R||R.done)return;if(R.kind==="zad")return finishZad(timeout);accTime();stopTimer();if(!timeout)clearToasts();R.done=true;
  var c=0,n=R.items.length;R.items.forEach(function(it,i){var x=itemOf(it);var ok=R.ans[i]===x.a;if(ok)c++;
    if(R.mode==="exam")record(qidOf(it),ok?1:0,R.tspent[i]||0,x.meta);});
  R.score=c;R.pct=pct(c,n);if(R.onFinish)R.onFinish(R);renderSingleResult();}
function renderSingleResult(){var n=R.items.length,p=R.pct,pass=p>=60;var answered=Object.keys(R.ans).length;
  var h='<div class="card"><h1>'+esc(R.title)+' — результат</h1><div class="big '+(pass?"pass":"fail")+'">'+p+'% · '+(pass?"СДАНО":"НЕ СДАНО")+'</div>'+
  '<p>Верно '+R.score+' из '+n+' (порог 60%). Отвечено: '+answered+'. Время: '+mmss(Date.now()-R.started)+'.</p>'+(R.nextHTML||'')+'<div class="navgrid">';
  R.items.forEach(function(it,i){var ok=R.ans[i]===itemOf(it).a;h+='<b class="'+(ok?"ok":"bad")+'" data-go="'+i+'">'+(i+1)+'</b>';});
  h+='</div><p class="small mute">Нажмите на номер, чтобы открыть разбор. Ошибки автоматически добавлены в «Повторение».</p></div><div id="rev"></div>';
  app.innerHTML=h;bindNext();
  app.querySelectorAll("[data-go]").forEach(function(el){el.onclick=function(){showReviewItem(+el.getAttribute("data-go"));};});
  var first=R.items.findIndex(function(it,i){return R.ans[i]!==itemOf(it).a;});if(first>=0)showReviewItem(first);}
function showReviewItem(i){var it=R.items[i],x=itemOf(it),a=R.ans[i];var q='<div class="card"><div class="qhead"><b>Вопрос '+(i+1)+'</b></div><div class="qtext">'+esc(x.t)+'</div>';
  it.ord.forEach(function(oi,p){var cls="opt";if(oi===x.a)cls+=" ok";else if(a===oi)cls+=" bad";q+='<div class="'+cls+'"><span class="lt">'+LET[p]+'</span><span>'+esc(x.o[oi])+'</span></div>';});
  q+=(a===undefined?'<p class="fail">Нет ответа</p>':'')+explHTML(x)+'</div>';
  document.getElementById("rev").innerHTML=x.case?'<div class="split">'+caseHTML(x.case)+'<div>'+q+'</div></div>':q;
  document.getElementById("rev").scrollIntoView({behavior:"smooth"});}
function bindNext(){app.querySelectorAll("[data-next]").forEach(function(el){el.onclick=function(){var k=el.getAttribute("data-next");if(k==="stage2")startStage2(R.exam);else if(k==="home")go("home");};});}

/* ================= ZADACHA RUNNER ================= */
function startZad(ids,mode,title,opts){opts=opts||{};stopTimer();clearToasts();
  R={kind:"zad",mode:mode,title:title,list:ids,zi:0,qi:0,sel:[],ans:ids.map(function(){return [];}),ord:{},checked:false,done:false,alarms:{},partial:opts.partial!=null?opts.partial:S.settings.partial,
     total:opts.minutes?opts.minutes*60000:0,deadline:opts.minutes?Date.now()+opts.minutes*60000:0,started:Date.now(),shownAt:Date.now(),onFinish:opts.onFinish,exam:opts.exam,alarmMins:opts.alarms||[10,5]};
  ids.forEach(function(id){var z=C.zMap[id];R.ord[id]=z.q.map(function(q){return shuffle(q.o.map(function(_,i){return i;}));});});
  if(location.hash!=="#run")go("run");else route();if(R.deadline)startTimer();}
function zScore(q,sel,partial){var hit=sel.filter(function(i){return q.a.indexOf(i)>=0;}).length;if(hit===q.a.length&&sel.length===q.a.length)return 1;return partial?hit/q.a.length:0;}
function revealsUpTo(z,qi){var h="";for(var i=0;i<qi;i++){var r=z.q[i].rev;if(r)h+='<div class="reveal"><b>'+esc(r.h||"Дополнительная информация")+'</b>'+(r.text?'<div class="vign">'+esc(r.text)+'</div>':'')+labsHTML(r.labs,r.texts)+'</div>';}return h;}
function renderZad(){var id=R.list[R.zi],z=C.zMap[id],q=z.q[R.qi],N=q.a.length,ord=R.ord[id][R.qi];var fb=R.checked;
  var h='<div class="card"><div class="qhead"><div><b>'+esc(R.title)+'</b> <span class="mute">· задача '+(R.zi+1)+' из '+R.list.length+' · '+(R.mode==="exam"?"экзамен: без возврата и проверки":"тренировка")+'</span></div><div class="row">'+(R.deadline?'<span id="timer" class="timer"></span>':'')+'<span class="tag">Вопрос '+(R.qi+1)+' / '+z.q.length+'</span></div></div><div class="dots">';
  z.q.forEach(function(qq,i){h+='<i title="'+qq.s+'" style="background:'+(i<R.qi?"#9db7f5":i===R.qi?"#b4232f":"#eef1f6")+'"></i>';});
  h+='</div></div><div class="split"><div class="card sticky"><h2>'+esc(z.title)+'</h2><div class="small mute">'+esc(krTitle(z.kr))+'</div><p class="vign">'+esc(z.vignette)+'</p>'+labsHTML(z.labs,z.texts)+revealsUpTo(z,R.qi+(fb?1:0))+'</div><div><div class="card">';
  h+='<div class="qhead"><span class="secpill sec-'+q.s+'">'+q.s+' · '+({"О":"Обследование","Д":"Диагноз","Л":"Лечение","В":"Вариатив"})[q.s]+'</span><b class="fail">Выберите '+N+' '+(N===1?"правильный ответ":N<5?"правильных ответа":"правильных ответов")+'</b></div><div class="qtext">'+esc(q.t)+'</div>';
  ord.forEach(function(oi,p){var on=R.sel.indexOf(oi)>=0;var cls="opt"+(on?" sel":"");if(fb){var corr=q.a.indexOf(oi)>=0;if(corr&&on)cls+=" ok";else if(on)cls+=" bad";else if(corr)cls+=" ok miss";}
    h+='<label class="'+cls+'" data-zo="'+oi+'"><input type="checkbox" '+(on?"checked":"")+' '+(fb?"disabled":"")+'><span class="lt">'+LET[p]+'</span><span>'+esc(q.o[oi])+'</span></label>';});
  if(fb){var sc=zScore(q,R.sel,R.partial);h+='<div class="'+(sc===1?"pass":"fail")+'"><b>'+(sc===1?"Верно":sc>0?"Частично верно ("+Math.round(sc*100)+"%)":"Неверно")+'</b></div>'+explHTML({e:q.e,fr:q.fr,ref:q.ref,meta:{kr:z.kr}});}
  h+='<div class="row" style="margin-top:10px">'+(fb?'<button class="btn" data-z="next">Далее →</button>':'<button class="btn" data-z="ok" '+(R.sel.length===N?"":"disabled")+'>Ответить ('+R.sel.length+'/'+N+')</button>')+
    '<button class="btn gray" data-z="finish">Завершить</button></div>'+(R.mode==="exam"?'<p class="small mute">Вернуться к предыдущим вопросам нельзя (как на экзамене).</p>':'')+'</div></div></div>';
  app.innerHTML=h;onTick();
  app.querySelectorAll("[data-zo]").forEach(function(el){el.onclick=function(ev){ev.preventDefault();if(R.checked)return;var oi=+el.getAttribute("data-zo");var k=R.sel.indexOf(oi);
    if(k>=0)R.sel.splice(k,1);else{if(R.sel.length>=N){toast("Можно выбрать только "+N);return;}R.sel.push(oi);}renderZad();};});
  app.querySelectorAll("[data-z]").forEach(function(el){el.onclick=function(){var a=el.getAttribute("data-z");
    if(a==="ok"){var ms=Date.now()-R.shownAt;R.ans[R.zi][R.qi]=R.sel.slice();var sc=zScore(q,R.sel,R.mode==="exam"?false:R.partial);
      record(id+"."+R.qi,sc,ms,metaZ(z,R.qi));
      if(R.mode==="exam")zNext();else{R.checked=true;renderZad();}}
    else if(a==="next")zNext();
    else if(a==="finish"){if(confirm("Завершить решение задач? Неотвеченные вопросы будут засчитаны как неверные."))finishZad();}};});}
function zNext(){R.checked=false;R.sel=[];R.shownAt=Date.now();var z=C.zMap[R.list[R.zi]];if(R.qi<z.q.length-1)R.qi++;else if(R.zi<R.list.length-1){R.zi++;R.qi=0;}else return finishZad();renderZad();window.scrollTo(0,0);}
function finishZad(timeout){if(R.done)return;stopTimer();if(!timeout)clearToasts();R.done=true;var tot=0,sc=0;
  R.list.forEach(function(id,zi){var z=C.zMap[id];z.q.forEach(function(q,qi){tot++;var s=R.ans[zi][qi];if(s)sc+=zScore(q,s,R.mode==="exam"?false:R.partial);});});
  R.score=Math.round(sc*10)/10;R.totalQ=tot;R.pct=pct(sc,tot);if(R.onFinish)R.onFinish(R);renderZadResult();}
function renderZadResult(){var pass=R.pct>=60;var h='<div class="card"><h1>'+esc(R.title)+' — результат</h1><div class="big '+(pass?"pass":"fail")+'">'+R.pct+'% · '+(pass?"СДАНО":"НЕ СДАНО")+'</div><p>Баллы: '+R.score+' из '+R.totalQ+
  (R.mode==="exam"?' (строгий подсчёт: вопрос засчитывается, только если выбраны все правильные ответы)':(R.partial?' (частичный подсчёт)':' (строгий подсчёт)'))+'. Время: '+mmss(Date.now()-R.started)+'.</p>'+(R.nextHTML||'')+'</div>';
  R.list.forEach(function(id,zi){var z=C.zMap[id];h+='<div class="card"><h2>'+esc(z.title)+'</h2><p class="small mute">'+esc(krTitle(z.kr))+'</p><details><summary>Условие задачи</summary><p class="vign">'+esc(z.vignette)+'</p>'+labsHTML(z.labs,z.texts)+revealsUpTo(z,z.q.length)+'</details>';
    z.q.forEach(function(q,qi){var s=R.ans[zi][qi]||[];var sc=zScore(q,s,false);h+='<h3><span class="secpill sec-'+q.s+'">'+q.s+'</span> '+(qi+1)+'. '+esc(q.t)+' <span class="'+(sc===1?"pass":"fail")+'">'+(sc===1?"✔":"✘")+'</span></h3>';
      q.o.forEach(function(o,oi){var on=s.indexOf(oi)>=0,corr=q.a.indexOf(oi)>=0;h+='<div class="opt '+(corr?(on?"ok":"ok miss"):(on?"bad":""))+'"><span>'+(corr?"✔ ":"")+esc(o)+'</span></div>';});
      h+=explHTML({e:q.e,fr:q.fr,ref:q.ref,meta:{kr:z.kr}});});h+='</div>';});
  app.innerHTML=h;bindNext();}

/* ================= EXAM ================= */
var EXAM_W={"ИБС":5,"АГ":2,"СН":3,"НРС":4,"КЛП":2,"СОС":2,"ВПС":1,"ПР":1};
function drawExam1(n){ // stage 1: one question per DIFFERENT case, weighted by domain, least-recently-seen first
  var seenQ=S.examSeenQ||{},seenC=S.examSeenC||{};
  function qn(id){return S.q[id]?S.q[id].n:0;}
  function byRecency(arr,key){return shuffle(arr).sort(function(a,b){return key(a)-key(b);});}
  var by={};C.tests.forEach(function(c){(by[c.topic]=by[c.topic]||[]).push(c);});
  for(var k in by)by[k]=byRecency(by[k],function(c){return seenC[c.id]||0;});
  var tot=0;for(k in EXAM_W)tot+=EXAM_W[k];
  var nCases=Math.min(n,C.tests.length),pick=[],used={};
  Object.keys(EXAM_W).forEach(function(d){var q=Math.round(nCases*EXAM_W[d]/tot),arr=by[d]||[];for(var i=0;i<q&&i<arr.length&&pick.length<nCases;i++){pick.push(arr[i]);used[arr[i].id]=1;}});
  var rest=byRecency(C.tests.filter(function(c){return !used[c.id];}),function(c){return seenC[c.id]||0;});
  while(pick.length<nCases&&rest.length)pick.push(rest.shift());
  var remain={};
  var items=pick.map(function(c){var qs=byRecency(c.q.map(function(_,i){return i;}),function(i){var id=c.id+"."+i;return (seenQ[id]||0)+qn(id);});
    remain[c.id]=qs.slice(1);return {src:"T",cid:c.id,qi:qs[0]};});
  if(items.length<n){ // fallback only when the bank has fewer cases than questions required
    var cs=shuffle(pick.slice());var guard=0;while(items.length<n&&guard++<5000){var c=cs[guard%cs.length];if(remain[c.id]&&remain[c.id].length)items.push({src:"T",cid:c.id,qi:remain[c.id].shift()});}}
  items=shuffle(items);
  for(var i=1;i<items.length;i++){if(items[i].cid===items[i-1].cid){for(var j=i+1;j<items.length;j++){if(items[j].cid!==items[i-1].cid&&(j+1>=items.length||items[j+1].cid!==items[i].cid)&&items[j-1].cid!==items[i].cid){var t=items[i];items[i]=items[j];items[j]=t;break;}}}}
  return items;}
function markExamSeen(items){var now=Date.now();S.examSeenQ=S.examSeenQ||{};S.examSeenC=S.examSeenC||{};
  items.forEach(function(it){S.examSeenQ[it.cid+"."+it.qi]=now;S.examSeenC[it.cid]=now;});save();}
function startExam(){if(C.tests.length<1){toast("Нет заданий");return;}beep(0);
  var items=drawExam1(100);markExamSeen(items);
  var ex={date:new Date().toISOString(),start:Date.now()};
  startSingle(items,"exam","Этап 1. Тестирование ("+items.length+" вопросов, 150 мин)",{minutes:150,alarms:[30,10,5],exam:ex,onFinish:function(r){ex.t1=r.pct;ex.t1c=r.score;ex.t1n=r.items.length;ex.t1ms=Date.now()-r.started;
    S.exams.push(ex);save();r.nextHTML=r.pct>=60?'<button class="btn" data-next="stage2">Перейти к этапу 2: ситуационные задачи (2 задачи, 40 мин) →</button>':
      '<p class="fail">На реальном экзамене при результате ниже 60% к этапу 2 не допускают.</p><button class="btn sec" data-next="stage2">Всё равно потренироваться в этапе 2 →</button>';}});}
function startStage2(ex){var by={};C.zadachi.forEach(function(z){(by[z.topic]=by[z.topic]||[]).push(z.id);});var doms=shuffle(Object.keys(by));
  var ids=[];doms.forEach(function(d){if(ids.length<2)ids.push(shuffle(by[d])[0]);});if(ids.length<2)ids=shuffle(C.zadachi.map(function(z){return z.id;})).slice(0,2);
  startZad(ids,"exam","Этап 2. Ситуационные задачи (2 задачи, 40 мин)",{minutes:40,alarms:[10,5],exam:ex,onFinish:function(r){if(ex){ex.t2=r.pct;ex.t2s=r.score;ex.t2n=r.totalQ;ex.pass=(ex.t1>=60&&ex.t2>=60);
    var i=S.exams.indexOf(ex);if(i<0){S.exams.push(ex);}save();r.nextHTML='<p><b>Итог пробного экзамена:</b> тесты '+ex.t1+'%, задачи '+ex.t2+'% → <b class="'+(ex.pass?"pass":"fail")+'">'+(ex.pass?"РЕКОМЕНДОВАН (сдано)":"НЕ СДАНО")+'</b></p><button class="btn gray" data-next="home">На главную</button>';}}});}

/* ================= VIEWS ================= */
function todayPlan(){var d=dayDiff(C.planStart,dstr())+1;return {n:d,day:C.plan[d-1]};}
function streak(){var g=S.settings.goal,s=0,d=dstr();if(!(S.days[d]&&S.days[d].n>=g))d=addDays(d,-1);while(S.days[d]&&S.days[d].n>=g){s++;d=addDays(d,-1);}return s;}
function dueList(){var t=dstr();return Object.keys(S.q).filter(function(k){var r=S.q[k];return r.srs&&r.srs.lapses>0&&r.srs.due<=t&&resolvable(k);});}
function resolvable(k){var p=k.split(".");if(p[0]==="KC")return !!C.demoKC[+p[1]];if(p[0]==="F")return !!C.fmza[+p[1]];if(C.caseMap[p[0]])return !!C.caseMap[p[0]].q[+p[1]];if(C.zMap[p[0]])return !!C.zMap[p[0]].q[+p[1]];return false;}
function nQ(){var t=0;C.tests.forEach(function(c){t+=c.q.length;});return t;}
function planKrLinks(kr){return kr.map(function(k){return '<a class="tag blue" href="#train?kr='+encodeURIComponent(k)+'">'+esc(k)+'</a>';}).join("");}

routes.home=function(){var tp=todayPlan(),today=S.days[dstr()]||{n:0,c:0},g=S.settings.goal,due=dueList().length;
  var h='<div class="grid g3"><div class="card"><div class="mute">Сегодня</div><div class="kpi">'+today.n+' <small>/ '+g+' вопросов</small></div><div class="bar"><i style="width:'+Math.min(100,pct(today.n,g))+'%"></i></div><div class="small mute">Верно: '+pct(today.c,today.n)+'%</div></div>'+
  '<div class="card"><div class="mute">Серия (дней с выполненной целью)</div><div class="kpi">🔥 '+streak()+'</div></div>'+
  '<div class="card"><div class="mute">К повторению сегодня</div><div class="kpi">'+due+'</div><a class="btn sm" href="#review">Повторить</a></div></div>';
  h+='<div class="card"><h2>План на сегодня</h2>';
  if(tp.n<1)h+='<p>План стартует <b>'+ruDate(C.planStart)+'</b> (через '+(1-tp.n)+' дн.). Можно начать с пробного экзамена, чтобы оценить исходный уровень.</p>';
  else if(!tp.day)h+='<p>30-дневный план завершён. Используйте «Повторение» и пробные экзамены.</p>';
  else h+='<p><b>День '+tp.n+' · '+ruDate(dstr())+'.</b> '+esc(tp.day.t)+'</p><div>'+planKrLinks(tp.day.kr)+'</div>'+(tp.day.mock?'<button class="btn" data-home="exam">Начать пробный экзамен</button>':'');
  h+='<a class="btn sec" href="#plan">Весь план</a></div>';
  h+='<div class="grid g2"><div class="card"><h2>Экзамен (формат приказа ДЗМ № 827)</h2><p>Этап 1: <b>100 тестов за 150 мин</b> (100 вопросов из 100 разных клинических ситуаций, вперемешку; 1 правильный ответ из 5).<br>Этап 2: <b>2 ситуационные задачи за 40 мин</b> (по 12 вопросов О/Д/Л/В, «выберите N правильных ответов»).<br>Порог каждого этапа — 60%.</p><button class="btn" data-home="exam">Начать пробный экзамен</button></div>'+
  '<div class="card"><h2>Содержимое</h2><p>Клинических ситуаций (тесты): <b>'+C.tests.length+'</b> ('+nQ()+' вопросов)<br>Ситуационных задач: <b>'+C.zadachi.length+'</b> ('+C.zadachi.length*12+' вопросов)<br>Демо Кадрового центра: <b>'+C.demoKC.length+'</b><br>Банк ФМЗА (неофициальная копия): <b>'+C.fmza.length+'</b></p><a class="btn sec" href="#train">Тесты по темам</a><a class="btn sec" href="#zadachi">Задачи</a></div></div>';
  app.innerHTML=h;app.querySelectorAll("[data-home]").forEach(function(b){b.onclick=function(){if(confirm("Начать пробный экзамен: 100 вопросов, 150 минут?"))startExam();};});};

routes.exam=function(){var h='<div class="card"><h1>Пробный экзамен</h1><p>Формат по приказу ДЗМ от 10.09.2026 № 827 (амбулаторное звено) и странице kadrcentr.ru/vhk:</p><ul><li>Этап 1 — компьютерное тестирование: 100 заданий, 150 минут; каждое задание — из отдельной клинической ситуации (условие и анализы показаны при каждом вопросе), порядок случайный, ситуации не повторяются, в следующих экзаменах приоритет — ещё не встречавшимся вопросам; ответы не проверяются до завершения; можно переходить между вопросами и отмечать их.</li><li>Этап 2 — ситуационные задачи: 2 задачи, 40 минут; вернуться к предыдущим вопросам нельзя; вопрос засчитывается только при выборе всех правильных ответов.</li><li>«Сдано» — 60% и более на каждом этапе; к этапу 2 допускают только после сдачи этапа 1.</li><li>Сигналы (звук + уведомление) за 30, 10 и 5 минут и по истечении времени.</li></ul><p class="small mute">Выборка 20 ситуаций взвешена по темам: ИБС/ОКС/липиды 5, нарушения ритма 4, СН/миокард 3, АГ/ЛГ 2, клапаны/ИЭ 2, сосуды/аорта 2, ВПС 1, прочее 1.</p>'+
  '<button class="btn" id="bx">Начать этап 1 (150 мин)</button><button class="btn sec" id="bz">Только этап 2 (2 задачи, 40 мин)</button></div>';
  if(S.exams.length){h+='<div class="card"><h2>История</h2><table><tr><th>Дата</th><th>Тесты</th><th>Задачи</th><th>Итог</th></tr>';S.exams.slice().reverse().forEach(function(e){h+='<tr><td>'+new Date(e.date).toLocaleString("ru-RU")+'</td><td>'+(e.t1!=null?e.t1+"%":"—")+'</td><td>'+(e.t2!=null?e.t2+"%":"—")+'</td><td>'+(e.t2!=null?(e.pass?'<span class="pass">сдано</span>':'<span class="fail">не сдано</span>'):(e.t1!=null&&e.t1<60?'<span class="fail">этап 1 не сдан</span>':"—"))+'</td></tr>';});h+='</table></div>';}
  app.innerHTML=h;document.getElementById("bx").onclick=function(){startExam();};document.getElementById("bz").onclick=function(){var ex={date:new Date().toISOString(),t1:null};S.exams.push(ex);save();startStage2(ex);};};

routes.run=function(){if(!R){go("home");return;}if(R.done)return R.kind==="zad"?renderZadResult():renderSingleResult();R.kind==="zad"?renderZad():renderSingle();};

function caseStat(c){var n=0,ok=0;c.q.forEach(function(_,i){var r=S.q[c.id+"."+i];if(r){n++;if(r.ok)ok++;}});return n?ok+"/"+c.q.length:"—";}
routes.train=function(q){var kr=q.kr;var list=C.tests.filter(function(c){return !kr||c.kr===kr||(c.kr2||[]).indexOf(kr)>=0;});
  var h='<div class="card"><h1>Тесты: клинические ситуации</h1><p class="small mute">Каждая ситуация: условие + результаты обследований + 7 вопросов, 1 правильный ответ из 5. Порядок ответов перемешивается при каждом запуске.</p>'+
   (kr?'<p>Фильтр: <b>'+esc(krTitle(kr))+'</b> <a href="#train">сбросить</a></p>':'')+'<button class="btn" id="all">Все показанные ситуации подряд ('+list.reduce(function(a,c){return a+c.q.length;},0)+' вопр.)</button><button class="btn sec" id="rnd">Случайные 20 вопросов</button></div>';
  if(kr&&!list.length){h+='<div class="card">По этой КР тестовых ситуаций пока нет. '+(C.zadachi.some(function(z){return z.kr===kr;})?'<a href="#zadachi?kr='+encodeURIComponent(kr)+'">Есть задачи →</a>':'Используйте банк ФМЗА (раздел «Банки»).')+'</div>';}
  Object.keys(C.domains).forEach(function(d){var cs=list.filter(function(c){return c.topic===d;});if(!cs.length)return;
    h+='<div class="card"><h2>'+esc(C.domains[d])+'</h2><table><tr><th>ID</th><th>Ситуация</th><th>КР</th><th>Верно</th><th></th></tr>';
    cs.forEach(function(c){h+='<tr><td>'+c.id+'</td><td>'+esc(c.title)+'</td><td class="small">'+esc(krTitle(c.kr))+'</td><td>'+caseStat(c)+'</td><td><button class="btn sm" data-case="'+c.id+'">Решать</button></td></tr>';});h+='</table></div>';});
  app.innerHTML=h;
  function its(cs){var a=[];cs.forEach(function(c){c.q.forEach(function(_,qi){a.push({src:"T",cid:c.id,qi:qi});});});return a;}
  document.getElementById("all").onclick=function(){if(list.length)startSingle(its(list),"train","Тренировка"+(kr?" · "+kr:""));};
  document.getElementById("rnd").onclick=function(){var a=its(list);if(a.length)startSingle(shuffle(a).slice(0,20),"train","Случайные вопросы");};
  app.querySelectorAll("[data-case]").forEach(function(b){b.onclick=function(){var c=C.caseMap[b.getAttribute("data-case")];startSingle(its([c]),"train",c.id+" · "+c.title);};});};

routes.zadachi=function(q){var kr=q.kr;var list=C.zadachi.filter(function(z){return !kr||z.kr===kr||(z.kr2||[]).indexOf(kr)>=0;});
  var h='<div class="card"><h1>Ситуационные задачи</h1><p class="small mute">12 вопросов: О — обследование, Д — диагноз, Л — лечение, В — вариатив. В каждом вопросе указано, сколько ответов выбрать. После ответов открываются дополнительные данные (результаты обследований, подтверждённый диагноз).</p>'+
  '<label><input type="checkbox" id="part" '+(S.settings.partial?"checked":"")+'> Частичный подсчёт баллов в тренировке</label><div style="margin-top:8px"><button class="btn" id="z2">Экзамен: 2 случайные задачи / 40 мин</button></div>'+(kr?'<p>Фильтр: <b>'+esc(krTitle(kr))+'</b> <a href="#zadachi">сбросить</a></p>':'')+'</div><div class="card"><table><tr><th>ID</th><th>Задача</th><th>КР</th><th>Лучший результат</th><th></th></tr>';
  list.forEach(function(z){var ok=0,n=0;z.q.forEach(function(_,i){var r=S.q[z.id+"."+i];if(r){n++;if(r.ok)ok++;}});
    h+='<tr><td>'+z.id+'</td><td>'+esc(z.title)+'</td><td class="small">'+esc(krTitle(z.kr))+'</td><td>'+(n?ok+"/"+z.q.length:"—")+'</td><td><button class="btn sm" data-zt="'+z.id+'">Тренировка</button><button class="btn sm sec" data-ze="'+z.id+'">Экзамен (20 мин)</button></td></tr>';});
  h+='</table></div>';app.innerHTML=h;
  document.getElementById("part").onchange=function(){S.settings.partial=this.checked;save();};
  document.getElementById("z2").onclick=function(){startStage2(null);};
  app.querySelectorAll("[data-zt]").forEach(function(b){b.onclick=function(){var id=b.getAttribute("data-zt");startZad([id],"train",id+" · тренировка");};});
  app.querySelectorAll("[data-ze]").forEach(function(b){b.onclick=function(){var id=b.getAttribute("data-ze");startZad([id],"exam",id+" · экзамен",{minutes:20});};});};

routes.review=function(){var due=dueList();var all=Object.keys(S.q).filter(function(k){return S.q[k].srs&&S.q[k].srs.lapses>0&&resolvable(k);});
  var h='<div class="card"><h1>Повторение ошибок (интервальное, SM-2)</h1><p>Каждый вопрос, на который вы ответили неверно, планируется к повторению: 1 → 3 → 6 → … дней (интервал растёт при правильных ответах и сбрасывается при ошибке).</p>'+
  '<p>К повторению сегодня: <b>'+due.length+'</b>. Всего вопросов с ошибками: <b>'+all.length+'</b>.</p><button class="btn" id="rd" '+(due.length?"":"disabled")+'>Повторить сегодняшние</button><button class="btn sec" id="ra" '+(all.length?"":"disabled")+'>Все ошибки</button></div>';
  var nz=0;all.forEach(function(k){if(C.zMap[k.split(".")[0]])nz++;});
  h+='<div class="card small mute">Вопросы задач (О/Д/Л/В) повторяются с полным условием и данными, открытыми до этого вопроса. Из них с ошибками: '+nz+'.</div>';app.innerHTML=h;
  function run(keys){var single=[],zq=[];keys.forEach(function(k){var p=k.split(".");if(p[0]==="KC")single.push({src:"KC",i:+p[1]});else if(p[0]==="F")single.push({src:"F",i:+p[1]});else if(C.caseMap[p[0]])single.push({src:"T",cid:p[0],qi:+p[1]});else zq.push(k);});
    if(single.length)startSingle(shuffle(single),"review","Повторение ошибок");else if(zq.length)startZqReview(zq);}
  var rd=document.getElementById("rd"),ra=document.getElementById("ra");rd.onclick=function(){run(due);};ra.onclick=function(){run(all);};};
function startZqReview(keys){ // review задача questions one by one, using train zad runner at the given question
  var k=keys[0],p=k.split(".");startZad([p[0]],"train","Повторение: "+p[0]);R.qi=+p[1];renderZad();}

routes.banks=function(){var h='<div class="grid g2"><div class="card"><h2>Демо Кадровый центр</h2><p>50 официальных демонстрационных вопросов Кадрового центра ДЗМ (для врачей всех специальностей; кардиологических ≈6). Формат: ситуация + 1 вопрос, 5 вариантов, 1 правильный. Источник: cloud.courseditor.ru, ссылка «Онлайн-тренажеры» на kadrcentr.ru/assessment_qualifications.</p><span class="tag green">Демо Кадровый центр</span><br><button class="btn" id="kct">Тренировка (50)</button><button class="btn sec" id="kce">Контроль без подсказок (50 / 75 мин)</button></div>'+
  '<div class="card"><h2>Банк ФМЗА (неофициальная копия)</h2><p>'+C.fmza.length+' вопросов первичной специализированной аккредитации «Кардиология» (копия с geetest.ru, 4 варианта, 1 правильный). Формат ПСА, не ДЗМ; часть вопросов может не соответствовать действующим КР.</p><span class="tag red">неофициальная копия</span><div class="row"><select id="ft"><option value="-1">Все темы</option>';
  C.fmzaTopics.forEach(function(t,i){var n=C.fmza.filter(function(f){return f[1]===i;}).length;h+='<option value="'+i+'">'+esc(t)+' ('+n+')</option>';});
  h+='</select><select id="fn"><option>20</option><option selected>50</option><option>100</option></select></div><button class="btn" id="fgo">Тренировка</button><button class="btn sec" id="fnew">Только новые вопросы</button></div></div>';
  app.innerHTML=h;
  document.getElementById("kct").onclick=function(){startSingle(C.demoKC.map(function(_,i){return {src:"KC",i:i};}),"train","Демо Кадровый центр");};
  document.getElementById("kce").onclick=function(){startSingle(shuffle(C.demoKC.map(function(_,i){return {src:"KC",i:i};})),"exam","Демо Кадровый центр — контроль",{minutes:75});};
  function f(onlyNew){var t=+document.getElementById("ft").value,n=+document.getElementById("fn").value;var pool=[];C.fmza.forEach(function(x,i){if((t<0||x[1]===t)&&(!onlyNew||!S.q["F."+i]))pool.push({src:"F",i:i});});
    if(!pool.length){toast("Нет вопросов");return;}startSingle(shuffle(pool).slice(0,n),"train","Банк ФМЗА"+(t>=0?" · "+C.fmzaTopics[t]:""));}
  document.getElementById("fgo").onclick=function(){f(false);};document.getElementById("fnew").onclick=function(){f(true);};};

function color(p,n){if(!n)return "#f2f4f7";if(p<50)return "#fbd5d0";if(p<70)return "#fde5c0";if(p<85)return "#d7f0dc";return "#9fdcb0";}
routes.stats=function(){var agg={},dom={},sec={},fm={},kc={n:0,c:0},tot={n:0,c:0,ms:0};
  Object.keys(S.q).forEach(function(k){var r=S.q[k];tot.n+=r.n;tot.c+=r.c;tot.ms+=r.ms;
    [r.kr].concat(r.kr2||[]).forEach(function(code){if(!code)return;var a=agg[code]=agg[code]||{n:0,c:0,q:0};a.n+=r.n;a.c+=r.c;a.q++;});
    if(r.dom){var d=dom[r.dom]=dom[r.dom]||{n:0,c:0};d.n+=r.n;d.c+=r.c;}
    if(r.sec){var s=sec[r.sec]=sec[r.sec]||{n:0,c:0};s.n+=r.n;s.c+=r.c;}
    if(r.src==="F"){var f=fm[r.ft]=fm[r.ft]||{n:0,c:0};f.n+=r.n;f.c+=r.c;}
    if(r.src==="KC"){kc.n+=r.n;kc.c+=r.c;}});
  var h='<div class="grid g3"><div class="card"><div class="mute">Ответов всего</div><div class="kpi">'+tot.n+'</div></div><div class="card"><div class="mute">Верно</div><div class="kpi">'+pct(tot.c,tot.n)+'%</div></div><div class="card"><div class="mute">Среднее время на вопрос</div><div class="kpi">'+(tot.n?mmss(tot.ms/tot.n):"—")+'</div><div class="small mute">на экзамене: 1:30 на вопрос</div></div></div>';
  h+='<div class="card"><h2>Тепловая карта 37 КР (официальный перечень)</h2><div class="heat">';
  C.kr.forEach(function(k){var a=agg[k.code];var p=a?pct(a.c,a.n):0;var has=C.tests.concat(C.zadachi).some(function(c){return c.kr===k.code||(c.kr2||[]).indexOf(k.code)>=0;});
    h+='<div style="background:'+color(p,a&&a.n)+'" title="'+esc(k.title)+'"><b>'+k.n+'. '+esc(k.title.length>48?k.title.slice(0,46)+"…":k.title)+'</b>'+(a?p+"% · "+a.n+" отв.":(has?"не начато":"<i>нет заданий — банк ФМЗА</i>"))+' <a href="#train?kr='+encodeURIComponent(k.code)+'">→</a></div>';});
  h+='</div><p class="small mute">Цвет: красный <50%, оранжевый 50–69%, светло-зелёный 70–84%, зелёный ≥85%, серый — нет ответов.</p></div>';
  h+='<div class="grid g2"><div class="card"><h2>По разделам</h2><table><tr><th>Раздел</th><th>Ответов</th><th>Верно</th></tr>';
  Object.keys(C.domains).forEach(function(d){var a=dom[d];h+='<tr><td>'+esc(C.domains[d])+'</td><td>'+(a?a.n:0)+'</td><td>'+(a?pct(a.c,a.n)+"%":"—")+'</td></tr>';});
  h+='</table></div><div class="card"><h2>Задачи: секции О / Д / Л / В</h2><table><tr><th>Секция</th><th>Ответов</th><th>Верно</th></tr>';
  [["О","Обследование"],["Д","Диагноз"],["Л","Лечение"],["В","Вариатив"]].forEach(function(s){var a=sec[s[0]];h+='<tr><td><span class="secpill sec-'+s[0]+'">'+s[0]+'</span> '+s[1]+'</td><td>'+(a?a.n:0)+'</td><td>'+(a?pct(a.c,a.n)+"%":"—")+'</td></tr>';});
  h+='</table></div></div><div class="grid g2"><div class="card"><h2>Активность (последние 30 дней)</h2><div style="display:flex;align-items:flex-end;gap:3px;height:120px">';
  var mx=S.settings.goal;for(var i=29;i>=0;i--){var d=S.days[addDays(dstr(),-i)];if(d&&d.n>mx)mx=d.n;}
  for(i=29;i>=0;i--){var ds=addDays(dstr(),-i),dd=S.days[ds]||{n:0};h+='<div title="'+ruDate(ds)+': '+dd.n+'" style="flex:1;background:'+(dd.n>=S.settings.goal?"#15803d":"#9db7f5")+';height:'+Math.max(2,Math.round(110*dd.n/mx))+'px;border-radius:3px 3px 0 0"></div>';}
  h+='</div><p class="small mute">Зелёный — дневная цель ('+S.settings.goal+') выполнена. Серия: '+streak()+' дн.</p></div>';
  h+='<div class="card"><h2>Банки</h2><p>Демо Кадровый центр: '+kc.n+' отв., '+pct(kc.c,kc.n)+'%</p><table><tr><th>ФМЗА: тема</th><th>Отв.</th><th>Верно</th></tr>';
  C.fmzaTopics.forEach(function(t,i){var a=fm[i];if(a)h+='<tr><td>'+esc(t)+'</td><td>'+a.n+'</td><td>'+pct(a.c,a.n)+'%</td></tr>';});h+='</table></div></div>';
  h+='<div class="card"><h2>Пробные экзамены</h2>'+(S.exams.length?'':'<p class="mute">Пока нет.</p>')+'<table>';S.exams.forEach(function(e){h+='<tr><td>'+new Date(e.date).toLocaleString("ru-RU")+'</td><td>Тесты: '+(e.t1!=null?e.t1+"%":"—")+(e.t1ms?" за "+mmss(e.t1ms):"")+'</td><td>Задачи: '+(e.t2!=null?e.t2+"%":"—")+'</td><td>'+(e.pass?'<span class="pass">сдано</span>':(e.t2!=null||e.t1!=null?'<span class="fail">не сдано</span>':''))+'</td></tr>';});h+='</table></div>';
  app.innerHTML=h;};

routes.plan=function(){var t=dstr();var h='<div class="card"><h1>План подготовки: 30 дней с '+ruDate(C.planStart)+'</h1><div class="row"><span>Дневная цель: <b>'+S.settings.goal+'</b> вопросов</span><span>Серия: 🔥 <b>'+streak()+'</b></span><span>Напоминание: <b>'+S.settings.remind+'</b> (МСК)</span><button class="btn sm" id="ics">Скачать календарь .ics</button><a class="btn sm gray" href="#settings">Изменить</a></div><p class="small mute">Файл .ics импортируется в Outlook / Google / Календарь Windows и напоминает каждый день, даже если сайт закрыт. Пока страница открыта, напоминание приходит также уведомлением браузера.</p></div><div class="card"><table class="plan"><tr><th></th><th>День</th><th>Дата</th><th>Тема</th><th>КР</th><th>Ответов</th></tr>';
  C.plan.forEach(function(p){var ds=addDays(C.planStart,p.d-1),dd=S.days[ds];var done=S.planDone[p.d];
    h+='<tr class="'+(done?"done":"")+'"><td><input type="checkbox" data-pd="'+p.d+'" '+(done?"checked":"")+'></td><td class="'+(ds===t?"today":"")+'">'+p.d+'</td><td class="'+(ds===t?"today":"")+'">'+ruDate(ds)+'</td><td>'+(p.mock?'<b>🏁 </b>':'')+esc(p.t)+(p.mock?' <button class="btn sm" data-mock="1">Начать</button>':'')+'</td><td>'+planKrLinks(p.kr)+'</td><td>'+(dd?dd.n+(dd.n>=S.settings.goal?" ✔":""):"")+'</td></tr>';});
  h+='</table></div>';app.innerHTML=h;
  app.querySelectorAll("[data-pd]").forEach(function(c){c.onchange=function(){S.planDone[c.getAttribute("data-pd")]=c.checked;save();};});
  app.querySelectorAll("[data-mock]").forEach(function(b){b.onclick=function(){startExam();};});
  document.getElementById("ics").onclick=downloadICS;};

function icsFold(line){var enc=new TextEncoder(),out=[],cur="",len=0;for(var ch of line){var b=enc.encode(ch).length;if(len+b>73){out.push(cur);cur=" "+ch;len=1+b;}else{cur+=ch;len+=b;}}out.push(cur);return out.join("\r\n");}
function icsEsc(s){return s.replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n");}
function buildICS(){var tm=S.settings.remind.replace(":","")+"00";var now=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  var L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CardioDZM//Plan//RU","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Кардио ДЗМ — подготовка","X-WR-TIMEZONE:Europe/Moscow",
   "BEGIN:VTIMEZONE","TZID:Europe/Moscow","BEGIN:STANDARD","DTSTART:19700101T000000","TZOFFSETFROM:+0300","TZOFFSETTO:+0300","TZNAME:MSK","END:STANDARD","END:VTIMEZONE"];
  C.plan.forEach(function(p){var ds=addDays(C.planStart,p.d-1).replace(/-/g,"");
    L.push("BEGIN:VEVENT","UID:cardiodzm-"+ds+"@local","DTSTAMP:"+now,"DTSTART;TZID=Europe/Moscow:"+ds+"T"+tm,"DURATION:PT1H",
      "SUMMARY:"+icsEsc("Кардио ДЗМ · день "+p.d+(p.mock?" · ПРОБНЫЙ ЭКЗАМЕН":"")),
      "DESCRIPTION:"+icsEsc(p.t+(p.kr.length?"\nКР: "+p.kr.join(", "):"")+"\nЦель: "+S.settings.goal+" вопросов. Откройте index.html (Документы\\Cardio-DZM)."),
      "BEGIN:VALARM","ACTION:DISPLAY","TRIGGER:PT0M","DESCRIPTION:"+icsEsc("Кардио ДЗМ: "+p.t),"END:VALARM","END:VEVENT");});
  L.push("END:VCALENDAR");return L.map(icsFold).join("\r\n")+"\r\n";}
function download(name,text,type){var b=new Blob([text],{type:type});var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);}
function downloadICS(){download("Cardio-DZM-plan.ics",buildICS(),"text/calendar;charset=utf-8");}
C.buildICS=buildICS;

routes.settings=function(){var st=S.settings;var h='<div class="card"><h1>Настройки</h1><div class="row"><label>Время ежедневного напоминания (МСК): <input type="time" id="rt" value="'+st.remind+'"></label><label>Дневная цель (вопросов): <input type="number" id="gl" min="5" max="300" value="'+st.goal+'"></label></div>'+
  '<p><label><input type="checkbox" id="snd" '+(st.sound?"checked":"")+'> Звуковые сигналы таймера</label><br><label><input type="checkbox" id="prt" '+(st.partial?"checked":"")+'> Частичный подсчёт в тренировке задач</label></p>'+
  '<button class="btn sec" id="nt">Разрешить уведомления браузера</button> <span class="small mute">Статус: '+(window.Notification?Notification.permission:"не поддерживается")+'</span><br><button class="btn sec" id="ics2">Скачать календарь напоминаний .ics</button><button class="btn gray" id="tst">Проверить сигнал</button></div>'+
  '<div class="card"><h2>Резервная копия прогресса</h2><p class="small mute">Прогресс хранится в localStorage этого браузера для этой папки. Экспортируйте файл регулярно (и перед переносом на другой компьютер).</p><button class="btn" id="exp">Экспорт JSON</button><label class="btn sec">Импорт JSON<input type="file" id="imp" accept=".json,application/json" style="display:none"></label><button class="btn gray" id="rst">Сбросить весь прогресс</button></div>'+
  '<div class="card small"><h2>Источники</h2><ul><li>Приказ ДЗМ от 10.09.2026 № 827 (регламент оценки при трудоустройстве, ПМСП).</li><li>kadrcentr.ru/vhk — этапы, время, пороги; kadrcentr.ru/kardiolodia — перечень 37 КР.</li><li>Рубрикатор КР Минздрава: cr.minzdrav.gov.ru (версии на 30.09.2026).</li><li>Формат задач О/Д/Л/В — по образцу «множественного кейса» ФМЗА (selftest.mededtech.ru).</li></ul><p>Задания этого тренажёра — авторские учебные материалы, не утечка ФОС. Реальный ФОС ДЗМ конфиденциален.</p></div>';
  app.innerHTML=h;
  document.getElementById("rt").onchange=function(){st.remind=this.value||"19:00";S.lastRemind="";save();toast("Сохранено. Скачайте .ics заново, чтобы обновить календарь.");};
  document.getElementById("gl").onchange=function(){st.goal=Math.max(5,+this.value||40);save();};
  document.getElementById("snd").onchange=function(){st.sound=this.checked;save();};document.getElementById("prt").onchange=function(){st.partial=this.checked;save();};
  document.getElementById("nt").onclick=function(){if(!window.Notification){toast("Уведомления не поддерживаются");return;}Notification.requestPermission().then(function(p){st.notif=p==="granted";save();routes.settings();});};
  document.getElementById("ics2").onclick=downloadICS;document.getElementById("tst").onclick=function(){beep(2);notify("Проверка сигнала","Так будет выглядеть напоминание");};
  document.getElementById("exp").onclick=function(){download("cardio-dzm-progress-"+dstr()+".json",JSON.stringify(S,null,1),"application/json");};
  document.getElementById("imp").onchange=function(){var f=this.files[0];if(!f)return;var fr=new FileReader();fr.onload=function(){try{var o=JSON.parse(fr.result);if(!o.q||!o.settings)throw new Error("неверный формат");
    if(!confirm("Заменить текущий прогресс данными из файла?"))return;S=o;save();load();toast("Импортировано");routes.settings();}catch(e){alert("Ошибка импорта: "+e.message);}};fr.readAsText(f);};
  document.getElementById("rst").onclick=function(){if(confirm("Удалить весь прогресс? Сначала сделайте экспорт.")){S=defState();save();toast("Сброшено");routes.settings();}};};

/* daily reminder while page is open */
function remindCheck(){var now=new Date(),hm=pad(now.getHours())+":"+pad(now.getMinutes()),t=dstr();
  if(hm>=S.settings.remind&&S.lastRemind!==t){var d=S.days[t]||{n:0};S.lastRemind=t;save();if(d.n<S.settings.goal){var tp=todayPlan();notify("Кардио ДЗМ: время заниматься","Сегодня "+d.n+"/"+S.settings.goal+(tp.day?" · "+tp.day.t:""));}}}
setInterval(remindCheck,30000);setTimeout(remindCheck,3000);
C._debug={get S(){return S;},get R(){return R;},startExam:startExam,startSingle:startSingle,startZad:startZad,finish:function(){finishRunner();},itemOf:itemOf,makeOrders:makeOrders};
route();
})();
