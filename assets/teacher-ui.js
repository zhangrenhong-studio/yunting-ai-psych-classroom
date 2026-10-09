(function(){
'use strict';
var path=location.pathname.split('/').pop()||'teacher.html';
var params=new URLSearchParams(location.search);
var view=params.get('view')||'dashboard';
var isWorkbench=path==='teacher.html';
var isLive=path==='teacher-course.html';
if(view==='launch'||view==='courses')view='arrangements';
var active=isWorkbench?view:(path==='teacher-record.html'?'records':(['teacher-class.html','teacher-class-analysis.html','teacher-class-create.html','teacher-student-add.html','teacher-students-import.html'].indexOf(path)>=0?'classes':'dashboard'));
var groups=[
 ['insight','心理洞察',[['data-overview','洞察总览'],['data-index','心理指数'],['data-trend','心理趋势'],['warning','需要关注']]],
 ['classroom','课堂教学',[['arrangements','教学安排'],['records','课堂记录']]],
 ['people','学生管理',[['classes','班级管理'],['students','学生总览']]],
 ['support','沟通与支持',[['follow','私密关注'],['wall','留言墙动态']]]
];
var core=[['dashboard','工作台首页'],['arrangements','教学安排'],['records','课堂记录'],['classes','班级管理']];
var more=[['wearables','手环监测'],['data-overview','洞察总览'],['data-index','心理指数'],['data-trend','心理趋势'],['students','学生总览'],['warning','需要关注'],['follow','私密关注'],['wall','留言墙动态']];
function href(id){return 'teacher.html?view='+id}
function iconSvg(id){var paths={dashboard:'<path d="M3.5 10.5 12 3l8.5 7.5M5.5 9.2V21h13V9.2M9.5 21v-6h5v6"/>',arrangements:'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',records:'<path d="M3.5 6.5h6l2-2h9v15h-17v-13Z"/><path d="M3.5 9h17"/>',classes:'<path d="M3 21h18M5 21V8l7-4 7 4v13M10 21v-5h4v5"/>',wearables:'<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6V3h6v3M9 18v3h6v-3M10 10h4M10 14h4"/>',courses:'<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z"/>','data-overview':'<path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20h18"/>','data-index':'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/>','data-trend':'<path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6"/>',students:'<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V20M15 5.5a3 3 0 0 1 0 5.8M16.5 13.5a4 4 0 0 1 4 4V20"/>',warning:'<path d="m12 3 9 17H3L12 3Z"/><path d="M12 9v5M12 17.5v.1"/>',follow:'<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8M8 13h5"/>',wall:'<path d="M5 3h10l4 4v14H5V3Z"/><path d="M15 3v5h5M8 12h8M8 16h8"/>'};return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(paths[id]||'<circle cx="12" cy="12" r="8"/>')+'</svg>'}
function navLinks(items){return items.map(function(x){return '<a href="'+href(x[0])+'" data-view="'+x[0]+'" class="'+(active===x[0]?'active on':'')+'">'+iconSvg(x[0])+'<span>'+x[1]+'</span></a>'}).join('')}
function groupIcon(id){var paths={classroom:'<path d="M4 5h16v12H4V5Z"/><path d="M8 21h8M12 17v4M8 9h8M8 13h5"/>',people:'<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V20M15 5.5a3 3 0 0 1 0 5.8M16.5 13.5a4 4 0 0 1 4 4V20"/>',insight:'<path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20h18"/>',support:'<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8M8 13h5"/>'};return '<svg viewBox="0 0 24 24" aria-hidden="true">'+paths[id]+'</svg>'}
function savedGroupState(){try{var x=JSON.parse(localStorage.getItem('yunting-teacher-nav-groups-v1'));return x&&typeof x==='object'?x:{}}catch(e){return{}}}
function groupedNav(){var saved=savedGroupState();return '<div class="sidebar-logo"><h1>云听</h1><p>AI 智慧心理教室 · 老师端</p></div><a href="'+href('dashboard')+'" data-view="dashboard" class="sidebar-home '+(active==='dashboard'?'active on':'')+'">'+iconSvg('dashboard')+'<span>工作台首页</span></a><div class="sidebar-modules" aria-label="功能模块">'+groups.map(function(g){var containsActive=g[2].some(function(x){return x[0]===active}),open=containsActive||saved[g[0]]===true,module='<section class="sidebar-module '+(open?'is-open':'')+'" data-nav-group="'+g[0]+'"><button type="button" class="sidebar-module-toggle" aria-expanded="'+String(open)+'" aria-controls="sidebar-module-'+g[0]+'"><span class="sidebar-module-title">'+groupIcon(g[0])+'<b>'+g[1]+'</b></span><svg class="sidebar-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button><div class="sidebar-subnav" id="sidebar-module-'+g[0]+'">'+navLinks(g[2])+'</div></section>';if(g[0]==='people')module+='<a href="'+href('wearables')+'" data-view="wearables" class="sidebar-module-direct '+(active==='wearables'?'active on':'')+'">'+iconSvg('wearables')+'<span>手环监测</span></a>';return module}).join('')+'</div>'}
function installGroupedNav(){var side=document.querySelector('.teacher-sidebar-canonical');if(!side)return;side.addEventListener('click',function(e){var button=e.target.closest('.sidebar-module-toggle');if(!button)return;var section=button.closest('.sidebar-module'),opening=!section.classList.contains('is-open');section.classList.toggle('is-open',opening);button.setAttribute('aria-expanded',String(opening));var state=savedGroupState();state[section.dataset.navGroup]=opening;try{localStorage.setItem('yunting-teacher-nav-groups-v1',JSON.stringify(state))}catch(err){}})}
function installShell(){
 if(isLive)return;
 var existing=document.querySelector('.sidebar');
 if(existing){existing.innerHTML=groupedNav();existing.classList.add('teacher-sidebar-canonical')}
 else if(!isWorkbench){document.body.classList.add('has-teacher-context');var rail=document.createElement('aside');rail.className='teacher-context-rail sidebar teacher-sidebar-canonical';rail.setAttribute('aria-label','老师端主导航');rail.innerHTML=groupedNav();document.body.prepend(rail)}
 installGroupedNav();
 var mobile=document.createElement('nav');mobile.className='teacher-mobile-nav';mobile.setAttribute('aria-label','老师端移动导航');mobile.innerHTML=navLinks(core)+'<button type="button" id="teacher-more" aria-expanded="false" aria-controls="teacher-more-popover" class="'+(more.some(function(x){return x[0]===active})?'on':'')+'">更多</button>';document.body.appendChild(mobile);
 var pop=document.createElement('div');pop.id='teacher-more-popover';pop.className='teacher-more-popover';pop.hidden=true;pop.innerHTML=navLinks(more);document.body.appendChild(pop);
 var button=document.getElementById('teacher-more');button.addEventListener('click',function(){pop.hidden=!pop.hidden;button.setAttribute('aria-expanded',String(!pop.hidden))});document.addEventListener('click',function(e){if(!pop.hidden&&!pop.contains(e.target)&&e.target!==button){pop.hidden=true;button.setAttribute('aria-expanded','false')}})
 if(isWorkbench){window.addEventListener('yunting:viewchange',function(e){active=e.detail&&e.detail.view?e.detail.view:'dashboard';var side=document.querySelector('.teacher-sidebar-canonical');if(side)side.innerHTML=groupedNav();document.querySelectorAll('.teacher-mobile-nav a').forEach(function(a){var current=a.dataset.view===active;a.classList.toggle('active',current);a.classList.toggle('on',current)});button.classList.toggle('on',more.some(function(x){return x[0]===active}))})}
}
function labelStage(stage){
 var eyebrow=stage.querySelector('.course-stage-head .eyebrow');
 var text=eyebrow?eyebrow.textContent.trim():'课程阶段';
 var box=stage.querySelector('.course-stage-head>div');
 if(box&&!box.querySelector('h3')){var h=document.createElement('h3');h.textContent=text;box.insertBefore(h,box.firstChild);if(eyebrow)eyebrow.remove()}
}
function installCurriculum(){
 var library=document.querySelector('.course-library');if(!library||library.dataset.browserReady)return;library.dataset.browserReady='true';
 var stages=Array.from(library.querySelectorAll(':scope > .course-stage'));
 stages.forEach(function(stage,si){
  labelStage(stage);var head=stage.querySelector('.course-stage-head');if(!head)return;head.tabIndex=0;head.setAttribute('role','button');head.setAttribute('aria-expanded',si===0?'true':'false');stage.classList.toggle('is-open',si===0);
  function toggleStage(){var opening=!stage.classList.contains('is-open');stages.forEach(function(s){s.classList.remove('is-open');var h=s.querySelector('.course-stage-head');if(h)h.setAttribute('aria-expanded','false')});if(opening){stage.classList.add('is-open');head.setAttribute('aria-expanded','true')}}
  head.addEventListener('click',toggleStage);head.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleStage()}});
  var grades=Array.from(stage.querySelectorAll(':scope > .course-grade'));grades.forEach(function(grade,gi){var gh=grade.querySelector('.course-grade-head');grade.classList.toggle('is-open',gi===0);if(!gh)return;gh.tabIndex=0;gh.setAttribute('role','button');gh.setAttribute('aria-expanded',gi===0?'true':'false');function toggleGrade(){var opening=!grade.classList.contains('is-open');grades.forEach(function(g){g.classList.remove('is-open');var x=g.querySelector('.course-grade-head');if(x)x.setAttribute('aria-expanded','false')});if(opening){grade.classList.add('is-open');gh.setAttribute('aria-expanded','true')}}gh.addEventListener('click',toggleGrade);gh.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleGrade()}})});
 });
 var filter=document.getElementById('course-grade-filter');if(filter){filter.addEventListener('change',function(){var picked=filter.value;if(picked==='all'){stages.forEach(function(s,i){s.hidden=false;s.classList.toggle('is-open',i===0)});return}var match=library.querySelector('.course-grade[data-grade="'+CSS.escape(picked)+'"]');stages.forEach(function(s){s.hidden=!s.contains(match);s.classList.toggle('is-open',s.contains(match))});if(match){Array.from(match.parentElement.querySelectorAll('.course-grade')).forEach(function(g){g.classList.toggle('is-open',g===match)});match.scrollIntoView({behavior:'smooth',block:'start'})}})}
}
function upgradeLegacySidebarIcons(){Array.prototype.forEach.call(document.querySelectorAll('.sidebar a'),function(a){var i=a.querySelector('i');if(!i)return;var u=new URL(a.href,location.href),id=u.searchParams.get('view')||'dashboard';i.innerHTML=iconSvg(id)})}
upgradeLegacySidebarIcons();installShell();installCurriculum();
})();
