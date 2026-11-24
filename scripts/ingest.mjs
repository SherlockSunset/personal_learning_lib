import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {root,validateNote,getImagePaths} from './content.mjs';
export function publicURL(value){const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.hostname==='localhost'||u.hostname.includes(':')||/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)||/\.(local|internal|localhost)$/i.test(u.hostname)||!u.hostname.includes('.'))throw Error('仅接收公开 HTTP(S) 地址');return u;}
async function fetchPublic(value){let u=publicURL(value);for(let i=0;i<5;i++){const r=await fetch(u,{redirect:'manual',signal:AbortSignal.timeout(30000),headers:{'User-Agent':'ZhixuLearningLibrary/2.0'}});if([301,302,303,307,308].includes(r.status)){u=publicURL(new URL(r.headers.get('location'),u).href);continue;}if(!r.ok)throw Error('读取失败 HTTP '+r.status+'：'+u);return {response:r,url:u.href};}throw Error('重定向次数过多');}
async function bytes(response,max){const parts=[];let size=0;for await(const p of response.body){size+=p.length;if(size>max)throw Error('文件过大，最多 '+Math.round(max/1024/1024)+' MB');parts.push(p);}return Buffer.concat(parts);}
function decode(s){return s.replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(Number(n),1114111)));}
function plain(html){return decode(html.replace(/<[^>]*>/g,'')).trim();}
function attribute(tag,name){return decode((tag.match(new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'))||[]).slice(1).find(x=>x!==undefined)||'');}
export function extractHTML(html){
 const title=plain((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'');const clean=html.replace(/<(script|style|nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,'');const core=(clean.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)||[])[1]||(clean.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)||[])[1]||clean;
 const imageDetails=[];const seen=new Map();
 const marked=core.replace(/<img\b[^>]*>/gi,(tag,offset)=>{
  let ref=attribute(tag,'data-src')||attribute(tag,'src');if(!ref)ref=attribute(tag,'data-srcset')||attribute(tag,'srcset');if(!ref)return '';
  if(!attribute(tag,'src')&&!attribute(tag,'data-src'))ref=ref.split(',').at(-1).trim().split(/\s+/)[0];
  const width=Number(attribute(tag,'width')),height=Number(attribute(tag,'height'));if((width&&width<100)||(height&&height<70))return '';
  if(seen.has(ref))return '\n\n[原文配图 '+seen.get(ref)+']\n\n';
  const marker='IMG_'+String(imageDetails.length+1).padStart(3,'0');seen.set(ref,marker);
  const before=core.slice(0,offset);const headings=[...before.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)];
  const figureStart=before.lastIndexOf('<figure');const figureEnd=core.indexOf('</figure>',offset);let caption='';if(figureStart>=0&&figureStart>before.lastIndexOf('</figure>')&&figureEnd>=0)caption=plain((core.slice(figureStart,figureEnd).match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)||[])[1]||'');
  imageDetails.push({marker,ref,alt:attribute(tag,'alt'),caption,nearbyHeading:plain(headings.at(-1)?.[1]||'')});return '\n\n[原文配图 '+marker+']\n\n';
 });
 return {title,text:decode(marked.replace(/<\/(p|div|h[1-6]|li|pre|section)>/gi,'\n\n').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'')).replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,'\n\n').trim(),images:imageDetails.map(im=>im.ref),imageDetails};
}
export async function ingest(input,{keepImages=true,base=root}={}){
 let raw,source='',title='',imageRefs=[],imageDetails=[],mime='',file='';const remote=/^https?:\/\//i.test(input);
 if(remote){const {response,url}=await fetchPublic(input);source=url;mime=response.headers.get('content-type')||'';if(!/text\/(html|plain|markdown)/i.test(mime))throw Error('该链接不是文本网页，请使用本地 TXT、Markdown 或 HTML 文件');raw=(await bytes(response,5000000)).toString('utf8');}else{file=path.resolve(input);if((await fs.stat(file)).size>5000000)throw Error('原文文件最多 5 MB');if(!/\.(txt|md|markdown|html|htm)$/i.test(file))throw Error('CLI 支持 TXT、Markdown、HTML；其他格式请交给本地 Codex 提取正文');raw=await fs.readFile(file,'utf8');title=path.basename(file).replace(/\.[^.]+$/,'');}
 let text=raw;if(/text\/html/i.test(mime)||/\.html?$/i.test(file)){const d=extractHTML(raw);text=d.text;title=d.title||title;imageRefs=d.images;imageDetails=d.imageDetails;}else{const matches=[...raw.matchAll(/!\[([^\]]*)\]\(([^)\n]+)\)/g)];imageDetails=matches.map((m,i)=>({marker:'IMG_'+String(i+1).padStart(3,'0'),ref:m[2].replace(/\s+["'][\s\S]*$/,''),alt:m[1],caption:m[1],nearbyHeading:raw.slice(0,m.index).match(/^#{1,6}\s+.+$/gm)?.at(-1)?.replace(/^#+\s*/,'')||''}));imageRefs=imageDetails.map(im=>im.ref);}
 if(!text.trim())throw Error('未读取到正文');const hash=createHash('sha256').update(source||file).update(raw).digest('hex').slice(0,10);const id='note-'+hash;const folder=path.join(base,'inbox',id);await fs.mkdir(folder,{recursive:true});const images=[],warnings=[];
 if(keepImages)for(const [i,ref] of [...new Set(imageRefs)].slice(0,24).entries()){try{let data,ext;
 if(remote||/^https?:\/\//i.test(ref)){const target=remote?new URL(ref,source).href:ref;const {response}=await fetchPublic(target);const type=(response.headers.get('content-type')||'').split(';')[0];ext={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/gif':'.gif'}[type];if(!ext)throw Error('不支持此图片格式');data=await bytes(response,5000000);}else{if(/^[a-z]+:/i.test(ref)||path.isAbsolute(ref))throw Error('仅复制文章相对路径的图片');const articleDir=path.dirname(file);const local=await fs.realpath(path.resolve(articleDir,decodeURIComponent(ref)));const realDir=await fs.realpath(articleDir);if(!local.startsWith(realDir+path.sep))throw Error('图片超出文章所在目录');ext=path.extname(local).toLowerCase();if(!['.png','.jpg','.jpeg','.webp','.gif'].includes(ext))throw Error('不支持此图片格式');if((await fs.stat(local)).size>5000000)throw Error('图片最多 5 MB');data=await fs.readFile(local);}
 const digest=createHash('sha256').update(data).digest('hex').slice(0,12);const rel='assets/'+id+'/'+digest+ext;await fs.mkdir(path.join(folder,'assets'),{recursive:true});await fs.writeFile(path.join(folder,'assets',digest+ext),data);images.push(rel);for(const im of imageDetails.filter(x=>x.ref===ref)){im.localPath=rel;im.source=remote?new URL(ref,source).href:/^https?:\/\//i.test(ref)?ref:'';}
 }catch(e){warnings.push('图片 '+(i+1)+'：'+e.message);for(const im of imageDetails.filter(x=>x.ref===ref))im.error=e.message;}}
 if(keepImages&&new Set(imageRefs).size>24)warnings.push('正文超过 24 张图片，本次只抓取前 24 张；其余需按需补充。');
 const now=new Date().toISOString();let draft={id,title:title||'待 Codex 总结的文章',category:'Agent 开发',summary:'',tags:[],points:[],images,source,sourceTitle:title,created:now,updated:now};await fs.writeFile(path.join(folder,'source.txt'),text);
 try{await fs.writeFile(path.join(folder,'draft.json'),JSON.stringify(draft,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;draft=JSON.parse(await fs.readFile(path.join(folder,'draft.json'),'utf8'));warnings.push('同一原文草稿已存在，保留已有编辑内容；需要新增配图时请在现有草稿中补充。');}
 await fs.writeFile(path.join(folder,'metadata.json'),JSON.stringify({source,originalFile:file,title,imageRefs,imageDetails,warnings},null,2)+'\n');return {folder,draft,imageDetails,warnings};
}
export async function saveDraft(filename,{replace=false,base=root}={}){
 const n=validateNote(JSON.parse(await fs.readFile(filename,'utf8')));
 for(const im of getImagePaths(n)){const target=path.join(base,'content',im);try{await fs.access(target);}catch{if(!im.startsWith('assets/'+n.id+'/'))throw Error('缺少图片：'+im);const staged=path.join(path.dirname(path.resolve(filename)),'assets',path.basename(im));await fs.access(staged);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(staged,target);}}
 const destination=path.join(base,'content/notes',n.id+'.json');await fs.mkdir(path.dirname(destination),{recursive:true});if(replace){const old=JSON.parse(await fs.readFile(destination,'utf8'));n.created=old.created;n.updated=new Date().toISOString();await fs.writeFile(destination,JSON.stringify(n,null,2)+'\n');}else await fs.writeFile(destination,JSON.stringify(n,null,2)+'\n',{flag:'wx'});return destination;
}
