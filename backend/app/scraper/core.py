import httpx
from bs4 import BeautifulSoup
import re
import json

class ImovelScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.google.com/",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "cross-site",
            "Sec-Fetch-User": "?1",
        }

    async def fetch_html(self, url: str) -> str | None:
        # Usando HTTP/2 e um cliente mais robusto
        async with httpx.AsyncClient(
            headers=self.headers, 
            follow_redirects=True,
            http2=True,
            timeout=20.0
        ) as client:
            try:
                print(f"Buscando {url}...")
                response = await client.get(url)
                if response.status_code == 403:
                    print(f"BLOQUEIO 403 em {url}. Tentando alternativa...")
                    return None
                response.raise_for_status()
                return response.text
            except Exception as e:
                print(f"Erro ao buscar {url}: {e}")
                return None

    def parse_imovelweb_data(self, html: str) -> list:
        soup = BeautifulSoup(html, "html.parser")
        # Selector updated based on browser analysis: "div[data-qa='posting PROPERTY']"
        items = soup.find_all("div", attrs={"data-qa": re.compile(r"posting PROPERTY|posting-card")})
        properties = []
        
        for item in items:
            try:
                # Title and URL
                title_el = item.find("h2") or item.find("div", attrs={"data-qa": "POSTING_CARD_DESCRIPTION"})
                title = title_el.text.strip() if title_el else "Imóvel ImovelWeb"
                
                # Check for link in diverse locations
                a_tag = item.find("a")
                source_url = ""
                if a_tag and "href" in a_tag.attrs:
                    source_url = a_tag["href"]
                elif "data-to-posting" in item.attrs:
                    source_url = item["data-to-posting"]
                
                if source_url and not source_url.startswith("http"):
                    source_url = "https://www.imovelweb.com.br" + source_url
                
                # Price
                price_float = 0.0
                price_el = item.find("div", attrs={"data-qa": "POSTING_CARD_PRICE"})
                if price_el:
                    price_text = price_el.text.strip()
                    price_digits = re.sub(r'[^\d]', '', price_text)
                    if price_digits:
                        price_float = float(price_digits)
                
                # Features
                area = None
                bedrooms = None
                bathrooms = None
                
                features = item.find("div", attrs={"data-qa": "POSTING_CARD_FEATURES"})
                if features:
                    text = features.text.lower()
                    m2_match = re.search(r'(\d+)\s*m²', text)
                    if m2_match: area = float(m2_match.group(1))
                    
                    quartos_match = re.search(r'(\d+)\s*quartos?', text)
                    if quartos_match: bedrooms = int(quartos_match.group(1))
                    
                    banheiros_match = re.search(r'(\d+)\s*banheiros?', text)
                    if banheiros_match: bathrooms = int(banheiros_match.group(1))
                
                # Location
                loc_el = item.find("div", attrs={"data-qa": "POSTING_CARD_LOCATION"})
                location_full = loc_el.text.strip() if loc_el else "São Paulo"
                
                parts = [p.strip() for p in location_full.split(",")]
                city = parts[-2] if len(parts) >= 2 else "São Paulo"
                neighborhood = parts[0] if len(parts) >= 1 else location_full
                
                # Image - Look deeper for the real image URL
                image_url = ""
                img_el = item.find("img")
                if img_el:
                    # ImovelWeb uses data-src for lazy loading
                    image_url = img_el.get("data-src") or img_el.get("src") or ""
                    # If it's a small placeholder or base64, try to find another sibling img
                    if image_url.startswith("data:") or "placeholder" in image_url:
                         # try to find any image that looks like a real property photo
                         all_imgs = item.find_all("img")
                         for possible_img in all_imgs:
                             url = possible_img.get("data-src") or possible_img.get("src") or ""
                             if url and not url.startswith("data:"):
                                 image_url = url
                                 break
                
                properties.append({
                    "title": title[:255],
                    "description": f"{title}. Localizado em {neighborhood}, {city}.",
                    "price": price_float,
                    "area": area,
                    "bedrooms": bedrooms,
                    "bathrooms": bathrooms,
                    "city": city[:255],
                    "neighborhood": neighborhood[:255],
                    "source_url": source_url,
                    "image_url": image_url,
                    "source": "ImovelWeb"
                })
            except Exception as e:
                print(f"Erro extraindo item ImovelWeb: {e}")
                continue
        return properties

    def parse_olx_data(self, html: str) -> list:
        # OLX often stores data in a JSON script block
        # We look for __NEXT_DATA__ which contains the state
        properties = []
        try:
            soup = BeautifulSoup(html, "html.parser")
            script = soup.find("script", id="__NEXT_DATA__")
            if script:
                data = json.loads(script.string)
                ads = data.get("props", {}).get("pageProps", {}).get("ads", [])
                
                for ad in ads:
                    # Basic info
                    title = ad.get("subject", "Imóvel OLX")
                    source_url = ad.get("url", "")
                    price_text = ad.get("price", "0")
                    price_digits = re.sub(r'[^\d]', '', price_text)
                    price_float = float(price_digits) if price_digits else 0.0
                    
                    # Images
                    images = ad.get("images", [])
                    image_url = images[0].get("original", "") if images else ""
                    
                    # Location
                    loc_details = ad.get("locationDetails", {})
                    city = loc_details.get("municipality", "São Paulo")
                    neighborhood = loc_details.get("neighbourhood", city)
                    
                    # Properties (rooms, size, etc)
                    props_list = ad.get("properties", [])
                    area = None
                    bedrooms = None
                    bathrooms = None
                    
                    for p in props_list:
                        name = p.get("name")
                        val = p.get("value")
                        if name == "size":
                            m2 = re.sub(r'[^\d]', '', val)
                            if m2: area = float(m2)
                        elif name == "rooms":
                            if val and val.isdigit(): bedrooms = int(val)
                        elif name == "bathrooms":
                            if val and val.isdigit(): bathrooms = int(val)
                    
                    properties.append({
                        "title": title[:255],
                        "description": f"{title}. Publicado na OLX.",
                        "price": price_float,
                        "area": area,
                        "bedrooms": bedrooms,
                        "bathrooms": bathrooms,
                        "city": city[:255],
                        "neighborhood": neighborhood[:255],
                        "source_url": source_url,
                        "image_url": image_url,
                        "source": "OLX"
                    })
        except Exception as e:
            print(f"Erro ao parsear dados OLX: {e}")
            
        return properties

    def parse_ml_data(self, html: str) -> list:
        # Mantendo compatibilidade se necessário, mas focado nos novos
        soup = BeautifulSoup(html, "html.parser")
        items = soup.find_all("li", class_="ui-search-layout__item")
        properties = []
        
        for item in items:
            try:
                title_wrapper = item.find("h3", class_="poly-component__title-wrapper")
                if not title_wrapper: continue
                a_tag = title_wrapper.find("a")
                title = a_tag.text.strip() if a_tag else "Imóvel à venda"
                source_url = a_tag["href"] if a_tag and "href" in a_tag.attrs else ""
                
                price_float = 0.0
                price_el = item.find("span", class_="andes-money-amount__fraction")
                if price_el:
                    price_str = price_el.text.strip().replace(".", "").replace(",", ".")
                    if price_str.replace(".", "", 1).isdigit(): price_float = float(price_str)
                
                properties.append({
                    "title": title[:255],
                    "description": title,
                    "price": price_float,
                    "city": "São Paulo",
                    "neighborhood": "Bairro",
                    "source_url": source_url,
                    "image_url": ""
                })
            except Exception: continue
        return properties
