export function p2(n){return String(n).padStart(2,'0');}
export function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
export function todayStr(){const d=new Date();return`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;}
export function monthStr(offset=0){const d=new Date();d.setMonth(d.getMonth()+offset);return`${d.getFullYear()}-${p2(d.getMonth()+1)}`;}
