"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

interface UserAdmin {
  id: number;
  email: string;
  nome: string | null;
  perfil: string;
  creci: string | null;
  ativo: boolean;
  criado_em: string;
  tipo_plano: string | null;
  plano_expira_em: string | null;
  broker_count: number;
}

interface UserListResponse {
  items: UserAdmin[];
  total: number;
  page: number;
  limit: number;
}

interface PlanStats {
  gratuito: number;
  pro: number;
  premium: number;
  expirando_em_7_dias: number;
}

interface EditForm {
  nome: string;
  perfil: string;
  ativo: boolean;
  tipo_plano: string;
  plano_expira_em: string;
  creci: string;
}

const PERFIL_LABELS: Record<string, string> = {
  admin: "Admin",
  imobiliaria: "Imobiliária",
  corretor: "Corretor",
  comprador: "Comprador",
};

const PERFIL_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  imobiliaria: "bg-blue-100 text-blue-700",
  corretor: "bg-amber-100 text-amber-700",
  comprador: "bg-slate-100 text-slate-600",
};

const PLANO_COLORS: Record<string, string> = {
  premium: "bg-purple-100 text-purple-700",
  pro: "bg-indigo-100 text-indigo-700",
  gratuito: "bg-slate-100 text-slate-500",
};

export default function AdminUsersPage() {
  const { success, error: toastError } = useToast();
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<"usuarios" | "planos">("usuarios");
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [planStats, setPlanStats] = useState<PlanStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [loading, setLoading] = useState(true);
  const [selectedPerfil, setSelectedPerfil] = useState("");
  const [selectedPlano, setSelectedPlano] = useState("");
  const [selectedAtivo, setSelectedAtivo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingUser, setEditingUser] = useState<UserAdmin | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    nome: "",
    perfil: "",
    ativo: true,
    tipo_plano: "gratuito",
    plano_expira_em: "",
    creci: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const fetchPlanStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/plans/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPlanStats(await res.json());
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  const fetchUsers = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const url = new URL(`${API}/api/v1/admin/users`);
      url.searchParams.set("page", p.toString());
      url.searchParams.set("limit", LIMIT.toString());
      if (selectedPerfil) url.searchParams.set("perfil", selectedPerfil);
      if (selectedPlano) url.searchParams.set("tipo_plano", selectedPlano);
      if (selectedAtivo !== "") url.searchParams.set("ativo", selectedAtivo);
      if (searchQuery) url.searchParams.set("q", searchQuery);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: UserListResponse = await res.json();
        setUsers(data.items);
        setTotal(data.total);
        setPage(data.page);
      }
    } finally {
      setLoading(false);
    }
  }, [token, page, selectedPerfil, selectedPlano, selectedAtivo, searchQuery]);

  useEffect(() => {
    if (!token || authLoading) return;
    fetchUsers(1);
    fetchPlanStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading, selectedPerfil, selectedPlano, selectedAtivo]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1);
    fetchPlanStats();
  };

  const openEdit = (u: UserAdmin) => {
    setEditingUser(u);
    setEditForm({
      nome: u.nome || "",
      perfil: u.perfil,
      ativo: u.ativo,
      tipo_plano: u.tipo_plano || "gratuito",
      plano_expira_em: u.plano_expira_em ? u.plano_expira_em.split("T")[0] : "",
      creci: u.creci || "",
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        nome: editForm.nome || null,
        perfil: editForm.perfil,
        ativo: editForm.ativo,
        tipo_plano: editForm.tipo_plano,
        creci: editForm.creci || null,
        plano_expira_em: editForm.plano_expira_em || null,
      };

      const res = await fetch(`${API}/api/v1/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated: UserAdmin = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setEditingUser(null);
        success("Usuário atualizado com sucesso!");
        fetchPlanStats();
      } else {
        toastError("Erro ao salvar alterações.");
      }
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const goToPage = (p: number) => {
    setPage(p);
    fetchUsers(p);
  };

  if (authLoading) return <div className="p-20 text-center animate-pulse">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/dashboard/admin" className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2 mb-2">
            ← Voltar ao Cockpit
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Usuários & Planos</h1>
          <p className="text-slate-500 font-medium mt-1">Gerencie contas, perfis e assinaturas da plataforma.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-slate-900">{total}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">usuários encontrados</div>
        </div>
      </div>

      {/* Plan Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer transition hover:shadow-md ${selectedPlano === "" && selectedPerfil === "" ? "ring-2 ring-slate-900" : ""}`}
          onClick={() => { setSelectedPlano(""); setSelectedPerfil(""); }}
        >
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Ativos</div>
          <div className="text-3xl font-black text-slate-900">
            {loadingStats ? "—" : (planStats ? planStats.gratuito + planStats.pro + planStats.premium : 0)}
          </div>
        </div>
        <div
          className={`bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer transition hover:shadow-md ${selectedPlano === "gratuito" ? "ring-2 ring-slate-900" : ""}`}
          onClick={() => setSelectedPlano(selectedPlano === "gratuito" ? "" : "gratuito")}
        >
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Gratuito</div>
          <div className="text-3xl font-black text-slate-700">{loadingStats ? "—" : planStats?.gratuito ?? 0}</div>
        </div>
        <div
          className={`bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm cursor-pointer transition hover:shadow-md ${selectedPlano === "pro" ? "ring-2 ring-indigo-600" : ""}`}
          onClick={() => setSelectedPlano(selectedPlano === "pro" ? "" : "pro")}
        >
          <div className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Pro</div>
          <div className="text-3xl font-black text-indigo-700">{loadingStats ? "—" : planStats?.pro ?? 0}</div>
        </div>
        <div
          className={`bg-purple-50 p-5 rounded-2xl border border-purple-100 shadow-sm cursor-pointer transition hover:shadow-md ${selectedPlano === "premium" ? "ring-2 ring-purple-600" : ""}`}
          onClick={() => setSelectedPlano(selectedPlano === "premium" ? "" : "premium")}
        >
          <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">Premium</div>
          <div className="text-3xl font-black text-purple-700">{loadingStats ? "—" : planStats?.premium ?? 0}</div>
          {(planStats?.expirando_em_7_dias ?? 0) > 0 && (
            <div className="text-[10px] font-bold text-amber-600 mt-1">
              {planStats!.expirando_em_7_dias} expira em 7 dias
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Buscar</label>
          <input
            type="text"
            placeholder="Nome ou e-mail..."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="w-full md:w-44">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Perfil</label>
          <select
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm appearance-none"
            value={selectedPerfil}
            onChange={(e) => setSelectedPerfil(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="comprador">Comprador</option>
            <option value="corretor">Corretor</option>
            <option value="imobiliaria">Imobiliária</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="w-full md:w-44">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Status</label>
          <select
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm appearance-none"
            value={selectedAtivo}
            onChange={(e) => setSelectedAtivo(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Bloqueados</option>
          </select>
        </div>
        <button
          onClick={handleSearch}
          className="w-full md:w-auto px-6 h-11 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-700 transition text-sm"
        >
          Filtrar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-slate-400 font-medium text-sm">Carregando usuários...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-4">Usuário</th>
                  <th className="px-5 py-4">Perfil</th>
                  <th className="px-5 py-4">Plano</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Cadastrado</th>
                  <th className="px-5 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition">
                    <td className="px-5 py-4 align-middle">
                      <div className="font-bold text-slate-900 text-sm">{u.nome || "Sem Nome"}</div>
                      <div className="text-xs text-slate-400 font-medium">{u.email}</div>
                      {u.creci && <div className="text-[10px] text-slate-400 mt-0.5">CRECI: {u.creci}</div>}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${PERFIL_COLORS[u.perfil] || "bg-slate-100 text-slate-600"}`}>
                        {PERFIL_LABELS[u.perfil] || u.perfil}
                      </span>
                      {u.perfil === "imobiliaria" && u.broker_count > 0 && (
                        <div className="text-[10px] text-slate-400 mt-1">{u.broker_count} corretor(es)</div>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${PLANO_COLORS[u.tipo_plano || "gratuito"] || "bg-slate-100 text-slate-500"}`}>
                        {(u.tipo_plano || "gratuito").toUpperCase()}
                      </span>
                      {u.plano_expira_em && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          Vence: {new Date(u.plano_expira_em).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${u.ativo ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {u.ativo ? "Ativo" : "Bloqueado"}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle text-xs text-slate-400 font-medium">
                      {new Date(u.criado_em).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-4 align-middle text-right">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-bold text-sm">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400 font-medium">
            Página {page} de {totalPages} — {total} usuários
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = page <= 4 ? i + 1 : page - 3 + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition ${p === page ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">Editar Usuário</h2>
              <p className="text-sm text-slate-400 font-medium mt-0.5">{editingUser.email} · ID #{editingUser.id}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Nome</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Perfil</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={editForm.perfil}
                    onChange={(e) => setEditForm({ ...editForm, perfil: e.target.value })}
                  >
                    <option value="comprador">Comprador</option>
                    <option value="corretor">Corretor</option>
                    <option value="imobiliaria">Imobiliária</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Status</label>
                  <div className="flex gap-2 h-[42px]">
                    <button
                      onClick={() => setEditForm({ ...editForm, ativo: true })}
                      className={`flex-1 rounded-xl text-xs font-bold transition border-2 ${editForm.ativo ? "bg-emerald-100 text-emerald-700 border-emerald-400" : "bg-slate-50 text-slate-400 border-transparent"}`}
                    >
                      Ativo
                    </button>
                    <button
                      onClick={() => setEditForm({ ...editForm, ativo: false })}
                      className={`flex-1 rounded-xl text-xs font-bold transition border-2 ${!editForm.ativo ? "bg-red-100 text-red-600 border-red-400" : "bg-slate-50 text-slate-400 border-transparent"}`}
                    >
                      Bloqueado
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Plano</label>
                <div className="flex gap-2">
                  {["gratuito", "pro", "premium"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setEditForm({ ...editForm, tipo_plano: p })}
                      className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition border-2 ${
                        editForm.tipo_plano === p
                          ? p === "premium"
                            ? "bg-purple-100 text-purple-700 border-purple-400"
                            : p === "pro"
                            ? "bg-indigo-100 text-indigo-700 border-indigo-400"
                            : "bg-slate-200 text-slate-700 border-slate-400"
                          : "bg-slate-50 text-slate-400 border-transparent"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Vencimento do Plano</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editForm.plano_expira_em}
                    onChange={(e) => setEditForm({ ...editForm, plano_expira_em: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">CRECI</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editForm.creci}
                    onChange={(e) => setEditForm({ ...editForm, creci: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 bg-slate-50 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition text-sm shadow-lg shadow-blue-100"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
