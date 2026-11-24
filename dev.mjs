import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './scripts/content.mjs';
const base=path.join(root,'dist');const port=Number(process.env.PORT||5173);
const types={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(base,'.'+(requested==='/'?'/index.html':requested));if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log('Local: http://localhost:'+port));
