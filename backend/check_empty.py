from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres.zignaiwlpvflbfnxidno:T74a58FBq8Twa4xL@aws-1-us-west-2.pooler.supabase.com:6543/postgres')
with engine.connect() as conn:
    users = conn.execute(text("SELECT count(*) FROM users")).scalar()
    props = conn.execute(text("SELECT count(*) FROM properties")).scalar()
    print(f"Users: {users}, Props: {props}")
