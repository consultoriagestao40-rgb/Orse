const fs = require('fs');
const path = require('path');

const actionsPath = path.join(__dirname, '../app/admin/usuarios/actions.ts');
let content = fs.readFileSync(actionsPath, 'utf8');

console.log('Iniciando atualizacao das Server Actions de Usuario (Parte 12)...');

content = content.split('\r\n').join('\n');

// 1. ATUALIZAR createUsuario
const oldCreate = `export async function createUsuario(data: any) {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        nome: data.nome,
        password: data.password || '123456',
        role: data.role,
        managerId: data.managerId || null,
      },
    });`;

const newCreate = `export async function createUsuario(data: any) {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        nome: data.nome,
        password: data.password || '123456',
        role: data.role,
        cargo: data.cargo || null,
        celular: data.celular || null,
        managerId: data.managerId || null,
      },
    });`;

if (content.includes(oldCreate)) {
   content = content.split(oldCreate).join(newCreate);
   console.log('✔ createUsuario atualizado.');
} else {
   console.log('⚠ Nao encontrou createUsuario antigo.');
}

// 2. ADICIONAR updateUsuario
const updateUsuarioFunc = `

export async function updateUsuario(id: string, data: any) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        nome: data.nome,
        password: data.password ? data.password : undefined,
        role: data.role,
        cargo: data.cargo || null,
        celular: data.celular || null,
        managerId: data.managerId || null,
      },
    });
    revalidatePath('/admin/usuarios');
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}`;

if (!content.includes('export async function updateUsuario')) {
   content += updateUsuarioFunc;
   console.log('✔ updateUsuario adicionado.');
} else {
   console.log('⚠ updateUsuario ja existe.');
}

fs.writeFileSync(actionsPath, content, 'utf8');
console.log('✔ app/admin/usuarios/actions.ts gravado com sucesso na Parte 12!');
