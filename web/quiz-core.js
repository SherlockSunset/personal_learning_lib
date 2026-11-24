// Shared pure quiz rules: imported by Node validation/tests and embedded in the
// static browser bundle. No network or account storage.
export const QuizCore=(()=>{
 const clone=x=>JSON.parse(JSON.stringify(x));
 const slug=s=>typeof s==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
 function validate(quiz,note){
  const fail=m=>{throw Error((quiz?.noteId||'quiz')+': '+m);};
  if(!quiz||quiz.noteId!==note.id||!Number.isInteger(quiz.version)||quiz.version<1||!Array.isArray(quiz.questions)||!quiz.questions.length)fail('题库需要匹配文章、正整数版本和题目');
  const concepts=note.points.filter(p=>p.assessable!==false);if(concepts.some(p=>!slug(p.id)))fail('考核知识点必须具有稳定 id');
  const conceptIds=new Set(concepts.map(p=>p.id)),sections=new Set((note.explanations||note.points).map(p=>p.id));const questionIds=new Set(),covered=new Set();
  for(const q of quiz.questions){
   if(!slug(q.id)||questionIds.has(q.id))fail('题目 id 无效或重复');questionIds.add(q.id);
   if(!['true_false','single_choice','short_answer'].includes(q.type)||typeof q.prompt!=='string'||!q.prompt.trim()||typeof q.explanation!=='string'||!q.explanation.trim())fail(q.id+' 缺少题型、题干或解析');
   if(!['理解','辨析','应用'].includes(q.level))fail(q.id+' 缺少考核层次');
   if(!Array.isArray(q.knowledgeIds)||!q.knowledgeIds.length||q.knowledgeIds.some(id=>!conceptIds.has(id)))fail(q.id+' 知识点关联无效');q.knowledgeIds.forEach(id=>covered.add(id));
   if(!Array.isArray(q.reviewSectionIds)||!q.reviewSectionIds.length||q.reviewSectionIds.some(id=>!slug(id)||!sections.has(id)))fail(q.id+' 回读章节不存在');
   if(q.type==='true_false'&&typeof q.answer!=='boolean')fail(q.id+' 判断题答案必须是布尔值');
   if(q.type==='single_choice'){
    if(!Array.isArray(q.options)||q.options.length<3||q.options.length>6)fail(q.id+' 单选题需 3–6 个选项');
    const ids=new Set();for(const o of q.options){if(!slug(o.id)||ids.has(o.id)||typeof o.text!=='string'||!o.text.trim()||typeof o.explanation!=='string'||!o.explanation.trim())fail(q.id+' 选项需要独立 id、内容和解释');ids.add(o.id);}if(!ids.has(q.answer))fail(q.id+' 正确选项不存在');
   }
   if(q.type==='short_answer'){
    if(typeof q.referenceAnswer!=='string'||!q.referenceAnswer.trim()||!Array.isArray(q.rubric)||!q.rubric.length)fail(q.id+' 简答题需要参考答案和评分要点');
    const ids=new Set();for(const r of q.rubric){if(!slug(r.id)||ids.has(r.id)||typeof r.text!=='string'||!r.text.trim()||!Number.isInteger(r.points)||r.points<1||r.points>5)fail(q.id+' 评分要点格式无效');ids.add(r.id);}
   }
  }
  const missing=concepts.filter(p=>!covered.has(p.id));if(missing.length)fail('题库未覆盖知识点：'+missing.map(p=>p.title).join('、'));
  if(new Set(quiz.questions.map(q=>q.type)).size!==3)fail('配套题库需要同时包含判断、单选和简答题');
  return {covered:covered.size,total:concepts.length,questions:quiz.questions.length};
 }
 function fingerprint(quiz){let hash=2166136261;for(const c of JSON.stringify(quiz)){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return quiz.version+'-'+(hash>>>0).toString(16);}
 function answered(q,response){if(q.type==='short_answer')return typeof response?.text==='string'&&!!response.text.trim();if(q.type==='true_false')return typeof response?.value==='boolean';return q.options.some(o=>o.id===response?.value);}
 function grade(q,response={}){
  if(q.type==='short_answer'){
   const possible=q.rubric.reduce((s,r)=>s+r.points,0);if(!response.selfGraded)return {graded:false,earned:0,possible,ratio:null};
   const checked=new Set(response.rubricIds||[]);const earned=answered(q,response)?q.rubric.reduce((s,r)=>s+(checked.has(r.id)?r.points:0),0):0;return {graded:true,earned,possible,ratio:earned/possible};
  }
  const earned=answered(q,response)&&response.value===q.answer?1:0;return {graded:true,earned,possible:1,ratio:earned};
 }
 function summarize(attempt){
  const results=attempt.questions.map(q=>({id:q.id,type:q.type,...grade(q,attempt.responses[q.id])}));const pending=results.filter(r=>!r.graded).length;const objective=results.filter(r=>r.type!=='short_answer');
  return {results,pending,objectiveCorrect:objective.reduce((s,r)=>s+r.earned,0),objectiveTotal:objective.length,score:pending?null:Math.round(100*results.reduce((s,r)=>s+r.ratio,0)/Math.max(1,results.length)),count:results.length};
 }
 function currentAttempts(record,quiz){const fp=fingerprint(quiz);return record.attempts.filter(a=>a.fingerprint===fp);}
 function evidence(record,quiz){const result={};for(const a of currentAttempts(record,quiz).slice().sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt))){for(const q of a.questions){if(!result[q.id])result[q.id]={...grade(q,a.responses[q.id]),uncertain:!!a.responses[q.id]?.uncertain};}}return result;}
 function weakIds(record,quiz){const e=evidence(record,quiz);return quiz.questions.filter(q=>e[q.id]?.graded&&(e[q.id].ratio<1||e[q.id].uncertain)).map(q=>q.id);}
 function coverage(note,quiz,record){const e=evidence(record,quiz);return note.points.filter(p=>p.assessable!==false).map(p=>{
  const related=quiz.questions.filter(q=>q.knowledgeIds.includes(p.id));const seen=related.filter(q=>e[q.id]);const pending=seen.some(q=>!e[q.id].graded);const weak=seen.some(q=>e[q.id].graded&&(e[q.id].ratio<1||e[q.id].uncertain));
  const status=!related.length?'未覆盖':!seen.length?'未作答':pending?'待自评':weak?'需巩固':seen.length<related.length?'证据不足':'本次掌握';
  return {id:p.id,title:p.title,total:related.length,answered:seen.length,status};
 });}
 function makeDraft(quiz,ids=quiz.questions.map(q=>q.id),mode='all'){
  const allowed=new Set(quiz.questions.map(q=>q.id));const questionIds=[...new Set(ids)].filter(id=>allowed.has(id));if(!questionIds.length)throw Error('没有可练习的题目');
  return {fingerprint:fingerprint(quiz),questionIds,mode,startedAt:new Date().toISOString(),responses:{}};
 }
 function submit(quiz,draft){
  if(draft.fingerprint!==fingerprint(quiz))throw Error('题库已变化，请开始新版练习');
  const questions=draft.questionIds.map(id=>quiz.questions.find(q=>q.id===id));if(questions.some(q=>!q))throw Error('题目不存在');
  if(questions.some(q=>!answered(q,draft.responses[q.id])))throw Error('请先完成全部题目；不确定时可以勾选标记');
  return {id:globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2),version:quiz.version,fingerprint:draft.fingerprint,mode:draft.mode,startedAt:draft.startedAt,submittedAt:new Date().toISOString(),questions:clone(questions),responses:clone(draft.responses)};
 }
 function createStore(storage,key){
  let record={schemaVersion:1,draft:null,attempts:[]},warning='',lastStoredText=null;
  try{const text=storage.getItem(key);lastStoredText=text;if(text){const value=JSON.parse(text);if(value.schemaVersion!==1||!Array.isArray(value.attempts)||value.attempts.some(a=>!a||typeof a.id!=='string'||typeof a.fingerprint!=='string'||typeof a.submittedAt!=='string'||!Array.isArray(a.questions)||!a.questions.length||!a.responses||a.questions.some(q=>!q||typeof q.prompt!=='string'||typeof q.explanation!=='string'||!Array.isArray(q.knowledgeIds)||!Array.isArray(q.reviewSectionIds)||!['true_false','single_choice','short_answer'].includes(q.type)||(q.type==='short_answer'&&!Array.isArray(q.rubric))||(q.type==='single_choice'&&!Array.isArray(q.options))))||value.draft&&(!Array.isArray(value.draft.questionIds)||!value.draft.responses||typeof value.draft.fingerprint!=='string'))throw Error('invalid records');record=value;}}
  catch{warning='浏览器存储不可用或记录格式异常，当前仅临时保存；已有存储值不会被覆盖。';}
  return {get record(){return record;},get warning(){return warning;},save(next){record=clone(next);record.attempts=record.attempts.slice(0,30);if(warning)return false;try{if(storage.getItem(key)!==lastStoredText){warning='其他标签页已更新学习记录，本页改为临时保存以避免覆盖。请刷新读取最新记录。';return false;}const serialized=JSON.stringify(record);storage.setItem(key,serialized);lastStoredText=serialized;return true;}catch{warning='本地存储写入失败，当前改动只保留在本页面，刷新后可能丢失。';return false;}}};
 }
 return {validate,fingerprint,answered,grade,summarize,currentAttempts,evidence,weakIds,coverage,makeDraft,submit,createStore};
})();
