import http from 'node:http';
import fs from 'node:fs/promises';
import worker from './dist/server/index.js';
await fs.mkdir('.local-data',{recursive:true});
const BUCKET={
 async put(key,value,options={}){await fs.mkdir('.local-data/'+key.split('/')[0],{recursive:true});await fs.writeFile('.local-data/'+key,value);await fs.writeFile('.local-data/'+key+'.meta',JSON.stringify(options));},
 async get(key){try{const b=await fs.readFile('.local-data/'+key);let meta={};try{meta=JSON.parse(await fs.readFile('.local-data/'+key+'.meta','utf8'));}catch{}return {json:async()=>JSON.parse(b.toString()),body:b,httpMetadata:meta.httpMetadata};}catch{return null;}},
 async list({prefix}){try{return {objects:(await fs.readdir('.local-data/'+prefix)).filter(n=>!n.endsWith('.meta')).map(n=>({key:prefix+n})),truncated:false};}catch{return {objects:[],truncated:false};}},
 async delete(key){await fs.unlink('.local-data/'+key);try{await fs.unlink('.local-data/'+key+'.meta');}catch{}}
};
const server=http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);const r=await worker.fetch(new Request('http://localhost:5173'+req.url,{method:req.method,headers:req.headers,...(body.length?{body}: {})}),{BUCKET});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch(e){res.writeHead(500);res.end('Preview error');}});
server.listen(5173,'127.0.0.1',()=>console.log('Local: http://localhost:5173'));
