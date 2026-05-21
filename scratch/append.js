const fs = require('fs');

const actions = `

// -- Segmentos --
export async function getSegmentos() {
  try {
    return await prisma.segmento.findMany({ orderBy: { nome: 'asc' } });
  } catch (error) {
    console.error('Erro ao buscar segmentos:', error);
    return [];
  }
}

export async function createSegmento(nome: string) {
  try {
    await prisma.segmento.create({ data: { nome: nome.toUpperCase() } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSegmento(id: string) {
  try {
    await prisma.segmento.delete({ where: { id } });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`;

fs.appendFileSync('app/admin/settings/actions.ts', actions);
console.log('Appended Segmento actions');
