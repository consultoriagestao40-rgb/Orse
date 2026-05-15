import { prisma } from '../lib/prisma'

async function main() {
  const email = 'cristiano@grupojvsserv.com.br'
  const password = '123456' // Em produção, usar hash!
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: 'ADMIN',
      nome: 'Cristiano Silva'
    },
    create: {
      email,
      nome: 'Cristiano Silva',
      password,
      role: 'ADMIN'
    }
  })
  
  console.log('Usuário Admin criado/atualizado:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
