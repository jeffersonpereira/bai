from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres.zignaiwlpvflbfnxidno:T74a58FBq8Twa4xL@aws-1-us-west-2.pooler.supabase.com:6543/postgres', isolation_level="AUTOCOMMIT")

with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE;"))
    conn.execute(text("CREATE SCHEMA public;"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
    conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
    conn.execute(text('CREATE EXTENSION IF NOT EXISTS postgis;'))

print("Schema public recriado.")
