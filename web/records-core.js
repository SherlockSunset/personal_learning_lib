export const RecordsCore=(()=>{
 function collect(getStorage,snapshots,notes,now=new Date()){
  const warnings=[],storage={localStorage:[],sessionStorage:[]};
  for(const name of Object.keys(storage))try{const target=getStorage(name);for(let i=0;i<target.length;i++){const key=target.key(i);if(key?.startsWith('zhixu-'))storage[name].push({key,value:target.getItem(key)});}}catch{warnings.push(name+' 读取不完整或不可用，已附上可获取的页面临时记录。');}
  return {format:'zhixu-local-records',version:1,exportedAt:now.toISOString(),scope:'当前浏览器此来源下所有 zhixu- 开头的学习记录；不包含其他站点、HTTP 图片缓存或已被清除的数据。',notes:notes.map(n=>({id:n.id,title:n.title})),storage,memoryRecords:snapshots,warnings:[...warnings,...snapshots.filter(s=>s.warning).map(s=>s.key+'：'+s.warning)]};
 }
 return {collect};
})();
