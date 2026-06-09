const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const connStr = 'postgresql://neondb_owner:npg_SJF3DB0zclRI@ep-noisy-morning-apre9go4-pooler.c-7.us-east-1.aws.neon.tech/neondb';
  const url = 'https://ep-noisy-morning-apre9go4.c-7.us-east-1.aws.neon.tech/sql';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'neon-connection-string': connStr
    },
    body: JSON.stringify({
      query: 'SELECT id, "nomeFantasia", "logoUrl" FROM "Tenant"'
    })
  });

  const data = await res.json();
  if (!data.rows) {
    console.error('Erro:', data);
    return;
  }

  for (const row of data.rows) {
    const logoStr = row.logoUrl || '';
    if (logoStr.startsWith('data:image/')) {
      const match = logoStr.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (match) {
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = row.nomeFantasia.toLowerCase().includes('slimpe') ? 'logo_slimpe.jpg' : 'logo_jvs.jpg';
        const filepath = path.join(__dirname, filename);
        fs.writeFileSync(filepath, buffer);
        console.log(`Salvo: ${filepath} (${buffer.length} bytes)`);
      }
    }
  }
}

main().catch(console.error);
