const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = 'cristiano@grupojvsserv.com.br'
  const password = '123456'
  
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
  
  console.log('Sucesso! Usuário Admin pronto:', user.email)
}

main()
  .catch((e) => {
    console.error('Erro ao criar admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
