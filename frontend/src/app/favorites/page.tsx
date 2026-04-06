"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { PropertyCardSkeleton } from "@/app/components/ui/Skeleton";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem("bai_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const userRes = await fetch(`${API}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!userRes.ok) throw new Error("Acesso negado");
        setUser(await userRes.json());

        const res = await fetch(`${API}/api/v1/favorites/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setFavorites(data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("bai_token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [router]);

  const removeFavorite = async (propertyId: number) => {
    const token = localStorage.getItem("bai_token");
    await fetch(`${API}/api/v1/favorites/${propertyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setFavorites(prev => prev.filter(f => f.property_id !== propertyId));
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-12">
      <div className="h-8 w-48 bg-slate-100 animate-pulse rounded-xl mb-2" />
      <div className="h-4 w-64 bg-slate-100 animate-pulse rounded-xl mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <PropertyCardSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Imóveis Salvos</h1>
          <p className="text-slate-500 mt-1">Olá {user?.name || user?.email}, aqui estão suas propriedades favoritas.</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem("bai_token"); router.push("/"); }} 
          className="text-red-500 font-medium hover:underline"
        >
          Sair da Conta
        </button>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white flex-1 flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-slate-300">
          <div className="text-4xl mb-4">🏠</div>
          <h2 className="text-xl font-bold mb-2">Sua lista está vazia</h2>
          <p className="text-slate-500 max-w-sm mb-6">Navegue pelas opções do mercado e salve os imóveis que combinam com você.</p>
          <Link href="/search" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition">
            Explorar Imóveis
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((fav) => {
            const imovel = fav.property;
            return (
              <div key={fav.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100 group relative">
                <button 
                  onClick={() => removeFavorite(imovel.id)}
                  className="absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur rounded-full text-red-500 font-bold shadow-sm hover:bg-red-500 hover:text-white transition"
                  title="Remover dos favoritos"
                >
                  ✕
                </button>
                <div className="relative h-40 overflow-hidden bg-slate-200">
                  <img src={imovel.image_url || "https://plchldr.co/i/500x250"} alt={imovel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <div className="text-xs text-blue-600 font-semibold mb-1 truncate">{imovel.neighborhood}, {imovel.city}</div>
                  <h3 className="text-base font-bold mb-2 truncate" title={imovel.title}>{imovel.title}</h3>
                  <div className="text-lg font-black text-slate-900 tracking-tight mb-3">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.price)}
                  </div>
                  <Link href={`/properties/${imovel.id}`} className="block text-center w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition">
                    Detalhes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
