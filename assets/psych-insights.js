/* 云听心理洞察演示数据：模拟学生-AI持续对话分析，不代表真实学生或医学诊断。 */
(function(global){
'use strict';
var DIMENSIONS=['情绪健康','注意专注','学习行为','社会交往','焦虑抑郁状态','睡眠休息','亲子关系','应激应对'];
var MONTHS=['4月','5月','6月','7月','8月','9月'];
var LEVELS=[
 {key:'strong',label:'优秀',min:85,color:'#21a985'},
 {key:'good',label:'良好',min:75,color:'#62c6ae'},
 {key:'normal',label:'正常',min:65,color:'#69a9dd'},
 {key:'attention',label:'差异',min:50,color:'#f2ad4e'},
 {key:'priority',label:'严重差异',min:0,color:'#e76868'}
];
var DEMO_NAMES=["林梓涵", "陈予安", "周语桐", "许嘉树", "沈清禾", "苏念安", "江书宁", "顾明轩", "叶知夏", "陆星遥", "唐可欣", "程亦然", "宋雨桐", "韩嘉宁", "夏沐辰", "赵清妍", "方景行", "蒋思悦", "罗予辰", "白若溪", "梁知远", "秦安然", "谢语乔", "邵明宇", "何嘉禾", "吴念初", "郑舒然", "冯奕帆", "高语晴", "徐慕言", "曹星冉", "袁书航", "戴清越"];
function demoName(classId,index){var offsets={'demo-class-7a':0,'demo-class-7b':12,'demo-class-8a':22};return DEMO_NAMES[(offsets[classId]||0)+index-1]||('演示学生'+index)}
var CLASS_NAMES={'demo-class-7a':'七年级 · 向阳班（演示）','demo-class-7b':'七年级 · 青禾班（演示）','demo-class-8a':'八年级 · 星河班（演示）'};
var SCORE_PATTERN=[91,87,83,79,76,73,69,66,61,56,47,81];
var flagged={
 'demo-class-7a-student-4':{score:48,sessions:12,summary:'近两周在多次对话中持续出现睡眠受影响、精力下降和反复担忧的表达。',evidence:['连续3次对话出现睡眠受影响的描述','学习与同伴话题中均出现明显担忧','曾主动询问可以向谁寻求帮助'],dimensions:[46,51,55,61,42,38,67,45]},
 'demo-class-7b-student-2':{score:58,sessions:9,summary:'考试临近后压力表达增多，出现反复自我否定和睡眠节律受影响的描述。',evidence:['7天内4次提到考试压力','两次表达“怎么做都不够好”','愿意尝试向可信任成人求助'],dimensions:[56,48,52,68,51,46,72,55]},
 'demo-class-8a-student-7':{score:63,sessions:8,summary:'近期同伴冲突相关表达增多，倾向回避沟通，但仍保持稳定的家庭支持感。',evidence:['3次对话围绕同伴误解展开','多次选择回避而不是澄清','提到家人愿意倾听'],dimensions:[62,66,65,44,61,69,81,58]},
 'demo-class-7a-student-9':{score:67,sessions:7,summary:'在家庭沟通话题中出现紧张和无力感，其他维度暂时保持稳定。',evidence:['近期2次主动谈到家庭沟通压力','表达“说了也不知道会不会被理解”','未出现持续性多维下降'],dimensions:[68,72,70,74,66,63,43,61]}
};
function clamp(v){return Math.max(0,Math.min(100,Math.round(v)))}
function average(values){return values.length?Math.round(values.reduce(function(a,b){return a+b},0)/values.length):null}
function levelOf(score){return LEVELS.find(function(x){return score>=x.min})||LEVELS[LEVELS.length-1]}
function genderFor(index){return index%2?'女':'男'}
function makeTrend(score,seed){return MONTHS.map(function(_,i){return clamp(score-4+((seed+i*3)%7)-Math.round((5-i)*.35))})}
function make(id,classId,index,classOffset){
 var score=SCORE_PATTERN[(index-1+classOffset)%SCORE_PATTERN.length],f=flagged[id];
 if(f)score=f.score;
 var dims=DIMENSIONS.map(function(_,i){return clamp(score+((index*5+i*7+classOffset)%15)-7)});
 if(f&&f.dimensions)dims=f.dimensions.slice();
 var item={studentId:id,classId:classId,className:CLASS_NAMES[classId],studentName:demoName(classId,index),gender:genderFor(index+classOffset),score:score,sessions:5+(index*2+classOffset)%8,window:'近30天',updatedAt:'2026-09-20 20:10',dimensions:dims,summary:'近期对话覆盖学习、同伴、家庭和日常感受，整体状态相对稳定，仍需结合后续变化持续观察。',evidence:['对话主题覆盖多个生活场景','各维度来自近30天连续表达的综合分析','当前结论仍需结合老师观察'],demo:true};
 if(f)Object.assign(item,f);
 item.level=levelOf(item.score).key;
 item.trend=makeTrend(item.score,index+classOffset);
 item.dimensionTrend=item.dimensions.map(function(v,di){return makeTrend(v,index+classOffset+di*2)});
 return item;
}
var rows=[];[['demo-class-7a',12],['demo-class-7b',10],['demo-class-8a',11]].forEach(function(pair,ci){for(var i=1;i<=pair[1];i++)rows.push(make(pair[0]+'-student-'+i,pair[0],i,ci*3))});
function normalizedRows(){var students=[],classes=[];try{students=JSON.parse(localStorage.getItem('yunting-class-students-v1')||'[]');classes=JSON.parse(localStorage.getItem('yunting-class-groups-v1')||'[]')}catch(e){}return rows.map(function(item){var student=students.find(function(x){return String(x.id)===String(item.studentId)});if(!student)return Object.assign({},item);var group=classes.find(function(x){return String(x.id)===String(student.classId)});return Object.assign({},item,{classId:student.classId||item.classId,className:group?((group.grade?group.grade+' · ':'')+group.name):item.className,studentName:student.name||item.studentName,gender:student.gender||item.gender})})}
function all(){return normalizedRows()}
function byStudent(id){return all().find(function(x){return String(x.studentId)===String(id)})||null}
function byClass(id){return all().filter(function(x){return String(x.classId)===String(id)})}
function filterGender(list,gender){return !gender||gender==='all'?list:list.filter(function(x){return x.gender===gender})}
function levelDistribution(list){return LEVELS.map(function(level){var count=list.filter(function(x){return x.level===level.key}).length;return{key:level.key,label:level.label,color:level.color,count:count,percent:list.length?Math.round(count/list.length*1000)/10:0}})}
function riskOf(item){return item.level==='priority'?'high':item.level==='attention'?'medium':'low'}
function riskLabel(r){return r==='high'?'重点关注':r==='medium'?'需要关注':'持续观察'}
function riskRank(r){return r==='high'?3:r==='medium'?2:1}
function dataSufficiency(item){var sessions=Number(item&&item.sessions)||0,evidence=Array.isArray(item&&item.evidence)?item.evidence.length:0;if(sessions>=9&&evidence>=3)return{key:'enough',label:'较充分',detail:sessions+'次对话 · '+evidence+'条分析依据'};if(sessions>=6&&evidence>=2)return{key:'normal',label:'一般',detail:sessions+'次对话 · '+evidence+'条分析依据'};return{key:'limited',label:'有限',detail:sessions+'次对话 · '+evidence+'条分析依据'}}
function dimensionSummary(list){list=list||all();return DIMENSIONS.map(function(name,i){var allScore=average(list.map(function(x){return x.dimensions[i]})),boys=filterGender(list,'男'),girls=filterGender(list,'女');return{name:name,score:allScore,boys:average(boys.map(function(x){return x.dimensions[i]})),girls:average(girls.map(function(x){return x.dimensions[i]}))}})}
function monthlyOverall(list,gender){list=filterGender(list||all(),gender);return MONTHS.map(function(label,i){return{label:label,score:average(list.map(function(x){return x.trend[i]})),count:list.length}})}
function monthlyDimensions(list,gender){list=filterGender(list||all(),gender);return DIMENSIONS.map(function(name,di){return{name:name,values:MONTHS.map(function(_,mi){return average(list.map(function(x){return x.dimensionTrend[di][mi]}))})}})}
function classSummary(){return Object.keys(CLASS_NAMES).map(function(id){var list=byClass(id),dist=levelDistribution(list);return{id:id,name:CLASS_NAMES[id],count:list.length,score:average(list.map(function(x){return x.score})),distribution:dist,priority:dist.find(function(x){return x.key==='priority'}).count,attention:dist.find(function(x){return x.key==='attention'}).count,dialogues:list.reduce(function(a,x){return a+x.sessions},0)}})}
function trend(){var list=all();return monthlyOverall(list,'all').map(function(x,i){var d=levelDistribution(list);return{label:x.label,score:x.score,high:i<3?2:1,medium:i<2?5:4}})}
global.YTPsychInsights={mode:'demo',dimensions:DIMENSIONS,months:MONTHS,levels:LEVELS,all:all,byStudent:byStudent,byClass:byClass,filterGender:filterGender,levelOf:levelOf,levelDistribution:levelDistribution,riskOf:riskOf,riskLabel:riskLabel,riskRank:riskRank,dataSufficiency:dataSufficiency,classSummary:classSummary,trend:trend,dimensionSummary:dimensionSummary,monthlyOverall:monthlyOverall,monthlyDimensions:monthlyDimensions,average:average,updatedAt:'2026-09-20 20:10',window:'近30天'};
})(window);
