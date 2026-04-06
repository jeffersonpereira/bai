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
            <footer className="border-t bg-white py-8 mt-12">
              <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
                <span>&copy; {new Date().getFullYear()} Plataforma BAI. Todos os direitos reservados.</span>
                <div className="flex items-center gap-4">
                  <a href="/search"        className="hover:text-slate-600 transition-colors">Buscar</a>
                  <a href="/login"         className="hover:text-slate-600 transition-colors">Entrar</a>
                  <a href="/login?mode=register" className="hover:text-slate-600 transition-colors">Cadastrar</a>
                </div>
              </div>
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
