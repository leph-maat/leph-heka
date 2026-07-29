'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const MERCADOPAGO_LINK = 'https://mpago.la/1o9RTMx'

const THEMES = {
  asombro:   { label:'Asombro',    bg:'#1a1206', accent:'#D4AF37', glow:'#F5D77A' },
  motivacion:{ label:'Motivación', bg:'#210a17', accent:'#C23B6B', glow:'#FF7A45' },
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

const REVEAL_MESSAGES = {
  alto: 'Un mes entero, y tu voz no vaciló. Lo que escribiste en silencio, tu cuerpo ya empezó a creerlo. Esta es la lista que sembraste — mirala, y notá cuánto de vos ya es ella.',
  medio: 'Hubo días de fuego y días de niebla, pero volviste una y otra vez. Eso también es voluntad — la que no se ve, la que insiste. Acá está lo que escribiste hace un mes. Leelo con los ojos de quien ya cambió un poco.',
  bajo: 'El mes fue disperso — lo sabés mejor que nadie. Pero escribiste. Volviste, aunque sea a los tropezones. Esa constancia imperfecta también reconfigura algo. Acá está tu punto de partida, sin juicio, solo para que lo veas.',
}

export default function Page(){
  const [session, setSession] = useState(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass] = useState('')
  const [authPassConfirm, setAuthPassConfirm] = useState('')
  const [authMsg, setAuthMsg] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const [profile, setProfile] = useState(null)
  const [exempt, setExempt] = useState(false)
  const [accessChecked, setAccessChecked] = useState(false)
  const [reveal, setReveal] = useState(null)

  const [visualMode, setVisualMode] = useState('orbes')
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

  const ACTIVE_THEMES = THEMES

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
    e.preventDefault()
    if(authPass !== authPassConfirm){ setAuthMsg('Las contraseñas no coinciden'); return }
    if(authPass.length < 6){ setAuthMsg('La contraseña debe tener al menos 6 caracteres'); return }
    setAuthMsg('Creando cuenta...')
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPass })
    setAuthMsg(error ? error.message : 'Cuenta creada. Ya podés iniciar sesión.')
    if(!error){ setIsSignUp(false); setAuthEmail(''); setAuthPass(''); setAuthPassConfirm('') }
  }

  async function handleForgotPassword(){
    if(!authEmail){ setAuthMsg('Escribí tu email arriba primero, y tocá de nuevo.'); return }
    setAuthMsg('Enviando link de recuperación...')
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
      redirectTo: 'https://leph-heka.vercel.app/reset-password'
    })
    setAuthMsg(error ? error.message : 'Listo — revisá tu email para el link de recuperación.')
  }

  async function handleLogout(){
    await supabase.auth.signOut()
    setProfile(null)
    setExempt(false)
    setAccessChecked(false)
    setReveal(null)
  }

  useEffect(()=>{ if(session) checkAccess() }, [session])

  async function checkAccess(){
    const uid = session.user.id
    const email = session.user.email

    let { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    if(!prof){
      const { data: created } = await supabase.from('profiles')
        .insert({ id: uid, email, trial_start: new Date().toISOString() })
        .select().maybeSingle()
      prof = created
    }
    setProfile(prof)

    const { data: ex } = await supabase.from('exempt_emails').select('email').eq('email', email).maybeSingle()
    setExempt(!!ex)

    setAccessChecked(true)
    await loadDate(viewDate)
    await checkMonthlyReveal(uid)
  }

  function hasAccess(){
    if(exempt) return true
    if(profile?.is_paid) return true
    if(!profile?.trial_start) return false
    const start = new Date(profile.trial_start)
    const diffDays = (Date.now() - start.getTime()) / (1000*60*60*24)
    return diffDays <= 3
  }

  function trialDaysLeft(){
    if(!profile?.trial_start) return 0
    const start = new Date(profile.trial_start)
    const diffDays = (Date.now() - start.getTime()) / (1000*60*60*24)
    return Math.max(0, Math.ceil(3 - diffDays))
  }

  function accountStatusLabel(){
    if(exempt) return { text: 'Cuenta exenta — acceso ilimitado', color: '#818CF8' }
    if(profile?.is_paid) return { text: 'Suscripción activa — $6.000 ARS/mes', color: '#4ADE80' }
    const left = trialDaysLeft()
    return { text: `Prueba gratuita — ${left} día${left===1?'':'s'} restante${left===1?'':'s'}`, color: '#D4AF37' }
  }

  async function checkMonthlyReveal(uid){
    const { data: baseline } = await supabase.from('baseline').select('*').eq('user_id', uid).maybeSingle()
    if(!baseline) return

    const baselineDate = new Date(baseline.baseline_date)
    const daysSince = Math.floor((today - baselineDate) / (1000*60*60*24))
    const currentCycle = Math.floor(daysSince / 30)
    if(currentCycle < 1) return

    const { data: sm } = await supabase.from('streak_meta').select('*').eq('user_id', uid).maybeSingle()
    const lastRevealedCycle = sm?.last_cycle_revealed
      ? Math.floor((new Date(sm.last_cycle_revealed) - baselineDate) / (1000*60*60*24*30))
      : -1
    if(lastRevealedCycle >= currentCycle) return

    const cycleStart = new Date(baselineDate); cycleStart.setDate(cycleStart.getDate() + (currentCycle-1)*30)
    const cycleEnd = new Date(baselineDate); cycleEnd.setDate(cycleEnd.getDate() + currentCycle*30)
    const rangeStart = new Date(cycleStart); rangeStart.setDate(rangeStart.getDate()-6)

    const { data: weeks } = await supabase.from('week_locks')
      .select('*').eq('user_id', uid)
      .gte('week_start', toKey(rangeStart)).lte('week_start', toKey(cycleEnd))

    let matched = 0
    ;(weeks||[]).forEach(w=>{
      ['mo','tu','we','th','fr','sa','su'].forEach(d=>{ if(w[d]) matched++ })
    })

    const tier = matched >= 24 ? 'alto' : matched >= 12 ? 'medio' : 'bajo'
    setReveal({ tier, message: REVEAL_MESSAGES[tier], metas: baseline.metas, matched })

    await supabase.from('streak_meta').upsert({
      user_id: uid, last_cycle_revealed: toKey(today), streak: sm?.streak || 0
    }, { onConflict: 'user_id' })
  }

  useEffect(()=>{ if(session && accessChecked) loadDate(viewDate) }, [viewDate])

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

  useEffect(()=>{
    const canvas = canvasRef.current
    if(!canvas) return
    const ctx = canvas.getContext('2d')
    function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)

    let t0 = 0, raf
    function hexToRgb(hex){ const n = parseInt(hex.replace('#',''),16); return [(n>>16)&255,(n>>8)&255,n&255] }

    if(visualMode === 'orbes'){
      const veils = [
        { key:'glow', phx:0.7, phy:1.3, spx:0.06, spy:0.045, rx:0.55, alpha:0.30 },
        { key:'accent', phx:2.1, phy:0.4, spx:0.05, spy:0.06, rx:0.42, alpha:0.24 },
        { key:'gold', phx:4.0, phy:2.6, spx:0.045, spy:0.05, rx:0.36, alpha:0.16 },
      ]
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
    } else {
      // Modo Lava: mismo tema activo (Asombro/Motivación/Calma/Foco), 
      // pero renderizado como blobs que se funden entre sí (estilo lámpara de lava)
      const blobs = Array.from({length:7}).map((_,i)=>({
        baseX: 0.15 + (i%4)*0.25 + Math.random()*0.1,
        speed: 0.15 + Math.random()*0.2,
        phase: Math.random()*10,
        baseR: 0.09 + Math.random()*0.07,
        dir: i%2===0 ? 1 : -1,
      }))
      function draw(){
        t0 += 0.006
        const w = canvas.width, h = canvas.height
        const th = THEMES[theme]
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = th.bg
        ctx.fillRect(0,0,w,h)
        const [ar,ag,ab] = hexToRgb(th.accent)
        const [gr,gg,gb] = hexToRgb(th.glow)
        blobs.forEach((b,i)=>{
          const cx = w * (b.baseX + Math.sin(t0*b.speed*b.dir + b.phase) * 0.18)
          const cy = h * ((0.15 + (i*0.7/blobs.length)) + Math.sin(t0*b.speed*0.7 + b.phase*1.3) * 0.5 + Math.sin(t0*0.15)*0.15)
          const r = Math.max(w,h) * b.baseR * (1 + Math.sin(t0*0.5+b.phase)*0.25)
          const [cr,cg,cb] = i % 2 === 0 ? [ar,ag,ab] : [gr,gg,gb]
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`
          ctx.beginPath()
          ctx.arc(cx, ((cy % (h*1.4)) + h*0.2) % (h*1.2) - h*0.1, r, 0, Math.PI*2)
          ctx.fill()
        })
        raf = requestAnimationFrame(draw)
      }
      draw()
    }

    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [theme, visualMode])

  useEffect(()=>{
    if(!ambient) return
    let idx = THEME_ORDER.indexOf(theme)
    const id = setInterval(()=>{
      idx = (idx+1) % THEME_ORDER.length
      setTheme(THEME_ORDER[idx])
    }, 30000)
    return ()=> clearInterval(id)
  }, [ambient])

  if(!session){
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050414', color:'#EDEAF6'}}>
        <form style={{width:320, padding:28}}>
          <h2 style={{color:'#D4AF37', textAlign:'center', marginBottom:24}}>Leph - Heka</h2>

          {!isSignUp ? (
            <>
              <input placeholder="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
                style={{width:'100%', padding:10, marginBottom:10, background:'#1a1a2e', border:'1px solid rgba(212,175,55,0.3)', color:'#EDEAF6', borderRadius:6}} />
              <input placeholder="contraseña" type="password" value={authPass} onChange={e=>setAuthPass(e.target.value)}
                style={{width:'100%', padding:10, marginBottom:16, background:'#1a1a2e', border:'1px solid rgba(212,175,55,0.3)', color:'#EDEAF6', borderRadius:6}} />
              <button onClick={handleSignIn} style={{width:'100%', padding:10, marginBottom:8, background:'#D4AF37', color:'#150f02', borderRadius:6, border:'none', fontWeight:'bold', cursor:'pointer'}}>
                Ingresar
              </button>
              <button type="button" onClick={()=>{setIsSignUp(true); setAuthMsg('')}} 
                style={{width:'100%', padding:10, background:'transparent', border:'1px solid #D4AF37', color:'#D4AF37', borderRadius:6, fontWeight:'bold', cursor:'pointer'}}>
                Registrarse
              </button>
              <button type="button" onClick={handleForgotPassword}
                style={{width:'100%', padding:8, marginTop:8, background:'transparent', border:'none', color:'#818CF8', fontSize:13, textDecoration:'underline', cursor:'pointer'}}>
                ¿Olvidaste tu contraseña?
              </button>
            </>
          ) : (
            <>
              <input placeholder="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}
                style={{width:'100%', padding:10, marginBottom:10, background:'#1a1a2e', border:'1px solid rgba(212,175,55,0.3)', color:'#EDEAF6', borderRadius:6}} />
              <input placeholder="contraseña" type="password" value={authPass} onChange={e=>setAuthPass(e.target.value)}
                style={{width:'100%', padding:10, marginBottom:10, background:'#1a1a2e', border:'1px solid rgba(212,175,55,0.3)', color:'#EDEAF6', borderRadius:6}} />
              <input placeholder="confirmar contraseña" type="password" value={authPassConfirm} onChange={e=>setAuthPassConfirm(e.target.value)}
                style={{width:'100%', padding:10, marginBottom:16, background:'#1a1a2e', border:'1px solid rgba(212,175,55,0.3)', color:'#EDEAF6', borderRadius:6}} />
              <button onClick={handleSignUp} style={{width:'100%', padding:10, marginBottom:8, background:'#D4AF37', color:'#150f02', borderRadius:6, border:'none', fontWeight:'bold', cursor:'pointer'}}>
                Crear cuenta
              </button>
              <button type="button" onClick={()=>{setIsSignUp(false); setAuthMsg('')}} 
                style={{width:'100%', padding:10, background:'transparent', border:'1px solid #818CF8', color:'#818CF8', borderRadius:6, fontWeight:'bold', cursor:'pointer'}}>
                ← Volver al login
              </button>
            </>
          )}
          <p style={{fontSize:12, color:'#a9a3c9', textAlign:'center', marginTop:12}}>{authMsg}</p>

          <div style={{display:'flex', gap:8, marginTop:20, justifyContent:'center', flexWrap:'wrap', fontSize:12}}>
            <a href="/legal" style={{color:'#818CF8', textDecoration:'none'}}>Privacidad</a>
            <span style={{color:'#a9a3c9'}}>•</span>
            <a href="/how-it-works" style={{color:'#818CF8', textDecoration:'none'}}>Cómo funciona</a>
          </div>
        </form>
      </div>
    )
  }

  if(!accessChecked){
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050414', color:'#a9a3c9'}}>
        Cargando...
      </div>
    )
  }

  if(!hasAccess()){
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050414', color:'#EDEAF6', padding:24}}>
        <div style={{maxWidth:380, textAlign:'center'}}>
          <h2 style={{color:'#D4AF37'}}>Leph - Heka</h2>
          <p style={{color:'#a9a3c9', lineHeight:1.6}}>
            Tu prueba de 3 días terminó. Si sentiste el enfoque, este es el momento de sostenerlo.
          </p>
          <a href={MERCADOPAGO_LINK} target="_blank" rel="noreferrer"
            style={{display:'inline-block', margin:'16px 0', padding:'12px 28px', background:'#D4AF37', color:'#150f02', borderRadius:20, fontWeight:'bold', textDecoration:'none'}}>
            Suscribirme
          </a>
          <p style={{color:'#818CF8', fontSize:13, fontStyle:'italic', lineHeight:1.6}}>
            Y si no es ahora, llevate esto con vos: seguí escribiendo, aunque sea en papel. Eso ya vale.
          </p>
          <button onClick={handleLogout} style={{marginTop:20, background:'transparent', border:'none', color:'#a9a3c9', fontSize:13, textDecoration:'underline', cursor:'pointer'}}>
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  if(reveal){
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050414', color:'#EDEAF6', padding:24}}>
        <div style={{maxWidth:500}}>
          <h2 style={{color:'#D4AF37', textAlign:'center'}}>⟁</h2>
          <p style={{fontStyle:'italic', lineHeight:1.7, textAlign:'center', color:'#EDEAF6'}}>{reveal.message}</p>
          <div style={{border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:16, marginTop:20}}>
            {reveal.metas.map((m,i)=>(
              <p key={i} style={{margin:'6px 0', color:'#a9a3c9'}}>{i+1}. Yo {m}</p>
            ))}
          </div>
          <div style={{textAlign:'center', marginTop:20}}>
            <button onClick={()=>setReveal(null)}
              style={{padding:'10px 24px', borderRadius:20, background:'#D4AF37', border:'none', fontWeight:'bold'}}>
              Continuar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const order = ['mo','tu','we','th','fr','sa','su']
  const labels = {mo:'Lun',tu:'Mar',we:'Mié',th:'Jue',fr:'Vie',sa:'Sáb',su:'Dom'}
  const acctStatus = accountStatusLabel()

  return (
    <div style={{position:'relative', minHeight:'100vh'}}>
      <div style={{position:'fixed', inset:0, zIndex:0, filter: visualMode==='lava' ? 'blur(8px) contrast(28) brightness(0.95)' : 'none', overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%', height:'100%', display:'block'}} />
      </div>
      <div style={{position:'relative', zIndex:1, maxWidth:780, margin:'0 auto', padding:'32px 20px 80px'}}>
        <div style={{display:'flex', justifyContent:'flex-end', marginBottom:8}}>
          <button onClick={handleLogout} style={{background:'transparent', border:'none', color:'#a9a3c9', fontSize:12, textDecoration:'underline', cursor:'pointer'}}>
            Cerrar sesión
          </button>
        </div>

        <h1 style={{textAlign:'center', color:'#D4AF37'}}>LEPH — HEKA</h1>
        <p style={{textAlign:'center', fontStyle:'italic', color:'#a9a3c9'}}>
          "Tu destino lo determinan tus decisiones, no tus condiciones."
        </p>

        <div style={{border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:'10px 16px', margin:'16px 0', textAlign:'center'}}>
          <p style={{color: acctStatus.color, fontSize:13, margin:0}}>{acctStatus.text}</p>
          {!exempt && !profile?.is_paid && (
            <a href={MERCADOPAGO_LINK} target="_blank" rel="noreferrer"
              style={{display:'inline-block', marginTop:8, padding:'6px 16px', background:'#D4AF37', color:'#150f02', borderRadius:16, fontSize:12, fontWeight:'bold', textDecoration:'none'}}>
              Suscribirme
            </a>
          )}
        </div>

        <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', margin:'16px 0'}}>
          {THEME_ORDER.map(k=>(
            <button key={k} onClick={()=>{ setAmbient(false); setTheme(k) }}
              style={{padding:'6px 12px', borderRadius:20, border:'1px solid #D4AF37', color: theme===k?'#D4AF37':'#a9a3c9', background:'transparent', cursor:'pointer'}}>
              {ACTIVE_THEMES[k].label}
            </button>
          ))}
          <button onClick={()=>setAmbient(!ambient)}
            style={{padding:'6px 12px', borderRadius:20, border:'1px solid #818CF8', color:'#818CF8', background: ambient?'rgba(129,140,248,0.15)':'transparent', cursor:'pointer'}}>
            {ambient ? '◈ Ambiente' : '◇ Ambiente'}
          </button>
          <button onClick={()=>setVisualMode(visualMode==='orbes' ? 'lava' : 'orbes')}
            style={{padding:'6px 12px', borderRadius:20, border:'1px solid #D4AF37', color:'#D4AF37', background:'transparent', cursor:'pointer', fontSize:12}}>
            {visualMode === 'orbes' ? '🌋 Lava' : '✦ Orbes'}
          </button>
        </div>

        <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:16, marginBottom:20}}>
          <button onClick={()=> setViewDate(d=>{ const n=new Date(d); n.setDate(n.getDate()-1); return n })} style={{background:'transparent', border:'none', color:'#D4AF37', cursor:'pointer', fontSize:18}}>‹</button>
          <div>{fmtLong(viewDate)}</div>
          <button disabled={isToday} onClick={()=> setViewDate(d=>{ const n=new Date(d); n.setDate(n.getDate()+1); return n })} style={{background:'transparent', border:'none', color:'#D4AF37', cursor:'pointer', fontSize:18, opacity: isToday ? 0.5 : 1}}>›</button>
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
                }} placeholder="Yo..." style={{flex:1, padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6', borderRadius:4}} />
              </div>
            ))
          ) : (
            <p style={{fontStyle:'italic', color:'#a9a3c9'}}>Las metas de días pasados permanecen selladas.</p>
          )}
        </div>

        <div style={{border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:16, marginBottom:20}}>
          <h3 style={{color:'#D4AF37'}}>🐸 2. Planificación Diaria</h3>
          <label style={{display:'block', marginBottom:6, color:'#D4AF37'}}>Sapo del día</label>
          <input value={sapo} disabled={!isToday} onChange={e=>setSapo(e.target.value)}
            style={{width:'100%', padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6', marginBottom:10, borderRadius:4}} />
          {['A','B','C','D','E'].map(L=>(
            <div key={L} style={{display:'flex', gap:8, marginBottom:6}}>
              <span style={{width:20, color:'#D4AF37'}}>{L}</span>
              <input value={abcde[L]} disabled={!isToday} onChange={e=>setAbcde({...abcde,[L]:e.target.value})}
                style={{flex:1, padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6', borderRadius:4}} />
            </div>
          ))}
        </div>

        <div style={{border:'1px solid rgba(212,175,55,0.25)', borderRadius:10, padding:16, marginBottom:20}}>
          <h3 style={{color:'#D4AF37'}}>☾ 3. Cierre y Autoevaluación</h3>
          <label style={{display:'block', marginBottom:6, color:'#D4AF37'}}>¿Qué hice bien hoy?</label>
          <textarea value={wentWell} disabled={!isToday} onChange={e=>setWentWell(e.target.value)}
            style={{width:'100%', padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6', marginBottom:10, borderRadius:4}} rows={2} />
          <label style={{display:'block', marginBottom:6, color:'#D4AF37'}}>¿Qué haría de manera diferente mañana?</label>
          <textarea value={doDiff} disabled={!isToday} onChange={e=>setDoDiff(e.target.value)}
            style={{width:'100%', padding:8, background:'rgba(0,0,0,0.25)', border:'1px solid rgba(212,175,55,0.25)', color:'#EDEAF6', borderRadius:4}} rows={2} />
        </div>

        {isToday && (
          <div style={{textAlign:'center'}}>
            <button onClick={handleSave} disabled={saving}
              style={{padding:'10px 24px', borderRadius:20, background:'#D4AF37', border:'none', fontWeight:'bold', cursor:'pointer', opacity: saving ? 0.6 : 1}}>
              Guardar entrada
            </button>
            <p style={{color:'#818CF8', fontSize:13, marginTop:8}}>{status}</p>
          </div>
        )}

        <div style={{display:'flex', gap:8, marginTop:30, justifyContent:'center', flexWrap:'wrap', fontSize:12}}>
          <a href="/legal" style={{color:'#818CF8', textDecoration:'none'}}>Privacidad y Términos</a>
          <span style={{color:'#a9a3c9'}}>•</span>
          <a href="/how-it-works" style={{color:'#818CF8', textDecoration:'none'}}>Cómo funciona</a>
          <span style={{color:'#a9a3c9'}}>•</span>
          <button onClick={handleLogout} style={{background:'transparent', border:'none', color:'#818CF8', fontSize:12, cursor:'pointer', padding:0}}>Cerrar sesión</button>
        </div>

        <p style={{textAlign:'center', color:'#a9a3c9', marginTop:12, fontSize:12}}>Leph ⟁ Heka</p>
      </div>
    </div>
  )
}
