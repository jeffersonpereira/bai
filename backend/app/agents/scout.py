from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.property import Property
from datetime import datetime

class ScoutAgent:
    def __init__(self):
        pass
        
    def analyze_and_update(self, db: Session):
        """
        Analisa a base de dados via SQLAlchemy para identificar oportunidades
        e marca no banco de dados operacional.
        """
        print("ScoutAgent: Iniciando análise de mercado (SQLite)...")
        
        # 1. Obter médias por cluster (cidade, bairro, tipo)
        # Usamos uma subquery ou apenas processamos os resultados
        stats_query = db.query(
            Property.city,
            Property.neighborhood,
            Property.property_type,
            func.avg(Property.price).label("avg_price"),
            func.count(Property.id).label("count")
        ).filter(
            Property.status == "active",
            Property.price > 0
        ).group_by(
            Property.city,
            Property.neighborhood,
            Property.property_type
        ).having(func.count(Property.id) >= 2) # Baixei para 2 para testes

        clusters = stats_query.all()
        print(f"ScoutAgent: Analisando {len(clusters)} clusters de mercado.")
        
        total_stars = 0
        
        for cluster in clusters:
            city, neighborhood, p_type, avg_price, count = cluster
            
            # 2. Identificar imóveis abaixo de 80% da média do cluster
            threshold = avg_price * 0.8
            
            opportunities = db.query(Property).filter(
                Property.city == city,
                Property.neighborhood == neighborhood,
                Property.property_type == p_type,
                Property.status == "active",
                Property.price > 0,
                Property.price <= threshold,
                Property.is_star == 0 # Só atua nos que ainda não são estrelas ou reavalia tudo
            ).all()
            
            for prop in opportunities:
                # Calcula um score simples (quanto mais barato que a média, maior o score)
                discount = ((avg_price - prop.price) / avg_price) * 100
                prop.is_star = 1
                prop.market_score = min(70 + discount, 99) # Base 70 + bônus de desconto
                prop.last_analysis_at = datetime.now()
                total_stars += 1
                
        db.commit()
        print(f"ScoutAgent: Análise concluída. {total_stars} novas oportunidades identificadas.")

if __name__ == "__main__":
    from app.db.database import SessionLocal
    db = SessionLocal()
    try:
        scout = ScoutAgent()
        scout.analyze_and_update(db)
    finally:
        db.close()
