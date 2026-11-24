import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {root,loadNotes} from './scripts/content.mjs';
const notes=(await loadNotes()).map(n=>Object.fromEntries(['id','title','category','summary','tags','points','explanations','references','images','source','sourceTitle','created','updated','sample'].filter(k=>n[k]!==undefined).map(k=>[k,n[k]])));
const html=await fs.readFile(path.join(root,'web/index.html'),'utf8');
const css=await fs.readFile(path.join(root,'web/style.css'),'utf8');
const js=await fs.readFile(path.join(root,'web/app.js'),'utf8');
const serialized=JSON.stringify(notes).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const script='const LIBRARY_DATA='+serialized+';\n'+js;
new vm.Script(script);
const output=path.join(root,'dist');
// Only the fixed generated output is cleaned; content stays in content/.
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
await fs.writeFile(path.join(output,'index.html'),html.replace('/*__STYLE__*/',()=>css).replace('/*__APP__*/',()=>script));
await fs.writeFile(path.join(output,'.nojekyll'),'');
for(const image of new Set(notes.flatMap(n=>n.images))){const destination=path.join(output,image);await fs.mkdir(path.dirname(destination),{recursive:true});await fs.copyFile(path.join(root,'content',image),destination);}
console.log('Built GitHub Pages static site: '+notes.length+' notes → dist/');
