import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const count = await prisma.leadStage.count();
    if (count === 0) {
      await prisma.leadStage.createMany({
        data: [
          { nome: 'Descoberta', ordem: 1 },
          { nome: 'Contato Realizado', ordem: 2 },
          { nome: 'Reunião Agendada', ordem: 3 },
          { nome: 'Qualificado', ordem: 4 }
        ]
      });
      return NextResponse.json({ success: true, message: 'Stages created' });
    }
    return NextResponse.json({ success: true, message: 'Stages already exist' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
