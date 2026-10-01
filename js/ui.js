/* Кардио ДЗМ — mobile app shell: tab bar, bottom sheets, theme, swipe, PWA. No dependencies. */
(function(){
"use strict";
var P={ // inline SVG paths (feather-style, 24x24)
 home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 exam:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6M12 2v3"/>',
 tests:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>',
 zad:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
 more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
 review:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
 banks:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
 stats:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 plan:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h2M14 14h2M8 18h2"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
 sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2M12 20.5v2M4.6 4.6 6 6M18 18l1.4 1.4M1.5 12h2M20.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
 left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',
 flag:'<path d="M4 22V4M4 4h12l-2 4 2 4H4"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 chev:'<path d="m6 9 6 6 6-6"/>',check:'<path d="M20 6 9 17l-5-5"/>'};
function icon(n,cls){return '<svg class="ic '+(cls||"")+'" viewBox="0 0 24 24" aria-hidden="true">'+(P[n]||"")+'</svg>';}
var TABS=[["home","Главная","home"],["exam","Экзамен","exam"],["train","Тесты","tests"],["zadachi","Задачи","zad"],["more","Ещё","more"]];
var MORE=[["review","Повторение","review"],["banks","Банки","banks"],["stats","Статистика","stats"],["plan","План","plan"],["settings","Настройки","settings"]];
var TITLES={home:"Кардио ДЗМ",exam:"Пробный экзамен",train:"Тесты",zadachi:"Задачи",review:"Повторение",banks:"Банки",stats:"Статистика",plan:"План",settings:"Настройки",run:""};
var $=function(id){return document.getElementById(id);};
var mq=window.matchMedia?matchMedia("(max-width: 768px)"):{matches:false};
/* ---------- theme ---------- */
var TKEY="cardioDZM.theme";
function themePref(){try{return localStorage.getItem(TKEY)||"auto";}catch(e){return "auto";}}
function effTheme(){var t=themePref();if(t==="auto")t=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";return t;}
function applyTheme(){var t=effTheme();document.documentElement.setAttribute("data-theme",t);var b=$("themebtn");if(b)b.innerHTML=icon(t==="dark"?"sun":"moon");
  document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.setAttribute("content",t==="dark"?"#161c29":"#b4232f");});}
function setTheme(t){try{localStorage.setItem(TKEY,t);}catch(e){}applyTheme();}
if(window.matchMedia)try{matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){if(themePref()==="auto")applyTheme();});}catch(e){}
/* ---------- sheet ---------- */
var sheetOpen=false;
function openSheet(html,bind){$("sheetc").innerHTML=html;$("scrim").classList.add("on");$("sheet").classList.add("on");sheetOpen=true;if(bind)bind($("sheetc"));}
function closeSheet(){if(!sheetOpen)return;$("scrim").classList.remove("on");$("sheet").classList.remove("on");sheetOpen=false;}
function moreSheet(){var cur=(location.hash.replace(/^#/,"").split("?")[0])||"home";var t=effTheme();
  var h='<h3>Ещё</h3><div class="mlist">';MORE.forEach(function(m){h+='<a href="#'+m[0]+'" class="'+(cur===m[0]?"on":"")+'">'+icon(m[2])+'<span>'+m[1]+'</span></a>';});
  h+='<button type="button" id="shtheme">'+icon(t==="dark"?"sun":"moon")+'<span>'+(t==="dark"?"Светлая тема":"Тёмная тема")+'</span><span class="sub">'+({auto:"сейчас: как в системе",light:"сейчас: светлая",dark:"сейчас: тёмная"})[themePref()]+'</span></button></div>';
  openSheet(h,function(el){el.querySelectorAll("a").forEach(function(a){a.onclick=function(){closeSheet();};});el.querySelector("#shtheme").onclick=function(){setTheme(effTheme()==="dark"?"light":"dark");closeSheet();};});}
/* ---------- tab bar / title ---------- */
function buildTabs(){var h="";TABS.forEach(function(t){h+='<a href="#'+t[0]+'" data-tab="'+t[0]+'">'+icon(t[2])+'<span>'+t[1]+'</span></a>';});$("tabbar").innerHTML=h;
  $("tabbar").querySelector('[data-tab=more]').onclick=function(e){e.preventDefault();sheetOpen?closeSheet():moreSheet();};}
var lastView="home";
var animT=null;function anim(){var m=$("app");m.classList.remove("anim");void m.offsetWidth;m.classList.add("anim");clearTimeout(animT);animT=setTimeout(function(){m.classList.remove("anim");},300);}
function onRoute(v){closeSheet();anim();var tab=v;if(MORE.some(function(m){return m[0]===v;}))tab="more";if(v==="run")tab=lastTab;else lastTab=tab;
  document.querySelectorAll("#tabbar a").forEach(function(a){a.classList.toggle("on",a.getAttribute("data-tab")===tab);});
  if(v!=="run"){setTitle(TITLES[v]||"Кардио ДЗМ");clearAct();timer(null);}
  document.body.classList.toggle("running",v==="run");lastView=v;}
var lastTab="home";
function setTab(t){lastTab=t;document.querySelectorAll("#tabbar a").forEach(function(a){a.classList.toggle("on",a.getAttribute("data-tab")===t);});}
function setTitle(t){var e=$("pgtitle");if(e)e.textContent=t;}
/* ---------- action bar ---------- */
function setAct(html){var a=$("actbar");a.innerHTML=html;document.body.classList.toggle("hasact",!!html);return a;}
function clearAct(){setAct("");}
/* ---------- header timer ---------- */
function timer(text,cls){var e=$("htimer");if(!e)return;if(text==null){e.className="timer";e.textContent="";return;}e.textContent=text;e.className="timer on"+(cls?" "+cls:"");}
/* ---------- swipe ---------- */
var swipeCb=null,sx=0,sy=0,st=0,sOk=false;
function onSwipe(cb){swipeCb=cb;}
document.addEventListener("touchstart",function(e){if(e.touches.length!==1){sOk=false;return;}var t=e.target;sOk=!(t.closest&&t.closest(".tscroll,.sheet,input,select,textarea"));sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now();},{passive:true});
document.addEventListener("touchend",function(e){if(!sOk||!swipeCb||lastView!=="run")return;var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  if(Math.abs(dx)>70&&Math.abs(dy)<Math.abs(dx)*0.5&&Date.now()-st<600)swipeCb(dx<0?1:-1);},{passive:true});
/* ---------- post-render: wrap wide tables, collapsibles ---------- */
function post(root){root.querySelectorAll("table:not(.list)").forEach(function(t){if(t.parentNode.classList&&t.parentNode.classList.contains("tscroll"))return;var w=document.createElement("div");w.className="tscroll";t.parentNode.insertBefore(w,t);w.appendChild(t);});}
var colState={};
function colHTML(key,title,body,defOpen){var open=colState[key]!=null?colState[key]:defOpen!==false;
  return '<section class="col'+(open?"":" closed")+'" data-col="'+key+'"><button type="button" class="colh" aria-expanded="'+open+'"><span>'+title+'</span>'+icon("chev","chev")+'</button><div class="colb">'+body+'</div></section>';}
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".colh");if(!b)return;var s=b.parentNode,k=s.getAttribute("data-col");var closed=s.classList.toggle("closed");colState[k]=!closed;b.setAttribute("aria-expanded",String(!closed));});
document.addEventListener("keydown",function(e){if(e.key==="Escape")closeSheet();});
function init(){buildTabs();applyTheme();$("themebtn").onclick=function(){setTheme(effTheme()==="dark"?"light":"dark");};$("scrim").onclick=closeSheet;
  var app=$("app");if(window.MutationObserver)new MutationObserver(function(){post(app);}).observe(app,{childList:true,subtree:true});
  /* PWA: service worker only over http(s) (not file://) */
  if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").then(function(reg){
    reg.addEventListener("updatefound",function(){var w=reg.installing;if(!w)return;w.addEventListener("statechange",function(){if(w.state==="installed"&&navigator.serviceWorker.controller){var d=document.createElement("div");d.className="toast";d.innerHTML='Доступна новая версия. <a href="#" style="color:#9db7f5" id="swup">Обновить</a>';document.body.appendChild(d);d.querySelector("#swup").onclick=function(ev){ev.preventDefault();location.reload();};setTimeout(function(){d.remove();},15000);}});});}).catch(function(){});});}}
window.UI={icon:icon,anim:anim,setTab:setTab,onRoute:onRoute,setTitle:setTitle,setAct:setAct,clearAct:clearAct,timer:timer,openSheet:openSheet,closeSheet:closeSheet,onSwipe:onSwipe,colHTML:colHTML,isMobile:function(){return mq.matches;},themePref:themePref,setTheme:setTheme,post:post};
init();
})();
