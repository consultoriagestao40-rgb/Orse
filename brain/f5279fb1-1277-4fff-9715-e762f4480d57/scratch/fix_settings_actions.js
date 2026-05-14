const fs = require('fs');
const path = 'app/admin/settings/actions.ts';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // 1. Update getUnidadesMedida
  content = content.replace(/orderBy: \{ sigla: 'asc' \}/g, "orderBy: { nome: 'asc' }");
  content = content.replace(/\{ nome: 'Unidade', sigla: 'UN' \}/g, "{ nome: 'UN' }");
  content = content.replace(/\{ nome: 'Quilograma', sigla: 'KG' \}/g, "{ nome: 'KG' }");
  content = content.replace(/\{ nome: 'Litro', sigla: 'L' \}/g, "{ nome: 'L' }");
  content = content.replace(/\{ nome: 'Metro', sigla: 'MT' \}/g, "{ nome: 'MT' }");
  content = content.replace(/\{ nome: 'Metro Quadrado', sigla: 'M²' \}/g, "{ nome: 'M²' }");
  content = content.replace(/\{ nome: 'Par', sigla: 'PAR' \}/g, "{ nome: 'PAR' }");
  content = content.replace(/\{ nome: 'Caixa', sigla: 'CX' \}/g, "{ nome: 'CX' }");

  // 2. Update createUnidadeMedida
  content = content.replace(/export async function createUnidadeMedida\(nome: string, sigla: string\) \{[\s\S]+?data: \{ nome, sigla: sigla\.toUpperCase\(\)\.trim\(\) \}/g, 
    "export async function createUnidadeMedida(nome: string) {\n  try {\n    const res = await prisma.unidadeMedida.create({\n      data: { nome: nome.trim() }");

  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
