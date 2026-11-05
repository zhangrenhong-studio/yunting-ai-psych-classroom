/* Student exploration uses the established classroom surfaces, not a workspace shell. */
(function(g){'use strict';
function el(tag,cls,html){const x=document.createElement(tag);x.className=cls||'';if(html)x.innerHTML=html;return x}
function enhance(main,view){document.body.dataset.exploreView=view;const h=main.querySelector('h1'),k=main.querySelector('.eyebrow');let dispose=()=>{};
if(view==='prepare'){
 const api=g.YTBreathingEnter.build({title:'换了新环境，慢一点也没关系',stages:{enter:{title:'换了新环境，<br>慢一点也没关系'}}});
 api.root.querySelector('h1').innerHTML='换了新环境，<br>慢一点也没关系';const scene=api.root.firstElementChild,panel=el('div','u-enter-panel'),portrait=el('figure','u-welcome-portrait','<img src="assets/cloud-welcome-r110.png" alt="云朵陪伴形象" width="1259" height="1178">');panel.append(scene.querySelector('.enter-body'),portrait);scene.append(panel);main.replaceChildren(api.root);api.onConfirm(()=>document.getElementById('next').click());api.activate();main.breathingApi=api;dispose=()=>{api.deactivate();main.breathingApi=null};
}
if(view==='story'){
 const split=main.querySelector('.split'),question=main.querySelector('.question'),text=split.querySelector('p').textContent;
 const article=el('article','r99-reader');article.append(el('div','r104-story-label','故事里的这一刻'),h);
 const prose=el('div','r99-prose');const parts=text.split(/(?=看着同桌|为什么别人)/);parts.forEach(t=>prose.append(el('p','',t)));article.append(prose);
 const oldLabel=question.querySelector('label'),ta=question.querySelector('textarea');oldLabel.replaceWith(ta);ta.rows=1;ta.setAttribute('aria-label','写下对小泽的想法，自愿');question.classList.add('r101-composer');question.querySelector('b').textContent='如果你是小泽的朋友，你会对他说什么？';main.replaceChildren(article,question);
}
if(view==='knowledge'){
 const split=main.querySelector('.split'),copy=split.firstElementChild,cloud=split.querySelector('img');main.replaceChildren(h);const box=el('section','classroom-knowledge');box.append(copy);main.append(box);cloud.classList.add('knowledge-scholar');main.append(cloud);
}
if(view==='discussion'){
 const choice=main.querySelector('.choices'),q=main.querySelector('.question'),log=main.querySelector('.messages'),label=main.querySelector('label'),row=main.querySelector('.row'),ta=label.querySelector('textarea'),badge=main.querySelector('.badge');
 choice.querySelector('[data-topic=methods]').textContent='怎样帮助小泽慢慢适应';
 const scene=el('section','scene-talk'),head=el('header','talk-head','<span class="talk-presence-dot"></span><b>小悦悦</b>');head.append(badge);const context=el('div','explore-talk-topics');context.append(choice);
 const opener=el('div','message preset');opener.append(el('img','talk-avatar'));opener.querySelector('img').src='assets/cloud-welcome-r110.png';opener.querySelector('img').alt='小悦悦';opener.append(el('div','msg',q.textContent));log.prepend(opener);
 log.querySelectorAll('.message:not(.mine)').forEach(m=>{if(!m.querySelector('img')){const img=el('img','talk-avatar');img.src='assets/cloud-welcome-r110.png';img.alt='小悦悦';m.prepend(img)}});
 const composer=el('div','talk-composer');ta.rows=2;ta.setAttribute('aria-label','写下你的想法');composer.append(ta,row);row.querySelector('[data-action=discuss]').textContent='发送';row.querySelector('[data-action=prompt]').textContent='先看提示';scene.append(head,context,log,composer);main.replaceChildren(scene);
}
if(view==='methods'){
 const method=main.querySelector('.method');method.querySelector('.question').className='method-example';const help=method.querySelector('.hint');const details=el('details','rules-note','<summary>关于练习提示</summary>');details.append(help);method.append(details);main.querySelectorAll('.choices button').forEach(x=>x.classList.add('method-tab'));
}
if(view==='audio'){
 const old=main.querySelector('.audio-scene'),video=old.querySelector('video'),audio=old.querySelector('audio'),play=old.querySelector('[data-action=play]'),retry=old.querySelector('[data-action=retry]'),stop=old.querySelector('[data-action=stop]'),status=old.querySelector('#audio-status'),progress=old.querySelector('#audio-progress');
 const scene=el('section','scene-energy'),copy=el('p','energy-positive-copy','让音乐陪你停留片刻，也记得温柔地照顾自己。<br>慢慢来，每一次小小的调整，都在积蓄成长的力量。'),visual=el('div','energy-visual');visual.append(video);video.poster='assets/cloud-loop-r116-poster.png';
 const player=el('section','energy-player'),panel=el('div','energy-player-main'),info=el('div','energy-track-info','<h2 class="t-title">心理能量成长训练</h2>');status.className='energy-status';info.append(status);play.className='energy-play';play.setAttribute('aria-label','开始或暂停收听');play.title='开始或暂停收听';play.innerHTML='<span aria-hidden="true">▶</span>';
 const volume=el('label','energy-volume','<span>音量</span><input type="range" min="0" max="1" step="0.05" value="0.8" aria-label="音量">');volume.querySelector('input').oninput=e=>audio.volume=Number(e.target.value);audio.volume=.8;
 const timeline=el('div','energy-timeline');progress.className='energy-time-text';timeline.append(progress,el('div','energy-progress','<i id="explore-audio-fill"></i>'));panel.append(info,play,volume,timeline);const tools=el('div','energy-quiet-tools');retry.textContent='重新加载';stop.textContent='不舒服，停止收听';tools.append(retry,stop);player.append(panel,tools);scene.append(copy,visual,player,audio);main.replaceChildren(scene);
}
if(view==='goal'){
 const hint=main.querySelector('.question');hint.className='goal-example';
}
if(view==='summary'){
 const record=main.querySelector('.callout'),details=el('details','explore-record','<summary>回看我的探索记录</summary>');details.append(record);main.append(details);
}
return dispose;
}
g.YTExploreClassroom=Object.freeze({enhance});
})(window);
