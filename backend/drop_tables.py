from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres.zignaiwlpvflbfnxidno:T74a58FBq8Twa4xL@aws-1-us-west-2.pooler.supabase.com:6543/postgres', isolation_level="AUTOCOMMIT")

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
    """))
    tables = result.scalars().all()
    
    for table in tables:
        if table != "spatial_ref_sys":
            conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))

print("All public tables dropped.")
