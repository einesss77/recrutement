#!/usr/bin/env python3
"""Private agent state; loopback HTTP behind Caddy, atomic SQLite CAS."""
import hashlib, hmac, json, os, sqlite3
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(os.environ.get('STUDIO_AGENT_LOCAL_DIR', '/var/lib/bm-linkedin/state'))
DB = ROOT / 'agent-store.sqlite3'
@contextmanager
def connect():
    c = sqlite3.connect(DB, timeout=20)
    c.execute('CREATE TABLE IF NOT EXISTS document (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL, etag TEXT NOT NULL)')
    try:
        with c: yield c
    finally: c.close()
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    def respond(self, code, body=b'', etag=None):
        self.send_response(code)
        self.send_header('Content-Type','application/json')
        self.send_header('Cache-Control','no-store')
        if etag: self.send_header('ETag',etag)
        self.send_header('Content-Length',str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def authorized(self):
        if self.path != '/linkedin-agent-store': self.respond(404); return False
        token = json.loads((ROOT/'connection.json').read_text())['token']
        if not hmac.compare_digest(self.headers.get('Authorization',''), 'Bearer '+token):
            self.respond(401); return False
        return True
    def do_GET(self):
        if not self.authorized(): return
        with connect() as c: row=c.execute('SELECT body,etag FROM document WHERE id=1').fetchone()
        if row: self.respond(200,row[0].encode(),row[1])
        else: self.respond(404)
    def do_PUT(self):
        if not self.authorized(): return
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0 < length <= 2000000: self.respond(413); return
            raw=self.rfile.read(length).decode(); value=json.loads(raw)
            if not isinstance(value,dict) or value.get('version')!=2 or set(value.get('accounts',{}))!={'person','organization'}: raise ValueError()
        except (ValueError,UnicodeError): self.respond(400); return
        with connect() as c:
            c.execute('BEGIN IMMEDIATE')
            old=c.execute('SELECT etag FROM document WHERE id=1').fetchone()
            if (old and self.headers.get('If-Match')!=old[0]) or (not old and self.headers.get('If-None-Match')!='*'):
                self.respond(412); return
            etag='"'+hashlib.sha256(raw.encode()).hexdigest()+'"'
            c.execute('INSERT OR REPLACE INTO document VALUES(1,?,?)',(raw,etag))
        self.respond(200,b'{"ok":true}',etag)
if __name__=='__main__':
    os.umask(0o077)
    with connect(): pass
    ThreadingHTTPServer(('127.0.0.1',8787),Handler).serve_forever()
