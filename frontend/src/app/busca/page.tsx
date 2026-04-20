import BuscaSplitWrapper from "./components/BuscaSplitWrapper";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:40001";

async function getProperties(params: any) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value || key === "map") return;
    if (Array.isArray(value)) {
      (value as string[]).forEach((v) => query.append(key, v));
    } else {
      query.append(key, value as string);
    }
  });

  try {
    const res = await fetch(`${API}/api/v1/properties/?${query.toString()}`, { cache: "no-store" });
    if (!res.ok) return { items: [], total: 0 };
    return res.json();
  } catch {
    return { items: [], total: 0 };
  }
}

async function getLocations() {
  try {
    const res = await fetch(`${API}/api/v1/properties/locations`, { cache: "no-store" });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export default async function BuscaPage({ searchParams }: { searchParams: Promise<any> }) {
  const par = await searchParams;
  const [propertiesData, locations] = await Promise.all([getProperties(par), getLocations()]);

  return (
    <BuscaSplitWrapper
      initialParams={par}
      locations={locations}
      initialProperties={propertiesData.items ?? []}
      total={propertiesData.total ?? 0}
    />
  );
}
