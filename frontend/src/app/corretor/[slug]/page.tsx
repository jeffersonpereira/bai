import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface LandingData {
  perfil: {
    id: number;
    nome: string | null;
    perfil: string;
    creci: string | null;
    telefone: string | null;
    bio: string | null;
    foto_perfil_url: string | null;
    cor_primaria: string;
    cor_secundaria: string;
    redes_sociais: Record<string, string> | null;
    tipo_plano: string | null;
  };
  imoveis: Imovel[];
  total_imoveis: number;
}

interface Imovel {
  id: number;
  titulo: string;
  preco: number;
  valor_aluguel: number | null;
  area: number | null;
  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  cidade: string | null;
  bairro: string | null;
  estado: string | null;
  tipo_oferta: string | null;
  tipo_imovel: string | null;
  url_imagem: string | null;
  destaque: boolean | null;
  total_visualizacoes: number | null;
}

async function fetchLanding(slug: string): Promise<LandingData | null> {
  try {
    const res = await fetch(`${API}/api/v1/landing/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchLanding(slug);
  if (!data) return { title: "Anunciante não encontrado" };

  const { perfil } = data;
  const tipoLabel = perfil.perfil === "imobiliaria" ? "Imobiliária" : "Corretor";

  return {
    title: `${perfil.nome} | ${tipoLabel} — BAI`,
    description:
      perfil.bio ??
      `${data.total_imoveis} imóveis disponíveis com ${perfil.nome}. Fale conosco!`,
    openGraph: {
      title: `${perfil.nome} — ${tipoLabel}`,
      description: perfil.bio ?? `Confira os imóveis de ${perfil.nome}`,
      images: perfil.foto_perfil_url ? [perfil.foto_perfil_url] : [],
    },
  };
}

export default async function CorretorLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchLanding(slug);
  if (!data) notFound();

  return <LandingPageClient data={data} />;
}
