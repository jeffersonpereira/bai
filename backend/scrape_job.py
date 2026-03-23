import asyncio
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.property import Property
from app.scraper.core import ImovelScraper

# Assegurar tabelas
Base.metadata.create_all(bind=engine)

URLS_TO_SCRAPE = [
    "https://lista.mercadolivre.com.br/imoveis/venda/sao-paulo/sao-paulo/",
    "https://lista.mercadolivre.com.br/imoveis/venda/rio-de-janeiro/rio-de-janeiro/",
    "https://lista.mercadolivre.com.br/imoveis/venda/curitiba-parana/"
]

async def run_scraper():
    print("Iniciando rotina de scraping real (Mercado Livre)...")
    scraper = ImovelScraper()
    
    db: Session = SessionLocal()
    try:
        total_inserted = 0
        for url in URLS_TO_SCRAPE:
            print(f"Baixando: {url}")
            html = await scraper.fetch_html(url)
            if not html:
                print(f"Falha ao carregar HTML de {url}")
                continue
                
            extracted = scraper.parse_ml_data(html)
            print(f"Extraídos {len(extracted)} itens de {url}")
            
            inserted = 0
            for item in extracted:
                # Evita duplicatas pela URL
                exists = db.query(Property).filter(Property.source_url == item["source_url"]).first()
                if not exists and item["source_url"]:
                    prop = Property(**item)
                    db.add(prop)
                    inserted += 1
                    
            db.commit()
            print(f"-> {inserted} anúncios NOVOS salvos no banco para esta região.")
            total_inserted += inserted
            
            # Rate limiting sutil
            await asyncio.sleep(2)
            
        print(f"\nScraping concluído! Foram totalizados {total_inserted} imóveis reais adicionados com sucesso.")
    except Exception as e:
        db.rollback()
        print(f"Erro crasso ao salvar no banco: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_scraper())
