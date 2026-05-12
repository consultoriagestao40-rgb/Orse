# SmartBid - Sistema de Orçamento (Engenharia de Custos FM)

ERP especializado em precificação de serviços com foco em "Gross-up" e conformidade trabalhista.

## Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Neon](https://neon.tech/) (PostgreSQL)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Deployment:** [Vercel](https://vercel.com/)

## Como rodar localmente
1. Clone o repositório.
2. Instale as dependências: `npm install`.
3. Configure o arquivo `.env` com a sua `DATABASE_URL` do Neon.
4. Rode as migrações: `npx prisma db push`.
5. Inicie o servidor: `npm run dev`.

## Metodologia de Cálculo
O sistema utiliza o motor de cálculo especializado em `lib/pricingEngine.ts`, seguindo rigorosamente a estrutura de Grupos de Encargos (A, B, C, D) e Gross-up corporativo.
