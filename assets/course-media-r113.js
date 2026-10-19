/* User-supplied media, applied after course registration; no cross-course inheritance. */
(function(g){'use strict';
 var course=(g.COURSE_REGISTRY||[]).find(function(c){return c.id==='lesson-01'});
 if(!course||!course.stages||!course.stages.energy)return;
 course.stages.energy.track={
  id:'lesson-01-energy',
  title:'心理能量成长训练',
  subtitle:'',
  durationLabel:'05:16',
  src:new URL('../audio/energy/user-supplied-r113.mp3',document.currentScript.src).href
 };
course.stages.energy.companionVideo={src:new URL('../video/cloud-loop-r116-alpha.webm',document.currentScript.src).href,poster:new URL('../assets/cloud-loop-r116-poster.png',document.currentScript.src).href,transparent:true,width:700,height:632,animatedFallback:new URL('../assets/cloud-loop-r116-fallback.webp',document.currentScript.src).href};
})(window);
