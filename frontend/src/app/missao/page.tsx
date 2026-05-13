import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nossa Missão",
  description: "A missão da BAI é democratizar o acesso ao mercado imobiliário com tecnologia, transparência e eficiência.",
};

export default function MissaoPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-blue-600 transition">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Nossa Missão</span>
      </nav>

      {/* Hero */}
      <div className="mb-16">
        <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-4">Nossa Missão</p>
        <h1 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
          Democratizar o mercado imobiliário para todos os brasileiros
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">
          Acreditamos que encontrar, anunciar ou negociar um imóvel deve ser simples, justo e acessível — independente
          de onde você está ou qual o seu papel na transação.
        </p>
      </div>

      {/* Mission pillars */}
      <section className="mb-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              number: "01",
              title: "Eliminar intermediários desnecessários",
              description:
                "Compradores se conectam diretamente a corretores e imobiliárias qualificadas. Sem porteiros de informação.",
            },
            {
              number: "02",
              title: "Dar poder às ferramentas certas",
              description:
                "CRM, WhatsApp integrado, gestão de documentos e propostas digitais — tudo que um profissional precisa para crescer.",
            },
            {
              number: "03",
              title: "Gerar confiança através de dados",
              description:
                "Histórico de visualizações, avaliações reais e transparência de preços para que nenhuma decisão seja tomada no escuro.",
            },
          ].map((p) => (
            <div key={p.number} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <span className="text-4xl font-black text-blue-100 mb-4 block">{p.number}</span>
              <h3 className="font-black text-slate-900 mb-2 text-lg leading-tight">{p.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision */}
      <section className="mb-16 bg-slate-900 rounded-3xl p-10 text-white">
        <p className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-4">Nossa Visão</p>
        <blockquote className="text-2xl font-black leading-snug mb-6">
          "Ser a plataforma imobiliária mais confiada do Brasil, onde cada transação gera valor real para todas as partes."
        </blockquote>
        <p className="text-slate-400 leading-relaxed">
          Não queremos ser apenas mais um portal de imóveis. Queremos construir a infraestrutura do mercado
          imobiliário moderno — ágil, digital e centrado nas pessoas.
        </p>
      </section>

      {/* Impact */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-slate-900 mb-8">Nosso impacto</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Imóveis anunciados", value: "10 mil+" },
            { label: "Corretores ativos", value: "2 mil+" },
            { label: "Leads gerados", value: "50 mil+" },
            { label: "Cidades atendidas", value: "300+" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm">
              <p className="text-3xl font-black text-blue-600 mb-1">{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-10">
        <h2 className="text-2xl font-black text-slate-900 mb-3">Faça parte desta missão</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Junte-se a milhares de profissionais e compradores que já usam a BAI para transformar suas negociações.
        </p>
        <Link
          href="/login"
          className="inline-block px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
        >
          Começar agora — é grátis
        </Link>
      </section>

      <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-500">
        <Link href="/sobre" className="hover:text-blue-600 transition">Sobre Nós</Link>
        <Link href="/privacidade" className="hover:text-blue-600 transition">Política de Privacidade</Link>
        <Link href="/termos" className="hover:text-blue-600 transition">Termos de Uso</Link>
        <Link href="/" className="hover:text-blue-600 transition">Voltar ao início</Link>
      </div>
    </main>
  );
}
