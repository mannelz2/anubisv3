# Integração Utmify

A integração com a Utmify foi implementada com sucesso para rastrear todas as transações e vendas do funil.

## Como Funciona

### 1. Fluxo Automático
Todas as transações são enviadas automaticamente para a Utmify quando:
- Uma transação é criada (status: `waiting_payment`)
- Uma transação é aprovada (status: `paid`)
- Uma transação é recusada (status: `refused`)
- Uma transação é reembolsada (status: `refunded`)
- Uma transação sofre chargeback (status: `chargedback`)

### 2. Webhooks Integrados
Os seguintes webhooks foram atualizados para enviar dados à Utmify:
- **Genesys Webhook** - `/functions/v1/genesys-webhook`
- **Mangofy Webhook** - `/functions/v1/mangofy-webhook`
- **Aureo Webhook** - `/functions/v1/aureo-webhook`

### 3. Edge Function Utmify
Nova edge function criada: `/functions/v1/utmify-integration`
- Recebe o ID da transação
- Busca os dados completos no banco
- Formata no padrão Utmify
- Envia para a API da Utmify

## Configuração

### 1. Adicionar Token da Utmify
No arquivo `.env`, adicione o token da API Utmify:

```env
VITE_UTMIFY_API_TOKEN=seu_token_aqui
```

**Onde encontrar o token:**
1. Acesse sua conta na Utmify
2. Vá em: Integrações > Webhooks > Credenciais de API
3. Clique em "Adicionar Credencial"
4. Copie o token gerado

### 2. Dados Enviados

A integração envia os seguintes dados para cada transação:

```json
{
  "orderId": "id_da_transacao",
  "platform": "NuBank",
  "paymentMethod": "pix",
  "status": "paid",
  "createdAt": "2024-12-04 15:30:45",
  "approvedDate": "2024-12-04 15:35:12",
  "refundedAt": null,
  "customer": {
    "name": "Nome do Cliente",
    "email": "email@cliente.com",
    "phone": "11999999999",
    "document": "12345678900",
    "country": "BR",
    "ip": "192.168.1.1"
  },
  "products": [
    {
      "id": "id_da_transacao",
      "name": "Desafio 30 dias",
      "quantity": 1,
      "priceInCents": 5747
    }
  ],
  "trackingParameters": {
    "src": "facebook",
    "sck": "campaign_123",
    "utm_source": "facebook",
    "utm_campaign": "campanha_teste",
    "utm_medium": "cpc",
    "utm_content": "anuncio_1",
    "utm_term": "emprestimo"
  },
  "commission": {
    "totalPriceInCents": 5747,
    "gatewayFeeInCents": 0,
    "userCommissionInCents": 5747,
    "currency": "BRL"
  },
  "isTest": false
}
```

## Status Mapeados

| Status no Sistema | Status Utmify |
|------------------|---------------|
| pending | waiting_payment |
| waiting_payment | waiting_payment |
| completed | paid |
| approved | paid |
| authorized | paid |
| refused | refused |
| failed | refused |
| cancelled | refused |
| refunded | refunded |
| chargedback | chargedback |

## Testes

### Testar Manualmente
Você pode testar a integração enviando uma requisição manual:

```bash
curl -X POST https://dcoqbmgeenivnvxtsafh.supabase.co/functions/v1/utmify-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SUPABASE_ANON_KEY" \
  -d '{"transactionId": "ID_DA_TRANSACAO"}'
```

### Verificar Logs
1. Acesse o Supabase Dashboard
2. Vá em Edge Functions
3. Clique em `utmify-integration`
4. Veja os logs para confirmar envios

## Métricas no Dashboard da Utmify

Após configurar, você verá no dashboard da Utmify:
- **Total de Vendas** por campanha
- **Conversão** por fonte de tráfego
- **Receita** por UTM parameters
- **Transações aguardando pagamento**
- **Reembolsos e chargebacks**

## Troubleshooting

### Token não configurado
Se o token não estiver configurado, a integração não enviará dados mas também não causará erros. Você verá no log:
```
Utmify API token not configured. Skipping order tracking.
```

### Erro ao enviar
Se houver erro ao enviar para Utmify, você verá no log:
```
Failed to send to Utmify: [erro]
```

A transação continuará sendo processada normalmente mesmo com erro no envio para Utmify.

## Suporte

Para mais informações sobre a API da Utmify:
- Documentação: https://api.utmify.com.br/api-credentials/orders
- Suporte: Contate o suporte da Utmify
