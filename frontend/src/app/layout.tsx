import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { ToastProvider } from "./components/ui/Toast";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default:  "BAI — Plataforma de Imóveis",
    template: "%s | BAI",
  },
  description:
    "Agregador premium de imóveis. Vasculhamos a web para trazer as melhores oportunidades em um só lugar, com alta velocidade.",
  keywords: ["imóveis", "comprar imóvel", "alugar", "corretor", "imobiliária", "agregador"],
  openGraph: {
    type:        "website",
    locale:      "pt_BR",
    siteName:    "BAI Plataforma de Imóveis",
    title:       "BAI — Encontre o imóvel perfeito",
    description: "Agregador premium de imóveis. Melhores oportunidades em um só lugar.",
  },
  robots: { index: true, follow: true },
};

import { AuthProvider } from "./context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="font-[var(--font-jakarta),system-ui,sans-serif] bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
            <footer className="border-t bg-slate-900 text-slate-300 mt-12">
              <div className="container mx-auto px-4 max-w-7xl py-14">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                  {/* Coluna BAI */}
                  <div>
                    <p className="text-white font-bold text-base mb-4">BAI</p>
                    <ul className="space-y-2 text-sm">
                      <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Nossa missão</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                    </ul>
                  </div>

                  {/* Coluna Para Você */}
                  <div>
                    <p className="text-white font-bold text-base mb-4">Para Você</p>
                    <ul className="space-y-2 text-sm">
                      <li><a href="/busca" className="hover:text-white transition-colors">Buscar imóveis</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Favoritos</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Alertas de preço</a></li>
                    </ul>
                  </div>

                  {/* Coluna Profissionais */}
                  <div>
                    <p className="text-white font-bold text-base mb-4">Profissionais</p>
                    <ul className="space-y-2 text-sm">
                      <li><a href="/login?mode=register&role=user" className="hover:text-white transition-colors">Anunciar imóvel</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">CRM para corretores</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Planos e preços</a></li>
                    </ul>
                  </div>

                  {/* Coluna Legal & Contato */}
                  <div>
                    <p className="text-white font-bold text-base mb-4">Legal & Contato</p>
                    <ul className="space-y-2 text-sm mb-5">
                      <li><a href="#" className="hover:text-white transition-colors">Política de privacidade</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Termos de uso</a></li>
                    </ul>
                    <div className="flex items-center gap-4 text-slate-400">
                      <a href="#" aria-label="WhatsApp" className="hover:text-white transition-colors">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </a>
                      <a href="#" aria-label="Instagram" className="hover:text-white transition-colors">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </a>
                      <a href="#" aria-label="LinkedIn" className="hover:text-white transition-colors">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Newsletter */}
                <div className="border-t border-slate-700 pt-10 pb-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <p className="text-white font-semibold mb-1">Fique por dentro do mercado</p>
                      <p className="text-slate-400 text-sm">Receba tendências e oportunidades no seu e-mail.</p>
                    </div>
                    <form className="flex gap-2 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        className="flex-1 md:w-64 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors whitespace-nowrap"
                      >
                        Assinar
                      </button>
                    </form>
                  </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-slate-800 pt-6 text-center text-slate-500 text-xs">
                  &copy; {new Date().getFullYear()} Plataforma BAI. Todos os direitos reservados.
                </div>
              </div>
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
