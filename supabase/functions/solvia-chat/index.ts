const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, // Use 204 No Content for preflight success
      headers: corsHeaders 
    })
  }

  try {
    const { message, context } = await req.json()

    // Enhanced AI response based on context
    let response = "¡Hola! Soy SolvIA, tu asistente inteligente de Solvendo. "

    if (message.toLowerCase().includes('ventas')) {
      const totalVentas = context?.metricas?.ventas?.total || 0
      response += `📊 **Ventas:** $${totalVentas.toLocaleString('es-CL')} total. `
      response += `Tienes ${context?.metricas?.ventas?.cantidad || 0} ventas registradas. `
      
      if (context?.ultimasVentas?.length > 0) {
        response += `Últimas ventas: ${context.ultimasVentas.map(v => `Folio ${v.folio} ($${v.total})`).join(', ')}. `
      }
    } else if (message.toLowerCase().includes('inventario') || message.toLowerCase().includes('productos')) {
      response += `📦 **Inventario:** ${context?.metricas?.inventario?.productos || 0} productos disponibles. `
      response += `Hay ${context?.metricas?.inventario?.mermas || 0} mermas reportadas. `
      
      if (context?.productos?.length > 0) {
        response += `Productos destacados: ${context.productos.map(p => `${p.nombre} ($${p.precio})`).join(', ')}. `
      }
    } else if (message.toLowerCase().includes('empleados') || message.toLowerCase().includes('colaboradores')) {
      response += `👥 **Colaboradores:** ${context?.metricas?.colaboradores?.total || 0} empleados registrados. `
      response += `Hoy hay ${context?.metricas?.colaboradores?.asistenciasHoy || 0} asistencias. `
    } else if (message.toLowerCase().includes('pos')) {
      response += `💳 **POS:** ${context?.metricas?.pos?.terminales || 0} terminales configurados. `
      response += `${context?.metricas?.pos?.online || 0} están en línea. `
      response += `Hoy: ${context?.metricas?.pos?.transaccionesHoy || 0} transacciones procesadas. `
    } else if (message.toLowerCase().includes('sii') || message.toLowerCase().includes('folios')) {
      response += `📄 **SII:** ${context?.metricas?.sii?.foliosDisponibles || 0} folios CAF disponibles. `
      response += `Sistema configurado para ANROLTEC SPA (RUT: 78168951-3). `
    } else if (message.toLowerCase().includes('caja')) {
      response += `💰 **Caja:** ${context?.metricas?.caja?.movimientosHoy || 0} movimientos registrados hoy. `
    } else {
      response += "¿En qué puedo ayudarte? Puedo darte información sobre:\n"
      response += "• 📊 **Ventas** y reportes\n"
      response += "• 📦 **Inventario** y productos\n"
      response += "• 👥 **Empleados** y asistencias\n"
      response += "• 💳 **POS** y terminales\n"
      response += "• 📄 **SII** y folios electrónicos\n"
      response += "• 💰 **Movimientos de caja**"
    }

    return new Response(
      JSON.stringify({ response }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('SolvIA Error:', error)
    return new Response(
      JSON.stringify({ 
        response: 'Lo siento, hay un problema técnico. Por favor intenta de nuevo.',
        error: error.message 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})