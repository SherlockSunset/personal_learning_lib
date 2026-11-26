const RecordsUI=(()=>{
 const button=document.createElement('button');button.type='button';button.className='secondary records-export';button.textContent='导出学习记录';document.querySelector('.header-right').prepend(button);
 const dialog=document.createElement('dialog');dialog.className='annotation-dialog';dialog.setAttribute('aria-label','导出全部学习记录');document.body.append(dialog);
 button.addEventListener('click',()=>{dialog.innerHTML='<div class="annotation-dialog-heading"><h2>导出全部学习记录</h2><button type="button" class="secondary" data-records-close>关闭</button></div><p>导出此浏览器中所有文章的阅读与复习记录、答题草稿、历史成绩、自评、划线和备注。包含已下架文章的缓存与当前页面临时保存的记录。</p><p class="learning-help">JSON 文件保留原始存储值和页面中的记录快照。答题历史仅能导出当前保留的最近 30 次。不同设备或网站地址的记录需要分别导出。导出不会清除记录。</p><button type="button" class="primary" data-records-download>下载 JSON 备份</button><p data-records-status role="status"></p>';dialog.showModal();});
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-records-close]'))dialog.close();if(!e.target.closest('[data-records-download]'))return;const status=dialog.querySelector('[data-records-status]');try{
  const data=RecordsCore.collect(name=>window[name],[...LearningUI.snapshot(),...QuizUI.snapshot(),...AnnotationUI.snapshot()],LIBRARY_DATA);
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='zhixu-records-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  status.textContent='已发起下载，请在浏览器下载列表确认。'+(data.warnings.length?' 部分记录仅临时保存或存储读取受限，备份中的 warnings 字段已说明；可获取的临时记录已包含。':' 已包含所有可读取的本站本地记录。');
 }catch{status.textContent='导出失败，记录仍保留在本页，请重试；不要刷新以免丢失临时记录。';}});
 dialog.addEventListener('close',()=>button.focus());
 return {};
})();
