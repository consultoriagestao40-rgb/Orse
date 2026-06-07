import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    // 1. Fetch all DocumentoProposta records with their proposal info
    const docs = await prisma.documentoProposta.findMany({
      include: {
        proposta: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Group by propostaId
    const groups: { [key: string]: typeof docs } = {};
    docs.forEach(doc => {
      const pid = doc.propostaId;
      if (!groups[pid]) {
        groups[pid] = [];
      }
      groups[pid].push(doc);
    });

    const deletedIds: string[] = [];
    const report: any[] = [];

    // 3. For each group with duplicates, delete all except the first (most recent)
    for (const [propostaId, group] of Object.entries(groups)) {
      if (group.length > 1) {
        const proposalNum = group[0].proposta?.numero || 'S/N';
        const toKeep = group[0];
        const toDelete = group.slice(1);

        report.push({
          proposalNumber: proposalNum,
          propostaId,
          keptId: toKeep.id,
          keptCreatedAt: toKeep.createdAt,
          deletedCount: toDelete.length,
          deletedDetails: toDelete.map(d => ({ id: d.id, createdAt: d.createdAt })),
        });

        for (const docToDelete of toDelete) {
          await prisma.documentoProposta.delete({
            where: { id: docToDelete.id },
          });
          deletedIds.push(docToDelete.id);
        }
      }
    }

    if (deletedIds.length > 0) {
      revalidatePath('/propostas-comerciais');
      revalidatePath('/contratos');
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up duplicates. Deleted ${deletedIds.length} duplicate proposal documents.`,
      deletedIds,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
