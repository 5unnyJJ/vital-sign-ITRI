export function avg(arr){const n=arr.map(v=>parseFloat(v)).filter(v=>!isNaN(v));if(!n.length)return null;return Math.round(n.reduce((a,b)=>a+b,0)/n.length*10)/10;}
export function stdOf(arr){
  const n=arr.map(v=>parseFloat(v)).filter(v=>!isNaN(v));
  if(n.length<2)return null;
  const mean=n.reduce((a,b)=>a+b,0)/n.length;
  const variance=n.reduce((s,v)=>s+(v-mean)**2,0)/n.length;
  return Math.round(Math.sqrt(variance)*10)/10;
}
export function modeOf(vals){
  const v=vals.filter(x=>x!==null&&x!==undefined);
  if(!v.length)return null;
  const counts={};let maxC=0,modeVal=v[v.length-1];
  v.forEach(x=>{counts[x]=(counts[x]||0)+1;if(counts[x]>maxC){maxC=counts[x];modeVal=x;}});
  return modeVal;
}
export function anomalyLevel(key,v){
  if(v===null||v===undefined)return'neutral';
  const n=parseFloat(v);if(isNaN(n))return'neutral';
  switch(key){
    case'sbp':return n>=160||n<80?'red':n>=140||n<90?'orange':'green';
    case'dbp':return n>=100||n<55?'red':n>=90||n<60?'orange':'green';
    case'heartbeat':return n>120||n<50?'red':n>100||n<60?'orange':'green';
    case'temp':return n>37.5||n<35?'red':'neutral';
    default:return'neutral';
  }
}
/* 暖機過濾：每個連續量測段落前 2 分鐘，若聚合筆數 < 55 則視為不穩定丟棄 */
export function filterWarmupMinutes(minuteRows,warmupMin=2,stableCount=55){
  if(!minuteRows||minuteRows.length<2)return minuteRows||[];
  const gapMs=5*60*1000;const warmMs=warmupMin*60*1000;
  const result=[];let sessionT=null,lastT=null;
  minuteRows.forEach(row=>{
    const t=new Date(row.time).getTime();
    if(sessionT===null||(t-lastT)>gapMs)sessionT=t;
    lastT=t;
    if((t-sessionT)<warmMs&&(row.count||0)<stableCount)return;
    result.push(row);
  });
  return result;
}
export function aggregateToMinutes(rows){
  const buckets={};
  // 直接字串切片取 HH:MM，避免每行建立 Date 物件（快 40-60%）
  rows.forEach(r=>{const key=r.date_minute.slice(0,16);if(!buckets[key])buckets[key]={time:key+':00',rows:[]};buckets[key].rows.push(r);});
  const af=(arr,f)=>{const n=arr.map(r=>parseFloat(r[f])).filter(v=>!isNaN(v));if(!n.length)return null;return Math.round(n.reduce((a,b)=>a+b,0)/n.length*10)/10;};
  return Object.values(buckets).map(b=>({time:b.time,count:b.rows.length,heartbeat:af(b.rows,'heartbeat'),temp:af(b.rows,'temp'),breath:af(b.rows,'breath'),sbp:af(b.rows,'sbp'),dbp:af(b.rows,'dbp'),pulse:af(b.rows,'pulse'),step:af(b.rows,'step'),calorie:af(b.rows,'calorie'),action:modeOf(b.rows.map(r=>r.action))}));
}
