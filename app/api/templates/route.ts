import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const templates = await prisma.templateContrato.findMany({
      include: { clausulas: { orderBy: { ordem: 'asc' } } }
    });
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, clausulas } = body;

    // Remove template if exists to replace (simple approach)
    await prisma.templateContrato.deleteMany({ where: { nome } });

    const newTemplate = await prisma.templateContrato.create({
      data: {
        nome,
        clausulas: {
          create: clausulas.map((c: any, index: number) => ({
            titulo: c.titulo,
            texto: c.texto,
            ordem: index
          }))
        }
      },
      include: { clausulas: true }
    });

    return NextResponse.json(newTemplate);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
