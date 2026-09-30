const $=s=>document.querySelector(s), title=$("#title"),sub=$("#subtitle"),content=$("#content"),hint=$("#hint"),icon=$("#iconbox"),step=$("#step"),card=$("#card");
const state={dates:[],food:null,noRuns:0,foodTries:0};
const icons={
versus:'<svg viewBox="0 0 48 48"><path d="M11 13l26 22M37 13L11 35"/><path d="M8 9l7 1-5 5M40 9l-7 1 5 5M8 39l7-1-5-5M40 39l-7-1 5-5"/></svg>',
calendar:'<svg viewBox="0 0 48 48"><rect x="7" y="10" width="34" height="31" rx="6"/><path d="M15 6v8M33 6v8M7 19h34"/><path d="M15 26h3M23 26h3M31 26h3M15 33h3M23 33h3"/></svg>',
food:'<svg viewBox="0 0 48 48"><path d="M8 28h32c-2 8-7 12-16 12S10 36 8 28Z"/><path d="M13 28c1-8 6-13 11-13s10 5 11 13M24 15V8M18 11l3 4M30 11l-3 4"/></svg>',
lock:'<svg viewBox="0 0 48 48"><rect x="9" y="21" width="30" height="21" rx="6"/><path d="M16 21v-6a8 8 0 0 1 16 0v6M24 29v6"/></svg>'};
function head(n,ic,t,s){step.textContent="0"+n+" / 04";icon.innerHTML=icons[ic];title.textContent=t;sub.textContent=s;hint.textContent=""}
function render(x){content.innerHTML=x;content.classList.remove("fade");void content.offsetWidth;content.classList.add("fade");setTimeout(bindTargets,0)}
function bindTargets(){let c=document.querySelector(".crosshair");if(!c){c=document.createElement("div");c.className="crosshair";document.body.appendChild(c)}document.querySelectorAll("button:not(.blank)").forEach(b=>{const aim=()=>{document.querySelectorAll(".targeted").forEach(x=>x.classList.remove("targeted"));b.classList.add("targeted");const r=b.getBoundingClientRect();c.style.left=(r.left+r.width/2-19)+"px";c.style.top=(r.top+r.height/2-19)+"px";c.classList.add("on")};b.addEventListener("pointerenter",aim);b.addEventListener("pointerdown",aim);b.addEventListener("touchstart",aim,{passive:true})})}
function lockAndGo(btn,action){const c=document.querySelector(".crosshair");if(btn){const r=btn.getBoundingClientRect();c.style.left=(r.left+r.width/2-19)+"px";c.style.top=(r.top+r.height/2-19)+"px";c.classList.add("on","locked");btn.classList.add("targeted","lockedTarget")}setTimeout(()=>{c&&c.classList.remove("locked");action()},320)}
function first(){head(1,"versus","敢不敢跟我 PK？","33，換個戰場玩玩看。");render('<div class="actions"><button class="primary aim" id="yes">來啊，誰怕誰</button><button class="secondary aim" id="no">先不要好了</button></div>');$("#yes").onclick=e=>lockAndGo(e.currentTarget,calendar);const no=$("#no");const flee=e=>{e.preventDefault();state.noRuns++;let x=20+Math.random()*(card.clientWidth-no.offsetWidth-40),y=390+Math.random()*90;no.style.position="absolute";no.style.left=x+"px";no.style.top=y+"px";hint.textContent=state.noRuns===1?"還沒開始就跑？":state.noRuns===2?"槍戰走位用到這裡是不是":"好啦，算妳走位成功";};no.onpointerenter=flee;no.onpointerdown=flee}
function calendar(){head(2,"calendar","選一天出任務","10 月挑一天妳想出門的，就決定這天。");let blanks=4,days="";for(let i=0;i<blanks;i++)days+='<button class="day blank"></button>';for(let d=1;d<=31;d++)days+='<button class="day" data-day="'+d+'">'+d+'</button>';render('<div class="calendar"><div class="week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div><div class="days">'+days+'</div><p class="selectedText" id="picked">挑一天吧</p><button class="primary" id="dateNext" style="width:100%;margin-top:8px">就這天</button></div>');document.querySelectorAll(".day[data-day]").forEach(b=>b.onclick=()=>{state.dates=[+b.dataset.day];document.querySelectorAll(".day[data-day]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("#picked").textContent="10/"+b.dataset.day+"，就決定這天"});$("#dateNext").onclick=e=>state.dates.length?lockAndGo(e.currentTarget,food):hint.textContent="先挑一天啦"}
function showFoodMsg(btn,msg){document.querySelectorAll(".foodmsg").forEach(x=>x.remove());const m=document.createElement("span");m.className="foodmsg";m.textContent=msg;btn.appendChild(m);requestAnimationFrame(()=>m.classList.add("show"));setTimeout(()=>{m.classList.remove("show");setTimeout(()=>m.remove(),220)},1500)}
function food(){
 head(3,"food","出發前先吃什麼？","吃飽再去 PK。這題看起來可以選。");
 const foods=["火鍋","燒肉","拉麵","壽司","義式","居酒屋"];
 render('<div class="foodgrid">'+foods.map(f=>'<button class="food" data-food="'+f+'">'+f+'</button>').join("")+'</div><button class="primary" id="foodNext" style="width:100%;margin-top:16px">就吃這個</button>');
 document.querySelectorAll(".food").forEach(b=>b.onclick=()=>{
  const picked=b.dataset.food; state.foodTries++;
  document.querySelectorAll(".food").forEach(x=>x.classList.remove("selected"));
  b.classList.add("selected");
  if(picked==="拉麵"){state.food="拉麵";showFoodMsg(b,"難得意見一致。");return}
  if(state.foodTries===1)showFoodMsg(b,"嗯，很有想法。");else if(state.foodTries===2)showFoodMsg(b,"妳可以再試一次。");else setTimeout(()=>showFoodMsg(b,"不要掙扎了 33。"),650);
  b.disabled=true;
  setTimeout(()=>{b.textContent="拉麵";b.disabled=false;b.classList.add("selected");state.food="拉麵";},300);
 });
 $("#foodNext").onclick=e=>state.food?lockAndGo(e.currentTarget,final):hint.textContent="先選一個想吃的";
}
function final(){
 head(4,"lock","挑戰成立","先吃飽，再換個戰場 PK。");
 const ds=state.dates.sort((a,b)=>a-b).map(d=>"10/"+d).join("、");
 render('<div class="summary">可以的日期<br><b>'+ds+'</b><br><br>吃什麼<br><b>到時候看心情</b><br><br>接下來<br><b>吃飽 → PK → 逛逛</b></div><p style="text-align:center;line-height:1.9;font-weight:700">地點先保密。<br>這次看看誰比較給力。<br><span style="font-size:13px;font-weight:500;color:#a27e89">輸的人請喝飲料。</span></p><div class="actions"><button class="secondary" id="again">重新選一次</button></div>');
 $("#again").onclick=()=>{state.dates=[];state.food=null;state.noRuns=0;state.foodTries=0;first()}
}
first();
