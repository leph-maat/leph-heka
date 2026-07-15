import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req) {
  const { baselineMetas, todayMetas } = await req.json();

  const prompt = `Compara estas dos listas de 10 metas personales escritas en primera persona. La Lista Base es la referencia original; la Lista de Hoy fue escrita de memoria, sin ver la primera. Conta cuantas metas de la Lista de Hoy comparten el mismo nucleo semantico con alguna meta de la Lista Base. Responde SOLO con JSON: {"matched": N}

Lista Base:
${baselineMetas.map((m,i)=>`${i+1}. ${m||'(vacio)'}`).join('\n')}

Lista de Hoy:
${todayMetas.map((m,i)=>`${i+1}. ${m||'(vacio)'}`).join('\n')}`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content.find(b => b.type === 'text')?.text || '{"matched":0}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return Response.json({ matched: parsed.matched });
  } catch (e) {
    console.error(e);
    return Response.json({ matched: -1 }, { status: 500 });
  }
}
