"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface Cupom {
  id: number;
  codigo: string;
  tipo_desconto: "percentual" | "fixo";
  valor_desconto: number;
  valido_ate: string | null;
  usos_max: number | null;
  usos_atual: number;
  ativo: boolean;
  criado_em: string;
}

const emptyForm = {
  codigo: "",
  tipo_desconto: "percentual" as "percentual" | "fixo",
  valor_desconto: "",
  valido_ate: "",
  usos_max: "",
};

export default function CuponsAdminPage() {
  const { token } = useAuth();
  const { success, error: toastError } = useToast();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCupons = async () => {
    if (!token) return;
    const res = await fetch(`${API}/api/v1/admin/cupons`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setCupons(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchCupons(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/cupons`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: form.codigo,
          tipo_desconto: form.tipo_desconto,
          valor_desconto: parseFloat(form.valor_desconto),
          valido_ate: form.valido_ate ? new Date(form.valido_ate).toISOString() : null,
          usos_max: form.usos_max ? parseInt(form.usos_max) : null,
        }),
      });
      if (res.ok) {
        success("Cupom criado com sucesso!");
        setForm(emptyForm);
        setShowForm(false);
        fetchCupons();
      } else {
        const data = await res.json();
        toastError(data.detail || "Erro ao criar cupom.");
      }
    } catch { toastError("Erro de conexão."); }
    finally { setSubmitting(false); }
  };

  const toggleAtivo = async (cupom: Cupom) => {
    const res = await fetch(`${API}/api/v1/admin/cupons/${cupom.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !cupom.ativo }),
    });
    if (res.ok) {
      success(cupom.ativo ? "Cupom desativado." : "Cupom ativado.");
      fetchCupons();
    } else { toastError("Erro ao atualizar cupom."); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cupons de Desconto</h1>
          <p className="text-slate-500 font-medium mt-1">Gerencie os cupons para planos pagos.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition text-sm"
        >
          {showForm ? "Cancelar" : "+ Novo Cupom"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Criar Cupom</h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Código *</label>
              <input
                required
                type="text"
                value={form.codigo}
                onChange={e => setForm(p => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                placeholder="Ex: PROMO20"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo *</label>
              <select
                value={form.tipo_desconto}
                onChange={e => setForm(p => ({ ...p, tipo_desconto: e.target.value as any }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 appearance-none"
              >
                <option value="percentual">Percentual (%)</option>
                <option value="fixo">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Valor * {form.tipo_desconto === "percentual" ? "(%)" : "(R$)"}
              </label>
              <input
                required
                type="number"
                min="0"
                max={form.tipo_desconto === "percentual" ? "100" : undefined}
                step="0.01"
                value={form.valor_desconto}
                onChange={e => setForm(p => ({ ...p, valor_desconto: e.target.value }))}
                placeholder={form.tipo_desconto === "percentual" ? "Ex: 20" : "Ex: 50.00"}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Válido até (opcional)</label>
              <input
                type="date"
                value={form.valido_ate}
                onChange={e => setForm(p => ({ ...p, valido_ate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Deixe vazio para prazo indeterminado.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Limite de usos (opcional)</label>
              <input
                type="number"
                min="1"
                value={form.usos_max}
                onChange={e => setForm(p => ({ ...p, usos_max: e.target.value }))}
                placeholder="Ex: 100"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Deixe vazio para usos ilimitados.</p>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition text-sm"
              >
                {submitting ? "Criando..." : "Criar Cupom"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Código", "Desconto", "Validade", "Usos", "Status", "Ações"].map(h => (
                <th key={h} className="px-5 py-4 text-xs font-black uppercase text-slate-400 tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Carregando...</td></tr>
            ) : cupons.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 italic">Nenhum cupom criado ainda.</td></tr>
            ) : cupons.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4">
                  <span className="font-black text-slate-800 font-mono tracking-widest text-sm">{c.codigo}</span>
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                  {c.tipo_desconto === "percentual" ? `${c.valor_desconto}%` : `R$ ${c.valor_desconto.toFixed(2)}`}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {c.valido_ate ? fmtDate(c.valido_ate) : <span className="text-emerald-600 font-semibold">Indeterminado</span>}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                  {c.usos_atual} / {c.usos_max ?? "∞"}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${c.ativo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => toggleAtivo(c)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${c.ativo ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                  >
                    {c.ativo ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
