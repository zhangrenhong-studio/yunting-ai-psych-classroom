/* Shared review model. Explicit sample report records, not a production assessment/diagnosis service. */
(function(global){
'use strict';
var KEY='yunting-support-review-v4-reports',EXTRAS='yunting-support-review-v4-extra-roster',OBS='yunting-support-review-v4-observations',USAGE='yunting-support-review-v4-resource-events';
var DIM_NAMES=['情绪情感','注意专注','学习行为','社会交往','焦虑抑郁状态','睡眠休息','亲子关系','应急应激'];
function read(k,fallback){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v===null?fallback:v}catch(e){return fallback}}
function clone(x){return JSON.parse(JSON.stringify(x))}
function id(v){return String(v==null?'':v)}
function day(v){if(!v)return '';var raw=String(v);if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;var normalized=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)?raw.replace(' ','T')+':00+08:00':raw;var d=new Date(normalized);if(!Number.isFinite(d.getTime()))return '';return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function roster(){var groups=read('yunting-class-groups-v1',[]),students=read('yunting-class-students-v1',[]);return students.filter(function(s){return s.demo===true&&groups.some(function(c){return c.demo===true&&id(c.id)===id(s.classId)})}).map(function(s){var c=groups.find(function(c){return id(c.id)===id(s.classId)});return {id:s.id,student_id:s.id,school_id:1,class_id:s.classId,name:s.name,student_no:s.studentNo||'',status:s.status||'active',class_status:c.status||'active',demo:true}}).concat(read(EXTRAS,[]))}
function groups(){return read('yunting-class-groups-v1',[]).filter(function(c){return c.demo===true}).map(function(c){return {id:c.id,school_id:1,name:(c.grade?c.grade+' · ':'')+c.name,status:c.status||'active',teacher_id:1,grade:c.grade}})}
function setExtraRoster(rows){localStorage.setItem(EXTRAS,JSON.stringify(rows));return read(EXTRAS,[])}
function initialize(){
 if(!global.YTPsychInsights)return;
 if(read(KEY,null))return;
 var selected=['demo-class-7a-student-4','demo-class-7b-student-2','demo-class-8a-student-7','demo-class-7a-student-9'],reports=[];
 selected.forEach(function(studentId,i){var insight=global.YTPsychInsights.byStudent(studentId);if(!insight||!roster().some(function(s){return id(s.id)===studentId}))return;reports.push({id:'review-report-'+(i+1),school_id:1,student_id:studentId,class_id:insight.classId,report_status:'generated',generated_at:'2026-09-20T20:10:00+08:00',period_start:'2026-08-22',period_end:'2026-09-20',input_id:'existing-demo-observation-'+studentId,measure_version:'existing-demo-eight-dimensions-v1',snapshot:clone(insight),report:{summary:insight.summary},source:'明确标注的演示生成记录；引用原心理状态演示分析，不是真实学生报告',demo:true})});
 if(reports[0])reports.push(Object.assign({},clone(reports[0]),{id:'review-report-5',generated_at:'2026-09-21T16:40:00+08:00',source:'重复生成样例；与上一份使用相同演示观察材料，不代表状态变化'}));
 localStorage.setItem(KEY,JSON.stringify(reports));
}
function reports(){initialize();return read(KEY,[])}
function validReports(rows){var unique=new Map();rows.forEach(function(r){if(!r||r.report_status!=='generated'||!day(r.generated_at)||!r.report||!Object.keys(r.report).length)return;var key=id(r.school_id)+'|'+id(r.id);if(!unique.has(key)||String(r.generated_at)>String(unique.get(key).generated_at))unique.set(key,r)});return Array.from(unique.values())}
function aggregate(input,students,schools,filters){
 filters=Object.assign({mode:'cumulative',school_id:'',class_id:'',date_from:'',date_to:''},filters||{});
 if(!['cumulative','period'].includes(filters.mode))throw Error('统计模式无效');
 ['date_from','date_to'].forEach(function(k){if(k==='date_from'&&filters.mode==='cumulative')return;if(filters[k]&&(!/^\d{4}-\d{2}-\d{2}$/.test(filters[k])||!Number.isFinite(Date.parse(filters[k]+'T00:00:00Z'))||new Date(filters[k]+'T00:00:00Z').toISOString().slice(0,10)!==filters[k]))throw Error('日期格式应为有效 YYYY-MM-DD')});
 if(filters.mode==='period'&&filters.date_from&&filters.date_to&&filters.date_from>filters.date_to)throw Error('开始日期不能晚于结束日期');
 var scopedSchools=schools.filter(function(s){return !filters.school_id||id(s.id)===id(filters.school_id)});
 var uniqueStudents=new Map();students.forEach(function(s){uniqueStudents.set(id(s.school_id)+'|'+id(s.id),s)});students=Array.from(uniqueStudents.values());
 var all=validReports(input).filter(function(r){var d=day(r.generated_at);return (!filters.date_to||d<=filters.date_to)&&(filters.mode!=='period'||!filters.date_from||d>=filters.date_from)});
 var items=scopedSchools.map(function(school){
  var linked=students.filter(function(s){return id(s.school_id)===id(school.id)&&(!filters.class_id||id(s.class_id)===id(filters.class_id))});
  var active=linked.filter(function(s){return s.status==='active'&&s.class_status==='active'}),eligible=new Set(active.map(function(s){return id(s.id)}));
  var known=new Set(linked.map(function(s){return id(s.id)})),rr=all.filter(function(r){return id(r.school_id)===id(school.id)&&known.has(id(r.student_id))});
  var covered=new Set(rr.filter(function(r){return eligible.has(id(r.student_id))}).map(function(r){return id(r.student_id)}));
  var last=rr.map(function(r){return r.generated_at}).sort(function(a,b){return new Date(a)-new Date(b)}).pop()||null;
  return {school_id:school.id,school_name:school.name,student_count:active.length,reported_student_count:covered.size,report_count:rr.length,coverage_rate:active.length?Math.round(covered.size/active.length*1000)/10:null,without_report_count:active.length-covered.size,last_generated_at:last};
 });
 var totals={student_count:0,reported_student_count:0,report_count:0,without_report_count:0,last_generated_at:null};
 items.forEach(function(r){['student_count','reported_student_count','report_count','without_report_count'].forEach(function(k){totals[k]+=r[k]});if(r.last_generated_at&&(!totals.last_generated_at||new Date(r.last_generated_at)>new Date(totals.last_generated_at)))totals.last_generated_at=r.last_generated_at});totals.coverage_rate=totals.student_count?Math.round(totals.reported_student_count/totals.student_count*1000)/10:null;
 return {items:items,totals:totals,filters:filters,basis:'分母为当前启用学生及启用班级；仅统计明确生成且有正文的报告，按校内学生去重。报告份数可包含当前已归档学生的历史报告；班级按当前归属筛选。没有报告不等于未完成测评。',personal_access:'restricted'};
}
function byStudent(studentId){var student=roster().find(function(s){return id(s.id)===id(studentId)}),list=validReports(reports()).filter(function(r){return id(r.student_id)===id(studentId)&&id(r.school_id)===id(student?.school_id)}).sort(function(a,b){return new Date(b.generated_at)-new Date(a.generated_at)}),latest=list[0]||null,previous=list[1]||null;var comparable=!!(latest&&previous&&latest.input_id!==previous.input_id&&latest.measure_version===previous.measure_version&&latest.period_end>previous.period_end);return {student:student||null,insight:latest?.snapshot||global.YTPsychInsights?.byStudent(studentId)||null,latest:latest,previous:previous,reportCount:list.length,comparable:comparable,delta:comparable?latest.snapshot.score-previous.snapshot.score:null}}
function supportFor(studentId){
 var context=byStudent(studentId),ins=context.insight;
 if(!context.latest||!ins)return {hasReport:false,focus:[],communication:'',audio:null,training:null,needsHumanReview:false,safetyNote:'已有分析观察不等于已生成报告；不据此判定学生未完成测评。',change:{text:'尚无已生成报告，不推算前后变化。',delta:null,comparable:false}};
 var ranked=(ins.dimensions||[]).map(function(value,i){return {name:DIM_NAMES[i],value:Number(value),index:i}}).filter(function(x){return Number.isFinite(x.value)}).sort(function(a,b){return a.value-b.value}),focus=ranked.filter(function(x){return x.value<65}).slice(0,2).map(function(x){return {name:x.name,reason:'本期指数 '+x.value+'，结合学生近期情境了解。'}}),di=ranked[0]?.index||0;
 var talk=['可以从“最近有什么让你不太舒服的时刻吗？”开始；先听学生愿意说的部分，不急着解释。','可以问“什么时候比较容易把注意力放回来？”先了解环境与感受，不把困难归因为不努力。','可以一起找一件最容易开始的小事，让学生自己选择，不追加打卡或作业。','可以问“你希望对方先理解你哪一点？”不急着判谁对谁错，也不强迫当场和解。','可以先了解担忧发生的情境与对日常生活的影响；不凭分数给学生贴焦虑或抑郁标签。','可以温和了解最近的睡眠与白天感受，不要求学生当场解释原因。','先听学生怎样感受家庭交流，不要求复述私密细节，也不未经了解就转述给家长。','可以先确认学生此刻是否有安全、可信任的支持，再邀请其表达愿意说的部分。'];
 var game=(di===1||di===2)?{id:'visual',title:'火眼金睛',path:'visual-search.html',reason:'可选的注意练习体验，不是测评，也不要求达到分数。'}:(di===3||di===6)?{id:'social',title:'社交小雷达',path:'social-radar.html',reason:'可选的相处情境练习，用作交流切入点，不等于现实交往能力结论。'}:{id:'emotion',title:'心情侦探',path:'emotion-detective.html',reason:'可选的情绪辨认练习，不要求学生解释私密经历。'};
 var change=context.previous?(context.comparable?'已有两期同口径报告可比较；指数变化 '+(context.delta>0?'+':'')+context.delta+'，不能据此归因于某段音频或训练。':'现有两份报告使用相同观察材料，不能据此判断变化；有新的可比材料时再自动整理。'):'目前只有一份报告，材料不足以判断前后变化；无需为此额外填写记录。';
 return {hasReport:true,focus:focus.length?focus:[{name:'保持日常支持',reason:'当前材料未提示需要额外安排训练，尊重学生自主选择即可。'}],communication:talk[di],audio:{id:'energy-existing',title:'心理能量成长训练',url:'https://zhangrenhong-studio.github.io/yunting-ai-psych-classroom/audio/energy/user-supplied-r113.mp3',reason:'现有音频资源，可自愿试听、随时停止；不是新生成的个体化治疗音频。'},training:{id:game.id,title:game.title,url:'https://zhangrenhong-studio.github.io/yunting-ai-psych-classroom/training-games/'+game.path,reason:game.reason},needsHumanReview:ins.level==='priority',safetyNote:'如学生表达即时安全风险，应依学校流程及时人工了解与必要处置，不以收听音频或训练代替。',change:{text:change,delta:context.delta,comparable:context.comparable}};
}
function getObservation(studentId){return read(OBS,{})[id(studentId)]?.text||''}
function saveObservation(studentId,text){text=String(text||'').trim();if(text.length>1000)throw Error('观察最多 1000 字');var rows=read(OBS,{}),r={text:text,updatedAt:new Date().toISOString()};if(text)rows[id(studentId)]=r;else delete rows[id(studentId)];localStorage.setItem(OBS,JSON.stringify(rows));if(getObservation(studentId)!==text)throw Error('保存后读取核验失败');return r}
function recordUsage(studentId,resourceId,event){if(!['play','pause','ended','opened'].includes(event))throw Error('资源事件无效');var rows=read(USAGE,[]),r={id:'use-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),studentId:id(studentId),resourceId:resourceId,event:event,at:new Date().toISOString(),actor:'teacher-preview',meaning:'仅教师资源体验，不代表学生完成或心理改善'};rows.push(r);localStorage.setItem(USAGE,JSON.stringify(rows.slice(-200)));return r}
function usage(studentId){return read(USAGE,[]).filter(function(r){return r.studentId===id(studentId)})}
global.YTSupportReports={initialize:initialize,roster:roster,groups:groups,setExtraRoster:setExtraRoster,reports:reports,validReports:validReports,aggregate:aggregate,byStudent:byStudent,supportFor:supportFor,getObservation:getObservation,saveObservation:saveObservation,recordUsage:recordUsage,usage:usage,day:day,mode:'explicit_demo'};
})(window);
