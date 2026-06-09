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
    console.log(`Tenant: ${row.nomeFantasia}`);
    console.log(`ID: ${row.id}`);
    console.log(`Tamanho do Logo: ${logoStr.length}`);
    console.log(`Prefixo do Logo: ${logoStr.substring(0, 100)}...`);
    console.log('-------------------------------------------');
  }

  if (data.rows.length >= 2) {
    const logo1 = data.rows[0].logoUrl || '';
    const logo2 = data.rows[1].logoUrl || '';
    if (logo1 === logo2) {
      console.log('Alerta crítico: Os dois logos são exatamente IDÊNTICOS!');
    } else {
      console.log('Os logos são diferentes.');
    }
  }
}

main().catch(console.error);
