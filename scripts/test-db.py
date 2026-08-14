import sqlite3

c = sqlite3.connect(r"F:\project\PaceOn\db\custom.db")
tables = [r[0] for r in c.execute("select name from sqlite_master where type='table'").fetchall()]
print("PYTHON SQLITE OK, tables:", tables[:8])
print("Runner count:", c.execute("select count(*) from Runner").fetchone()[0])
c.close()
