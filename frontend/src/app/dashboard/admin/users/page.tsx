"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ui/Toast";

interface UserAdmin {
  id: number;
  email: string;
  name: string | null;
  role: string;
  creci: string | null;
  is_active: boolean;
  created_at: string;
  plan_type: string | null;
  plan_expires_at: string | null;
}

export default function AdminUsersPage() {
  const { success, error: toastError } = useToast();
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingUser, setEditingUser] = useState<UserAdmin | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserAdmin>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [user, token, authLoading, router, selectedRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:40001"}/api/v1/admin/users?`;
      if (selectedRole) url += `role=${selectedRole}&`;
      if (searchQuery) url += `q=${searchQuery}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:40001"}/api/v1/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
        setEditingUser(null);
      } else {
        toastError("Erro ao atualizar!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (u: UserAdmin) => {
    setEditingUser(u);
    setEditFormData({
      is_active: u.is_active,
      plan_type: u.plan_type || "free",
      plan_expires_at: u.plan_expires_at ? u.plan_expires_at.split("T")[0] : ""
    });
  };

  if (authLoading) return <div className="p-20 text-center animate-pulse">Carregando...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/dashboard/admin" className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2 mb-2">
            ← Voltar ao Cockpit
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Usuários</h1>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Buscar</label>
          <input 
            type="text" 
            placeholder="Nome ou e-mail..."
            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition outline-none font-medium"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers()}
          />
        </div>
        <div className="w-full md:w-64 space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Cargo</label>
          <select 
            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 transition outline-none font-medium appearance-none"
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="user">Usuário Comum</option>
            <option value="broker">Corretor</option>
            <option value="agency">Imobiliária</option>
          </select>
        </div>
        <button 
          onClick={fetchUsers}
          className="w-full md:w-auto px-8 h-12 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition shadow-sm"
        >
          Filtrar
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center animate-pulse flex flex-col items-center">
             <div className="w-6 h-6 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
             Buscando identidades...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="p-5 font-bold">Tipo</th>
                  <th className="p-5 font-bold">Identificação</th>
                  <th className="p-5 font-bold">Status</th>
                  <th className="p-5 font-bold">Plano SaaS</th>
                  <th className="p-5 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-5 align-middle">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' : 
                        u.role === 'agency' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'broker' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-5 align-middle">
                      <div className="font-bold text-slate-900">{u.name || 'Sem Nome'}</div>
                      <div className="text-xs font-medium text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-5 align-middle">
                       <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                         {u.is_active ? 'Ativo' : 'Bloqueado'}
                       </span>
                    </td>
                    <td className="p-5 align-middle">
                       <div className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                         {u.plan_type || 'FREE'}
                       </div>
                       {u.plan_expires_at && <div className="text-[10px] font-medium text-slate-400">Vence: {new Date(u.plan_expires_at).toLocaleDateString('pt-BR')}</div>}
                    </td>
                    <td className="p-5 text-right align-middle">
                      <button 
                        onClick={() => openEdit(u)}
                        className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">Nenhum usuário encontrado na base.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 mb-2">Editar Usuário</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">{editingUser.email}</p>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Status da Conta</label>
                <div className="flex gap-2">
                  <button onClick={() => setEditFormData({...editFormData, is_active: true})} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${editFormData.is_active ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' : 'bg-slate-50 text-slate-500 border-2 border-transparent'}`}>Ativa</button>
                  <button onClick={() => setEditFormData({...editFormData, is_active: false})} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${!editFormData.is_active ? 'bg-red-100 text-red-700 border-2 border-red-500' : 'bg-slate-50 text-slate-500 border-2 border-transparent'}`}>Bloqueada</button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Plano SaaS</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 border border-slate-200 text-sm font-bold text-slate-800"
                  value={editFormData.plan_type || "free"}
                  onChange={(e) => setEditFormData({...editFormData, plan_type: e.target.value})}
                >
                  <option value="free">FREE</option>
                  <option value="pro">PRO</option>
                  <option value="premium">PREMIUM</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Vencimento do Plano</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-800"
                  value={editFormData.plan_expires_at || ""}
                  onChange={(e) => setEditFormData({...editFormData, plan_expires_at: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-3 bg-slate-50 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition">Cancelar</button>
                <button onClick={handleUpdate} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
