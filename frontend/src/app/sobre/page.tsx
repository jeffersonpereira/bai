import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre Nós",
  description: "Conheça a história e os valores por trás da BAI, a marketplace imobiliária que conecta pessoas a imóveis.",
};

export default function SobrePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-blue-600 transition">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Sobre Nós</span>
      </nav>

      {/* Hero */}
      <div className="mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4 leading-tight">
          Conectando pessoas<br />a imóveis que importam
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          A BAI nasceu da percepção de que o mercado imobiliário precisava de uma plataforma verdadeiramente
          bidirecional — onde compradores, vendedores, corretores e imobiliárias se encontram em igualdade
          de condições.
        </p>
      </div>

      {/* Story */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-slate-900 mb-6">Nossa história</h2>
        <div className="space-y-4 text-slate-600 leading-relaxed">
          <p>
            Fundada em 2024, a BAI surgiu após anos observando as frustações de todos os lados de uma
            transação imobiliária. Compradores sem visibilidade real de oportunidades, corretores perdendo
            tempo com leads desqualificados, e imobiliárias sem ferramentas modernas de gestão.
          </p>
          <p>
            Decidimos construir uma plataforma que resolve esses problemas de forma integrada: busca
            avançada com mapa interativo, CRM embutido para gestão de leads, integração com WhatsApp,
            gestão de documentos e propostas — tudo em um único lugar.
          </p>
          <p>
            Hoje a BAI é utilizada por corretores autônomos e imobiliárias em todo o Brasil, com um
            crescimento consistente impulsionado pela confiança de quem usa e recomenda.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-2xl font-black text-slate-900 mb-8">Nossos valores</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              icon: "🤝",
              title: "Transparência",
              description: "Preços claros, dados reais e sem letras miúdas. Acreditamos que a confiança se constrói com honestidade.",
            },
            {
              icon: "⚡",
              title: "Agilidade",
              description: "O mercado imobiliário não para. Nossa plataforma foi desenhada para que cada interação seja rápida e eficiente.",
            },
            {
              icon: "🧠",
              title: "Tecnologia a serviço das pessoas",
              description: "Usamos inteligência artificial e automações para ampliar o alcance dos nossos usuários, não para substituí-los.",
            },
            {
              icon: "🌱",
              title: "Crescimento conjunto",
              description: "Quando nossos usuários crescem, nós crescemos. Nosso sucesso é medido pelo sucesso de quem usa a BAI.",
            },
          ].map((v) => (
            <div key={v.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <span className="text-3xl mb-4 block">{v.icon}</span>
              <h3 className="font-black text-slate-900 mb-2">{v.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 rounded-3xl p-10 text-center text-white">
        <h2 className="text-2xl font-black mb-3">Faça parte da BAI</h2>
        <p className="text-blue-100 mb-8 max-w-md mx-auto">
          Seja você corretor, imobiliária ou comprador — temos o plano certo para você.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/login"
            className="px-8 py-3.5 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition shadow-sm"
          >
            Criar conta grátis
          </Link>
          <Link
            href="/missao"
            className="px-8 py-3.5 border border-blue-400 text-white font-bold rounded-2xl hover:bg-blue-700 transition"
          >
            Nossa missão →
          </Link>
        </div>
      </section>

      <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-500">
        <Link href="/missao" className="hover:text-blue-600 transition">Nossa Missão</Link>
        <Link href="/privacidade" className="hover:text-blue-600 transition">Política de Privacidade</Link>
        <Link href="/termos" className="hover:text-blue-600 transition">Termos de Uso</Link>
        <Link href="/" className="hover:text-blue-600 transition">Voltar ao início</Link>
      </div>
    </main>
  );
}
