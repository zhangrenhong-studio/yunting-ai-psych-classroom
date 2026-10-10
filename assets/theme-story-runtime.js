/* Apply the confirmed, immutable story snapshot to an existing compatible classroom package. */
(function(g){'use strict';
var q=new URLSearchParams(location.search),s=g.YTClassroomDemo&&g.YTClassroomDemo.read(),d=s&&s.themeStorySnapshot;
if(q.get('mode')!=='classroom'||!d||!d.confirmed||q.get('session')!==s.sessionId||q.get('id')!==s.courseId)return;
var reg=g.COURSE_REGISTRY||[],index=reg.findIndex(function(c){return c.id===s.courseId});if(index<0)return;
var c=JSON.parse(JSON.stringify(reg[index]));c.title=d.title;c.stages.enter.title=d.title;
var paragraphs=d.story.split(/\n\s*\n|\n/).map(function(t){return t.trim()}).filter(Boolean),beats=[];
paragraphs.forEach(function(p){if(p.length<=260){beats.push(p);return}var chunks=p.match(/[^。！？]+[。！？]?/g)||[p],buf='';chunks.forEach(function(t){if(buf.length+t.length>260&&buf){beats.push(buf);buf=''}while(t.length>260){if(buf){beats.push(buf);buf=''}beats.push(t.slice(0,260));t=t.slice(260)}buf+=t});if(buf)beats.push(buf)});
c.stages.story.frameLabel=d.title;c.stages.story.bookTitle=d.title;c.stages.story.bookNote='老师确认的故事 · 先读情境，再慢慢聊聊';c.stages.story.companionLine='可以先理解故事人物，不必讲自己的经历。';c.stages.story.beats=beats.map(function(text,i){return{id:'theme-beat-'+i,scene:'故事 · '+(i+1)+' / '+beats.length,text:text}});c.stages.story.prompt.text=d.lead;c.stages.story.prompt.placeholder='可以只聊故事人物，也可以暂时不写。';
c.stages.talk.opening=['刚才我们一起读了这段故事。',d.lead];c.stages.talk.nodes[0].say=['我听见你刚才提到「{{storyEcho}}」。','我们可以先从故事人物的感受聊起。'];c.stages.talk.nodes[1].say=['在这个情境里，你最想先理解哪一部分？如果愿意，也可以聊聊自己的经历。'];
reg[index]=c;
})(window);
