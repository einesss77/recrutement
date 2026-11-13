import os, sqlite3
from pathlib import Path
from datetime import datetime, timezone
os.umask(0o077)
root=Path('/var/lib/bm-linkedin/state');target=root/'backups';target.mkdir(mode=0o700,exist_ok=True)
source=sqlite3.connect('file:'+str(root/'agent-store.sqlite3')+'?mode=ro',uri=True)
dest=sqlite3.connect(target/('agent-'+datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')+'.sqlite3'))
try:source.backup(dest)
finally:dest.close();source.close()
