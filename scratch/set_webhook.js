require('dotenv').config();

const instanceId = process.env.ZAPI_INSTANCE_ID;
const token = process.env.ZAPI_TOKEN;
const clientToken = process.env.ZAPI_CLIENT_TOKEN;
const webhookUrl = "https://orse.vercel.app/api/webhooks/zapi";

if (!instanceId || !token) {
  console.error("ZAPI credentials missing in .env");
  process.exit(1);
}

const endpoints = [
  'update-webhook-received',
  'update-webhook-message-status',
  'update-webhook-chat-presence'
];

async function run() {
  for (const endpoint of endpoints) {
    console.log(`Configurando webhook para ${endpoint}...`);
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(clientToken ? { 'Client-Token': clientToken } : {})
        },
        body: JSON.stringify({
          value: webhookUrl
        })
      });
      
      const data = await response.json();
      console.log(`Resposta para ${endpoint}:`, data);
    } catch (error) {
      console.error(`Erro em ${endpoint}:`, error);
    }
  }
}

run();
