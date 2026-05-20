const fs = require('fs');
const path = require('path');

const actionsPath = path.join(__dirname, '../app/ccts/actions.ts');
let content = fs.readFileSync(actionsPath, 'utf8');

console.log('Iniciando correcao de cache nas Server Actions de CCT (Parte 11)...');

content = content.split('\r\n').join('\n');

// 1. ADICIONAR REVALIDAÇÕES EM createCCT
const oldCreateReturn = `    });
    
    return { success: true };`;

const newCreateReturn = `    });
    
    revalidatePath('/admin/ccts');
    revalidatePath('/propostas/nova');
    revalidatePath('/');
    return { success: true };`;

if (content.includes(oldCreateReturn)) {
   content = content.split(oldCreateReturn).join(newCreateReturn);
   console.log('✔ Revalidacao adicionada em createCCT.');
} else {
   console.log('⚠ Nao encontrou retorno padrao em createCCT.');
}

// 2. ADICIONAR REVALIDAÇÕES EM updateCCT
const oldUpdateReturn = `    });
    return { success: true };`;

const newUpdateReturn = `    });
    revalidatePath('/admin/ccts');
    revalidatePath('/propostas/nova');
    revalidatePath('/');
    return { success: true };`;

if (content.includes(oldUpdateReturn)) {
   content = content.split(oldUpdateReturn).join(newUpdateReturn);
   console.log('✔ Revalidacao adicionada em updateCCT.');
} else {
   console.log('⚠ Nao encontrou retorno padrao em updateCCT.');
}

// 3. ADICIONAR REVALIDAÇÕES EM deleteCCT
const oldDeleteReturn = `    });
    return { success: true };`;

const newDeleteReturn = `    });
    revalidatePath('/admin/ccts');
    revalidatePath('/propostas/nova');
    revalidatePath('/');
    return { success: true };`;

// Como deleteCCT pode ter uma chamada de retorno similar, vamos fazer uma substituicao cirurgica na funcao
const oldDeleteFunc = `export async function deleteCCT(id: string) {
  try {
    await prisma.cCT.delete({
      where: { id }
    });
    return { success: true };`;

const newDeleteFunc = `export async function deleteCCT(id: string) {
  try {
    await prisma.cCT.delete({
      where: { id }
    });
    revalidatePath('/admin/ccts');
    revalidatePath('/propostas/nova');
    revalidatePath('/');
    return { success: true };`;

if (content.includes(oldDeleteFunc)) {
   content = content.split(oldDeleteFunc).join(newDeleteFunc);
   console.log('✔ Revalidacao adicionada em deleteCCT.');
} else {
   console.log('⚠ Nao encontrou a funcao deleteCCT exata.');
}

fs.writeFileSync(actionsPath, content, 'utf8');
console.log('✔ app/ccts/actions.ts gravado com sucesso na Parte 11!');
