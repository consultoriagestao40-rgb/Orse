import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';

let prisma: PrismaClient;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function GET() {
  try {
    const db = getPrisma();
    const templates = await db.templateContrato.findMany({
      include: { clausulas: { orderBy: { ordem: 'asc' } } }
    });
    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = getPrisma();
    const body = await req.json();
    const { nome, clausulas } = body;

    // Remove template if exists to replace (simple approach)
    await db.templateContrato.deleteMany({ where: { nome } });

    const newTemplate = await db.templateContrato.create({
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
