"""Loopback-only, read-only HTML and JSON views of intake snapshots."""
from __future__ import annotations

import html
import json
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

from .intake import IntakeError, show

HOST = "127.0.0.1"
CSP = "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; style-src 'self'"
CSS = """body{font:16px/1.5 system-ui,sans-serif;max-width:58rem;margin:2rem auto;padding:0 1rem;color:#20242a;background:#f7f8fa}h1,h2{line-height:1.2}article{background:white;border:1px solid #d8dde5;border-radius:.5rem;padding:1.25rem;margin:1rem 0}dl{display:grid;grid-template-columns:minmax(9rem,14rem) 1fr;gap:.5rem 1rem}dt{font-weight:700}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}ul{margin:.3rem 0;padding-left:1.5rem}a{color:#1558a6}@media(max-width:36rem){dl{grid-template-columns:1fr;gap:0}dd{margin-bottom:.7rem}}"""


def _age(timestamp: str) -> str:
    value = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).astimezone(timezone.utc)
    seconds = int((datetime.now(timezone.utc) - value).total_seconds())
    if seconds < 0:
        return "en el futuro"
    if seconds < 60:
        return f"hace {seconds} s"
    if seconds < 3600:
        return f"hace {seconds // 60} min"
    if seconds < 86400:
        return f"hace {seconds // 3600} h"
    return f"hace {seconds // 86400} d"


def _e(value: object) -> str:
    return html.escape(str(value), quote=True)


def _page(items: list[dict]) -> str:
    blocks = []
    for item in items:
        work_id = _e(item["id"])
        brief = item["brief"]
        observed = datetime.fromisoformat(item["observed_at"].replace("Z", "+00:00")).astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
        updated = datetime.fromisoformat(item["updated_at"].replace("Z", "+00:00")).astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
        fields = (
            ("Repositorio / issue", f"{_e(item['repo'])}#{_e(item['issue'])}"),
            ("Revisión", _e(item["revision"])),
            ("Categoría / preparación", f"{_e(item['category'])} · {_e(item['preparation'])}"),
            ("Motivo", _e(item["motive"])),
            ("Siguiente paso", _e(item["next_step"])),
            ("Objetivo", _e(brief["objective"])),
            ("Alcance", _e(brief["scope"])),
            ("Exclusiones", _list(brief["exclusions"])),
            ("Aceptación", _list(brief["acceptance"])),
            ("Decisiones pendientes", _question_list(item["questions"])),
            ("Resolución", _resolution(item["resolution"])),
            ("Riesgos", _list(brief["risks"])),
            ("Dependencias", _list(brief["dependencies"])),
            ("Contexto", _list(brief["context"])),
            ("Comprobaciones", _list(brief["checks"])),
            ("Revisión prevista", _list(brief["reviews"])),
            ("Base", _e(brief["base"])),
            ("Configuración", _e(brief["configuration"])),
            ("Límites", _e(brief["limits"])),
            ("Checkpoints", _e(brief["checkpoints"])),
            ("Etiquetas", _e(", ".join(item["source"]["labels"]) or "Ninguna")),
            ("Issue leída", f"{_e(observed)} ({_e(_age(observed))})"),
            ("Ficha actualizada", f"{_e(updated)} ({_e(_age(updated))})"),
            ("Ejecución", _e(item["execution"])),
        )
        details = "".join(f"<dt>{_e(label)}</dt><dd>{value}</dd>" for label, value in fields)
        blocks.append(f"<article><h2><a href='/work/{work_id}'>{_e(item['source']['title'])}</a></h2><dl>{details}</dl></article>")
    content = "".join(blocks) or "<p>No hay trabajos preparados.</p>"
    return "<!doctype html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>isSWF · trabajos</title><link rel='stylesheet' href='/panel.css'></head><body><main><h1>Trabajos preparados</h1>" + content + "</main></body></html>"


def _list(values: list[str]) -> str:
    return "<ul>" + "".join(f"<li>{_e(value)}</li>" for value in values) + "</ul>" if values else "<span>Sin datos</span>"


def _question_list(questions: list[dict]) -> str:
    return _list([f"{item['id']}: {item['question']} Responsable: {item['owner']}. Salida: {item['exit_condition']}" for item in questions])


def _resolution(value: dict | None) -> str:
    if value is None:
        return "<span>Sin resolución</span>"
    evidence = _list([f"{item['ref']}: {item['observation']}" for item in value["evidence"]])
    return f"<p>{_e(value['kind'])}. {_e(value['explanation'])} Destino: {_e(value['destination'])}</p>{evidence}"


def make_server(state: str, port: int = 8765) -> ThreadingHTTPServer:
    class Handler(BaseHTTPRequestHandler):
        def _reject(self, code: int, message: str) -> None:
            body = message.encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", CSP)
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:
            expected_host = f"127.0.0.1:{self.server.server_port}"
            if self.headers.get("Host") != expected_host:
                self._reject(400, "Host no válido")
                return
            origin = self.headers.get("Origin")
            if origin:
                try:
                    parsed_origin = urlsplit(origin)
                except ValueError:
                    self._reject(403, "Origin no local")
                    return
                if parsed_origin.scheme != "http" or parsed_origin.netloc != expected_host or parsed_origin.path not in ("", "/") or parsed_origin.query or parsed_origin.fragment:
                    self._reject(403, "Origin no local")
                    return
            if self.headers.get("Sec-Fetch-Site", "").lower() == "cross-site":
                self._reject(403, "Solicitud cross-site rechazada")
                return
            path = self.path
            if not path.startswith("/") or "?" in path or "#" in path or "%" in path or "\\" in path or ".." in path:
                self._reject(404, "Ruta no válida")
                return
            try:
                if path == "/panel.css":
                    body = CSS.encode("utf-8")
                    content_type = "text/css; charset=utf-8"
                elif path == "/":
                    items = show(state)
                    body = _page(items).encode("utf-8")
                    content_type = "text/html; charset=utf-8"
                elif path == "/api/work":
                    body = json.dumps(show(state), ensure_ascii=False).encode("utf-8")
                    content_type = "application/json; charset=utf-8"
                elif path.startswith("/api/work/") and path.count("/") == 3:
                    item = show(state, path.removeprefix("/api/work/"))
                    body = json.dumps(item, ensure_ascii=False).encode("utf-8")
                    content_type = "application/json; charset=utf-8"
                elif path.startswith("/work/") and path.count("/") == 2:
                    item = show(state, path.removeprefix("/work/"))
                    body = _page([item]).encode("utf-8")
                    content_type = "text/html; charset=utf-8"
                else:
                    self._reject(404, "Ruta no encontrada")
                    return
            except IntakeError as exc:
                self._reject(503, f"Estado no disponible: {exc}")
                return
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", CSP)
            self.send_header("X-Frame-Options", "DENY")
            self.end_headers()
            self.wfile.write(body)

        def do_HEAD(self) -> None:
            self._reject(405, "Solo se admite GET")

        def do_POST(self) -> None:
            self._reject(405, "Solo se admite GET")

        def do_PUT(self) -> None:
            self._reject(405, "Solo se admite GET")

        def do_DELETE(self) -> None:
            self._reject(405, "Solo se admite GET")

        def do_OPTIONS(self) -> None:
            self._reject(405, "Solo se admite GET")

        def log_message(self, fmt: str, *args: object) -> None:
            return

    return ThreadingHTTPServer((HOST, port), Handler)


def serve(state: str, port: int = 8765) -> None:
    server = make_server(state, port)
    try:
        print(f"Panel de solo lectura en http://127.0.0.1:{server.server_port}/")
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
