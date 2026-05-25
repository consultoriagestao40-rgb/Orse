const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_SJF3DB0zclRI@ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

async function check() {
  console.log("=== CONECTANDO VIA PG ===");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const leadsRes = await client.query("SELECT id, \"nomeFantasia\", telefone FROM \"Lead\" WHERE telefone LIKE '%966687%'");
    console.log("Leads encontrados:", leadsRes.rows);

    if (leadsRes.rows.length > 0) {
      const leadId = leadsRes.rows[0].id;
      const msgsRes = await client.query("SELECT * FROM \"WhatsAppMessage\" WHERE \"leadId\" = $1 ORDER BY \"createdAt\" DESC LIMIT 10", [leadId]);
      console.log("Mensagens no banco para esse Lead:", msgsRes.rows);
    } else {
      console.log("Nenhum lead com esse telefone encontrado no banco.");
    }
  } catch (error) {
    console.error("Erro ao executar query:", error);
  } finally {
    await client.end();
  }
}

check();
