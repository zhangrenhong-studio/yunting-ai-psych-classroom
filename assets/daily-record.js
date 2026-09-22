(function () {
  'use strict';
  document.body.className='student-daily';
  var KEY='yunting-daily-records-v1',app=document.getElementById('app');
  var today=new Date(),shown=new Date(today.getFullYear(),today.getMonth(),1),selected=key(today);
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function key(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function parse(k){var a=k.split('-').map(Number);return new Date(a[0],a[1]-1,a[2]);}
  function records(){try{var r=JSON.parse(localStorage.getItem(KEY));return Array.isArray(r)?r.filter(function(x){return!x.deletedAt;}):[];}catch(e){return[];}}
  function save(rows){localStorage.setItem(KEY,JSON.stringify(rows));}
  function dateText(k){return parse(k).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});}
  function rowDate(r){return r.localDate||key(new Date(r.createdAt));}
  function dayRows(k){return records().filter(function(r){return rowDate(r)===k;}).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});}
  function preview(s){s=String(s||'').trim().replace(/\s+/g,' ');return s.length>54?s.slice(0,54)+'…':s;}
  function calendar(){
    var y=shown.getFullYear(),m=shown.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),all=records(),counts={};
    all.forEach(function(r){var d=rowDate(r);counts[d]=(counts[d]||0)+1;});
    var cells=''; for(var blank=0;blank<first;blank++)cells+='<span class="cal-day is-empty"></span>';
    for(var d=1;d<=days;d++){var k=key(new Date(y,m,d)),future=parse(k)>new Date(today.getFullYear(),today.getMonth(),today.getDate());cells+='<button type="button" class="cal-day '+(k===selected?'is-selected ':'')+(k===key(today)?'is-today ':'')+(counts[k]?'has-record ':'')+'" data-day="'+k+'" '+(future?'disabled':'')+'><span>'+d+'</span>'+(counts[k]?'<i>'+counts[k]+'</i>':'')+'</button>';}
    return '<section class="calendar-card"><div class="calendar-head"><button type="button" data-month="-1" aria-label="上个月">‹</button><h2>'+y+' 年 '+(m+1)+' 月</h2><button type="button" data-month="1" aria-label="下个月">›</button></div><div class="week-row"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div><div class="calendar-grid">'+cells+'</div><p class="calendar-tip"><i></i> 有记录的日期会显示标记和数量</p></section>';
  }
  function dayPanel(){var rows=dayRows(selected),items=rows.map(function(r){return '<button type="button" class="day-record" data-record="'+esc(r.id)+'"><time>'+new Date(r.createdAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+'</time><b>'+esc(preview(r.content))+'</b><span>查看 ›</span></button>';}).join('');return '<section class="day-panel"><header><div><p class="eyebrow">'+dateText(selected)+'</p><h2>'+ (rows.length?'这一天写下了 '+rows.length+' 条':'这一天还没有记录') +'</h2></div><button type="button" class="new-entry" data-new>＋ 写一条</button></header><div class="day-records">'+(items||'<div class="day-empty"><span>○</span><p>想写的时候，就从一句话开始。</p></div>')+'</div></section>';}
  function render(){app.innerHTML='<section class="daily-page"><header class="daily-heading"><div><p class="eyebrow">只属于你的片刻</p><h1>每日记录</h1><p>按日期整理自己的片刻，写下后可以随时回来看看。</p></div><span class="private-tag">仅当前设备可见</span></header><div class="daily-layout">'+calendar()+dayPanel()+'</div><p class="privacy-note">每日记录与留言墙、课堂记录彼此独立，不会自动展示给老师或同学。</p></section>';bind();}
  function bind(){
    Array.prototype.forEach.call(app.querySelectorAll('[data-month]'),function(b){b.addEventListener('click',function(){shown=new Date(shown.getFullYear(),shown.getMonth()+Number(b.getAttribute('data-month')),1);var last=new Date(shown.getFullYear(),shown.getMonth()+1,0).getDate();selected=key(new Date(shown.getFullYear(),shown.getMonth(),Math.min(parse(selected).getDate(),last)));if(parse(selected)>today)selected=key(today);render();});});
    Array.prototype.forEach.call(app.querySelectorAll('[data-day]'),function(b){b.addEventListener('click',function(){selected=b.getAttribute('data-day');render();});});
    app.querySelector('[data-new]').addEventListener('click',editor);
    Array.prototype.forEach.call(app.querySelectorAll('[data-record]'),function(b){b.addEventListener('click',function(){detail(b.getAttribute('data-record'));});});
  }
  function editor(){app.innerHTML='<section class="daily-page editor-page"><header class="daily-heading"><div><p class="eyebrow">'+dateText(selected)+'</p><h1>写下这一天</h1><p>不需要写得完整，也不用给自己下结论。</p></div><span class="private-tag">仅当前设备可见</span></header><div class="paper"><textarea id="entry" maxlength="1200" autofocus placeholder="这一天发生了什么？\n有没有一件事，还留在你的心里？"></textarea></div><div class="writer-actions"><span><i id="count">0</i>/1200</span><div><button type="button" class="text-button" id="cancel">取消</button><button type="button" class="save-entry" id="save" disabled>保存记录</button></div></div></section>';
    var input=document.getElementById('entry'),count=document.getElementById('count'),button=document.getElementById('save');input.focus();input.addEventListener('input',function(){count.textContent=input.value.length;button.disabled=!input.value.trim();});document.getElementById('cancel').onclick=render;button.onclick=function(){var text=input.value.trim();if(!text)return;var now=new Date(),rows=records();rows.unshift({id:'daily-'+Date.now()+'-'+Math.random().toString(16).slice(2),studentId:'local-student',createdAt:now.toISOString(),updatedAt:now.toISOString(),localDate:selected,content:text,paperState:'saved'});save(rows);render();};
  }
  function detail(id){var row=records().filter(function(x){return x.id===id;})[0];if(!row)return render();selected=rowDate(row);app.innerHTML='<section class="daily-page detail-page"><header class="daily-heading"><div><p class="eyebrow">'+dateText(selected)+'</p><h1>那天写下的话</h1><p>'+new Date(row.createdAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+' 保存</p></div><span class="private-tag">仅当前设备可见</span></header><article class="detail-paper">'+esc(row.content)+'</article><label class="consent"><input type="checkbox" id="consent"><span>我愿意把<strong>这一条记录</strong>带入和小悦悦的本次对话。</span></label><div class="detail-actions"><button type="button" class="chat-record" id="chat">带着这条记录去聊聊</button><button type="button" class="delete-record" id="delete">删除</button><button type="button" class="text-button" id="back">返回日历</button></div></section>';
    document.getElementById('back').onclick=render;document.getElementById('chat').onclick=function(){if(!document.getElementById('consent').checked){alert('请先确认只将这一条记录带入本次对话。');return;}location.href='student-space.html?view=chat&record='+encodeURIComponent(row.id);};document.getElementById('delete').onclick=function(){if(!confirm('确定删除这条记录吗？'))return;save(records().filter(function(x){return x.id!==id;}));render();};
  }
  var target=new URLSearchParams(location.search).get('record');if(target)detail(target);else render();
}());
