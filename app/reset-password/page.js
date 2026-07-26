'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function ResetPassword(){
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)

  async function handleUpdate(e){
    e.preventDefault()
    setMsg('Actualizando...')
    const { error } = await supabase.auth.updateUser({ password: pass })
    if(error){ setMsg(error.message); return }
    setDone(true)
    setMsg('Contraseña actualizada. Ya podés ingresar con la nueva.')
  }

  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#050414', color:'#EDEAF6'}}>
      <form onSubmit={handleUpdate} style={{width:300, padding:24}}>
        <h2 style={{color:'#D4AF37', textAlign:'center'}}>Nueva contraseña</h2>
        {!done && (
          <>
            <input placeholder="nueva contraseña" type="password" value={pass}
              onChange={e=>setPass(e.target.value)}
              style={{width:'100%', padding:10, marginBottom:10}} />
            <button type="submit" style={{width:'100%', padding:10}}>Actualizar contraseña</button>
          </>
        )}
        <p style={{fontSize:12, color:'#a9a3c9', textAlign:'center', marginTop:10}}>{msg}</p>
        {done && (
          <a href="/" style={{display:'block', textAlign:'center', color:'#818CF8', marginTop:10}}>
            Ir a Leph - Heka
          </a>
        )}
      </form>
    </div>
  )
          }
