import { NextRequest, NextResponse } from 'next/server';  
  
export async function POST(request: NextRequest) {  
  try {  
    const { message, context, empresa_id } = await request.json();  
  
    // Prompt especializado para consultas de voz empresariales  
    const systemPrompt = `Eres SolvIA Voice, asistente de voz especializado en gestión empresarial para Solvendo.  
  
CONTEXTO EMPRESARIAL ACTUAL:  
- Empresa ID: ${empresa_id}  
- Fecha: ${context.fecha}  
- Hora: ${context.hora}  
  
MÉTRICAS DEL DÍA:  
- Ventas: $${context.metricas_hoy.ventas.total.toLocaleString('es-CL')} (${context.metricas_hoy.ventas.cantidad} transacciones)  
- Ticket promedio: $${context.metricas_hoy.ventas.promedio.toLocaleString('es-CL')}  
- Mermas: ${context.metricas_hoy.mermas.cantidad} reportes por $${context.metricas_hoy.mermas.valor_total.toLocaleString('es-CL')}  
- Asistencias: ${context.metricas_hoy.asistencias.presentes} presentes, ${context.metricas_hoy.asistencias.ausentes} ausentes  
- Inventario: ${context.inventario.total_productos} productos, ${context.inventario.stock_bajo} con stock bajo  
  
PRODUCTOS CRÍTICOS:  
${context.inventario.productos_criticos.map(p => `- ${p.nombre}: ${p.stock} unidades (mínimo: ${p.minimo})`).join('\n')}  
  
SUCURSALES:  
${context.sucursales.map(s => `- ${s.nombre}: ${s.activa ? 'Activa' : 'Inactiva'}`).join('\n')}  
  
INSTRUCCIONES:  
- Responde en español chileno, de forma conversacional y directa  
- Usa datos específicos del contexto empresarial  
- Mantén respuestas concisas para audio (máximo 3 oraciones)  
- Si preguntan por ventas, menciona cifras exactas y comparaciones  
- Para inventario, destaca productos críticos  
- Para mermas, especifica tipos y valores  
- Sugiere acciones concretas cuando sea relevante  
- Si no tienes datos específicos, indica que necesitas más información  
  
Responde como si fueras un consultor empresarial experimentado hablando directamente al emprendedor.`;  
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {  
      method: 'POST',  
      headers: {  
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,  
        'Content-Type': 'application/json',  
      },  
      body: JSON.stringify({  
        model: 'gpt-3.5-turbo',  
        messages: [  
          { role: 'system', content: systemPrompt },  
          { role: 'user', content: message }  
        ],  
        max_tokens: 300,  
        temperature: 0.7,  
      }),  
    });  
  
    if (!response.ok) {  
      throw new Error(`OpenAI API error: ${response.status}`);  
    }  
  
    const data = await response.json();  
    const aiResponse = data.choices[0]?.message?.content || 'Lo siento, no pude procesar tu consulta.';  
  
    return NextResponse.json({ response: aiResponse });  
  } catch (error) {  
    console.error('Error in voice chat API:', error);  
    return NextResponse.json(  
      { response: 'Lo siento, hay un problema técnico. Por favor intenta de nuevo.' },  
      { status: 500 }  
    );  
  }  
}