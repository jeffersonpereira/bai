"use client";
import { useState, useEffect } from "react";
import Header from "../../components/Header";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export default function TeamManagement() {
  const [brokers, setBrokers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBroker, setNewBroker] = useState({ name: "", email: "", password: "", creci: "" });
  const [error, setError] = useState("");

  const fetchBrokers = async () => {
    const token = localStorage.getItem("bai_token");
    try {
      const res = await fetch(`${API}/api/v1/team/brokers`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setBrokers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleAddBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("bai_token");
    try {
      const res = await fetch(`${API}/api/v1/team/brokers`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newBroker)
      });
      if (res.ok) {
        setNewBroker({ name: "", email: "", password: "", creci: "" });
        setShowAddForm(false);
        fetchBrokers();
      } else {
        const data = await res.json();
        setError(data.detail);
      }
    } catch (err) {
      setError("Erro ao adicionar corretor");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Equipe</h1>
            <p className="text-slate-500">Gerencie os corretores vinculados à sua imobiliária.</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition flex items-center gap-2"
          >
            {showAddForm ? "Cancelar" : "🔌 Adicionar Corretor"}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 bg-white p-6 rounded-3xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold mb-4">Novo Membro da Equipe</h2>
            {error && <p className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
            <form onSubmit={handleAddBroker} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input 
                required
                type="text" 
                placeholder="Nome Completo" 
                className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
                value={newBroker.name}
                onChange={e => setNewBroker({...newBroker, name: e.target.value})}
              />
              <input 
                required
                type="email" 
                placeholder="E-mail" 
                className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
                value={newBroker.email}
                onChange={e => setNewBroker({...newBroker, email: e.target.value})}
              />
              <input 
                required
                type="password" 
                placeholder="Senha Temporária" 
                className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
                value={newBroker.password}
                onChange={e => setNewBroker({...newBroker, password: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="CRECI (opcional)" 
                className="px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500"
                value={newBroker.creci}
                onChange={e => setNewBroker({...newBroker, creci: e.target.value})}
              />
              <button className="lg:col-span-4 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">
                Confirmar Cadastro
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Membro</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">E-mail</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">CRECI</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">Data Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Carregando equipe...</td></tr>
              ) : brokers.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Nenhum corretor vinculado ainda.</td></tr>
              ) : brokers.map(broker => (
                <tr key={broker.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                        {broker.name[0]}
                      </div>
                      <span className="font-bold text-slate-700">{broker.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{broker.email}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-mono">{broker.creci || "---"}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(broker.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}
