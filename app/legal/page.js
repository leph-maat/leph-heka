'use client'
import { useState } from 'react'

export default function LegalPage(){
  const [section, setSection] = useState('privacy')

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
- Que eliminemos tu cuenta y todos tus datos de
