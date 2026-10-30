#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";

function u16(value) { const b=Buffer.alloc(2); b.writeUInt16LE(value); return b; }
function u32(value) { const b=Buffer.alloc(4); b.writeUInt32LE(value >>> 0); return b; }
function makeStringPool(strings) {
  const offsets=[]; const data=[];
  for (const value of strings) {
    const raw=Buffer.from(value,"utf8");
    offsets.push(data.reduce((n,b)=>n+b.length,0));
    data.push(Buffer.concat([Buffer.from([value.length,raw.length]),raw,Buffer.from([0])]));
  }
  const payload=Buffer.concat(data);
  const header=Buffer.concat([u16(1),u16(28),u32(28+strings.length*4+payload.length),u32(strings.length),u32(0),u32(0x100),u32(28+strings.length*4),u32(0)]);
  return Buffer.concat([header,...offsets.map(u32),payload]);
}
function makeManifest() {
  const strings=["manifest","package","com.example.webdroid","versionName","1.0.0"];
  const pool=makeStringPool(strings);
  const attrs=[[1,2],[3,4]];
  const attrBytes=[];
  for(const [name,value] of attrs) attrBytes.push(Buffer.concat([u32(0xffffffff),u32(name),u32(value),u16(8),Buffer.from([0,3]),u32(value)]));
  const start=Buffer.concat([
    u16(0x0102),u16(16),u32(16+20+attrBytes.reduce((n,b)=>n+b.length,0)),
    u32(1),u32(0xffffffff),u32(0xffffffff),u32(0),u16(20),u16(20),u16(attrs.length),u16(0),u16(0),u16(0),
    ...attrBytes
  ]);
  const end=Buffer.concat([u16(0x0103),u16(16),u32(24),u32(1),u32(0xffffffff),u32(0xffffffff),u32(0)]);
  const body=Buffer.concat([pool,start,end]);
  return Buffer.concat([u16(3),u16(8),u32(8+body.length),body]);
}
function makeApk(manifest) {
  const name=Buffer.from("AndroidManifest.xml");
  const local=Buffer.concat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(0),u32(manifest.length),u32(manifest.length),u16(name.length),u16(0),name,manifest]);
  const centralOffset=local.length;
  const central=Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(0),u32(manifest.length),u32(manifest.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(0),name]);
  const eocd=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(1),u16(1),u32(central.length),u32(centralOffset),u16(0)]);
  return new Blob([local,central,eocd],{type:"application/vnd.android.package-archive"});
}
const source=readFileSync(new URL("../webdroid/apk-inspector.js",import.meta.url),"utf8");
globalThis.window=globalThis;
runInThisContext(source,{filename:"apk-inspector.js"});
const result=await globalThis.inspectWebDroidApk(makeApk(makeManifest()));
if(result.manifest?.packageName!=="com.example.webdroid") throw new Error("Package name parse failed: "+JSON.stringify(result));
if(result.manifest?.versionName!=="1.0.0") throw new Error("Version name parse failed: "+JSON.stringify(result));
console.log("PASS APK ZIP + AndroidManifest binary XML parsing");
