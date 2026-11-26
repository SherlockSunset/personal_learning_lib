const AnnotationUI=(()=>{
 const stores=new Map(),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let current=null,pending=null,editing=null,returnFocus=null;
 const toolbar=document.createElement('div');toolbar.className='annotation-selection';toolbar.hidden=true;toolbar.innerHTML='<span>选中文字</span><button type="button" data-annotation="highlight">划线</button><button type="button" data-annotation="note">添加备注</button><button type="button" data-annotation="dismiss">取消</button>';document.body.append(toolbar);
 const dialog=document.createElement('dialog');dialog.className='annotation-dialog';dialog.setAttribute('aria-label','文章标注与备注');document.body.append(dialog);
 function store(id){if(!stores.has(id)){let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error();}};}stores.set(id,AnnotationCore.createStore(storage,id));}return stores.get(id);}
 function message(text){const el=document.getElementById('annotation-status');if(el)el.textContent=text;}
 function blocks(){return [...document.querySelectorAll('#detail .point[id] .point-body p, #detail .point[id] .point-body pre code')].filter(el=>!el.closest('figure'));}
 function render(){if(!current)return;const s=store(current.id),items=s.record.items;document.querySelectorAll('#detail .annotation-pin').forEach(el=>el.remove());let placed=0;
  for(const el of blocks()){
   const text=el.textContent;el.replaceChildren(document.createTextNode(text));
   const matches=items.filter(a=>a.mode===current.mode&&a.section===el.dataset.annotationSection&&a.block===Number(el.dataset.annotationBlock)).map(a=>({a,start:AnnotationCore.locate(text,a)})).filter(x=>x.start>=0).sort((a,b)=>a.start-b.start);
   let end=0;const fragment=document.createDocumentFragment();for(const {a,start} of matches){if(start<end)continue;fragment.append(document.createTextNode(text.slice(end,start)));const mark=document.createElement('mark');mark.className='article-highlight';mark.dataset.annotationId=a.id;mark.tabIndex=0;mark.setAttribute('role','button');mark.setAttribute('aria-label',a.note?'查看备注：'+a.note:'查看划线');mark.textContent=a.quote;fragment.append(mark);end=start+a.quote.length;placed++;}
   fragment.append(document.createTextNode(text.slice(end)));el.replaceChildren(fragment);
   const notes=matches.filter(x=>x.a.note);if(notes.length){const pin=document.createElement('button');pin.type='button';pin.className='annotation-pin';pin.dataset.annotationId=notes[0].a.id;pin.textContent='备注 '+notes.length;pin.setAttribute('aria-label','展开此处备注');el.closest('pre')?.after(pin);if(!el.closest('pre'))el.after(pin);}
  }
  const count=document.getElementById('annotation-count');if(count)count.textContent=`本篇标注（${items.length}）`;
  message(s.warning||`选中同一段文字后可划线或添加备注。${items.filter(a=>a.mode===current.mode).length>placed?'部分标注暂未定位，请在本篇标注中查看原摘录。':''}`);
 }
 function mount(note,mode){toolbar.hidden=true;pending=null;if(dialog.open)dialog.close();current=mode==='quiz'?null:{id:note.id,mode};if(!current)return;
  const bar=document.createElement('div');bar.className='annotation-bar';bar.innerHTML='<button type="button" class="secondary" data-annotation="list" id="annotation-count"></button><span id="annotation-status" role="status"></span>';
  document.querySelector('#detail .detail-layout')?.before(bar);
  document.querySelectorAll('#detail .point[id]').forEach(section=>{let index=0;section.querySelectorAll('.point-body p,.point-body pre code').forEach(el=>{if(el.closest('figure'))return;el.dataset.annotationSection=section.id;el.dataset.annotationBlock=index++;});});render();
 }
 function capture(){if(!current||dialog.open)return;const selection=window.getSelection();if(!selection||selection.isCollapsed){toolbar.hidden=true;return;}if(!selection.rangeCount)return;const range=selection.getRangeAt(0),element=node=>node.nodeType===1?node:node.parentElement;
  const first=element(range.startContainer)?.closest('[data-annotation-block]'),last=element(range.endContainer)?.closest('[data-annotation-block]');
  if(!first||first!==last||!first.closest('#detail')||!range.toString().trim()){toolbar.hidden=true;return;}
  const before=range.cloneRange();before.selectNodeContents(first);before.setEnd(range.startContainer,range.startOffset);const start=before.toString().length,end=start+range.toString().length;
  pending={mode:current.mode,section:first.dataset.annotationSection,block:Number(first.dataset.annotationBlock),...AnnotationCore.anchor(first.textContent,start,end),note:''};toolbar.hidden=false;
 }
 function show(id=null){if(!current)return;returnFocus=document.activeElement;editing=id;const s=store(current.id),a=s.record.items.find(a=>a.id===id);
  dialog.innerHTML=`<div class="annotation-dialog-heading"><h2>${a?'划线与备注':id==='new'?'添加备注':'本篇标注'}</h2><button type="button" class="secondary" data-annotation="close">关闭</button></div>${s.warning?'<p class="learning-warning">'+E(s.warning)+'</p>':''}`;
  if(a||id==='new')dialog.innerHTML+=`<blockquote>${E(a?.quote||pending?.quote)}</blockquote><label>备注<textarea id="annotation-note" rows="5" maxlength="6000" placeholder="记录自己的理解、疑问或例子…">${E(a?.note||'')}</textarea></label><div class="annotation-actions"><button type="button" class="primary" data-annotation="save">保存备注</button>${a?'<button type="button" class="secondary" data-annotation="remove">删除此标注</button>':''}</div>`;
  else dialog.innerHTML+=s.record.items.length?s.record.items.map(a=>`<div class="annotation-list-item"><small>${a.mode==='points'?'知识提要':'详细讲解'} · ${E(new Date(a.updated).toLocaleString('zh-CN'))}</small><blockquote>${E(a.quote)}</blockquote>${a.note?'<p>'+E(a.note)+'</p>':''}<button type="button" class="secondary" data-annotation-id="${E(a.id)}">查看 / 编辑</button><a class="secondary" href="#note/${encodeURIComponent(current.id)}/${a.mode}/${encodeURIComponent(a.section.replace(/^section-/,''))}" data-annotation="jump">回读章节</a></div>`).join(''):'<p>暂无标注。选中文章中同一段文字后，即可划线或添加备注。</p>';
  toolbar.hidden=true;if(!dialog.open)dialog.showModal();if(a||id==='new')dialog.querySelector('textarea').focus();
 }
 function overlaps(a){return store(current.id).record.items.some(b=>{if(a.mode!==b.mode||a.section!==b.section||a.block!==b.block)return false;const el=blocks().find(el=>el.dataset.annotationSection===a.section&&Number(el.dataset.annotationBlock)===a.block);const start=el?AnnotationCore.locate(el.textContent,b):-1;return start>=0&&a.start<start+b.quote.length&&start<a.start+a.quote.length;});}
 function add(note){if(!pending||!current)return false;if(overlaps(pending)){message('选区与已有划线重叠，请点击已有划线编辑备注，或重新选择文字。');return false;}store(current.id).add({...pending,note});pending=null;window.getSelection()?.removeAllRanges();render();return true;}
 document.addEventListener('selectionchange',()=>{clearTimeout(capture.timer);capture.timer=setTimeout(capture,120);});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-annotation],[data-annotation-id]');if(!b)return;if(b.dataset.annotationId){show(b.dataset.annotationId);return;}const action=b.dataset.annotation;
  if(action==='highlight'){add('');toolbar.hidden=true;}else if(action==='note')show('new');else if(action==='list')show();else if(action==='save'){const note=dialog.querySelector('textarea').value;if(editing==='new'){if(!add(note)){dialog.close();return;}}else{store(current.id).edit(editing,note);render();}dialog.close();}else if(action==='remove'){store(current.id).remove(editing);render();dialog.close();}else if(action==='close'||action==='jump')dialog.close();else if(action==='dismiss'){toolbar.hidden=true;pending=null;window.getSelection()?.removeAllRanges();}});
 document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('mark[data-annotation-id]')){e.preventDefault();show(e.target.dataset.annotationId);}if(e.key==='Escape')toolbar.hidden=true;});
 document.addEventListener('click',e=>{const link=e.target.closest('[data-annotation="jump"]');if(!link||link.getAttribute('href')!==location.hash)return;e.preventDefault();const section=decodeURIComponent(location.hash.split('/')[3]||'');const target=document.getElementById('section-'+section)||document.getElementById(section);target?.scrollIntoView({block:'start',behavior:'smooth'});target?.querySelector('h2')?.focus({preventScroll:true});});
 dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus();});
 return {mount,snapshot:()=>[...stores].map(([id,s])=>({key:AnnotationCore.key(id),record:s.record,warning:s.warning}))};
})();
