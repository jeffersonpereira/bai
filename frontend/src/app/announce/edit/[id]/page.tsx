"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import CurrencyInput from "@/app/components/ui/CurrencyInput";
import NumberMaskInput from "@/app/components/ui/NumberMaskInput";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

export default function EditAnnouncePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<{url: string, media_type: string}[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    listing_type: "venda",
    property_type: "apartamento",
    city: "",
    neighborhood: "",
    area: "",
    bedrooms: "",
    bathrooms: "",
    garage_spaces: "",
    financing_eligible: false,
    description: "",
    image_url: "",
    actual_owner_id: "",
    commission_percentage: "",
    full_address: "",
  });
  const [availability, setAvailability] = useState<{day_of_week: number, start_time: string, end_time: string}[]>([]);
  const [showQuickOwner, setShowQuickOwner] = useState(false);
  const [quickOwner, setQuickOwner] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("bai_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API}/api/v1/crm/owners?limit=1000`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOwners(data.items || data);
        }
      } catch (err) { console.error(err); }

      try {
        const propRes = await fetch(`${API}/api/v1/properties/${propertyId}`);
        
        if (propRes.ok) {
          const propData = await propRes.json();
          setFormData({
            title: propData.title,
            description: propData.description || "",
            price: propData.price.toString(),
            area: propData.area ? propData.area.toString() : "",
            bedrooms: propData.bedrooms ? propData.bedrooms.toString() : "",
            bathrooms: propData.bathrooms ? propData.bathrooms.toString() : "",
            garage_spaces: propData.garage_spaces ? propData.garage_spaces.toString() : "",
            financing_eligible: propData.financing_eligible || false,
            city: propData.city || "",
            neighborhood: propData.neighborhood || "",
            image_url: propData.image_url || "",
            actual_owner_id: propData.actual_owner_id ? propData.actual_owner_id.toString() : "",
            commission_percentage: propData.commission_percentage ? propData.commission_percentage.toString() : "",
            listing_type: propData.listing_type || "venda",
            property_type: propData.property_type || "apartamento",
            full_address: propData.full_address || ""
          });
          if (propData.media && propData.media.length > 0) {
            setMediaItems(propData.media.map((m: any) => ({ url: m.url, media_type: m.media_type })));
          }
          if (propData.availability_windows) {
            setAvailability(propData.availability_windows.map((a: any) => ({ 
              day_of_week: a.day_of_week, 
              start_time: a.start_time.slice(0, 5), 
              end_time: a.end_time.slice(0, 5) 
            })));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchInitialData();
  }, [router, propertyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleQuickOwnerSave = async () => {
    if (!quickOwner.name) return;
    const token = localStorage.getItem("bai_token");
    const payload: any = { name: quickOwner.name };
    if (quickOwner.phone) payload.phone = quickOwner.phone;
    if (quickOwner.email) payload.email = quickOwner.email;

    try {
      const res = await fetch(`${API}/api/v1/crm/owners`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newOwner = await res.json();
        setOwners(prev => [...prev, newOwner]);
        setFormData(prev => ({ ...prev, actual_owner_id: String(newOwner.id) }));
        setShowQuickOwner(false);
        setQuickOwner({ name: "", phone: "", email: "" });
      }
    } catch (err) { console.error(err); }
  };

  const handleAddMedia = (type: string) => {
    setMediaItems([...mediaItems, { url: "", media_type: type }]);
  };

  const handleMediaChange = (index: number, url: string) => {
    const updated = [...mediaItems];
    updated[index].url = url;
    setMediaItems(updated);
  };

  const handleRemoveMedia = (index: number) => {
    const updated = [...mediaItems];
    updated.splice(index, 1);
    setMediaItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const token = localStorage.getItem("bai_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API}/api/v1/properties/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          area: formData.area ? parseFloat(formData.area) : null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
          garage_spaces: formData.garage_spaces ? parseInt(formData.garage_spaces) : 0,
          financing_eligible: formData.financing_eligible,
          actual_owner_id: formData.actual_owner_id ? parseInt(formData.actual_owner_id) : null,
          commission_percentage: formData.commission_percentage ? parseFloat(formData.commission_percentage) : null,
          full_address: formData.full_address || null,
          media: mediaItems.filter(m => m.url.trim() !== ""),
          availability_windows: availability
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao atualizar anúncio");
      }

      setSuccess(true);
      setTimeout(() => router.push("/search"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Editar Anúncio</h1>
          <p className="text-slate-500">Atualize as informações do seu imóvel no BAI.</p>
        </div>

        {error && <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">{error}</div>}
        {success && <div className="mb-6 bg-green-50 text-green-600 p-4 rounded-2xl text-sm font-medium border border-green-100 italic">✓ Imóvel atualizado com sucesso! Redirecionando...</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Informações Básicas
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Título do Anúncio</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="Ex: Apartamento Moderno no Centro" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Preço (R$)</label>
                <CurrencyInput value={formData.price} onChange={(val) => setFormData({...formData, price: val !== undefined ? String(val) : ""})} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="Ex: 500000" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Negócio</label>
                <select name="listing_type" value={formData.listing_type} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition appearance-none font-medium text-slate-700">
                  <option value="venda">Venda</option>
                  <option value="aluguel">Aluguel</option>
                  <option value="temporada">Temporada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tipo de Imóvel</label>
                <select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition appearance-none font-medium text-slate-700">
                  <option value="apartamento">Apartamento</option>
                  <option value="casa">Casa</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Localização
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Cidade</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="Ex: São Paulo" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bairro</label>
                <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="Ex: Jardins" />
              </div>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Endereço Completo (para visualização no mapa)</label>
               <input type="text" name="full_address" value={formData.full_address} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP" />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Detalhes
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Área (m²)</label>
                <NumberMaskInput value={formData.area} onChange={(val) => setFormData({...formData, area: val !== undefined ? String(val) : ""})} suffix=" m²" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="0 m²" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quartos</label>
                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Banheiros</label>
                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Vagas Garagem</label>
                <input type="number" name="garage_spaces" value={formData.garage_spaces} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Comercial & CRM
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Proprietário (Cliente CRM)</label>
                <button 
                  type="button" 
                  onClick={() => setShowQuickOwner(!showQuickOwner)}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition"
                >
                  {showQuickOwner ? "× Cancelar" : "+ Novo Proprietário Rápido"}
                </button>
              </div>

              {showQuickOwner ? (
                <div className="bg-white border-2 border-dashed border-blue-100 p-4 rounded-3xl space-y-4 animate-in fade-in zoom-in duration-200">
                  <input 
                    type="text" 
                    placeholder="Nome completo do proprietário" 
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500"
                    value={quickOwner.name}
                    onChange={e => setQuickOwner({...quickOwner, name: e.target.value})}
                  />
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Telefone/WhatsApp" 
                      className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500"
                      value={quickOwner.phone}
                      onChange={e => setQuickOwner({...quickOwner, phone: e.target.value})}
                    />
                    <button 
                      type="button" 
                      onClick={handleQuickOwnerSave}
                      className="bg-blue-600 text-white font-bold text-sm px-6 rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                    >
                      Cadastrar e Vincular
                    </button>
                  </div>
                </div>
              ) : (
                <select name="actual_owner_id" value={formData.actual_owner_id} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition appearance-none font-medium text-slate-700">
                  <option value="">Nenhum - Fica sob gestão direta</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>{owner.name} ({owner.document || 'Sem doc'})</option>
                  ))}
                </select>
              )}
              <p className="mt-2 text-[10px] text-slate-400">Vincule um dono para gerenciar as permissões e dados no CRM.</p>
            </div>
            <div className="flex flex-col justify-end pb-3">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl hover:border-blue-200 transition-colors cursor-pointer group">
                <input 
                  type="checkbox" 
                  id="financing_eligible" 
                  name="financing_eligible" 
                  checked={formData.financing_eligible} 
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="financing_eligible" className="text-sm font-bold text-slate-700 cursor-pointer group-hover:text-blue-600 transition-colors">
                  Imóvel elegível para Financiamento Bancário
                </label>
              </div>
            </div>
          </div>
{/* Disponibilidade para Visitas */}
          <div className="pt-8 border-t border-slate-100 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Disponibilidade para Visitas
              </h2>
              <button 
                type="button" 
                onClick={() => setAvailability([...availability, { day_of_week: 1, start_time: "09:00", end_time: "17:00" }])}
                className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
              >
                + Adicionar Janela
              </button>
            </div>
            
            {availability.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-3xl text-center">
                <p className="text-xs text-slate-400 font-medium">Nenhuma janela de visita definida.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availability.map((window, idx) => (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <select 
                      value={window.day_of_week} 
                      onChange={e => {
                        const updated = [...availability];
                        updated[idx].day_of_week = parseInt(e.target.value);
                        setAvailability(updated);
                      }}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    >
                      <option value={1}>Segunda</option>
                      <option value={2}>Terça</option>
                      <option value={3}>Quarta</option>
                      <option value={4}>Quinta</option>
                      <option value={5}>Sexta</option>
                      <option value={6}>Sábado</option>
                      <option value={0}>Domingo</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input 
                        type="time" 
                        value={window.start_time} 
                        onChange={e => {
                          const updated = [...availability];
                          updated[idx].start_time = e.target.value;
                          setAvailability(updated);
                        }}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm w-32 outline-none"
                      />
                      <span className="text-slate-400 font-bold">até</span>
                      <input 
                        type="time" 
                        value={window.end_time} 
                        onChange={e => {
                          const updated = [...availability];
                          updated[idx].end_time = e.target.value;
                          setAvailability(updated);
                        }}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm w-32 outline-none"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAvailability(availability.filter((_, i) => i !== idx))} 
                      className="text-slate-300 hover:text-red-500 transition px-2 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-slate-100 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              Galeria de Imagens e Vídeos
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">URL da Imagem de Capa Principal</label>
              <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition" placeholder="https://..." />
              <p className="mt-2 text-[10px] text-slate-400">Esta será a imagem em destaque nas listagens.</p>
            </div>
            
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Mídias Adicionais</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleAddMedia('image')} className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition">+ Foto</button>
                  <button type="button" onClick={() => handleAddMedia('video')} className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition">+ Vídeo</button>
                  <button type="button" onClick={() => handleAddMedia('document')} className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition">+ Documento</button>
                </div>
              </div>
              
              {mediaItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`text-xl ${item.media_type === 'video' ? 'text-indigo-500' : 'text-blue-500'}`}>
                    {item.media_type === 'video' ? '🎬' : '📸'}
                  </div>
                  <input 
                    type="text" 
                    value={item.url} 
                    onChange={e => handleMediaChange(idx, e.target.value)} 
                    className={`flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition ${item.media_type === 'document' ? 'border-emerald-200' : ''}`} 
                    placeholder={`URL ${item.media_type === 'video' ? 'do Vídeo (ex: YouTube)' : item.media_type === 'document' ? 'do Documento (ex: PDF)' : 'da Imagem'}`} 
                  />
                  <button type="button" onClick={() => handleRemoveMedia(idx)} className="text-slate-400 hover:text-red-500 font-black text-xl px-2 transition">×</button>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Descrição Detalhada</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition resize-none" placeholder="Conte mais sobre o imóvel..."></textarea>
            </div>
          </div>

          <div className="pt-12">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl transition-all ${loading ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300'}`}
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
