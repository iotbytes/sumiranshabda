"use strict";

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const reduced=window.matchMedia("(prefers-reduced-motion:reduce)").matches;

const state={
  opened:false,
  lightboxIndex:0,
  scratchDone:false,
  scratching:false,
  countdownDone:false
};

const DOM={
  opening:$("#opening"),
  card:$("#invitationCard"),
  open:$("#openInvitation"),
  navbar:$("#navbar"),
  nav:$("#navLinks"),
  menu:$("#mobileMenuButton"),
  music:$("#weddingMusic"),
  musicBtn:$("#musicControl"),
  lightbox:$("#lightbox"),
  lightboxArt:$("#lightboxArtwork"),
  lightboxTitle:$("#lightboxTitle"),
  scratch:$("#scratchCanvas"),
  scratchCard:$(".scratch-card"),
  scratchText:$(".scratch-instruction"),
  toast:$("#toast")
};

document.body.classList.add("locked");

/* MOTION ENGINE */
class Motion{
  static animate(el,keyframes,options={}){
    if(!el||reduced)return;
    return el.animate(keyframes,{
      duration:options.duration||700,
      easing:options.easing||"cubic-bezier(.2,.75,.2,1)",
      fill:"both",
      ...options
    });
  }

  static burst(x,y,count=24){
    if(reduced)return;
    const layer=document.createDocumentFragment();
    for(let i=0;i<count;i++){
      const p=document.createElement("i");
      const angle=Math.random()*Math.PI*2;
      const distance=70+Math.random()*220;
      p.textContent=Math.random()>.45?"✦":"♡";
      p.style.cssText=`position:fixed;left:${x}px;top:${y}px;z-index:10002;pointer-events:none;color:${Math.random()>.5?"#d7b56d":"#c94f73"};font-style:normal;font-size:${10+Math.random()*18}px`;
      layer.appendChild(p);
      requestAnimationFrame(()=>{
        p.animate([
          {transform:"translate(-50%,-50%) scale(.2) rotate(0)",opacity:0},
          {transform:"translate(-50%,-50%) scale(1.1)",opacity:1,offset:.15},
          {transform:`translate(calc(-50% + ${Math.cos(angle)*distance}px),calc(-50% + ${Math.sin(angle)*distance}px)) rotate(${180+Math.random()*360}deg) scale(.3)`,opacity:0}
        ],{duration:900+Math.random()*700,easing:"cubic-bezier(.15,.7,.2,1)"});
        setTimeout(()=>p.remove(),1800);
      });
    }
    document.body.appendChild(layer);
  }
}

/* CINEMATIC PARTICLES */
class ParticleField{
  constructor(){
    if(reduced)return;
    this.layer=document.createElement("div");
    this.layer.className="motion-particles";
    this.layer.setAttribute("aria-hidden","true");
    document.body.appendChild(this.layer);
    this.spawn(18);
  }

  spawn(n){
    const frag=document.createDocumentFragment();
    for(let i=0;i<n;i++){
      const p=document.createElement("span");
      p.textContent=Math.random()>.5?"✦":"♡";
      p.style.left=`${Math.random()*100}%`;
      p.style.top=`${70+Math.random()*35}%`;
      p.style.animationDelay=`${Math.random()*8}s`;
      p.style.animationDuration=`${7+Math.random()*9}s`;
      frag.appendChild(p);
    }
    this.layer.appendChild(frag);
  }
}

function injectMotionCSS(){
  const style=document.createElement("style");
  style.textContent=`
    .motion-particles{position:fixed;inset:0;z-index:2;pointer-events:none;overflow:hidden}
    .motion-particles span{position:absolute;color:rgba(201,79,115,.3);font-style:normal;animation:floatUp linear infinite}
    @keyframes floatUp{0%{transform:translate3d(0,30px,0) rotate(0) scale(.6);opacity:0}15%{opacity:.8}80%{opacity:.35}100%{transform:translate3d(40px,-110vh,0) rotate(240deg) scale(1.15);opacity:0}}
    .motion-progress{position:fixed;z-index:10001;top:0;left:0;width:0;height:3px;background:linear-gradient(90deg,#c94f73,#d7b56d,#9e3155);box-shadow:0 0 14px rgba(201,79,115,.5)}
    .nav-active{color:#c94f73!important}
    .nav-active:after{right:0!important}
    .magnetic{will-change:transform}
    .tilt-card{transform-style:preserve-3d;will-change:transform}
    .count-card.tick strong{animation:countTick .35s ease}
    @keyframes countTick{50%{transform:translateY(-6px);opacity:.25}}
    .success-pop{animation:successPop .7s cubic-bezier(.2,.8,.2,1)}
    @keyframes successPop{0%{transform:scale(.9);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
    .gallery-art{will-change:transform}
    @media(prefers-reduced-motion:reduce){.motion-particles{display:none}}
  `;
  document.head.appendChild(style);
}
injectMotionCSS();
new ParticleField();

/* OPENING */
class Invitation{
  constructor(){
    if(!DOM.open)return;
    DOM.open.addEventListener("click",()=>this.open());
  }

  async open(){
    if(state.opened)return;
    state.opened=true;
    DOM.open.disabled=true;
    DOM.card?.classList.add("opening-animation");

    const music=DOM.music;
    if(music?.src){
      try{
        await music.play();
        this.setMusicState(true);
      }catch{}
    }

    Motion.burst(innerWidth/2,innerHeight/2,30);

    setTimeout(()=>{
      DOM.opening?.classList.add("hidden");
      document.body.classList.remove("locked");
      DOM.navbar?.classList.add("visible");
      document.body.classList.add("site-opened");
      this.revealHero();
    },850);
  }

  setMusicState(playing){
    if(!DOM.musicBtn)return;
    DOM.musicBtn.textContent=playing?"❚❚":"♫";
    DOM.musicBtn.setAttribute("aria-label",playing?"Pause wedding music":"Play wedding music");
  }

  revealHero(){
    $$(".hero .reveal").forEach((el,i)=>{
      setTimeout(()=>el.classList.add("visible"),150+i*120);
    });
  }
}
new Invitation();

/* NAVIGATION */
class Navigation{
  constructor(){
    if(!DOM.nav)return;
    DOM.menu?.addEventListener("click",()=>this.toggle());
    $$(".nav-links a").forEach(a=>a.addEventListener("click",()=>this.close()));
    this.sections=$$("section[id],header[id],.hero[id]");
    this.observe();
  }

  toggle(){
    const open=DOM.nav.classList.toggle("open");
    DOM.menu?.setAttribute("aria-expanded",String(open));
  }

  close(){
    DOM.nav.classList.remove("open");
    DOM.menu?.setAttribute("aria-expanded","false");
  }

  observe(){
    if(!this.sections.length)return;
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          $$(".nav-links a").forEach(a=>a.classList.toggle("nav-active",a.getAttribute("href")===`#${entry.target.id}`));
        }
      });
    },{threshold:.35});
    this.sections.forEach(s=>observer.observe(s));
  }
}
new Navigation();

/* MUSIC */
class MusicController{
  constructor(){
    if(!DOM.musicBtn)return;
    DOM.musicBtn.addEventListener("click",()=>this.toggle());
    DOM.music?.addEventListener("play",()=>this.icon(true));
    DOM.music?.addEventListener("pause",()=>this.icon(false));
  }

  async toggle(){
    if(!DOM.music?.src){
      showToast("Add your wedding music file to enable music.");
      return;
    }
    try{
      if(DOM.music.paused)await DOM.music.play();
      else DOM.music.pause();
    }catch{
      showToast("Music could not be played.");
    }
  }

  icon(active){
    DOM.musicBtn.textContent=active?"❚❚":"♫";
    DOM.musicBtn.setAttribute("aria-label",active?"Pause wedding music":"Play wedding music");
    DOM.musicBtn.classList.toggle("music-playing",active);
  }
}
new MusicController();

/* SCROLL REVEAL */
class RevealEngine{
  constructor(){
    this.items=$$(".reveal");
    if(!this.items.length)return;
    if(reduced){
      this.items.forEach(e=>e.classList.add("visible"));
      return;
    }
    this.observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        const siblings=[...entry.target.parentElement.children].filter(e=>e.classList.contains("reveal"));
        const delay=Math.max(0,siblings.indexOf(entry.target))*80;
        setTimeout(()=>entry.target.classList.add("visible"),delay);
        this.observer.unobserve(entry.target);
      });
    },{threshold:.1,rootMargin:"0px 0px -45px"});
    this.items.forEach(e=>this.observer.observe(e));
  }
}
new RevealEngine();

/* SCROLL PROGRESS */
class ScrollProgress{
  constructor(){
    this.bar=document.createElement("div");
    this.bar.className="motion-progress";
    document.body.appendChild(this.bar);
    addEventListener("scroll",()=>this.update(),{passive:true});
    this.update();
  }

  update(){
    const max=document.documentElement.scrollHeight-innerHeight;
    this.bar.style.width=`${max>0?scrollY/max*100:0}%`;
  }
}
new ScrollProgress();

/* COUNTDOWN */
class Countdown{
  constructor(){
    this.parts={
      days:$("#days"),hours:$("#hours"),minutes:$("#minutes"),seconds:$("#seconds")
    };
    this.finished=$("#countdownFinished");
    this.target=new Date("November 22, 2026 00:00:00").getTime();
    this.previous={};
    this.tick();
    this.timer=setInterval(()=>this.tick(),1000);
  }

  tick(){
    const diff=this.target-Date.now();
    if(diff<=0){
      Object.values(this.parts).forEach(e=>{if(e)e.textContent="00"});
      this.finished?.classList.add("visible");
      if(!state.countdownDone){
        state.countdownDone=true;
        clearInterval(this.timer);
        Motion.burst(innerWidth/2,innerHeight/2,45);
      }
      return;
    }
    const values={
      days:Math.floor(diff/86400000),
      hours:Math.floor(diff/3600000)%24,
      minutes:Math.floor(diff/60000)%60,
      seconds:Math.floor(diff/1000)%60
    };
    Object.entries(values).forEach(([key,val])=>{
      const value=String(val).padStart(2,"0");
      const el=this.parts[key];
      if(el&&el.textContent!==value){
        el.textContent=value;
        const card=el.closest(".count-card");
        card?.classList.remove("tick");
        void card?.offsetWidth;
        card?.classList.add("tick");
      }
    });
  }
}
new Countdown();

/* SCRATCH CARD */
class ScratchCard{
  constructor(){
    this.canvas=DOM.scratch;
    this.card=DOM.scratchCard;
    if(!this.canvas||!this.card)return;
    this.ctx=this.canvas.getContext("2d",{willReadFrequently:true});
    this.lastCheck=0;
    this.setup();
    this.bind();
  }

  setup(){
    const r=this.card.getBoundingClientRect();
    this.w=r.width;
    this.h=r.height;
    this.dpr=Math.min(devicePixelRatio||1,2);
    this.canvas.width=this.w*this.dpr;
    this.canvas.height=this.h*this.dpr;
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    const g=this.ctx.createLinearGradient(0,0,this.w,this.h);
    g.addColorStop(0,"#9d7b50");
    g.addColorStop(.35,"#d8bc84");
    g.addColorStop(.65,"#a98758");
    g.addColorStop(1,"#e0c98e");
    this.ctx.fillStyle=g;
    this.ctx.fillRect(0,0,this.w,this.h);
    this.ctx.globalAlpha=.16;
    for(let i=0;i<90;i++){
      this.ctx.fillStyle="#fff";
      this.ctx.beginPath();
      this.ctx.arc(Math.random()*this.w,Math.random()*this.h,Math.random()*2,0,Math.PI*2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha=1;
    this.ctx.fillStyle="rgba(255,255,255,.18)";
    this.ctx.font="42px Cormorant Garamond";
    this.ctx.textAlign="center";
    this.ctx.fillText("✦",this.w/2,this.h/2+12);
  }

  bind(){
    this.canvas.addEventListener("pointerdown",e=>{
      this.canvas.setPointerCapture?.(e.pointerId);
      state.scratching=true;
      this.erase(e);
    });
    this.canvas.addEventListener("pointermove",e=>{
      if(state.scratching)this.erase(e);
    });
    this.canvas.addEventListener("pointerup",()=>state.scratching=false);
    this.canvas.addEventListener("pointercancel",()=>state.scratching=false);
    addEventListener("resize",()=>{if(!state.scratchDone)this.setup()});
  }

  erase(e){
    if(state.scratchDone)return;
    const r=this.canvas.getBoundingClientRect();
    this.ctx.globalCompositeOperation="destination-out";
    this.ctx.beginPath();
    this.ctx.arc(e.clientX-r.left,e.clientY-r.top,27,0,Math.PI*2);
    this.ctx.fill();
    const now=performance.now();
    if(now-this.lastCheck>180){
      this.lastCheck=now;
      this.progress();
    }
  }

  progress(){
    const data=this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height).data;
    let clear=0;
    for(let i=3;i<data.length;i+=32)if(data[i]===0)clear++;
    if(clear/(data.length/32)>.48)this.complete();
  }

  complete(){
    state.scratchDone=true;
    this.canvas.style.transition="opacity .8s ease";
    this.canvas.style.opacity="0";
    if(DOM.scratchText)DOM.scratchText.style.opacity="0";
    Motion.burst(innerWidth/2,innerHeight/2,40);
  }
}
new ScratchCard();

/* TILT + MAGNETIC INTERACTION */
class PremiumHover{
  constructor(){
    if(reduced)return;
    this.tilt();
    this.magnetic();
  }

  tilt(){
    $$(".event-card,.info-card,.family-card,.count-card,.rsvp-card,.scratch-card").forEach(card=>{
      card.classList.add("tilt-card");
      card.addEventListener("pointermove",e=>{
        if(innerWidth<800)return;
        const r=card.getBoundingClientRect();
        const x=(e.clientX-r.left)/r.width-.5;
        const y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`perspective(900px) rotateX(${y*-4}deg) rotateY(${x*5}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave",()=>{
        card.style.transform="";
      });
    });
  }

  magnetic(){
    $$(".btn,.open-button,.copy-button,.music-control").forEach(btn=>{
      btn.classList.add("magnetic");
      btn.addEventListener("pointermove",e=>{
        if(innerWidth<800)return;
        const r=btn.getBoundingClientRect();
        const x=(e.clientX-r.left-r.width/2)*.15;
        const y=(e.clientY-r.top-r.height/2)*.15;
        btn.style.transform=`translate(${x}px,${y}px)`;
      });
      btn.addEventListener("pointerleave",()=>btn.style.transform="");
    });
  }
}
new PremiumHover();

/* GALLERY */
class Gallery{
  constructor(){
    this.items=$$(".gallery-item");
    this.box=DOM.lightbox;
    if(!this.items.length||!this.box)return;
    this.art=DOM.lightboxArt;
    this.title=DOM.lightboxTitle;
    this.classes=["art-pink","art-yellow","art-purple","art-green","art-red","art-champagne"];
    this.bind();
  }

  bind(){
    this.items.forEach((item,i)=>item.addEventListener("click",()=>this.open(i)));
    $("#lightboxClose")?.addEventListener("click",()=>this.close());
    $("#lightboxNext")?.addEventListener("click",()=>this.next());
    $("#lightboxPrev")?.addEventListener("click",()=>this.prev());
    this.box.addEventListener("click",e=>{if(e.target===this.box)this.close()});
    document.addEventListener("keydown",e=>{
      if(!this.box.classList.contains("open"))return;
      if(e.key==="Escape")this.close();
      if(e.key==="ArrowRight")this.next();
      if(e.key==="ArrowLeft")this.prev();
    });
  }

  open(i){
    this.index=i;
    const item=this.items[i];
    const source=$(".gallery-art",item);
    this.art.className=`gallery-art ${this.classes[i%this.classes.length]}`;
    this.art.innerHTML=source?.innerHTML||"";
    this.title.textContent=item.dataset.title||"Vijay & Rashima";
    this.box.classList.add("open");
    this.box.setAttribute("aria-hidden","false");
    document.body.classList.add("locked");
    if(!reduced)Motion.animate(this.art,[{opacity:0,transform:"scale(.94) translateY(12px)"},{opacity:1,transform:"scale(1) translateY(0)"}],{duration:500});
  }

  close(){
    this.box.classList.remove("open");
    this.box.setAttribute("aria-hidden","true");
    document.body.classList.remove("locked");
  }

  next(){this.open((this.index+1)%this.items.length)}
  prev(){this.open((this.index-1+this.items.length)%this.items.length)}
}
new Gallery();

/* RSVP */
class RSVP{
  constructor(){
    this.form=$("#rsvpForm");
    this.status=$("#formStatus");
    if(!this.form)return;
    this.fields=["guestName","phone","guestCount","attendance","meal"].map(id=>$("#"+id)).filter(Boolean);
    this.form.addEventListener("submit",e=>this.submit(e));
    this.fields.forEach(field=>field.addEventListener("input",()=>this.clear(field)));
  }

  clear(field){
    const error=$(".error-message",field.parentElement);
    if(field.value.trim()){
      error&&(error.textContent="");
      field.removeAttribute("aria-invalid");
    }
  }

  submit(e){
    e.preventDefault();
    let valid=true;
    this.fields.forEach(field=>{
      const error=$(".error-message",field.parentElement);
      if(!field.value.trim()){
        valid=false;
        error&&(error.textContent="Please complete this field.");
        field.setAttribute("aria-invalid","true");
      }else this.clear(field);
    });
    if(!valid){
      this.status.textContent="Please complete the required details.";
      return;
    }
    this.status.textContent="Thank you. Your RSVP has been beautifully received ♡";
    this.status.classList.add("success-pop");
    Motion.burst(innerWidth/2,innerHeight/2,35);
    this.form.reset();
  }
}
new RSVP();

/* HASHTAG */
$("#copyHashtag")?.addEventListener("click",async()=>{
  const hashtag="#SumiranShabda";
  try{
    await navigator.clipboard.writeText(hashtag);
    $("#copyStatus").textContent="Hashtag copied ♡";
    Motion.burst(innerWidth/2,innerHeight/2,15);
  }catch{
    $("#copyStatus").textContent=`Please copy: ${hashtag}`;
  }
});

/* GUESTBOOK */
class Guestbook{
  constructor(){
    this.form=$("#guestbookForm");
    this.notes=$("#guestbookNotes");
    this.key="vijay-rashima-guestbook";
    if(!this.form||!this.notes)return;
    this.form.addEventListener("submit",e=>this.add(e));
    this.render();
  }

  get(){
    try{return JSON.parse(localStorage.getItem(this.key))||[]}
    catch{return[]}
  }

  save(data){
    try{localStorage.setItem(this.key,JSON.stringify(data))}
    catch{showToast("Guestbook storage is unavailable.")}
  }

  add(e){
    e.preventDefault();
    const name=$("#guestbookName")?.value.trim();
    const message=$("#guestbookMessage")?.value.trim();
    if(!name||!message){
      showToast("Please add your name and message.");
      return;
    }
    const data=this.get();
    data.unshift({name,message,createdAt:Date.now()});
    this.save(data);
    this.form.reset();
    this.render();
    showToast("Your note has been added ♡");
    Motion.burst(innerWidth/2,innerHeight/2,15);
  }

  render(){
    const data=this.get();
    this.notes.innerHTML="";
    if(!data.length){
      this.notes.innerHTML=`<div class="guest-note"><strong>♡</strong><p>Your beautiful message could be the first note here.</p></div>`;
      return;
    }
    const frag=document.createDocumentFragment();
    data.forEach(entry=>{
      const article=document.createElement("article");
      article.className="guest-note";
      const name=document.createElement("strong");
      const text=document.createElement("p");
      name.textContent=entry.name;
      text.textContent=entry.message;
      article.append(name,text);
      frag.appendChild(article);
    });
    this.notes.appendChild(frag);
  }
}
new Guestbook();

/* TOAST */
let toastTimer;
function showToast(message){
  if(!DOM.toast)return;
  DOM.toast.textContent=message;
  DOM.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>DOM.toast.classList.remove("show"),2600);
}

/* HERO PARALLAX */
class HeroParallax{
  constructor(){
    this.hero=$(".hero");
    this.couple=$(".hero-couple");
    if(!this.hero||!this.couple||reduced||innerWidth<800)return;
    this.move=this.move.bind(this);
    this.hero.addEventListener("pointermove",this.move);
    this.hero.addEventListener("pointerleave",()=>this.reset());
  }

  move(e){
    const r=this.hero.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    this.couple.style.transform=`translate3d(${x*14}px,${y*10}px,0)`;
  }

  reset(){
    this.couple.style.transform="translate3d(0,0,0)";
  }
}
new HeroParallax();

/* NAVBAR */
let navFrame;
addEventListener("scroll",()=>{
  if(navFrame)return;
  navFrame=requestAnimationFrame(()=>{
    navFrame=null;
    if(state.opened)DOM.navbar?.classList.toggle("visible",scrollY>60);
  });
},{passive:true});

/* SECTION PARALLAX */
if(!reduced){
  const decorative=$$(".hero-flower,.thank-you-flowers,.thank-you-flower-right");
  addEventListener("scroll",()=>{
    const y=scrollY;
    decorative.forEach((el,i)=>{
      el.style.transform=`translate3d(0,${y*(i%2?.015:-.01)}px,0)`;
    });
  },{passive:true});
}

/* PAGE VISIBILITY */
document.addEventListener("visibilitychange",()=>{
  if(document.hidden)return;
  if(DOM.music&&!DOM.music.paused)DOM.music.play().catch(()=>{});
});

/* INITIAL ACCESSIBILITY */
DOM.menu?.setAttribute("aria-expanded","false");
DOM.lightbox?.setAttribute("aria-hidden","true");