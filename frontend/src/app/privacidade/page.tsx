import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Saiba como a BAI coleta, usa e protege seus dados pessoais.",
};

export default function PrivacidadePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <nav className="text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-blue-600 transition">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-600">Política de Privacidade</span>
      </nav>

      <h1 className="text-3xl font-black text-slate-900 mb-2">Política de Privacidade</h1>
      <p className="text-slate-500 text-sm mb-10">Última atualização: maio de 2025</p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">1. Quem somos</h2>
          <p>
            A BAI — Plataforma de Imóveis é uma marketplace bidirecional que conecta compradores, vendedores,
            corretores e imobiliárias. Nosso objetivo é facilitar negociações imobiliárias de forma direta,
            transparente e segura.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">2. Dados que coletamos</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone e perfil profissional (corretor, imobiliária etc.).</li>
            <li><strong>Dados de uso:</strong> imóveis visualizados, buscas realizadas, agendamentos e favoritos.</li>
            <li><strong>Dados de imóveis:</strong> endereço, fotos, preço e características dos imóveis anunciados.</li>
            <li><strong>Dados de pagamento:</strong> processados por gateways seguros certificados PCI-DSS; não armazenamos dados de cartão.</li>
            <li><strong>Dados de comunicação:</strong> mensagens trocadas via chat ou WhatsApp integrado, quando aplicável.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">3. Como usamos seus dados</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>Fornecer e melhorar os serviços da plataforma.</li>
            <li>Personalizar recomendações de imóveis com base no seu perfil de busca.</li>
            <li>Comunicar novidades, alertas de imóveis e atualizações da conta.</li>
            <li>Garantir a segurança e prevenir fraudes.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">4. Compartilhamento de dados</h2>
          <p>
            Não vendemos seus dados pessoais. Podemos compartilhá-los com prestadores de serviços (hospedagem,
            pagamentos, analytics) que atuam como operadores sob nossas instruções, e com autoridades quando
            exigido por lei.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">5. Seus direitos (LGPD)</h2>
          <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul className="list-disc list-inside space-y-2 text-slate-600 mt-3">
            <li>Confirmar a existência de tratamento dos seus dados.</li>
            <li>Acessar, corrigir ou excluir seus dados.</li>
            <li>Revogar consentimento a qualquer momento.</li>
            <li>Solicitar portabilidade ou anonimização dos dados.</li>
          </ul>
          <p className="mt-3">
            Para exercer seus direitos, entre em contato:{" "}
            <a href="mailto:privacidade@bai.imb.br" className="text-blue-600 hover:underline font-medium">
              privacidade@bai.imb.br
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">6. Cookies</h2>
          <p>
            Utilizamos cookies essenciais para o funcionamento da plataforma e cookies analíticos (anonimizados)
            para entender como você usa o site. Você pode gerenciar preferências de cookies nas configurações
            do seu navegador.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">7. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em
            trânsito (TLS), controle de acesso por função e monitoramento contínuo de segurança.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-slate-900 mb-3">8. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta Política periodicamente. Alterações relevantes serão comunicadas por e-mail
            ou notificação na plataforma. A continuidade do uso após a notificação implica aceite das mudanças.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4 text-sm text-slate-500">
        <Link href="/termos" className="hover:text-blue-600 transition">Termos de Uso</Link>
        <Link href="/sobre" className="hover:text-blue-600 transition">Sobre Nós</Link>
        <Link href="/" className="hover:text-blue-600 transition">Voltar ao início</Link>
      </div>
    </main>
  );
}
