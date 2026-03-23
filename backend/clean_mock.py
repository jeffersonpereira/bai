from app.db.database import SessionLocal
from app.models.property import Property

def clean_database():
    db = SessionLocal()
    try:
        # Busca propriedades que tenham a URL mockada
        mocked_props = db.query(Property).filter(Property.source_url.like('%mockedimoveis.com.br%')).all()
        count = len(mocked_props)
        for prop in mocked_props:
            db.delete(prop)
        db.commit()
        print(f"Limpeza concluída! {count} imóveis fictícios do teste inicial foram apagados permanentemente.")
    except Exception as e:
        db.rollback()
        print("Erro na limpeza:", e)
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
