// Calendar-day intervals from the previous completed review (local browser time).
export const LearningCore=(()=>{
 const intervals=[1,2,4,7,15,30];
 const validTime=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
 function validate(r){
  if(!r||r.version!==1||!Array.isArray(r.reads)||!Array.isArray(r.reviews)||r.reviews.length>intervals.length||!r.reads.every(validTime)||!r.reviews.every(validTime))throw Error('invalid');
  if(r.reviews.length&&!r.reads.length)throw Error('invalid');
  for(const list of [r.reads,r.reviews])for(let i=1;i<list.length;i++)if(Date.parse(list[i])<Date.parse(list[i-1]))throw Error('invalid');
  if(r.reviews.length&&Date.parse(r.reviews[0])<Date.parse(r.reads[0]))throw Error('invalid');
  return r;
 }
 function due(r){if(!r.reads.length||r.reviews.length===intervals.length)return null;const d=new Date(r.reviews.at(-1)||r.reads[0]);d.setDate(d.getDate()+intervals[r.reviews.length]);return d.toISOString();}
 function status(r,now=new Date()){const next=due(r);return !r.reads.length?'未阅读':!next?'本轮完成':Date.parse(next)<=+now?'待复习':'计划中';}
 function createStore(storage,key){
  let record={version:1,reads:[],reviews:[]},warning='',temporary=false;
  try{const raw=storage.getItem(key);if(raw!==null)record=validate(JSON.parse(raw));}catch{temporary=true;warning='阅读存储不可用或数据损坏：本页新增记录仅临时保存，刷新后可能丢失；原存储未被覆盖。';}
  function save(){if(temporary)return;try{storage.setItem(key,JSON.stringify(record));warning='';}catch{temporary=true;warning='阅读记录仅临时保存在本页：浏览器存储不可用或空间不足，刷新后可能丢失。';}}
  return {get record(){return record;},get warning(){return warning;},read(now=new Date()){const stamp=now.toISOString();if(record.reads.length&&stamp<record.reads.at(-1))return false;record.reads.push(stamp);save();return true;},review(now=new Date()){if(status(record,now)!=='待复习')return false;record.reviews.push(now.toISOString());save();return true;}};
 }
 return {intervals,due,status,createStore};
})();
