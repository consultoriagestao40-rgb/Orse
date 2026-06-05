import { prisma } from '../lib/prisma';

async function main() {
  const fpv = await prisma.proposta.findFirst({
    where: { numero: 13 },
    include: {
      client: true,
      versoes: true
    }
  });

  console.log('FPV 13 Details:');
  console.log('=============================');
  console.log('ID:', fpv?.id);
  console.log('Numero:', fpv?.numero);
  console.log('ClientId:', fpv?.clientId);
  console.log('Client Name:', fpv?.client?.nomeFantasia);
  console.log('TenantId:', fpv?.tenantId);
  console.log('Versoes Count:', fpv?.versoes?.length);
}

main().catch(console.error);
