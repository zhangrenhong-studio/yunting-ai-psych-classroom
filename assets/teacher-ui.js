(function(){
'use strict';
var path=location.pathname.split('/').pop()||'teacher.html';
var params=new URLSearchParams(location.search);
var view=params.get('view')||'dashboard';
var isWorkbench=path==='teacher.html';
var isLive=path==='teacher-course.html';
var active=isWorkbench?view:(path==='teacher-record.html'?'records':(['teacher-class.html','teacher-class-create.html','teacher-student-add.html','teacher-students-import.html'].indexOf(path)>=0?'classes':'dashboard'));
var core=[['dashboard','开课准备','⌂'],['records','课堂记录','▤'],['classes','班级管理','▣'],['courses','课程管理','▦']];
var more=[['students','成长观察','◎'],['follow','私密关注','✦'],['wall','留言墙动态','▧']];
function href(id){return 'teacher.html?view='+id}
function navLinks(items){return items.map(function(x){return '<a href="'+href(x[0])+'" class="'+(active===x[0]?'on':'')+'" data-icon="'+x[2]+'">'+x[1]+'</a>'}).join('')}
function installShell(){
 if(isLive)return;
 if(!isWorkbench){
  document.body.classList.add('has-teacher-context');
  var rail=document.createElement('aside');rail.className='teacher-context-rail';rail.setAttribute('aria-label','老师端主导航');rail.innerHTML='<a class="teacher-context-brand" href="teacher.html">云听<small>AI 智慧心理教室 · 老师端</small></a><nav class="teacher-context-nav">'+navLinks(core.concat(more))+'</nav><p class="teacher-context-foot">教学流程演示 · 本地数据</p>';document.body.prepend(rail);
 }
 var mobile=document.createElement('nav');mobile.className='teacher-mobile-nav';mobile.setAttribute('aria-label','老师端移动导航');mobile.innerHTML=navLinks(core)+'<button type="button" id="teacher-more" data-icon="•••" aria-expanded="false" aria-controls="teacher-more-popover" class="'+(more.some(function(x){return x[0]===active})?'on':'')+'">更多</button>';document.body.appendChild(mobile);
 var pop=document.createElement('div');pop.id='teacher-more-popover';pop.className='teacher-more-popover';pop.hidden=true;pop.innerHTML=navLinks(more);document.body.appendChild(pop);
 var button=document.getElementById('teacher-more');button.addEventListener('click',function(){pop.hidden=!pop.hidden;button.setAttribute('aria-expanded',String(!pop.hidden))});
 document.addEventListener('click',function(e){if(!pop.hidden&&!pop.contains(e.target)&&e.target!==button){pop.hidden=true;button.setAttribute('aria-expanded','false')}});
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
installShell();installCurriculum();
})();
