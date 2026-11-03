/* Shared listening presentation; per-course audio overrides remain independent. */
(function(g){'use strict';
 var scriptBase=document.currentScript.src;
 function url(path){return new URL(path,scriptBase).href;}
 var defaultTrack={title:'心理能量成长训练',subtitle:'',durationLabel:'05:16',src:url('../audio/energy/user-supplied-r113.mp3')};
 var defaultCompanion={src:url('../video/cloud-loop-r116-alpha.webm'),poster:url('../assets/cloud-loop-r116-poster.png'),transparent:true,width:700,height:632,animatedFallback:url('../assets/cloud-loop-r116-fallback.webp')};
 function copy(value){return JSON.parse(JSON.stringify(value));}
 function apply(course){
  if(!course||!course.stages)return course;
  var energy=course.stages.energy||(course.stages.energy={});
  // An explicitly configured audio keeps its own title, duration and source.
  // Empty syllabus/theme placeholders inherit the shared default recording.
  if(!energy.track||!String(energy.track.src||'').trim()){
   energy.track=copy(defaultTrack);energy.track.id=course.id+'-energy';
  }
  // Cloud accompaniment is presentation, independent of the selected recording.
  energy.companionVideo=copy(defaultCompanion);
  return course;
 }
 g.YTCourseMedia={apply:apply,defaultTrack:copy(defaultTrack),companion:copy(defaultCompanion)};
 (g.COURSE_REGISTRY||[]).forEach(apply);
})(window);
