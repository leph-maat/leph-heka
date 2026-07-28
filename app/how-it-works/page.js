'use client'

export default function HowItWorksPage(){
  const content = `# Cómo funciona Leph - Heka

## Qué es Heka

En la mitología egipcia, **Heka** es el poder mágico de la palabra hablada o escrita.
No es magia fantástica — es el reconocimiento de que cuando hablas o escribís algo
con convicción, reprogramás tu mente para creerlo y actuar en consecuencia.

Heka es la fuerza que hace que una intención escrita en presente ("Yo soy disciplinado")
se vuelva realidad a través de la repetición y la coherencia.

Por eso el diario se llama así: porque escribir tus metas **es** la magia.

---

## 1. El Método de las 10 Metas

Cada mañana, escribís 10 metas en presente. No son deseos, son afirmaciones:
en lugar de "Quiero ser más disciplinado", escribís "Yo soy disciplinado".

La magia está en la repetición: escribir la intención reprograma tu subconsciente.
Heka captura esas 10 metas el primer día (tu "Lista Base") y de ahí en más,
cada día compara silenciosamente si mantenés el enfoque en lo que realmente importa.

## 2. La Regla de Oro: Los Candados

A partir del segundo día, Heka compara tus nuevas metas con tu Lista Base usando IA.
Si hay coincidencia semántica (tu enfoque sigue siendo el mismo), se abre un 🔓 candado.

Los 7 candados de la semana te muestran de un vistazo si mantuviste el rumbo.
No es para juzgar — es para verte a vos mismo actuando con coherencia.

Si abrís al menos un candado en la semana, tu "Racha" suma +1.
Si pasá una semana sin coincidir con tu base, la racha se resetea sin culpa.

## 3. El Sapo del Día

Viene de Mark Twain: "Si tu trabajo es comerte un sapo, hacelo a primera hora".

Tu Sapo es la tarea más importante del día — no la más urgente,
sino la que más resistencia te da pero que, si la hacés, el resto fluye.

Lo escribís al lado de tu planificación ABCDE para dejar clara la prioridad.

## 4. Planificación ABCDE

Cada tarea tiene un nivel:
- **A:** Debe hacerse hoy (alto impacto)
- **B:** Conviene hacerla (impacto medio)
- **C:** Está bien hacerla (impacto bajo)
- **D:** Delegar (alguien más puede)
- **E:** Eliminar (no suma)

Tu Sapo casi siempre es A-1.

## 5. Cierre Nocturno

Antes de dormir, respondés dos preguntas:
- ¿Qué hice bien hoy?
- ¿Qué haría diferente mañana?

Es tu brújula para el día siguiente. No es autocrítica, es aprendizaje.

## 6. La Revelación Mensual (La Sorpresa)

A los 30 días desde tu Lista Base, sin aviso, Heka te muestra tu Lista Base original
más un mensaje personalizado según cómo fue tu mes:

- **Alto esfuerzo** (24+ candados): Se reconoce tu consistencia.
- **Esfuerzo medio** (12-23 candados): Se valida tu persistencia imperfecta.
- **Bajo esfuerzo** (<12): Se acepta el mes disperso, sin juicio.

Es un momento para ver cuánto ya cambió en vos desde hace un mes.

## 7. Los 3 Días de Prueba

Cuando te registrás, tenés 3 días completos para sentir cómo funciona.
Es suficiente para notar si el enfoque mental cambia.

Si querés seguir, la suscripción es $6.000 ARS/mes.
Si no, llevate lo que aprendiste — escribir metas es gratis en papel.

## 8. Los Fondos: Tu Espacio Mental

Cada fondo tiene una energía:
- **Asombro:** Para momentos de descubrimiento
- **Motivación:** Para días intensos
- **Calma:** Para reflexión profunda
- **Foco:** Para trabajo concentrado
- **Lava:** Para cuando querés intensidad y movimiento

El **Modo Ambiente** rota entre fondos cada 30 segundos si lo activás.

---

*Heka es tu espejo de coherencia. No es sobre ser perfecto — es sobre verte vos mismo actuando alineado con lo que dijiste que importaba.*`

  const lines = content.split('\n')

  return (
    <div style={{position:'relative', minHeight:'100vh', background:'#050414', color:'#EDEAF6'}}>
      <div style={{maxWidth:780, margin:'0 auto', padding:'32px 20px 80px'}}>
        <h1 style={{textAlign:'center', color:'#D4AF37', marginBottom:8}}>Cómo Funciona</h1>
        <p style={{textAlign:'center', fontSize:14, color:'#a9a3c9', marginBottom:24}}>Leph - Heka</p>

        <div style={{lineHeight:1.8}}>
          {lines.map((line, i)=>{
            if(line.startsWith('# ')){
              return <h2 key={i} style={{fontSize:24, color:'#D4AF37', marginTop:24, marginBottom:16}}>{line.replace('# ','')}</h2>
            }
            if(line.startsWith('## ')){
              return <h3 key={i} style={{fontSize:18, color:'#D4AF37', marginTop:20, marginBottom:12}}>{line.replace('## ','')}</h3>
            }
            if(line.startsWith('- **')){
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
