const corsHeaders = {  
  'Access-Control-Allow-Origin': '*',  
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',  
  'Access-Control-Allow-Methods': 'POST, OPTIONS',  
}  
  
Deno.serve(async (req) => {  
  // Handle CORS preflight requests  
  if (req.method === 'OPTIONS') {  
    return new Response('ok', { headers: corsHeaders })  
  }  
  
  try {  
    const body = await req.text()  
    let message, context  
      
    try {  
      const parsed = JSON.parse(body)  
      message = parsed.message  
      context = parsed.context  
    } catch (e) {  
      message = body || 'Hola'  
      context = {}  
    }  
  
    // Respuestas más naturales y conversacionales en español  
    let response = "¡Hola! Soy SolvIA, tu asistente inteligente de Solvendo. "  
  
    if (message.toLowerCase().includes('ventas')) {  
      const totalVentas = context?.metricas?.ventas?.total || 0  
      const cantidadVentas = context?.metricas?.ventas?.cantidad || 0  
      const promedio = context?.metricas?.ventas?.promedio || 0  
        
      response = `Perfecto, te cuento sobre las ventas de hoy. `  
        
      if (totalVentas > 0) {  
        response += `Llevas $${totalVentas.toLocaleString('es-CL')} en total con ${cantidadVentas} transacciones realizadas. `  
          
        if (promedio > 0) {  
          response += `El ticket promedio está en $${Math.round(promedio).toLocaleString('es-CL')}. `  
        }  
          
        // Evaluación del rendimiento  
        if (totalVentas > 500000) {  
          response += "¡Excelente día de ventas! Vas muy bien. "  
        } else if (totalVentas > 200000) {  
          response += "Van bien las ventas hoy, buen ritmo. "  
        } else if (totalVentas > 50000) {  
          response += "Las ventas van moderadas, pero hay potencial para más. "  
        } else {  
          response += "Las ventas van despacio hoy, pero aún hay tiempo para mejorar. "  
        }  
      } else {  
        response += "Aún no tienes ventas registradas hoy. ¡Es hora de empezar a vender! "  
      }  
        
      if (context?.ultimasVentas?.length > 0) {  
        response += `Las últimas ventas fueron: ${context.ultimasVentas.map(v => `Folio ${v.folio} por $${parseFloat(v.total).toLocaleString('es-CL')}`).join(', ')}. `  
      }  
        
    } else if (message.toLowerCase().includes('inventario') || message.toLowerCase().includes('productos') || message.toLowerCase().includes('stock')) {  
      const totalProductos = context?.inventario?.total_productos || 0  
      const stockBajo = context?.inventario?.stock_bajo || 0  
      const productosCriticos = context?.inventario?.productos_criticos || []  
        
      response = `Te cuento sobre tu inventario. `  
      response += `Tienes ${totalProductos} productos registrados en total. `  
        
      if (stockBajo > 0) {  
        response += `¡Atención! Hay ${stockBajo} productos con stock bajo que necesitan reposición. `  
          
        if (productosCriticos.length > 0) {  
          response += `Los más críticos son: ${productosCriticos.map(p => `${p.nombre} (${p.stock} unidades, mínimo ${p.minimo})`).join(', ')}. `  
          response += "Te recomiendo hacer pedidos pronto para evitar quedarte sin stock. "  
        }  
      } else {  
        response += "¡Perfecto! Todos tus productos tienen stock suficiente. "  
      }  
        
      const totalMermas = context?.mermas?.total || 0  
      if (totalMermas > 0) {  
        response += `Tienes ${totalMermas} mermas reportadas en total. `  
      }  
        
    } else if (message.toLowerCase().includes('empleados') || message.toLowerCase().includes('colaboradores') || message.toLowerCase().includes('asistencia')) {  
      const totalEmpleados = context?.metricas?.colaboradores?.total || 0  
      const asistenciasHoy = context?.asistencias?.hoy || 0  
      const presentes = context?.asistencias?.presentes || 0  
      const ausentes = context?.asistencias?.ausentes || 0  
        
      response = `Te cuento sobre tu equipo de trabajo. `  
      response += `Tienes ${totalEmpleados} colaboradores registrados. `  
        
      if (asistenciasHoy > 0) {  
        response += `Hoy hay ${presentes} personas presentes`  
        if (ausentes > 0) {  
          response += ` y ${ausentes} ausentes`  
        }  
        response += `. `  
          
        const porcentajeAsistencia = totalEmpleados > 0 ? Math.round((presentes / totalEmpleados) * 100) : 0  
        if (porcentajeAsistencia >= 90) {  
          response += "¡Excelente asistencia del equipo! "  
        } else if (porcentajeAsistencia >= 70) {  
          response += "Buena asistencia general. "  
        } else {  
          response += "La asistencia podría mejorar. "  
        }  
      } else {  
        response += "Aún no hay registros de asistencia para hoy. "  
      }  
        
    } else if (message.toLowerCase().includes('mermas') || message.toLowerCase().includes('pérdidas')) {  
      const mermasHoy = context?.mermas?.hoy || 0  
      const totalMermas = context?.mermas?.total || 0  
        
      response = `Te informo sobre las mermas. `  
        
      if (mermasHoy > 0) {  
        response += `Hoy tienes ${mermasHoy} mermas reportadas. `  
      } else {  
        response += "¡Perfecto! No hay mermas reportadas hoy. "  
      }  
        
      if (totalMermas > 0) {  
        response += `En total tienes ${totalMermas} mermas registradas. `  
        response += "Te recomiendo revisar las causas principales para reducir las pérdidas. "  
      }  
        
    } else if (message.toLowerCase().includes('pos') || message.toLowerCase().includes('terminal')) {  
      const terminales = context?.metricas?.pos?.terminales || 0  
      const online = context?.metricas?.pos?.online || 0  
      const transaccionesHoy = context?.metricas?.pos?.transaccionesHoy || 0  
        
      response = `Estado de tus terminales POS: `  
      response += `Tienes ${terminales} terminales configurados, `  
      response += `${online} están en línea actualmente. `  
        
      if (transaccionesHoy > 0) {  
        response += `Hoy se han procesado ${transaccionesHoy} transacciones. `  
      }  
        
      if (online < terminales) {  
        response += "Revisa las terminales desconectadas para asegurar el servicio completo. "  
      }  
        
    } else if (message.toLowerCase().includes('sii') || message.toLowerCase().includes('folios') || message.toLowerCase().includes('facturación')) {  
      const foliosDisponibles = context?.metricas?.sii?.foliosDisponibles || 0  
        
      response = `Estado de facturación electrónica: `  
      response += `Tienes ${foliosDisponibles} folios CAF disponibles. `  
        
      if (foliosDisponibles < 100) {  
        response += "¡Atención! Te quedan pocos folios, solicita más al SII pronto. "  
      } else if (foliosDisponibles < 500) {  
        response += "Tienes folios suficientes, pero considera solicitar más pronto. "  
      } else {  
        response += "Perfecto, tienes folios suficientes para operar. "  
      }  
        
      response += `El sistema está configurado para ANROLTEC SPA (RUT: 78168951-3). `  
        
    } else if (message.toLowerCase().includes('caja') || message.toLowerCase().includes('dinero') || message.toLowerCase().includes('efectivo')) {  
      const movimientosHoy = context?.metricas?.caja?.movimientosHoy || 0  
        
      response = `Movimientos de caja: `  
        
      if (movimientosHoy > 0) {  
        response += `Hoy tienes ${movimientosHoy} movimientos registrados. `  
        response += "Recuerda mantener el control de ingresos y egresos actualizado. "  
      } else {  
        response += "No hay movimientos de caja registrados hoy. "  
      }  
        
    } else if (message.toLowerCase().includes('hola') || message.toLowerCase().includes('buenos días') || message.toLowerCase().includes('buenas tardes')) {  
      response = "¡Hola! ¿Cómo estás? Soy SolvIA y estoy aquí para ayudarte con tu negocio. "  
      response += "Puedo darte información sobre ventas, inventario, empleados, y mucho más. ¿Qué te gustaría saber? "  
        
    } else if (message.toLowerCase().includes('ayuda') || message.toLowerCase().includes('qué puedes hacer')) {  
      response = "¡Por supuesto! Puedo ayudarte con información sobre tu negocio. "  
      response += "Pregúntame sobre:\n"  
      response += "• 📊 **Ventas de hoy** - totales, promedios y últimas transacciones\n"  
      response += "• 📦 **Inventario** - stock disponible y productos críticos\n"  
      response += "• 👥 **Empleados** - asistencias y colaboradores\n"  
      response += "• 📉 **Mermas** - pérdidas y reportes\n"  
      response += "• 💳 **POS** - estado de terminales\n"  
      response += "• 📄 **SII** - folios electrónicos disponibles\n"  
      response += "• 💰 **Caja** - movimientos de dinero\n\n"  
      response += "Solo pregúntame lo que necesites saber. ¡Estoy aquí para ayudarte! "  
        
    } else {  
      // Respuesta por defecto más amigable  
      response = "Entiendo que quieres información sobre tu negocio. "  
      response += "Puedo ayudarte con datos específicos sobre:\n"  
      response += "• 📊 **Ventas** - ¿cómo van las ventas de hoy?\n"  
      response += "• 📦 **Inventario** - ¿hay productos con stock bajo?\n"  
      response += "• 👥 **Empleados** - ¿cómo está la asistencia?\n"  
      response += "• 📉 **Mermas** - ¿qué pérdidas tengo?\n"  
      response += "• 💳 **POS** y terminales de pago\n"  
      response += "• 📄 **Facturación** electrónica\n"  
      response += "• 💰 **Movimientos de caja**\n\n"  
      response += "¿Sobre qué te gustaría que te informe específicamente? "  
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
        response: 'Lo siento, hay un problema técnico en este momento. Por favor intenta de nuevo en unos segundos.',  
        error: error.message   
      }),  
      {  
        status: 200,  
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },  
      },  
    )  
  }  
})