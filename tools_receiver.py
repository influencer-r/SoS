"""One-shot receiver: the browser POSTs the rendered 180px icon bytes here;
we save them verbatim and exit. No transport through tool output, so no
corruption is possible. Temporary helper — deleted after use."""
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

OUT = "apple-touch-icon.png"

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        with open(OUT, "wb") as f:
            f.write(body)
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(f"saved {len(body)} bytes".encode())
        print(f"received {len(body)} bytes -> {OUT}; exiting", flush=True)
        os._exit(0)

    def log_message(self, *args):
        pass

if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 8632), Handler).serve_forever()
