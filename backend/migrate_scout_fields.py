import sqlite3

def migrate():
    conn = sqlite3.connect('bai.db')
    cursor = conn.cursor()
    
    print("Migrando bai.db...")
    
    try:
        # Adiciona colunas se não existirem
        cursor.execute("ALTER TABLE properties ADD COLUMN market_score FLOAT DEFAULT 0.0")
        print("Coluna market_score adicionada.")
    except sqlite3.OperationalError:
        print("Coluna market_score já existe.")
        
    try:
        cursor.execute("ALTER TABLE properties ADD COLUMN is_star INTEGER DEFAULT 0")
        print("Coluna is_star adicionada.")
    except sqlite3.OperationalError:
        print("Coluna is_star já existe.")
        
    try:
        cursor.execute("ALTER TABLE properties ADD COLUMN last_analysis_at DATETIME")
        print("Coluna last_analysis_at adicionada.")
    except sqlite3.OperationalError:
        print("Coluna last_analysis_at já existe.")
        
    conn.commit()
    conn.close()
    print("Migração concluída.")

if __name__ == "__main__":
    migrate()
