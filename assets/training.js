(()=>{
  const games={
    emotion:{title:'心情侦探',dimension:'读懂心情',src:'training-games/emotion-detective.html'},
    social:{title:'社交小雷达',dimension:'相处有方法',src:'training-games/social-radar.html'},
    visual:{title:'火眼金睛',dimension:'专注一下',src:'training-games/visual-search.html'},
    reaction:{title:'苹果炸弹',dimension:'专注一下',src:'training-games/apple-bomb.html'}
  };
  document.querySelectorAll('[data-dimension]').forEach(card=>{const d=window.YT_THEME_COURSES.dimensions.find(d=>d.id===card.dataset.dimension);if(d)card.querySelector('h2').textContent=d.studentName;});
  const app=document.querySelector('[data-training-app]');
  const stage=document.querySelector('[data-game-stage]');
  const frame=document.querySelector('[data-game-frame]');
  const loading=document.querySelector('[data-game-loading]');
  const title=document.querySelector('[data-stage-title]');
  const dimension=document.querySelector('[data-stage-dimension]');
  let current='';

  function openGame(key,{push=true}={}){
    const game=games[key];
    if(!game)return;
    current=key;
    title.textContent=game.title;
    dimension.textContent=game.dimension;
    loading.classList.remove('is-ready');
    stage.hidden=false;
    app.setAttribute('aria-hidden','true');
    document.body.style.overflow='hidden';
    frame.src=game.src;
    if(push)history.pushState({game:key},'',`training.html?game=${encodeURIComponent(key)}`);
    document.querySelector('[data-stage-back]').focus({preventScroll:true});
  }
  function closeGame({historyBack=false}={}){
    frame.src='about:blank';
    stage.hidden=true;
    app.removeAttribute('aria-hidden');
    document.body.style.overflow='';
    const prior=current;
    current='';
    if(historyBack)history.back();
    else history.replaceState({},'', 'training.html');
    document.querySelector(`[data-game="${prior}"]`)?.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-game]').forEach(button=>button.addEventListener('click',()=>openGame(button.dataset.game)));
  document.querySelector('[data-stage-back]').addEventListener('click',()=>closeGame());
  document.querySelector('[data-stage-reload]').addEventListener('click',()=>{
    if(!current)return;
    loading.classList.remove('is-ready');
    frame.src=games[current].src+`?restart=${Date.now()}`;
  });
  frame.addEventListener('load',()=>{
    if(frame.src!=='about:blank')loading.classList.add('is-ready');
  });
  window.addEventListener('popstate',()=>{
    const key=new URLSearchParams(location.search).get('game');
    if(key&&games[key])openGame(key,{push:false});
    else if(!stage.hidden)closeGame();
  });
  const initial=new URLSearchParams(location.search).get('game');
  if(initial&&games[initial])openGame(initial,{push:false});
})();
