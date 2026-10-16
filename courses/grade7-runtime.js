/* Build the eight supplied grade-seven introductions on the established six-stage engine. */
(function(g){'use strict';
var reg=g.COURSE_REGISTRY||[],template=reg.find(function(c){return c.id==='lesson-01'});if(!template)return;
(g.YT_GRADE7_CONTENT||[]).forEach(function(d){
var existing=reg.find(function(c){return c.id===d.id}),c=JSON.parse(JSON.stringify(existing||template));c.id=d.id;c.order=d.order;c.title=d.title;c.theme=d.unit;c.subtitle=d.headline;c.dimensions=d.dimensions;c.contentSource='用户提供《初中心理课 · 每节课开场页（含科普页）》';
c.stages.enter.eyebrow='七年级 · '+d.unit;c.stages.enter.title=d.title;c.stages.enter.subtitle=d.headline;c.stages.enter.opening='你好，我是小悦悦。'+d.headline+'今天我们先读一段故事，再一起感受和思考本节课的话题。';c.stages.enter.companionLine='可以慢慢想，也可以先安静听听。';c.stages.enter.audio=null;c.stages.enter.agreements=['这里没有标准答案，不必和别人比较。','你可以写一句、写几个字，说说你对故事的看法。','不要求公开自己的经历。','需要帮助时，可以选择课末的老师支持入口。'];
c.stages.story={frameLabel:d.storyTitle,bookTitle:d.storyTitle,bookNote:d.headline,companionLine:'一起读读故事里的这个瞬间。',beats:d.paragraphs.map(function(t,i){return {id:d.id+'-p'+i,scene:d.storyTitle,text:t}}),prompt:{id:d.id+'-story',text:d.lead,placeholder:'你会怎么想、怎么做？也可以只写几个字。',maxLen:500},knowledge:d.knowledge,narration:d.audio};
c.stages.talk.opening=['刚才我们读了《'+d.storyTitle+'》。',d.lead+'你可以只谈故事里的人，也可以聊聊自己的想法。'];c.stages.talk.nodes[0].say=['我听见你刚才提到「{{storyEcho}}」。','如果愿意，我们可以从你最在意的地方慢慢聊。'];var clarify=c.stages.talk.nodes[1];clarify.say=['在这个故事里，你最想理解的是哪种感受或哪件事？'];clarify.branches=[];clarify.replies={};var step=c.stages.talk.nodes[3];step.say=['联系今天的话题，如果只做一个很小的尝试，你愿意从什么开始？'];step.input.placeholder='可以从故事人物的角度回答，也可以谈自己的小行动。';step.branches=[];step.replies={};
c.stages.closing.ending=[d.knowledge.core,'谢谢你今天愿意停下来，看看自己的感受。'];c.stages.closing.outlets.forEach(function(o){if(o.id==='class')o.hint='围绕今天的话题，我想送给同学的一句话……'});c.stages.closing.audio=null;
// Retain the platform's existing energy and training capabilities; do not fabricate course music.
c.stages.energy.track.id=d.id+'-energy';c.stages.energy.track.title='本课心理能量音乐';
var index=reg.findIndex(function(x){return x.id===d.id});if(index<0)reg.push(c);else reg[index]=c;
});g.COURSE_REGISTRY=reg;
})(window);
