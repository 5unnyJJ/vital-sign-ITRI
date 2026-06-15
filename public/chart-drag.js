(function(){
  function actionLabel(n){
    const m={0:'靜止',1:'走路',2:'走路',3:'慢跑',4:'慢跑',5:'快跑',6:'躺姿',7:'姿勢異常'}
    if(n===null||n===undefined||n==='') return null
    const k=parseInt(n); return isNaN(k)?null:(m[k]||null)
  }

  let _drag = null

  function onDragStart(e){
    const nd = e.currentTarget
    const wrap = nd.closest('[data-chart]')
    if (!wrap) return
    const d = JSON.parse(wrap.dataset.chart)
    const svg = wrap.querySelector('svg')
    _drag = { nd, wrap, d, svg }
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)
    document.addEventListener('touchmove', onDragMove, {passive:false})
    document.addEventListener('touchend', onDragEnd)
    e.preventDefault()
  }

  function onDragMove(e){
    if (!_drag) return
    const {wrap, d, svg} = _drag
    const r = svg.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const W=620, PL=46, PR=d.dualAxis?46:20
    const frac = Math.max(0, Math.min(1, (cx - r.left) / r.width))
    const raw = PL + frac*(W-PL-PR)
    const i = Math.max(0, Math.min(d.labels.length-1,
      Math.round((raw-PL)/(W-PL-PR)*(d.labels.length-1))))

    const prog = wrap.querySelector('.cursor-progress')
    const vline = wrap.querySelector('.cursor-vline')
    if(prog) prog.setAttribute('width', raw)
    if(vline){ vline.setAttribute('x1',raw); vline.setAttribute('x2',raw) }

    const tt = document.getElementById('chart-tooltip')
    if (!tt) return
    const ttTime = document.getElementById('tt-time')
    const ttRows = document.getElementById('tt-rows')
    const ttPost = document.getElementById('tt-posture')
    if(ttTime) ttTime.textContent = d.labels[i] || ''
    if(ttRows){
      let html = ''
      d.series.forEach(s=>{
        const v = s.values[i]
        const disp = (v===null||v===undefined) ? '—' : Math.round(v)
        html += `<div class="tt-row"><span class="tt-label" style="color:${s.color||'inherit'}">${s.label}</span><span class="tt-val">${disp}</span></div>`
      })
      ttRows.innerHTML = html
    }
    if(ttPost){
      const raw = d.actions && d.actions[i]
      const lbl = actionLabel(raw)
      if(lbl){ ttPost.textContent = '姿位：'+lbl; ttPost.style.display='block' }
      else ttPost.style.display='none'
    }
    const ty = (e.touches?e.touches[0].clientY:e.clientY) - 20
    tt.style.left = (cx + 14 + 200 > window.innerWidth ? cx - 174 : cx + 14) + 'px'
    tt.style.top  = Math.max(8, ty) + 'px'
    tt.style.display = 'block'
    if(e.touches) e.preventDefault()
  }

  function onDragEnd(){
    _drag = null
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('touchmove', onDragMove)
    document.removeEventListener('touchend', onDragEnd)
    const tt = document.getElementById('chart-tooltip')
    if(tt) tt.style.display = 'none'
  }

  function attachNodes(){
    document.querySelectorAll('.cursor-drag-node').forEach(nd=>{
      if(nd._chartDragBound) return
      nd._chartDragBound = true
      nd.addEventListener('mousedown', onDragStart)
      nd.addEventListener('touchstart', onDragStart, {passive:false})
    })
  }

  const obs = new MutationObserver(attachNodes)
  obs.observe(document.body, {childList:true, subtree:true})
  attachNodes()
})()
