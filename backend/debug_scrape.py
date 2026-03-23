import asyncio
import sys
import os

# Adiciona o diretório atual ao sys.path para permitir importações relativas
sys.path.append(os.getcwd())

from app.scraper.core import ImovelScraper

async def debug():
    scraper = ImovelScraper()
    sites = [
        {"url": "https://www.imovelweb.com.br/imoveis-aluguel-sao-paulo-sp.html", "source": "ImovelWeb"},
        {"url": "https://www.olx.com.br/imoveis/estado-sp/sao-paulo-e-regiao", "source": "OLX"},
    ]
    
    for site in sites:
        print(f"\n--- Testando {site['source']} ---")
        html = await scraper.fetch_html(site['url'])
        if not html:
            print(f"FAILED to fetch HTML for {site['source']}")
            continue
            
        print(f"HTML fetch SUCCESS ({len(html)} bytes)")
        
        if site['source'] == "ImovelWeb":
            res = scraper.parse_imovelweb_data(html)
        else:
            res = scraper.parse_olx_data(html)
            
        print(f"Parsed {len(res)} properties.")
        if res:
            for i, p in enumerate(res[:2]):
                print(f"Property {i}: {p['title']} | Image: {p['image_url']}")
        else:
            # Save a snippet of HTML for inspection if no properties found
            with open(f"debug_{site['source'].lower()}.html", "w", encoding="utf-8") as f:
                f.write(html[:5000])
            print(f"Saved snippet to debug_{site['source'].lower()}.html")

if __name__ == "__main__":
    asyncio.run(debug())
