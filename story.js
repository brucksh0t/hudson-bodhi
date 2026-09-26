/* BODHI scrollytelling: GSAP + ScrollTrigger (+ Lenis on desktop). Static layout is the fallback. */
(function(){
  if(!window.gsap || !window.ScrollTrigger) return;           // CDN failed: static page still works
  gsap.registerPlugin(ScrollTrigger);
  var root=document.documentElement;
  var navBook=document.querySelector('.nav__actions .btn--primary');

  function splitWords(el){
    var walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null), nodes=[], n;
    while((n=walker.nextNode())) nodes.push(n);
    nodes.forEach(function(t){
      var frag=document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function(part){
        if(!part) return;
        if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
        var s=document.createElement('span'); s.className='w'; s.textContent=part; frag.appendChild(s);
      });
      t.parentNode.replaceChild(frag,t);
    });
    return el.querySelectorAll('.w');
  }
  var heroTitle=document.querySelector('.hero__title');
  var statement=document.querySelector('[data-split]');

  var mm=gsap.matchMedia();

  /* ---------- All sizes, motion allowed ---------- */
  mm.add('(prefers-reduced-motion: no-preference)', function(){
    root.classList.add('motion-ok');

    // Hero: headline words rise in, photo zooms & drifts as you scroll away
    if(heroTitle){
      heroTitle.classList.remove('reveal');
      var hw=heroTitle.querySelectorAll('.w').length ? heroTitle.querySelectorAll('.w') : splitWords(heroTitle);
      gsap.from(hw,{y:40,opacity:0,duration:1.1,ease:'power3.out',stagger:.08,delay:.15});
    }
    gsap.to('.hero__media',{scale:1.15,yPercent:6,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero__content',{y:-110,opacity:.15,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});

    // Gallery parallax layers
    gsap.utils.toArray('.g img').forEach(function(img,i){
      var amt=(i%3===0)?10:(i%3===1?6:13);
      gsap.fromTo(img,{scale:1.18,yPercent:-amt},{yPercent:amt,ease:'none',
        scrollTrigger:{trigger:img.parentNode,start:'top bottom',end:'bottom top',scrub:true,refreshPriority:-1}});
    });

    // Finale image drift
    gsap.fromTo('.finale__media img',{yPercent:-8,scale:1.12},{yPercent:8,ease:'none',scrollTrigger:{trigger:'.finale',start:'top bottom',end:'bottom top',scrub:true,refreshPriority:-1}});

    return function(){ root.classList.remove('motion-ok'); };
  });

  /* ---------- Phones / tablets: no pins, lighter scrubs ---------- */
  mm.add('(prefers-reduced-motion: no-preference) and (max-width: 899px)', function(){
    if(statement){
      var w=statement.querySelectorAll('.w').length ? statement.querySelectorAll('.w') : splitWords(statement);
      gsap.to(w,{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:statement,start:'top 85%',end:'bottom 45%',scrub:.5}});
    }
    gsap.utils.toArray('.story__panel').forEach(function(p){
      gsap.from(p,{y:50,opacity:0,duration:.9,ease:'power2.out',scrollTrigger:{trigger:p,start:'top 88%'}});
    });
    ScrollTrigger.create({trigger:'.story',start:'bottom 90%',onEnter:function(){ var b=document.querySelector('.mbar__book'); if(b){b.classList.remove('pulse-3');void b.offsetWidth;b.classList.add('pulse-3');} }});
  });

  /* ---------- Desktop: pinned sequences + Lenis ---------- */
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 900px)', function(){
    root.classList.add('motion-desk');

    // Lenis smooth scrolling (desktop only), synced to ScrollTrigger
    var lenis=null;
    if(window.Lenis){
      root.style.scrollBehavior='auto';   // native smooth-scroll would fight Lenis
      lenis=new Lenis({duration:1.15,smoothWheel:true});
      window.__lenis=lenis;
      lenis.on('scroll',ScrollTrigger.update);
      var raf=function(t){ lenis.raf(t*1000); };
      gsap.ticker.add(raf); gsap.ticker.lagSmoothing(0);
    }
    function onAnchor(e){
      var a=e.target.closest('a[href^="#"]'); if(!a||!lenis) return;
      var id=a.getAttribute('href'), el=id==='#top'?null:document.querySelector(id);
      if(id!=='#top' && !el) return;
      e.preventDefault(); lenis.resize();
      var y=el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - 70) : 0;
      lenis.scrollTo(y,{duration:1.4,force:true});
    }
    document.addEventListener('click',onAnchor);

    // Statement: pinned, words light up one by one
    if(statement){
      var sw=statement.querySelectorAll('.w').length ? statement.querySelectorAll('.w') : splitWords(statement);
      gsap.timeline({scrollTrigger:{trigger:'.statement',start:'top top',end:'+=130%',pin:'.statement__pin',scrub:.6}})
        .to(sw,{opacity:1,stagger:.12,ease:'none'})
        .from('.statement__eyebrow',{opacity:0,y:20,duration:.6},0);
    }

    // Your Visit: pinned 4-step story with crossfading photos + sliding panels
    var imgs=gsap.utils.toArray('.story__img'), panels=gsap.utils.toArray('.story__panel'),
        dots=gsap.utils.toArray('.story__progress li'), cta=document.querySelector('.story__cta');
    var STEP=2, total=(imgs.length-1)*STEP+1.2;
    var tl=gsap.timeline({defaults:{ease:'power2.inOut'},scrollTrigger:{
      trigger:'.story',start:'top top',end:'+=340%',pin:'.story__pin',scrub:.7,anticipatePin:1,
      onUpdate:function(self){
        var t=self.progress*tl.duration(), idx=Math.max(0,Math.min(3,Math.floor((t+0.4)/STEP)));
        dots.forEach(function(d,i){ d.classList.toggle('on',i<=idx); });
        cta.classList.toggle('pulse', idx===3);
      },
      onLeave:function(){ if(navBook){ navBook.classList.remove('pulse-3'); void navBook.offsetWidth; navBook.classList.add('pulse-3'); } }
    }});
    gsap.set(imgs.slice(1),{opacity:1,clipPath:'inset(100% 0% 0% 0%)'});
    tl.fromTo(imgs[0],{scale:1.1},{scale:1,duration:STEP*.8,ease:'none'},0);
    for(var i=1;i<imgs.length;i++){
      var at=i*STEP-0.6;
      tl.to(panels[i-1],{yPercent:-16,autoAlpha:0,duration:.45},at)
        .fromTo(imgs[i],{clipPath:'inset(100% 0% 0% 0%)',scale:1.18},{clipPath:'inset(0% 0% 0% 0%)',scale:1.04,duration:.9,ease:'power3.inOut'},at)
        .to(imgs[i],{scale:1,duration:STEP-.9,ease:'none'},at+.9)
        .fromTo(panels[i],{yPercent:22,autoAlpha:0},{yPercent:0,autoAlpha:1,duration:.55,ease:'power2.out'},at+.4);
    }
    tl.to({}, {duration:.8}); // hold on the final step
    dots[0] && dots[0].classList.add('on');

    return function(){
      root.classList.remove('motion-desk');
      document.removeEventListener('click',onAnchor);
      if(lenis){ lenis.destroy(); window.__lenis=null; root.style.scrollBehavior=''; }
    };
  });

  /* ---------- Wide desktop: horizontal service cards ---------- */
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 640px)', function(){
    root.classList.add('motion-hs');
    var track=document.querySelector('.services .cards'), vp=document.querySelector('.hscroll__viewport'),
        bar=document.querySelector('.hscroll__bar span');
    document.querySelectorAll('.services .card').forEach(function(c){ c.classList.add('in'); });
    function dist(){ return Math.max(0, track.scrollWidth - vp.clientWidth); }
    gsap.to(track,{x:function(){return -dist();},ease:'none',scrollTrigger:{
      trigger:'.hscroll',start:'top top',end:function(){return '+='+dist();},pin:true,scrub:.6,invalidateOnRefresh:true,
      onUpdate:function(self){ gsap.set(bar,{scaleX:self.progress}); }
    }});
    return function(){ root.classList.remove('motion-hs'); gsap.set(track,{clearProps:'x'}); };
  });

  window.addEventListener('load',function(){ ScrollTrigger.refresh(); });
})();
