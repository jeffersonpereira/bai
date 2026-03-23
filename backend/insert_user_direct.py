import sqlite3
import os

# Caminho do banco
db_path = "bai.db"

def main():
    if not os.path.exists("hash.txt"):
        print("Erro: hash.txt não encontrado")
        return

    # Lê o hash (sabemos que é utf-16 devido ao erro anterior)
    try:
        with open("hash.txt", "r", encoding="utf-16") as f:
            hashed_pwd = f.read().strip()
    except UnicodeError:
        with open("hash.txt", "r", encoding="utf-8") as f:
            hashed_pwd = f.read().strip()

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Verifica se a tabela users existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("Erro: Tabela 'users' não existe")
            return

        # Limpa usuário existente
        cursor.execute("DELETE FROM users WHERE email=?", ("test@test.com",))
        
        # Insere novo
        cursor.execute(
            "INSERT INTO users (email, hashed_password, name, role) VALUES (?, ?, ?, ?)",
            ("test@test.com", hashed_pwd, "Corretor de Teste", "broker")
        )
        conn.commit()
        print("Usuário test@test.com inserido com sucesso!")
    except Exception as e:
        print(f"Erro ao inserir no banco: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
