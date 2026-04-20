import os
import glob
import re

migration_files = glob.glob('alembic/versions/*_initial_schema.py')
if not migration_files:
    print("No migration file found")
    exit(1)

migration_file = migration_files[0]
with open(migration_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Remover op.drop_table('spatial_ref_sys')
content = re.sub(r"    op\.drop_table\('spatial_ref_sys'\)\n", "", content)

# Remover block de recreate em downgrade
content = re.sub(r"    op\.create_table\('spatial_ref_sys',.*?\)\n", "", content, flags=re.DOTALL)

with open(migration_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Fixed {migration_file}")
