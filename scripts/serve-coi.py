#!/usr/bin/env python3
"""Static test server with the headers required by pthread-enabled QEMU/Wasm."""
from __future__ import annotations
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class COIHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",default="webdroid")
    parser.add_argument("--host",default="127.0.0.1")
    parser.add_argument("--port",type=int,default=8765)
    args=parser.parse_args()
    root=Path(args.root).resolve()
    handler=partial(COIHandler,directory=str(root))
    server=ThreadingHTTPServer((args.host,args.port),handler)
    print(f"Serving {root} at http://{args.host}:{args.port}",flush=True)
    server.serve_forever()

if __name__=="__main__":
    main()
