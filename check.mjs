import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {root,loadNotes,validateNote} from './scripts/content.mjs';
import {ingest,saveDraft,extractHTML,publicURL} from './scripts/ingest.mjs';
const notes=await loadNotes();assert.ok(notes.length>=0);
const html=await fs.readFile(path.join(root,'dist/index.html'),'utf8');
assert.match(html,/我的学习库/);assert.doesNotMatch(html,/\/api\/|API Key|id="import-dialog"|data-edit=|data-delete=|data-favorite=/);
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(script);
const embedded=vm.runInNewContext(script.slice(0,script.indexOf(';\n'))+';LIBRARY_DATA');assert.equal(embedded.length,notes.length);
assert.equal(await fs.readFile(path.join(root,'dist/.nojekyll'),'utf8'),'');
for(const n of notes)for(const image of n.images){assert.equal(new URL(image,'https://example.github.io/learning/').pathname,'/learning/'+image);await fs.access(path.join(root,'dist',image));}
assert.throws(()=>validateNote({...notes[0],category:'其他'}));assert.throws(()=>validateNote({...notes[0],images:['assets/../secret.png']}));
const hostile=JSON.stringify([{title:'</script><script>alert(1)</script>'}]).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');assert.doesNotMatch(hostile,/<\/script>/);assert.match(JSON.parse(hostile)[0].title,/<script>/);
assert.equal(extractHTML('<title>例子</title><article><p>内容</p><img src="figure.png"></article><script>bad</script>').text,'内容');
for(const url of ['file:///a','http://127.0.0.1','https://host.local','https://user:pass@example.com'])assert.throws(()=>publicURL(url));
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'zhixu-test-'));
const originalFetch=globalThis.fetch;
try{
 await fs.mkdir(path.join(temp,'source'));await fs.writeFile(path.join(temp,'source/figure.png'),Buffer.from('png-test'));
 const file=path.join(temp,'source/article.md');await fs.writeFile(file,'# 测试文章\n正文：理解工具调用。\n![配图](figure.png)');
 let result=await ingest(file,{keepImages:true,base:temp});assert.equal(result.draft.images.length,1);assert.match(await fs.readFile(path.join(result.folder,'source.txt'),'utf8'),/理解工具调用/);assert.throws(()=>validateNote(result.draft));
 await assert.rejects(()=>fs.access(path.join(temp,'content',result.draft.images[0])));await fs.access(path.join(result.folder,'assets',path.basename(result.draft.images[0])));
 const draft={...result.draft,title:'工具调用入门',summary:'理解参数校验。',category:'Agent 开发',tags:['工具调用'],points:[{title:'先校验再执行',body:'工具收到参数后需要检查格式。'}]};
 const draftPath=path.join(result.folder,'draft.json');await fs.writeFile(draftPath,JSON.stringify(draft));await saveDraft(draftPath,{base:temp});assert.equal((await loadNotes(temp)).length,1);
 assert.equal((await ingest(file,{keepImages:true,base:temp})).draft.summary,'理解参数校验。');
 await assert.rejects(()=>saveDraft(draftPath,{base:temp}),/EEXIST/);
 await saveDraft(draftPath,{base:temp,replace:true});assert.equal((await loadNotes(temp))[0].created,draft.created);
 globalThis.fetch=async url=>new URL(url).pathname==='/image.png'?new Response(Buffer.from('image'),{headers:{'Content-Type':'image/png'}}):new Response('<title>链接测试</title><article><p>链接正文，供 Codex 阅读整理。</p><img src="/image.png"></article>',{headers:{'Content-Type':'text/html'}});
 result=await ingest('https://example.com/article',{keepImages:true,base:temp});assert.equal(result.draft.source,'https://example.com/article');assert.equal(result.draft.images.length,1);assert.equal(result.draft.sourceTitle,'链接测试');
 console.log('Passed: static output, embedded script, schema, subpath assets, local file/image ingestion, mocked link/image ingestion, draft save and update.');
}finally{globalThis.fetch=originalFetch;const resolved=path.resolve(temp);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('zhixu-test-'));await fs.rm(resolved,{recursive:true,force:true});}
