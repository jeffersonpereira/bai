import Link from "next/link";
import CardImovel from "./components/CardImovel";
import EmptyState from "./components/ui/EmptyState";
import Script from "next/script";

async function getLatestProperties() {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001"}/api/v1/imoveis/?limit=6`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items ?? [];
  } catch {
    return [];
  }
}

const StarIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4 shrink-0" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default async function Home() {
  const latestProperties = await getLatestProperties();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "88vh" }}
        aria-label="Hero — Busca de imóveis"
      >
        <div className="absolute inset-0 bg-slate-900" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Interior elegante de imóvel"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/98" />
        </div>

        <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col items-center text-center gap-7 py-24">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Imóveis verificados em todo o Brasil
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-[4.25rem] font-extrabold text-white tracking-tight leading-[1.08]">
            Chega de anúncio<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300"> desatualizado</span> e corretor sumido
          </h1>

          <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
            O BAI conecta compradores, proprietários e corretores em um só lugar —
            com imóveis reais, contato direto e ferramentas para fechar negócio de verdade.
          </p>

          <div className="w-full max-w-3xl mt-2">
            <form
              action="/busca"
              role="search"
              aria-label="Buscar imóveis"
              className="bg-white/8 border border-white/15 rounded-2xl p-2 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <input
                    type="text"
                    name="city"
                    placeholder="Cidade — ex: São Paulo, Curitiba..."
                    aria-label="Cidade"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400 font-medium text-sm"
                  />
                </div>
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                  <input
                    type="text"
                    name="neighborhood"
                    placeholder="Bairro (opcional)"
                    aria-label="Bairro"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition placeholder:text-slate-400 font-medium text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="sm:w-auto w-full px-7 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg transition-all text-sm whitespace-nowrap"
                >
                  Buscar Imóveis
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300"><CheckIcon /> Sem cadastro para buscar</span>
              <span className="flex items-center gap-1.5 text-slate-300"><CheckIcon /> Contato direto com o anunciante</span>
              <span className="flex items-center gap-1.5 text-emerald-400"><WhatsAppIcon /> WhatsApp em um clique</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Prova Social ─────────────────────────────────────── */}
      <section className="bg-white py-20 border-b border-slate-100" aria-labelledby="social-proof-title">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-3 gap-4 md:gap-16 text-center mb-16">
            <div>
              <p className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-none tabular-nums">4.830</p>
              <p className="text-slate-500 mt-2 text-xs md:text-sm font-medium">imóveis disponíveis hoje</p>
            </div>
            <div>
              <p className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-none tabular-nums">1.140</p>
              <p className="text-slate-500 mt-2 text-xs md:text-sm font-medium">corretores cadastrados</p>
            </div>
            <div>
              <p className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-none tabular-nums">R$&nbsp;1,8bi</p>
              <p className="text-slate-500 mt-2 text-xs md:text-sm font-medium">em negócios na plataforma</p>
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 id="social-proof-title" className="text-2xl md:text-3xl font-bold text-slate-900">
              O que dizem quem usa todo dia
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4">
              <div className="flex gap-0.5 text-amber-400">
                {Array(5).fill(0).map((_, i) => <StarIcon key={i} />)}
              </div>
              <p className="text-slate-700 leading-relaxed text-sm">
                "Eu tentei três portais antes. No BAI encontrei um apartamento de 2 quartos em Pinheiros com preço compatível com o bairro — e o corretor me retornou no mesmo dia. Fechei em 11 dias."
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">RC</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Rafael Costa</p>
                  <p className="text-slate-400 text-xs">Comprador · São Paulo, SP</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4">
              <div className="flex gap-0.5 text-amber-400">
                {Array(5).fill(0).map((_, i) => <StarIcon key={i} />)}
              </div>
              <p className="text-slate-700 leading-relaxed text-sm">
                "Anunciei minha casa em Campinas achando que ia demorar meses. Em dois dias tinha propostas sérias — não curiosos. O filtro de perfil funciona de verdade. Vendi acima do pedido."
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">AM</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Ana Martins</p>
                  <p className="text-slate-400 text-xs">Proprietária · Campinas, SP</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col gap-4">
              <div className="flex gap-0.5 text-amber-400">
                {Array(5).fill(0).map((_, i) => <StarIcon key={i} />)}
              </div>
              <p className="text-slate-700 leading-relaxed text-sm">
                "Trabalho sozinho como autônomo em BH. O CRM do BAI substituiu minha planilha e o WhatsApp desordenado. Agora sei exatamente em que etapa cada lead está. Fechei 40% mais em 3 meses."
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">LS</div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Lucas Souza</p>
                  <p className="text-slate-400 text-xs">Corretor CRECI-MG · Belo Horizonte</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Segmentação de Públicos ───────────────────────────── */}
      <section className="bg-white py-24" aria-labelledby="personas-title">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 id="personas-title" className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Feito para o <span className="text-blue-600">seu lado</span> da negociação
            </h2>
            <p className="text-base text-slate-500 leading-relaxed">
              Compradores, proprietários e profissionais têm necessidades diferentes. Por isso a plataforma funciona diferente para cada um.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Compradores */}
            <div className="group bg-slate-50 rounded-3xl p-7 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 flex flex-col h-full">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-5 border border-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Estou buscando imóvel</h3>
              <p className="text-slate-500 mb-6 leading-relaxed text-sm flex-1">
                Filtre por cidade, bairro, tipo e faixa de preço. Nada de anúncio duplicado ou foto de 2019 — só o que está disponível agora.
              </p>
              <ul className="space-y-2.5 mb-7 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 shrink-0 text-blue-600" />Busca por mapa e filtros avançados</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 shrink-0 text-blue-600" />Contato direto com o anunciante</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 shrink-0 text-blue-600" />Favoritos e comparativo de imóveis</li>
                <li className="flex items-center gap-2 text-emerald-600"><WhatsAppIcon />WhatsApp direto com quem anuncia</li>
              </ul>
              <Link href="/search" className="inline-block w-full py-3 px-4 bg-white text-blue-600 font-semibold border border-blue-100 hover:border-blue-500 rounded-xl text-center transition-colors text-sm">
                Ver imóveis disponíveis
              </Link>
            </div>

            {/* Proprietários — destaque */}
            <div className="group bg-blue-600 rounded-3xl p-7 border border-blue-500 hover:shadow-xl hover:shadow-blue-900/25 transition-all duration-200 flex flex-col h-full text-white">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-white mb-5 border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Quero vender ou alugar</h3>
              <p className="text-blue-100 mb-6 leading-relaxed text-sm flex-1">
                Publique seu imóvel gratuitamente. Defina preço com base no mercado local e receba contatos apenas de pessoas com interesse real.
              </p>
              <ul className="space-y-2.5 mb-7 text-sm text-blue-50">
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 shrink-0 text-white" />Anúncio rápido, sem burocracia</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 shrink-0 text-white" />Visibilidade para compradores reais</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 shrink-0 text-white" />Referência de preço por metro quadrado</li>
                <li className="flex items-center gap-2 text-emerald-300"><WhatsAppIcon />Receba propostas via WhatsApp</li>
              </ul>
              <Link href="/login?mode=register&role=user" className="inline-block w-full py-3 px-4 bg-white text-blue-700 font-semibold hover:bg-blue-50 rounded-xl text-center transition-colors text-sm">
                Anunciar meu imóvel
              </Link>
            </div>

            {/* Corretores / Agências */}
            <div className="group bg-slate-50 rounded-3xl p-7 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 flex flex-col h-full">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-5 border border-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sou corretor ou imobiliária</h3>
              <p className="text-slate-500 mb-6 leading-relaxed text-sm flex-1">
                Uma central de operação para escalar sem bagunçar. CRM, carteira de imóveis, landing page e gestão de equipe — tudo integrado.
              </p>
              <ul className="space-y-2.5 mb-7 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 shrink-0 text-blue-600" />CRM com funil de leads integrado</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 shrink-0 text-blue-600" />Landing page personalizada com seu CRECI</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 shrink-0 text-blue-600" />Painel multi-corretor para agências</li>
                <li className="flex items-center gap-2 text-emerald-600"><WhatsAppIcon />Leads notificados por WhatsApp</li>
              </ul>
              <Link href="/login?mode=register&role=agency" className="inline-block w-full py-3 px-4 bg-white text-blue-600 font-semibold border border-blue-100 hover:border-blue-500 rounded-xl text-center transition-colors text-sm">
                Conhecer planos para profissionais
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Como Funciona ─────────────────────────────────────── */}
      <section className="bg-slate-50 py-24 border-y border-slate-100" aria-labelledby="como-funciona-title">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <span className="text-blue-600 font-semibold tracking-wider text-xs uppercase mb-3 block">Do zero ao fechamento</span>
            <h2 id="como-funciona-title" className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Como funciona na prática
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-9 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-slate-200" aria-hidden="true" />

            {[
              {
                n: "1",
                titulo: "Crie sua conta",
                desc: "Menos de um minuto. Sem cartão de crédito. Escolha se você é comprador, proprietário ou corretor.",
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                n: "2",
                titulo: "Configure seu perfil",
                desc: "A plataforma mostra as ferramentas certas para o seu momento — sem tela cheia de opções que você nunca vai usar.",
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
              },
              {
                n: "3",
                titulo: "Feche negócio",
                desc: "Fale direto com quem importa via chat ou WhatsApp. Sem formulário que some no vazio, sem esperar dias por resposta.",
                icon: (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                ),
              },
            ].map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                    {step.icon}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-400 text-white text-xs font-bold flex items-center justify-center">
                    {step.n}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">{step.titulo}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center gap-2 px-7 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-md transition-all hover:scale-[1.02] text-sm"
            >
              Começar agora — é grátis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Planos ───────────────────────────────────────────── */}
      <section className="bg-white py-24" aria-labelledby="planos-title">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <span className="text-blue-600 font-semibold tracking-wider text-xs uppercase mb-3 block">Transparência total</span>
            <h2 id="planos-title" className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Plano para cada fase da sua operação
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Corretores autônomos e imobiliárias têm necessidades muito diferentes. Escolha sem complicar.
              <span className="font-semibold text-emerald-600"> Pagando anual, economize até 18%.</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Plano Gratuito */}
            <div className="border border-slate-200 rounded-2xl p-7 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Gratuito</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-slate-900">R$&nbsp;0</span>
                  <span className="text-slate-400 text-sm mb-1">para sempre</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Para quem quer anunciar um imóvel avulso ou explorar a plataforma sem compromisso.
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1 text-sm">
                {[
                  "Até 5 imóveis ativos",
                  "Busca, favoritos e filtros",
                  "Contato via WhatsApp",
                  "Suporte por e-mail",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-slate-700">
                    <CheckIcon className="w-4 h-4 shrink-0 text-emerald-500" />{f}
                  </li>
                ))}
                {["CRM de leads", "Landing page personalizada", "Relatórios de conversão"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-slate-400 line-through">
                    <XIcon />{f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login?mode=register"
                className="block w-full py-3 text-center text-slate-700 font-semibold border border-slate-200 hover:border-slate-400 rounded-xl transition-colors text-sm"
              >
                Começar grátis
              </Link>
            </div>

            {/* Plano Pro — destaque */}
            <div className="relative border-2 border-blue-600 rounded-2xl p-7 flex flex-col shadow-lg shadow-blue-900/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  Mais escolhido
                </span>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Pro</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-slate-900">R$&nbsp;97</span>
                  <span className="text-slate-400 text-sm mb-1">/mês</span>
                </div>
                <p className="text-xs text-emerald-600 font-medium mb-3">
                  ou R$&nbsp;79/mês no plano anual (economize R$&nbsp;216/ano)
                </p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Para corretores autônomos que querem escalar os resultados sem contratar mais ninguém.
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1 text-sm">
                {[
                  "Até 50 imóveis ativos",
                  "CRM com funil de leads",
                  "Landing page personalizada",
                  "Notificação de lead por WhatsApp",
                  "25 fotos por imóvel",
                  "5 GB de armazenamento",
                  "Relatório de acessos e conversão",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-slate-700">
                    <CheckIcon className="w-4 h-4 shrink-0 text-blue-600" />{f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login?mode=register&plano=pro"
                className="block w-full py-3 text-center text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-sm"
              >
                Assinar Pro
              </Link>
              <p className="text-center text-slate-400 text-xs mt-3">Cancele quando quiser</p>
            </div>

            {/* Plano Premium */}
            <div className="border border-slate-200 rounded-2xl p-7 flex flex-col bg-slate-900 text-white">
              <div className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Premium</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold">R$&nbsp;397</span>
                  <span className="text-slate-400 text-sm mb-1">/mês</span>
                </div>
                <p className="text-xs text-emerald-400 font-medium mb-3">
                  ou R$&nbsp;317/mês no plano anual (economize R$&nbsp;960/ano)
                </p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Para agências e equipes que precisam de controle total, múltiplos corretores e volume alto.
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1 text-sm">
                {[
                  "Imóveis ilimitados",
                  "Tudo do plano Pro",
                  "Até 15 corretores associados",
                  "Assinatura digital de documentos",
                  "50 GB de armazenamento",
                  "Relatórios individuais por corretor",
                  "Suporte prioritário via WhatsApp",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-slate-200">
                    <CheckIcon className="w-4 h-4 shrink-0 text-emerald-400" />{f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login?mode=register&plano=premium"
                className="block w-full py-3 text-center text-slate-900 font-bold bg-white hover:bg-slate-100 rounded-xl transition-colors text-sm"
              >
                Assinar Premium
              </Link>
              <p className="text-center text-slate-500 text-xs mt-3">Cancele quando quiser</p>
            </div>
          </div>

          <p className="text-center text-slate-400 text-xs mt-8">
            Todos os planos incluem acesso à busca de imóveis e contato direto com anunciantes.
            Dúvidas? <a href="mailto:contato@bai.com.br" className="text-blue-600 hover:underline">Fale com a gente.</a>
          </p>
        </div>
      </section>

      {/* ── Diferenciais ──────────────────────────────────────── */}
      <section className="bg-slate-50 py-24 border-y border-slate-100" aria-labelledby="features-title">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-blue-600 font-semibold tracking-wider text-xs uppercase mb-3 block">O que faz a diferença</span>
              <h2 id="features-title" className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight text-slate-900">
                Sem anúncio fantasma,<br />sem lead que some
              </h2>
              <p className="text-slate-500 mb-10 text-base leading-relaxed">
                Os maiores portais do país têm um problema antigo: anúncios que nunca saem do ar e corretores que demoram dias para responder.
                O BAI funciona diferente — imóvel fechado, anúncio fora do ar. Contato real, em tempo real.
              </p>

              <div className="space-y-7">
                {[
                  {
                    titulo: "Busca que filtra de verdade",
                    desc: "Sem duplicatas, sem imóvel que já foi vendido. A base é auditada continuamente para você não perder tempo.",
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    ),
                  },
                  {
                    titulo: "Profissionais verificados",
                    desc: "Todo corretor na plataforma passa por validação de CRECI. Você sabe com quem está falando antes de responder.",
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.746 3.746 0 01-3.296 1.043A3.746 3.746 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    ),
                  },
                  {
                    titulo: "Preço de mercado na tela",
                    desc: "Referência de preço por metro quadrado por bairro, atualizada mensalmente. Comprador e proprietário chegam ao preço justo mais rápido.",
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <div key={item.titulo} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">{item.titulo}</h3>
                      <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Exemplo de imóvel na plataforma"
                className="w-full h-[480px] object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md flex items-center gap-3 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Imóvel disponível e verificado</p>
                    <p className="text-xs text-slate-400">Atualizado há 2 horas · Corretor respondeu em 18min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vitrine: Adicionados Recentemente ─────────────────── */}
      <section className="bg-white py-24" aria-labelledby="recent-title">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-blue-600 font-semibold tracking-wider text-xs uppercase mb-2 block">Adicionados recentemente</span>
              <h2 id="recent-title" className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                Em destaque agora
              </h2>
              <p className="text-slate-500 text-sm">
                Imóveis verificados pelos nossos parceiros nas últimas 48h.
              </p>
            </div>
            <Link
              href="/search"
              className="shrink-0 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-full hover:border-slate-400 transition-all flex items-center gap-2 group text-sm"
            >
              Ver todas as ofertas
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {latestProperties.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
              }
              title="Nenhum imóvel disponível no momento"
              description="A vitrine é atualizada constantemente. Faça uma busca manual ou volte em instantes."
              action={
                <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors text-sm">
                  Buscar imóveis
                </Link>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {latestProperties.map((imovel: any) => (
                <CardImovel key={imovel.id} imovel={imovel} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────── */}
      <section className="bg-slate-900 py-24" aria-label="Chamada para ação">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Pronto para parar de perder negócio para o portal?
          </h2>
          <p className="text-slate-400 mb-8 text-base leading-relaxed">
            Mais de 1.100 corretores já migraram para o BAI. A conta gratuita não tem prazo e não pede cartão.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?mode=register"
              className="px-7 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-colors text-sm"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/search"
              className="px-7 h-12 flex items-center justify-center bg-transparent text-white font-semibold rounded-full hover:bg-white/8 transition-colors border border-white/20 text-sm"
            >
              Explorar imóveis
            </Link>
          </div>
          <p className="mt-5 text-slate-500 text-xs">Cadastro em menos de 1 minuto · Sem cartão de crédito · Cancele quando quiser</p>
        </div>
      </section>

      <Script id="jsonld-organization" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "BAI Plataforma de Imóveis",
        "description": "Marketplace imobiliário conectando compradores, vendedores, corretores e imobiliárias em todo o Brasil.",
        "url": "https://bai.com.br",
        "logo": "https://bai.com.br/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "Portuguese"
        }
      })}} />
    </div>
  );
}
