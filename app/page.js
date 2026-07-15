'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const THEMES = {
  asombro:   { label:'Asombro',    bg:'#1a1206', accent:'#D4AF37', glow:'#F5D77A' },
  motivacion:{ label:'Motivación', bg:'#180022', accent:'#9333EA', glow:'#D946EF' },
  calma:     { label:'Calma',      bg:'#0B0F2B', accent:'#4C1D95', glow:'#818CF8' },
  foco:      { label:'Foco',       bg:'#050505', accent:'#00E5FF', glow:'#67E8F9' },
}
const THEME_ORDER = ['asombro','motivacion','calma','foco']

function pad(n){ return n<10 ? '0'+n : ''+n }
function toKey(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()) }
function mondayOf(d){
  const dd = new Date(d); const day = dd.getDay()
  const diff = (day===0 ? -6 : 1-day)
  dd.setDate(dd.getDate()+diff); dd.setHours(0,0,0,0)
  return dd
}
function fmtLong(d){
  return d.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

export default function Page(){
  const [session, setSession] = useState(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass] = useState('')
  const [authMsg, setAuthMsg] = useState('')

  const [theme, setTheme] = useState('calma')
  const [ambient, setAmbient] = useState(false)
  const canvasRef = useRef(null)

  const today = new Date(); today.setHours(0,0,0,0)
  const [viewDate, setViewDate] = useState(today)
  const isToday = toKey(viewDate) === toKey(today)

  const [metas, setMetas] = useState(Array(10).fill(''))
  const [sapo, setSapo] = useState('')
  const [abcde, setAbcde] = useState({A:'',B:'',C:'',D:'',E:''})
  const [wentWell, setWentWell] = useState('')
  const [doDiff, setDoDiff] = useState('')
  const [week, setWeek] = useState({mo:false,tu:false,we:false,th:false,fr:false,sa:false,su:false})
  const [streak, setStreak] = useState(0)
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  // ---- Auth ----
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=> setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s)=> setSession(s))
    return ()=> listener.subscription.unsubscribe()
  },[])

  async function handleSignIn(e){
    e.preventDefault(); setAuthMsg('Ingresando...')
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPass })
    setAuthMsg(error ? error.message : '')
  }
  async function handleSignUp(e){
    e.preventDefault(); setAuthMsg('Creando cuenta...')
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPass })
    setAuthMsg(error ? error.message : 'Cuenta creada. Revisá tu email si pide confirmación, o iniciá sesión.')
  }

  // ---- Carga de datos al cambiar de fecha ----
  useEffect(()=>{ if(session) loadDate(viewDate) }, [session, viewDate])

  async function loadDate(d){
    const uid = session.user.id
    const key = toKey(d)
    const { data: entry } = await supabase.from('entries')
      .select('*').eq('user_id', uid).eq('entry_date', key).maybeSingle()

    setMetas(entry?.metas || Array(10).fill(''))
    setSapo(entry?.sapo || '')
    setAbcde(entry?.abcde || {A:'',B:'',C:'',D:'',E:''})
    setWentWell(entry?.went_well || '')
    setDoDiff(entry?.do_diff || '')
    setStatus('')

    await loadWeek(d, uid)
  }

  async function loadWeek(d, uid){
    const mon = mondayOf(d)
    const monKey = toKey(mon)
    const { data: w } = await supabase.from('week_locks')
      .select('*').eq('user_id', uid).eq('week_start', monKey).maybeSingle()
    setWeek(w || {mo:false,tu:false,we:false,th:false,fr:false,sa:false,su:false})

    const { data: sm } = await supabase.from('streak_meta').select('*').eq('user_id', uid).maybeSingle()
    setStreak(sm?.streak || 0)
  }

  // ---- Guardar ----
  async function handleSave(){
    setSaving(true); setStatus('Guardando...')
    const uid = session.user.id
    const key = toKey(today)
    const filled = metas.filter(m=>m && m.trim()).length

    await supabase.from('entries').upsert({
      user_id: uid, entry_date: key, metas, sapo, abcde,
      went_well: wentWell, do_diff: doDiff
    }, { onConflict: 'user_id,entry_date' })

    const { data: baseline } = await supabase.from('baseline').select('*').eq('user_id', uid).maybeSingle()

    if(!baseline && filled >= 8){
      await supabase.from('baseline').insert({ user_id: uid, metas, baseline_date: key })
      setStatus('Entrada guardada. Esta es tu Lista Base — a partir de mañana se compara en silencio.')
    } else if(baseline && filled >= 8){
      const res = await fetch('/api/match', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ baselineMetas: baseline.metas, todayMetas: metas })
      })
      const { matched } = await res.json()
      if(matched >= 6){
        const mon = mondayOf(today)
        const monKey = toKey(mon)
        const dayCode = ['mo','tu','we','th','fr','sa','su'][(today.getDay()+6)%7]
        const updated = { ...week, [dayCode]: true }
        await supabase.from('week_locks').upsert({
          user_id: uid, week_start: monKey, ...updated
        }, { onConflict: 'user_id,week_start' })
        setWeek(updated)
        setStatus('Entrada guardada. 🔓 Candado abierto — coincidencia detectada.')
      } else {
        setStatus('Entrada guardada.')
      }
    } else {
      setStatus('Entrada guardada. Completá al menos 8 metas para activar tu Lista Base.')
    }
    setSaving(false)
  }

  // ---- Fondo aurora ----
  useEffect(()=>{
    const canvas = canvasRef.current
    if(!canvas) return
    const ctx = canvas.getContext('2d')
    function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)

    let t0 = 0, raf
    const veils = [
      { key:'glow', phx:0.7, phy:1.3, spx:0.06, spy:0.045, rx:0.55, alpha:0.30 },
      { key:'accent', phx:2.1, phy:0.4, spx:0.05, spy:0.06, rx:0.42, alpha:0.24 },
      { key:'gold', phx:4.0, phy:2.6, spx:0.045, spy:0.05, rx:0.36, alpha:0.16 },
    ]
    function hexToRgb(hex){ const n = parseInt(hex.replace('#',''),16); return [(n>>16)&255,(n>>8)&255,n&255] }
    function draw(){
      t0 += 0.01
      const w = canvas.width, h = canvas.height
      const th = THEMES[theme]
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = th.bg
      ctx.fillRect(0,0,w,h)
      ctx.globalCompositeOperation = 'lighter'
      veils.forEach(v=>{
        const colorHex = v.key==='gold' ? '#D4AF37' : th[v.key]
        const [r,g,b] = hexToRgb(colorHex)
        const cx = w * (0.5 + Math.sin(t0*v.spx + v.phx) * 0.32)
        const cy = h * (0.42 + Math.cos(t0*v.spy + v.phy) * 0.22)
        const rad = Math.max(w,h) * (v.rx + Math.sin(t0*0.03+v.phx)*0.05)
        const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,rad)
        grad.addColorStop(0, `rgba(${r},${g},${b},${v.alpha})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(cx,cy,rad,rad*0.7,0,0,Math.PI*2)
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [theme])

  useEffect(()=>{
    if(!ambient) return
    let idx = THEME_ORDER.indexOf(theme)
    const id = setInterval(()=>{
      idx = (idx+1) % THEME_ORDER.length
      setTheme(THEME_ORDER[idx])
    }, 30000)
    return ()=> clearInterval(id)
  }, [ambient])

  // ---- Login screen ----
  if(!session){
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050414', color:'#EDEAF6'}}>
        <form style={{width:300, padding:24}}>
          <h2 style={{color:'#D4AF37', textAlign:'center'}}>Leph - Heka</h2>
          <input placeholder="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
            style={{width:'100%', padding:10, marginBottom:10}} />
          <input placeholder="contraseña" type="password" value={authPass} onChange={e=>setAuthPass(e.target.value)}
            style={{width:'100%', padding:10, marginBottom:10}} />
          <button onClick={handleSignIn} style={{width:'100%', padding:10, marginBottom:8}}>Ingresar</button>
          <button onClick={handleSignUp} style={{width:'100%', padding:10}}>Crear cuenta</button>
          <p style={{fontSize:12, color:'#a9a3c9', textAlign:'center'}}>{authMsg}</p>
        </form>
      </div>
    )
  }

  // ---- Diario ----
  const order = ['mo','tu','we','th','fr','sa','su']
  const labels = {mo:'Lun',tu:'Mar',we:'Mié',th:'Jue',fr:'Vie',sa:'Sáb',su:'Dom'}

  return (
    <div style={{position:'relative', minHeight:'100vh'}}>
      <canvas ref={canvasRef} style={{position:'fixed', inset:0, zIndex:0}} />
      <div style={{position:'relative', zIndex:1, maxWidth:780, margin:'0 auto', padding:'32px 20px 80px'}}>
        <h1 style={{textAlign:'center', color:'#D4AF37'}}>LEPH — HEKA</h1>
        <p style={{textAlign:'center', fontStyle:'italic', color:'#a9a3c9'}}>
          "Tu destino lo determinan tus decisiones, no tus condiciones."
        </p>

        <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', margin:'16px 0'}}>
          {THEME_ORDER.map(k=>(
            <button key={k} onClick={()=>{ setAmbient(false); setTheme(k) }}
              style={{padding:'6px 12px', borderRadius:20, border:'1px solid #D4AF37', color: theme===k?'#D4AF37':'#a9a3c9', background:'transparent'}}>
              {THEMES[k].label}
            </button>
          ))}
          <button onClick={()=>setAmbient(!ambient)}
            style={{padding:'6px 12px', borderRadius:20, border:'1px solid #818CF8', color:'#818CF8', background: ambient?'rgba(129,140,248,0.15)':'transparent'}}>
            {ambient ? '◈ Ambiente activo' : '◇ Modo Ambiente'}
          </button>
        </div>

        <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:16, marginBottom:20}}>
          <button onClick={()=> setViewDate(d=>{ const n=new Date(d); n.setDate(n.getDate()-1); return n })}>‹</button>
          <div>{fmtLong(viewDate)}</div>
          <button disabled={isToday} onClick={()=> setViewDate(d=>{ const n=new Date(d); n.setDate(n.getDate()+1); return n })}>›</button>
        </div>

        <div style={{border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:16, marginBottom:20}}>
          <h3 style={{color:'#D4AF37'}}>⟁ La Regla de Oro</h3>
          <div style={{display:'flex', gap:6}}>
            {order.map(code=>(
              <div key={code} style={{flex:1, textAlign:'center', padding:8, border:'1px solid rgba(212,175,55,0.25)', borderRadius:8, background: week[code]?'rgba(212,175,55,0.1)':'transparent'}}>
                <div style={{fontSize:11, color:'#a9a3c9'}}>{labels[code]}</div>
                <div style={{fontSize:20}}>{week[code] ? '🔓' : '🔒'}</div>
              </div>
            ))}
          </div>
          <p style={{fontSize:12, color:'#a9a3c9', textAlign:'center', marginTop:8}}>Racha de semanas con coincidencia: {streak}</p>
        </div>

        <div style={{border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:16, marginBottom:20}}>
          <h3 style={{color:'#D4AF37'}}>✦ 1. El Método de las 10 Metas</h3>
          {isToday ? (
            metas.map((m,i)=>(
              <div key={i} style={{display:'flex', gap:8, marginBottom:8}}>
                <span style={{color:'#D4AF37', width:24}}>{i+1}.</span>
                <input value={m} onChange={e=>{
                  const copy=[...metas]; copy[i]=e.target.value; setMetas(copy)
                }} placeholder="Yo..." style={{flex:1, padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6'}} />
              </div>
            ))
          ) : (
            <p style={{fontStyle:'italic', color:'#a9a3c9'}}>Las metas de días pasados permanecen selladas.</p>
          )}
        </div>

        <div style={{border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:16, marginBottom:20}}>
          <h3 style={{color:'#D4AF37'}}>🐸 2. Planificación Diaria</h3>
          <label>Sapo del día</label>
          <input value={sapo} disabled={!isToday} onChange={e=>setSapo(e.target.value)}
            style={{width:'100%', padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6', marginBottom:10}} />
          {['A','B','C','D','E'].map(L=>(
            <div key={L} style={{display:'flex', gap:8, marginBottom:6}}>
              <span style={{width:20, color:'#D4AF37'}}>{L}</span>
              <input value={abcde[L]} disabled={!isToday} onChange={e=>setAbcde({...abcde,[L]:e.target.value})}
                style={{flex:1, padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6'}} />
            </div>
          ))}
        </div>

        <div style={{border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:16, marginBottom:20}}>
          <h3 style={{color:'#D4AF37'}}>☾ 3. Cierre y Autoevaluación</h3>
          <label>¿Qué hice bien hoy?</label>
          <textarea value={wentWell} disabled={!isToday} onChange={e=>setWentWell(e.target.value)}
            style={{width:'100%', padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6', marginBottom:10}} rows={2} />
          <label>¿Qué haría de manera diferente mañana?</label>
          <textarea value={doDiff} disabled={!isToday} onChange={e=>setDoDiff(e.target.value)}
            style={{width:'100%', padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6'}} rows={2} />
        </div>

        {isToday && (
          <div style={{textAlign:'center'}}>
            <button onClick={handleSave} disabled={saving}
              style={{padding:'10px 24px', borderRadius:20, background:'#D4AF37', border:'none', fontWeight:'bold'}}>
              Guardar entrada
            </button>
            <p style={{color:'#818CF8', fontSize:13, marginTop:8}}>{status}</p>
          </div>
        )}

        <p style={{textAlign:'center', color:'#a9a3c9', marginTop:30, fontSize:12}}>Leph ⟁ Heka</p>
      </div>
    </div>
  )
                                    }
