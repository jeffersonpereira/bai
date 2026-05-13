import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Leia os termos e condições de uso da plataforma BAI.",
};

export default function TermosPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-blue-600 transition">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Termos de Uso</span>
      </nav>

      <h1 className="text-3xl font-black text-slate-900 mb-2">Termos de Uso</h1>
      <p className="text-slate-500 text-sm mb-10">Última atualização: maio de 2025</p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">1. Aceitação dos termos</h2>
          <p>
            Ao criar uma conta ou usar a plataforma BAI, você concorda com estes Termos de Uso. Caso não concorde
            com qualquer parte, não utilize os serviços. A BAI reserva-se o direito de atualizar estes Termos
            periodicamente, sendo de responsabilidade do usuário acompanhar as versões publicadas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">2. Descrição do serviço</h2>
          <p>
            A BAI é uma marketplace imobiliária que permite a corretores, imobiliárias, vendedores e compradores
            anunciar, buscar e negociar imóveis. A plataforma não atua como agente imobiliário e não é parte
            das transações realizadas entre usuários.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">3. Cadastro e conta</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>Você deve fornecer informações verdadeiras, precisas e atualizadas no cadastro.</li>
            <li>É proibido criar contas falsas ou se passar por terceiros.</li>
            <li>Corretores devem possuir CRECI válido para se identificar como tal na plataforma.</li>
            <li>Você é responsável pela confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">4. Anúncios e conteúdo</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>Todo conteúdo publicado deve ser verídico, completo e não enganoso.</li>
            <li>É proibido anunciar imóveis sem autorização do proprietário.</li>
            <li>A BAI pode remover anúncios que violem estes Termos ou a legislação aplicável, sem aviso prévio.</li>
            <li>Imagens devem ser originais ou com direitos de uso; é proibida a publicação de imagens com marca d'água de terceiros.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">5. Planos e pagamentos</h2>
          <p>
            A BAI oferece planos pagos com funcionalidades adicionais. Os valores, recursos e condições de cada
            plano estão descritos na página de preços. Assinaturas são cobradas antecipadamente e não são
            reembolsáveis, salvo nos casos previstos no Código de Defesa do Consumidor (CDC).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">6. Conduta proibida</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>Spam, mensagens em massa não solicitadas ou automação abusiva.</li>
            <li>Tentativas de acesso não autorizado a sistemas ou dados de outros usuários.</li>
            <li>Publicação de conteúdo ofensivo, discriminatório ou que viole direitos de terceiros.</li>
            <li>Uso da plataforma para fins ilegais.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">7. Limitação de responsabilidade</h2>
          <p>
            A BAI não se responsabiliza por negociações ou transações entre usuários, inexatidões em anúncios
            publicados por terceiros, nem por perdas indiretas decorrentes do uso da plataforma. O serviço é
            fornecido "como está", sem garantias de disponibilidade ininterrupta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">8. Rescisão</h2>
          <p>
            A BAI pode suspender ou encerrar sua conta em caso de violação destes Termos, sem necessidade de
            aviso prévio. Você pode encerrar sua conta a qualquer momento pelas configurações da plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">9. Lei aplicável e foro</h2>
          <p>
            Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de São Paulo/SP
            para dirimir quaisquer controvérsias, com renúncia expressa a qualquer outro.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-500">
        <Link href="/privacidade" className="hover:text-blue-600 transition">Política de Privacidade</Link>
        <Link href="/sobre" className="hover:text-blue-600 transition">Sobre Nós</Link>
        <Link href="/" className="hover:text-blue-600 transition">Voltar ao início</Link>
      </div>
    </main>
  );
}
