(function(){
  var nav=document.querySelector('.nav'), mbar=document.querySelector('.mbar');
  function onScroll(){
    var y=window.scrollY;
    nav.classList.toggle('is-scrolled', y>40);
    if(mbar) mbar.classList.toggle('show', y>500);
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // Mobile menu
  var toggle=document.querySelector('.nav__toggle');
  toggle.addEventListener('click', function(){
    var open=nav.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.mobile-menu a').forEach(function(a){
    a.addEventListener('click', function(){ nav.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', false); });
  });

  // Reveal on scroll
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
    els.forEach(function(el,i){
      var sib=el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay=Math.min(sib,5)*90+'ms';
      io.observe(el);
    });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }

  // Today's hours
  var d=new Date().getDay(), row=document.querySelector('.hours tr[data-day="'+d+'"]');
  if(row) row.classList.add('today');

  // Lightbox
  var lb=document.getElementById('lightbox'), lbImg=lb.querySelector('img');
  document.querySelectorAll('.g').forEach(function(b){
    b.addEventListener('click', function(){
      lbImg.src=b.dataset.full; lbImg.alt=b.querySelector('img').alt;
      lb.classList.add('open'); lb.setAttribute('aria-hidden','false');
    });
  });
  function close(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); }
  lb.addEventListener('click', function(e){ if(e.target!==lbImg) close(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });

  var yr=document.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();
})();
