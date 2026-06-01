import { todayStr } from './format.js'

const SCAN_CACHE_TTL    = 5*60*1000;
const SCAN_CACHE_VERSION= 4; // bumped: cross-org member filter fixes (v4)
const DAY_CACHE_TTL_NOW = 90*1000;       // 今日：90 秒 SWR
const DAY_CACHE_TTL_OLD = 24*3600*1000;  // 歷史：24 小時
const ANNOT_CACHE_TTL   = 2*60*1000;     // 護理備註：2 分鐘

// ── 快取 eviction 工具 ───────────────────────────────────────
export function evictOldestCache(prefix,keep){
  try{
    const entries=[];
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(prefix)){try{const o=JSON.parse(localStorage.getItem(k));entries.push({k,ts:o.ts||0});}catch{entries.push({k,ts:0});}}}
    entries.sort((a,b)=>a.ts-b.ts);
    entries.slice(0,Math.max(0,entries.length-keep)).forEach(e=>localStorage.removeItem(e.k));
  }catch{}
}

// ── Day view 快取 ────────────────────────────────────────────
export function getDayCacheKey(table,date,mid){return`vd_day__${table}__${date}__${mid||'ALL'}`;}
export function loadDayCache(table,date,mid){
  try{
    const raw=localStorage.getItem(getDayCacheKey(table,date,mid));
    if(!raw)return null;
    const obj=JSON.parse(raw);
    const isToday=(date===todayStr());
    const ttl=isToday?DAY_CACHE_TTL_NOW:DAY_CACHE_TTL_OLD;
    const expired=Date.now()-obj.ts>ttl;
    if(expired&&!isToday)return null;
    return{rows:obj.rows,stale:expired};
  }catch{return null;}
}
export function saveDayCache(table,date,mid,rows){
  try{localStorage.setItem(getDayCacheKey(table,date,mid),JSON.stringify({ts:Date.now(),rows}));}
  catch{evictOldestCache('vd_day__',3);}
}

// ── Annotations 快取 ─────────────────────────────────────────
export function getAnnotCacheKey(table,mid){return`vd_annot__${table||''}__${mid||''}`;}
export function loadAnnotCache(table,mid){
  try{
    const raw=localStorage.getItem(getAnnotCacheKey(table,mid));
    if(!raw)return null;
    const obj=JSON.parse(raw);
    if(Date.now()-obj.ts>ANNOT_CACHE_TTL)return null;
    return obj.annots;
  }catch{return null;}
}
export function saveAnnotCache(table,mid,annots){
  try{localStorage.setItem(getAnnotCacheKey(table,mid),JSON.stringify({ts:Date.now(),annots}));}
  catch{evictOldestCache('vd_annot__',5);}
}
export function invalidateAnnotCache(table,mid){
  localStorage.removeItem(getAnnotCacheKey(table,mid));
  localStorage.removeItem(getAnnotCacheKey(table,''));
}

// ── Scan 快取 ────────────────────────────────────────────────
export function getScanCacheKey(table,date){return`vd_scan__${table}__${date}`;}
export function loadScanCache(table,date){
  try{
    const raw=localStorage.getItem(getScanCacheKey(table,date));
    if(!raw)return null;
    const obj=JSON.parse(raw);
    if((obj.ver||1)!==SCAN_CACHE_VERSION)return null;
    if(Date.now()-obj.ts>SCAN_CACHE_TTL)return null;
    return obj;
  }catch(e){return null;}
}
export function saveScanCache(table,date,todayGroups,allGroups,mList){
  const key=getScanCacheKey(table,date);
  const val=JSON.stringify({ver:SCAN_CACHE_VERSION,ts:Date.now(),todayGroups,allGroups,memberList:mList});
  try{
    localStorage.setItem(key,val);
  }catch(e){
    evictOldestCache('vd_scan__',1);
    try{localStorage.setItem(key,val);}catch(e2){}
  }
}
