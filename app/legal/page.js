'use client'

export default function LegalPage(){
  const privacy = `# LEPH — HEKA
## Política de Privacidad y Términos de Uso

*Última actualización: julio 2026*

---

## 1. Qué es Heka

Leph - Heka es un diario digital de alto rendimiento personal. No es un producto médico,
terapéutico ni un sustituto de atención psicológica o psiquiátrica profesional. Si estás
atravesando una crisis emocional o de salud mental, buscá ayuda de un profesional o de
una línea de asistencia en tu país — Heka no está diseñado para ese propósito.

## 2. Qué datos guardamos

Cuando usás Heka, guardamos:

- Tu email y contraseña (la contraseña nunca la vemos en texto plano — la maneja
  Supabase de forma encriptada, nosotros no tenemos acceso a ella)
- Las entradas que escribís en el diario: tus 10 metas diarias, tu "Sapo del día",
  tu planificación ABCDE, y tus respuestas de cierre nocturno
- Metadatos de uso: fechas de entrada, estado de tu prueba gratuita o suscripción

## 3. Qué NO hacemos con tus datos

- **Nunca vendemos ni compartimos** tus datos con terceros para publicidad ni ningún
  otro fin comercial
- **Nunca leemos tus metas manualmente** — el único procesamiento automático es el
  matching semántico de la Regla de Oro, que corre en un servidor y no involucra
  revisión humana de tu contenido
- Tus 10 metas diarias **nunca se muestran de nuevo en la interfaz** después de
  escribirlas, ni siquiera a vos mismo, salvo en la revelación mensual de tu Lista Base
  original — esa es una función central del producto, no un descuido

## 4. Con quién compartimos datos (proveedores técnicos)

Para que Heka funcione, tus datos pasan por:

- **Supabase** (alojamiento de base de datos y autenticación) — https://supabase.com
- **Vercel** (alojamiento de la aplicación) — https://vercel.com
- **Anthropic** (procesamiento del matching semántico, sin revisión humana) — https://www.anthropic.com

Cada uno tiene sus propias políticas de seguridad; no compartimos tus datos con nadie más.

## 5. Tus derechos

Podés pedir en cualquier momento:
- Que te enviemos una copia de tus datos
- Que eliminemos tu cuenta y todos tus datos de forma permanente

Escribiendo a: lephbrc@gmail.com

## 6. Suscripción y pagos

- Heka ofrece 3 días de prueba gratuita a partir del registro
- Al finalizar la prueba, continuar usando el diario requiere una suscripción paga de
  $6.000 ARS mensuales
- Los pagos se procesan a través de Mercado Pago; Heka no almacena datos de tarjetas
  ni de medios de pago
- Podés cancelar tu suscripción cuando quieras; el acceso continúa hasta el fin del
  período ya pagado
- No se realizan reembolsos por períodos parciales ya utilizados, salvo que la ley
  aplicable indique lo contrario

## 7. Cambios a estos términos

Si estos términos cambian de forma significativa, te vamos a avisar dentro de la
aplicación antes de que entren en vigencia.

## 8. Contacto

Cualquier consulta sobre privacidad o estos términos: lephbrc@gmail.com

---

*Leph ⟁ Heka*`

  const lines = privacy.split('\n')

  return (
    <div style={{position:'relative', minHeight:'100vh', background:'#050414', color:'#EDEAF6'}}>
      <div style={{maxWidth:780, margin:'0 auto', padding:'32px 20px 80px'}}>
        <h1 style={{textAlign:'center', color:'#D4AF37', marginBottom:8}}>Leph - Heka</h1>
        <p style={{textAlign:'center', fontSize:14, color:'#a9a3c9', marginBottom:24}}>Política de Privacidad y Términos de Uso</p>

        <div style={{lineHeight:1.8}}>
          {lines.map((line, i)=>{
            if(line.startsWith('# ')){
              return <h2 key={i} style={{fontSize:24, color:'#D4AF37', marginTop:24, marginBottom:16}}>{line.replace('# ','')}</h2>
            }
            if(line.startsWith('## ')){
              return <h3 key={i} style={{fontSize:18, color:'#D4AF37', marginTop:20, marginBottom:12}}>{line.replace('## ','')}</h3>
            }
            if(line.startsWith('- ')){
              return <p key={i} style={{marginLeft:16, marginBottom:8, color:'#a9a3c9'}}>{line}</p>
            }
            if(line.startsWith('*')){
              return <p key={i} style={{fontStyle:'italic', color:'#818CF8', textAlign:'center', marginTop:16, marginBottom:16}}>{line}</p>
            }
            if(line === '---'){
              return <hr key={i} style={{borderColor:'rgba(212,175,55,0.25)', marginTop:16, marginBottom:16}} />
            }
            if(line.trim() === ''){
              return <div key={i} style={{height:8}} />
            }
            return <p key={i} style={{marginBottom:8, color:'#a9a3c9'}}>{line}</p>
          })}
        </div>

        <div style={{textAlign:'center', marginTop:40}}>
          <a href="/" style={{color:'#818CF8', textDecoration:'none', fontSize:14}}>
            ← Volver a Leph - Heka
          </a>
        </div>
      </div>
    </div>
  )
                }
