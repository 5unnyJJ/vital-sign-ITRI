import { escHtml } from './format.js'

function actionLabel(n){
  const m={0:'靜止',1:'走路',2:'走路',3:'慢跑',4:'慢跑',5:'快跑',6:'躺姿',7:'姿勢異常'};
  if(n===null||n===undefined||n==='')return null;
  const k=parseInt(n);return isNaN(k)?null:(m[k]||null);
}

function niceTicks(mn,mx,target){
  target=target||5;const rng=mx-mn;if(rng<=0)return[Math.round(mn)];
  const raw=rng/target;const mag=Math.pow(10,Math.floor(Math.log10(raw)));
  let s=raw/mag;if(s<1.5)s=1;else if(s<3.5)s=2;else if(s<7.5)s=5;else s=10;s*=mag;
  const start=Math.ceil((mn+s*0.001)/s)*s;const ticks=[];
  for(let t=start;t<mx+s*0.001;t=Math.round((t+s)*1e9)/1e9)ticks.push(Math.round(t));
  return ticks;
}

export function trendSVG(series,labels,opts,hParam){
  const dualAxis=!!(opts&&opts.dualAxis&&series.length>=2);
  const sharedCursor=!!(opts&&opts.sharedCursor);
  const hideXLabs=!!(opts&&opts.hideXLabels);
  const cursorFooter=sharedCursor?26:0;
  const W=620,H=hParam||150,PL=46,PR=dualAxis?44:12,PT=22,PB=hideXLabs?6:28,CW=W-PL-PR,CH=H-PT-PB,svgH=H+cursorFooter;
  const scales=series.map(s=>{
    const v=s.values.filter(x=>x!==null&&!isNaN(x));
    if(!v.length)return{mn:0,mx:1};
    if(dualAxis){const mn=Math.min(...v),mx=Math.max(...v),pad=Math.max((mx-mn)*0.18,2);return{mn:mn-pad,mx:mx+pad};}
    return null;
  });
  if(!dualAxis){
    const allV=series.flatMap(s=>s.values.filter(v=>v!==null&&!isNaN(v)));
    if(!allV.length)return'<div class="trend-empty">此期間無資料</div>';
    const mn=Math.min(...allV),mx=Math.max(...allV);
    const rng=mx-mn||1;const pad=Math.max(rng*0.18,2);
    let sMn=mn-pad,sMx=mx+pad;
    const minRng=(opts&&opts.minRange>0)?opts.minRange:0;
    if(sMx-sMn<minRng){const ctr=(sMn+sMx)/2;sMn=ctr-minRng/2;sMx=ctr+minRng/2;}
    scales.forEach((_,i)=>scales[i]={mn:sMn,mx:sMx});
  } else if(series.every(s=>s.values.every(v=>v===null||isNaN(v)))){return'<div class="trend-empty">此期間無資料</div>';}
  const yS=(v,si)=>{const sc=scales[si]||scales[0];const rng=sc.mx-sc.mn||1;return PT+CH-((v-sc.mn)/rng)*CH;};
  const n=labels.length;const xS=i=>PL+(n>1?i/(n-1):0.5)*CW;
  let paths='',hasPartial=false;
  series.forEach((s,si)=>{
    let segs=[],cur=[];
    s.values.forEach((v,i)=>{
      if(v===null||isNaN(v)){if(cur.length){segs.push(cur);cur=[];}hasPartial=true;}
      else cur.push(`${xS(i).toFixed(1)},${yS(v,si).toFixed(1)}`);
    });
    if(cur.length)segs.push(cur);
    segs.forEach(pts=>{
      if(pts.length===1){const[cx,cy]=pts[0].split(',');paths+=`<circle cx="${cx}" cy="${cy}" r="2.5" fill="${s.color}" opacity=".8"/>`;}
      else paths+=`<polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
    });
  });
  const chartId='tc-'+(Math.random().toString(36).slice(2,8));
  const midIdx=Math.floor(n/2);const midX=xS(midIdx).toFixed(1);
  let avgLines='',cursorEls='',avgNodes='';
  series.forEach((s,si)=>{
    const v=s.values.filter(x=>x!==null&&!isNaN(x));if(!v.length)return;
    const avgVal=v.reduce((a,b)=>a+b,0)/v.length;const ay=yS(avgVal,si).toFixed(1);
    avgLines+=`<line x1="${PL}" y1="${ay}" x2="${PL+CW}" y2="${ay}" stroke="${s.color}" stroke-width="1.2" stroke-dasharray="5,3" opacity=".4"/>`;
    avgLines+=`<text x="${PL-4}" y="${(parseFloat(ay)+3.5).toFixed(1)}" font-size="9" fill="${s.color}" text-anchor="end" font-weight="700" font-family="DM Sans,sans-serif">${Math.round(avgVal)}</text>`;
    const midV=s.values[midIdx];const midY=(midV!==null&&!isNaN(midV))?yS(midV,si).toFixed(1):ay;
    if(sharedCursor){cursorEls+=`<circle class="cursor-dot" cx="${midX}" cy="${midY}" r="5" fill="${s.color}" stroke="white" stroke-width="2" opacity="0" data-si="${si}"/>`;}
    else{avgNodes+=`<circle class="avg-drag-node" cx="${midX}" cy="${midY}" r="6" fill="${s.color}" stroke="white" stroke-width="2.5" opacity=".95" style="cursor:ew-resize" data-si="${si}" data-cid="${chartId}" data-avg="${avgVal.toFixed(1)}"/>`;}
  });
  if(sharedCursor){
    cursorEls=`<line class="cursor-vline" x1="${midX}" y1="${PT}" x2="${midX}" y2="${(PT+CH).toFixed(1)}" stroke="#7aafc4" stroke-width="1.2" stroke-dasharray="4,3" opacity="0"/>`+cursorEls;
    const trkY=H+10,trkH=6,trkCY=(trkY+trkH/2).toFixed(1);
    const initProg=(parseFloat(midX)-PL).toFixed(1);
    cursorEls+=`<rect class="cursor-track" x="${PL}" y="${trkY}" width="${CW}" height="${trkH}" rx="${trkH/2}" fill="rgba(122,175,196,0.13)" stroke="#b6d8e5" stroke-width="1"/>`;
    cursorEls+=`<rect class="cursor-progress" x="${PL}" y="${trkY}" width="${initProg}" height="${trkH}" rx="${trkH/2}" fill="#7aafc4" opacity="0.42"/>`;
    cursorEls+=`<circle class="cursor-drag-node" cx="${midX}" cy="${trkCY}" r="9" fill="white" stroke="#6ba3bc" stroke-width="2" style="cursor:ew-resize;filter:drop-shadow(0 1px 5px rgba(90,155,185,.38))" data-cid="${chartId}"/>`;
  }
  const step=Math.max(1,Math.floor(n/7));
  let xLabs='';
  if(!hideXLabs){for(let i=0;i<n;i+=step)xLabs+=`<text x="${xS(i).toFixed(1)}" y="${H-4}" font-size="9" fill="#486055" text-anchor="middle" font-family="DM Sans,sans-serif">${labels[i]||''}</text>`;}
  let yLabs='',gridLines='';
  if(dualAxis){
    const sc0=scales[0],sc1=scales[1]||scales[0];const rx=PL+CW+4;
    niceTicks(sc0.mn,sc0.mx,6).forEach(t=>{
      const ty=yS(t,0);if(ty<PT-2||ty>PT+CH+2)return;
      gridLines+=`<line x1="${PL}" y1="${ty.toFixed(1)}" x2="${PL+CW}" y2="${ty.toFixed(1)}" stroke="#e5eeea" stroke-width="0.8" stroke-dasharray="3,3"/>`;
      yLabs+=`<text x="${PL-4}" y="${(ty+3.5).toFixed(1)}" font-size="9" fill="${series[0].color}" text-anchor="end" font-family="DM Sans,sans-serif">${t}</text>`;
    });
    niceTicks(sc1.mn,sc1.mx,4).forEach(t=>{
      const ty=yS(t,1);if(ty<PT-2||ty>PT+CH+2)return;
      yLabs+=`<text x="${rx}" y="${(ty+3.5).toFixed(1)}" font-size="9" fill="${series[1].color}" text-anchor="start" font-family="DM Sans,sans-serif">${t}</text>`;
    });
  } else {
    const sc=scales[0];
    niceTicks(sc.mn,sc.mx,5).forEach(t=>{
      const ty=yS(t,0);if(ty<PT-2||ty>PT+CH+2)return;
      gridLines+=`<line x1="${PL}" y1="${ty.toFixed(1)}" x2="${PL+CW}" y2="${ty.toFixed(1)}" stroke="#e5eeea" stroke-width="0.8" stroke-dasharray="3,3"/>`;
      yLabs+=`<text x="${PL-4}" y="${(ty+3.5).toFixed(1)}" font-size="9" fill="#486055" text-anchor="end" font-family="DM Sans,sans-serif">${t}</text>`;
    });
  }
  let legend='',lx=PL;
  series.forEach(s=>{legend+=`<line x1="${lx}" y1="${PT-8}" x2="${lx+12}" y2="${PT-8}" stroke="${s.color}" stroke-width="2" stroke-linecap="round"/>`;legend+=`<text x="${lx+16}" y="${PT-5}" font-size="10" fill="#486055" font-family="Noto Sans TC,sans-serif">${s.label}</text>`;lx+=90;});
  const chartData=JSON.stringify({labels,series:series.map(s=>({label:s.label,color:s.color,values:s.values})),actions:(opts&&opts.actionValues)||null,n,dualAxis,sharedCursor,scales:scales.map(sc=>({mn:sc.mn,mx:sc.mx})),chartH:H,PT,PB});
  return`<div class="trend-chart-wrap" id="${chartId}" data-chart='${chartData.replace(/'/g,"&#39;")}' style="position:relative"><svg width="100%" viewBox="0 0 ${W} ${svgH}" style="overflow:visible;display:block">
    ${gridLines}${yLabs}${xLabs}${legend}${paths}${avgLines}${cursorEls}${avgNodes}
  </svg><div class="chart-overlay"></div>${hasPartial?'<div class="trend-note">部分時段無資料（斷線處）</div>':''}</div>`;
}

/* Cursor drag — event delegation, set up once regardless of DOM changes */
let _cursorDrag=null;
let _cursorDragInited=false;
export function initCursorDragNodes(){
  if(_cursorDragInited)return;_cursorDragInited=true;
  document.addEventListener('mousedown',_onCursorDown);
  document.addEventListener('touchstart',_onCursorDown,{passive:false});
}
function _onCursorDown(e){
  const nd=e.target.closest('.cursor-drag-node');
  if(!nd)return;
  e.preventDefault();
  const cid=nd.getAttribute('data-cid');
  const wrap=document.getElementById(cid);if(!wrap)return;
  let d;try{d=JSON.parse(wrap.dataset.chart.replace(/&#39;/g,"'"));}catch{return;}
  _cursorDrag={nd,wrap,d};
  const svg=wrap.querySelector('svg');
  if(svg){svg.querySelector('.cursor-vline')?.setAttribute('opacity','0.6');svg.querySelectorAll('.cursor-dot').forEach(el=>el.setAttribute('opacity','1'));}
  document.addEventListener('mousemove',_cursorDragMove);
  document.addEventListener('mouseup',_cursorDragEnd);
  document.addEventListener('touchmove',_cursorDragMove,{passive:false});
  document.addEventListener('touchend',_cursorDragEnd);
  _cursorDragMove(e);
}
function _cursorDragMove(e){
  if(!_cursorDrag)return;e.preventDefault();
  const{nd,wrap,d}=_cursorDrag;
  const svg=wrap.querySelector('svg');if(!svg)return;
  const rect=svg.getBoundingClientRect();
  const cx=e.touches?e.touches[0].clientX:e.clientX;
  const cy2=e.touches?e.touches[0].clientY:e.clientY;
  const W=620,PL=46,PR=d.dualAxis?44:12,CW=W-PL-PR;
  const H=d.chartH||230,PT=d.PT||22,PB=d.PB||28,CH=H-PT-PB;
  const rx=Math.max(PL,Math.min(PL+CW,(cx-rect.left)*(W/rect.width)));
  const i=Math.min(d.n-1,Math.max(0,Math.round(((rx-PL)/CW)*(d.n-1))));
  nd.setAttribute('cx',rx.toFixed(1));
  svg.querySelector('.cursor-progress')?.setAttribute('width',Math.max(0,rx-PL).toFixed(1));
  const vline=svg.querySelector('.cursor-vline');
  if(vline){vline.setAttribute('x1',rx.toFixed(1));vline.setAttribute('x2',rx.toFixed(1));}
  svg.querySelectorAll('.cursor-dot').forEach(dot=>{
    const si=parseInt(dot.getAttribute('data-si')||'0');
    dot.setAttribute('cx',rx.toFixed(1));
    const sc=d.scales[si]||d.scales[0];const rng=sc.mx-sc.mn||1;
    const v=d.series[si]&&d.series[si].values[i];
    if(v!==null&&v!==undefined&&!isNaN(parseFloat(v)))dot.setAttribute('cy',(PT+CH-((parseFloat(v)-sc.mn)/rng)*CH).toFixed(1));
  });
  const tt=document.getElementById('chart-tooltip');
  document.getElementById('tt-time').textContent=d.labels[i]||'';
  let rowsHtml='';
  d.series.forEach(s=>{const v=s.values[i];const disp=(v===null||v===undefined||isNaN(parseFloat(v)))?'—':Math.round(parseFloat(v));const safeColor=/^#[0-9a-fA-F]{3,6}$|^rgb/.test(s.color)?s.color:'#666';rowsHtml+=`<div class="tt-row"><span class="tt-label" style="color:${safeColor}">${escHtml(s.label)}</span><span class="tt-val">${disp}</span></div>`;});
  document.getElementById('tt-rows').innerHTML=rowsHtml;
  const posEl=document.getElementById('tt-posture');
  if(d.actions&&d.actions[i]!==null&&d.actions[i]!==undefined){const lbl=actionLabel(d.actions[i]);if(lbl){posEl.textContent='姿位：'+lbl;posEl.style.display='block';}else posEl.style.display='none';}
  else posEl.style.display='none';
  let tx=cx+16,ty=cy2-54;
  if(tx+180>window.innerWidth-8)tx=cx-196;if(ty<8)ty=8;
  tt.style.left=tx+'px';tt.style.top=ty+'px';tt.style.display='block';
}
function _cursorDragEnd(){
  _cursorDrag=null;
  document.removeEventListener('mousemove',_cursorDragMove);document.removeEventListener('mouseup',_cursorDragEnd);
  document.removeEventListener('touchmove',_cursorDragMove);document.removeEventListener('touchend',_cursorDragEnd);
  document.getElementById('chart-tooltip').style.display='none';
}

let _avgDrag=null;
export function initAvgDragNodes(){
  document.querySelectorAll('.avg-drag-node').forEach(nd=>{nd.addEventListener('mousedown',_avgDragStart);nd.addEventListener('touchstart',_avgDragStart,{passive:false});});
}
function _avgDragStart(e){
  e.preventDefault();e.stopPropagation();
  const nd=e.currentTarget;const cid=nd.getAttribute('data-cid');
  const wrap=document.getElementById(cid);if(!wrap)return;
  let d;try{d=JSON.parse(wrap.dataset.chart.replace(/&#39;/g,"'"));}catch{return;}
  _avgDrag={nd,wrap,d};
  document.addEventListener('mousemove',_avgDragMove);document.addEventListener('mouseup',_avgDragEnd);
  document.addEventListener('touchmove',_avgDragMove,{passive:false});document.addEventListener('touchend',_avgDragEnd);
  _avgDragMove(e);
}
function _avgDragMove(e){
  if(!_avgDrag)return;e.preventDefault();
  const{nd,wrap,d}=_avgDrag;const si=parseInt(nd.getAttribute('data-si')||'0');
  const svg=wrap.querySelector('svg');if(!svg)return;
  const rect=svg.getBoundingClientRect();
  const cx=e.touches?e.touches[0].clientX:e.clientX;const cy2=e.touches?e.touches[0].clientY:e.clientY;
  const W=620,PL=46,PR=d.dualAxis?44:12,CW=W-PL-PR;
  const H=d.chartH||150,PT=d.PT||22,PB=d.PB||28,CH=H-PT-PB;
  const rx=Math.max(PL,Math.min(PL+CW,(cx-rect.left)*(W/rect.width)));
  nd.setAttribute('cx',rx.toFixed(1));
  const i=Math.min(d.n-1,Math.max(0,Math.round(((rx-PL)/CW)*(d.n-1))));
  const sc=d.scales[si]||d.scales[0];const rng=sc.mx-sc.mn||1;
  const v=d.series[si]&&d.series[si].values[i];
  if(v!==null&&v!==undefined&&!isNaN(parseFloat(v)))nd.setAttribute('cy',(PT+CH-((parseFloat(v)-sc.mn)/rng)*CH).toFixed(1));
  const tt=document.getElementById('chart-tooltip');
  document.getElementById('tt-time').textContent=d.labels[i]||'';
  let rowsHtml='';d.series.forEach(s=>{const v=s.values[i];const disp=(v===null||v===undefined||isNaN(parseFloat(v)))?'—':Math.round(parseFloat(v));rowsHtml+=`<div class="tt-row"><span class="tt-label" style="color:${s.color}">${s.label}</span><span class="tt-val">${disp}</span></div>`;});
  document.getElementById('tt-rows').innerHTML=rowsHtml;
  const posEl=document.getElementById('tt-posture');
  if(d.actions&&d.actions[i]!==null&&d.actions[i]!==undefined){const lbl=actionLabel(d.actions[i]);if(lbl){posEl.textContent='姿位：'+lbl;posEl.style.display='block';}else posEl.style.display='none';}
  else posEl.style.display='none';
  let tx=cx+16,ty=cy2-44;if(tx+160>window.innerWidth-8)tx=cx-174;if(ty<8)ty=8;
  tt.style.left=tx+'px';tt.style.top=ty+'px';tt.style.display='block';
}
function _avgDragEnd(){_avgDrag=null;document.removeEventListener('mousemove',_avgDragMove);document.removeEventListener('mouseup',_avgDragEnd);document.removeEventListener('touchmove',_avgDragMove);document.removeEventListener('touchend',_avgDragEnd);document.getElementById('chart-tooltip').style.display='none';}

export function sparklineSVG(values,stroke,w=180,h=32){
  const nums=values.map(v=>parseFloat(v)).filter(v=>!isNaN(v));
  if(nums.length<2)return`<svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="max-width:${w}px;display:block"><text x="4" y="18" font-size="10" fill="#b5ccc5">—</text></svg>`;
  const mn=Math.min(...nums),mx=Math.max(...nums),rng=mx-mn||1,p=3;
  const pts=nums.map((v,i)=>{const x=p+(i/(nums.length-1))*(w-p*2);const y=(h-p)-((v-mn)/rng)*(h-p*2)+p/2;return`${x.toFixed(1)},${y.toFixed(1)}`;}).join(' ');
  return`<svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="max-width:${w}px;display:block"><polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
