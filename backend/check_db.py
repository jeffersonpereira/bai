from sqlalchemy import create_engine
engine = create_engine('postgresql://postgres.zignaiwlpvflbfnxidno:T74a58FBq8Twa4xL@aws-1-us-west-2.pooler.supabase.com:6543/postgres')
with engine.connect() as conn:
    result = conn.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id'")
    print(result.fetchall())
