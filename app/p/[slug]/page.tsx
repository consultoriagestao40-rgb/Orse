import type { Metadata } from 'next';
import {
  buildPublicPropostaMetadata,
  renderPublicPropostaBySlugOrId,
} from '@/app/proposta/ver/[id]/page';

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  return buildPublicPropostaMetadata(slug);
}

export default async function ExecutiveProposalShortLinkPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  return renderPublicPropostaBySlugOrId(slug);
}
