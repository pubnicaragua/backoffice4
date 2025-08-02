// Documentación de endpoints API para integración POS
export const POSApiDocumentation = {
  baseUrl: 'https://tu-dominio.com/api/pos',
  
  endpoints: {
    // Autenticación de terminal
    authenticate: {
      method: 'POST',
      path: '/auth/terminal',
      description: 'Autenticar terminal POS',
      payload: {
        terminal_code: 'string',
        mac_address: 'string',
        api_key: 'string'
      },
      response: {
        token: 'string',
        expires_in: 'number',
        terminal_id: 'uuid'
      }
    },

    // Sincronizar productos
    syncProducts: {
      method: 'GET',
      path: '/sync/products/:terminal_id',
      description: 'Obtener productos actualizados para el POS',
      headers: {
        'Authorization': 'Bearer {token}',
        'Content-Type': 'application/json'
      },
      response: {
        products: [
          {
            id: 'uuid',
            codigo: 'string',
            nombre: 'string',
            precio: 'number',
            stock: 'number',
            activo: 'boolean'
          }
        ],
        last_sync: 'timestamp'
      }
    },

    // Sincronizar promociones
    syncPromotions: {
      method: 'GET',
      path: '/sync/promotions/:terminal_id',
      description: 'Obtener promociones activas para el POS',
      response: {
        promotions: [
          {
            id: 'uuid',
            nombre: 'string',
            descripcion: 'string',
            precio_prom: 'number',
            fecha_inicio: 'date',
            fecha_fin: 'date',
            activo: 'boolean'
          }
        ]
      }
    },

    // Enviar transacción
    sendTransaction: {
      method: 'POST',
      path: '/transactions',
      description: 'Enviar transacción desde POS al back office',
      payload: {
        terminal_id: 'uuid',
        transaction_type: 'sale|refund|void',
        items: [
          {
            producto_id: 'uuid',
            cantidad: 'number',
            precio_unitario: 'number'
          }
        ],
        payment_method: 'cash|card|digital_wallet',
        payment_provider_id: 'uuid',
        external_transaction_id: 'string',
        total_amount: 'number'
      },
      response: {
        transaction_id: 'uuid',
        status: 'approved|rejected|pending',
        folio: 'string'
      }
    },

    // Webhooks para proveedores de pago
    webhooks: {
      mercadoPago: {
        method: 'POST',
        path: '/webhooks/mercado-pago',
        description: 'Webhook para notificaciones de Mercado Pago',
        payload: {
          id: 'number',
          live_mode: 'boolean',
          type: 'payment',
          date_created: 'timestamp',
          application_id: 'number',
          user_id: 'number',
          version: 'number',
          api_version: 'string',
          action: 'payment.created|payment.updated',
          data: {
            id: 'string'
          }
        }
      },

      sumUp: {
        method: 'POST',
        path: '/webhooks/sumup',
        description: 'Webhook para notificaciones de SumUp',
        payload: {
          event_type: 'PAYMENT_SUCCESSFUL|PAYMENT_FAILED',
          resource_type: 'TXN',
          resource_id: 'string',
          timestamp: 'timestamp'
        }
      },

      transbank: {
        method: 'POST',
        path: '/webhooks/transbank',
        description: 'Webhook para notificaciones de Transbank',
        payload: {
          buy_order: 'string',
          session_id: 'string',
          amount: 'number',
          response_code: 'number',
          authorization_code: 'string'
        }
      },

      getNet: {
        method: 'POST',
        path: '/webhooks/getnet',
        description: 'Webhook para notificaciones de GetNet',
        payload: {
          payment_id: 'string',
          order_id: 'string',
          status: 'APPROVED|DENIED|PENDING',
          amount: 'number',
          currency: 'string'
        }
      }
    }
  },

  // Flujo de integración
  integrationFlow: {
    step1: 'Terminal POS se autentica usando terminal_code y api_key',
    step2: 'Terminal recibe token de acceso válido por tiempo limitado',
    step3: 'Terminal sincroniza productos y promociones cada X minutos',
    step4: 'Terminal procesa venta y envía transacción al back office',
    step5: 'Proveedor de pago envía webhook con resultado de transacción',
    step6: 'Back office actualiza estado de transacción y stock',
    step7: 'Terminal recibe confirmación y imprime comprobante'
  },

  // Configuración de seguridad
  security: {
    authentication: 'Bearer Token con expiración',
    encryption: 'HTTPS/TLS 1.2 mínimo',
    apiKeys: 'Rotación automática cada 30 días',
    webhookValidation: 'Firma HMAC-SHA256',
    rateLimiting: '100 requests por minuto por terminal'
  }
};

// Ejemplo de implementación del cliente POS
export const POSClientExample = `
// Ejemplo de cliente JavaScript para POS
class SolvendoPOSClient {
  constructor(terminalCode, apiKey, baseUrl) {
    this.terminalCode = terminalCode;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.token = null;
    this.terminalId = null;
  }

  async authenticate() {
    const response = await fetch(\`\${this.baseUrl}/auth/terminal\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        terminal_code: this.terminalCode,
        mac_address: this.getMacAddress(),
        api_key: this.apiKey
      })
    });
    
    const data = await response.json();
    this.token = data.token;
    this.terminalId = data.terminal_id;
    
    return data;
  }

  async syncProducts() {
    const response = await fetch(\`\${this.baseUrl}/sync/products/\${this.terminalId}\`, {
      headers: { 'Authorization': \`Bearer \${this.token}\` }
    });
    
    return await response.json();
  }

  async sendTransaction(transactionData) {
    const response = await fetch(\`\${this.baseUrl}/transactions\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.token}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        terminal_id: this.terminalId,
        ...transactionData
      })
    });
    
    return await response.json();
  }

  getMacAddress() {
    // Implementación específica del terminal
    return 'XX:XX:XX:XX:XX:XX';
  }
}

// Uso del cliente
const posClient = new SolvendoPOSClient('POS-001', 'api_key_here', 'https://api.solvendo.com');

// Autenticar
await posClient.authenticate();

// Sincronizar productos
const products = await posClient.syncProducts();

// Enviar transacción
const transaction = await posClient.sendTransaction({
  transaction_type: 'sale',
  items: [
    { producto_id: 'uuid', cantidad: 2, precio_unitario: 1500 }
  ],
  payment_method: 'card',
  total_amount: 3000
});
`;