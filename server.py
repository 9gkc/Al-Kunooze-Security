import json
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from report_renderer import render_report_html
from scanner import run_scan


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
RESULTS_DIR = BASE_DIR / "results"


class VulnScannerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            if parsed.path == "/api/health":
                return self._send_json({"status": "ok"})
            if parsed.path == "/api/report":
                return self._handle_report(parsed)
            if parsed.path == "/report.html":
                return self._handle_report_html(parsed)
            if parsed.path == "/":
                self.path = "/index.html"
            return super().do_GET()
        except Exception as e:
            print(f"Error in do_GET: {e}")
            self.send_error(500, "Internal Server Error")

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/scan":
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown API endpoint")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            return self._send_json(
                {"error": "الطلب غير صالح. الرجاء إرسال JSON صحيح."},
                status=HTTPStatus.BAD_REQUEST,
            )

        target = (payload.get("target") or "").strip()
        profile = (payload.get("profile") or "deep").strip()
        if not target:
            return self._send_json(
                {"error": "أدخل رابط موقع أو اسم نطاق قبل بدء الفحص."},
                status=HTTPStatus.BAD_REQUEST,
            )

        try:
            report = run_scan(target, RESULTS_DIR, profile=profile)
        except ValueError as exc:
            return self._send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
        except Exception as exc:  # pragma: no cover
            return self._send_json(
                {"error": "حدث خطأ غير متوقع أثناء الفحص.", "details": str(exc)},
                status=HTTPStatus.INTERNAL_SERVER_ERROR,
            )

        return self._send_json(report, status=HTTPStatus.CREATED)

    def _handle_report(self, parsed):
        params = parse_qs(parsed.query)
        report_id = (params.get("id") or [""])[0].strip()
        if not report_id:
            return self._send_json(
                {"error": "معرّف التقرير مطلوب."},
                status=HTTPStatus.BAD_REQUEST,
            )

        report_path = RESULTS_DIR / f"{report_id}.json"
        if not report_path.exists():
            return self._send_json(
                {"error": "التقرير غير موجود."},
                status=HTTPStatus.NOT_FOUND,
            )

        data = json.loads(report_path.read_text(encoding="utf-8"))
        return self._send_json(data)

    def _handle_report_html(self, parsed):
        params = parse_qs(parsed.query)
        report_id = (params.get("id") or [""])[0].strip()
        if not report_id:
            self.send_error(HTTPStatus.BAD_REQUEST, "Missing report id")
            return
        report_path = RESULTS_DIR / f"{report_id}.json"
        if not report_path.exists():
            self.send_error(HTTPStatus.NOT_FOUND, "Report not found")
            return
        data = json.loads(report_path.read_text(encoding="utf-8"))
        html = render_report_html(data).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html)))
        self.end_headers()
        self.wfile.write(html)

    def _send_json(self, payload, status=HTTPStatus.OK):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)


def run(host="127.0.0.1", port=8000):
    RESULTS_DIR.mkdir(exist_ok=True)
    server = ThreadingHTTPServer((host, port), VulnScannerHandler)
    print(f"VulnScanner Pro running on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        server.server_close()
