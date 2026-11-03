/* Opt-in review fixtures only. Never changes existing records or owner classes. */
(function(g){'use strict';if(new URLSearchParams(location.search).get('classPreview')!=='demo')return;
g.YTSeedDemo?.ensure();let cs=JSON.parse(localStorage.getItem('yunting-class-groups-v1')||'[]'),c=cs.find(x=>x.id==='demo-class-7a'&&x.demo===true);if(!c)return;
let now=Date.now(),base={classId:c.id,classIds:[c.id],className:c.grade+' · '+c.name,grade:c.grade,courseType:'syllabus',progressMode:'teacher',duration:45,expectedStudents:12,demo:true,previewFixture:true};
function append(key,entries){let rows=JSON.parse(localStorage.getItem(key)||'[]');entries.forEach(x=>{if(!rows.some(r=>(r.sessionId||r.id)===(x.sessionId||x.id)))rows.push(x)});localStorage.setItem(key,JSON.stringify(rows))}
append('yunting-class-records-v1',[{...base,sessionId:'class-preview-demo-completed-01',courseId:'lesson-01',title:'走进初中，拥抱新起点',at:now-172800000,endedAt:now-170100000,completedAt:now-170100000,completionStatus:'completed',completed:true,status:'已完成'}]);

g.YTClassPreviewDemo=true;
})(window);
