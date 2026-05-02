from html import escape
from vulnerabilities_db import get_vulnerability_info

def render_report_html(report: dict) -> str:
    findings = "".join(render_finding(item) for item in report.get("findings", []))
    strengths = "".join(
        f'<div class="strength"><h4>{escape(item.get("title", ""))}</h4><p>{escape(item.get("description", ""))}</p></div>'
        for item in report.get("strengths", [])
    )
    next_steps = "".join(f"<li>{escape(step)}</li>" for step in report.get("next_steps", []))
    counts = report.get("summary", {}).get("counts", {})
    dns = report.get("recon", {}).get("dns", {})
    
    return f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Al-Kunooze Security - Deep Scan</title>
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #f0f2f5; color: #1c1e21; }}
    .container {{ max-width: 1000px; margin: 20px auto; padding: 20px; }}
    .card {{ background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 20px; }}
    h1, h2, h3 {{ color: #0f172a; margin-top: 0; }}
    .grid {{ display: grid; gap: 15px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }}
    .pill {{ display: inline-block; border-radius: 20px; padding: 5px 15px; margin: 5px; font-size: 12px; font-weight: bold; }}
    .critical {{ background: #fee2e2; color: #991b1b; border-right: 5px solid #dc2626; }}
    .high {{ background: #ffedd5; color: #9a3412; border-right: 5px solid #ea580c; }}
    .medium {{ background: #fef3c7; color: #92400e; border-right: 5px solid #f59e0b; }}
    .low {{ background: #f0fdf4; color: #166534; border-right: 5px solid #22c55e; }}
    .finding {{ padding: 15px; border-radius: 8px; margin-bottom: 15px; background: #fafafa; border: 1px solid #e5e7eb; }}
    .exploitation {{ background: #fff1f2; border: 1px dashed #fda4af; padding: 10px; border-radius: 6px; margin-top: 10px; }}
    .payload {{ font-family: monospace; background: #1e293b; color: #f8fafc; padding: 8px; border-radius: 4px; margin-top: 5px; overflow-x: auto; }}
    .strength {{ background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 8px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
    th, td {{ text-align: right; padding: 12px; border-bottom: 1px solid #e5e7eb; }}
    th {{ background: #f8fafc; }}
    .btn-print {{ background: #0f172a; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; float: left; }}
    @media print {{ .btn-print {{ display: none; }} }}
  </style>
</head>
<body>
  <div class="container">
    <button class="btn-print" onclick="window.print()">طباعة التقرير</button>
    <div class="card">
      <h1>Al-Kunooze Security - Deep Scan</h1>
      <div class="grid">
        <div><strong>الهدف:</strong> {escape(report.get('target', ''))}</div>
        <div><strong>الـ IP:</strong> {escape(report.get('ip_address') or 'N/A')}</div>
        <div><strong>الدرجة:</strong> {escape(str(report.get('summary', {}).get('score', '')))}/100</div>
        <div><strong>الوضع:</strong> {escape(report.get('summary', {}).get('posture', ''))}</div>
      </div>
      <div style="margin-top: 15px;">
        <span class="pill critical">حرجة: {counts.get('critical', 0)}</span>
        <span class="pill high">عالية: {counts.get('high', 0)}</span>
        <span class="pill medium">متوسطة: {counts.get('medium', 0)}</span>
        <span class="pill low">منخفضة: {counts.get('low', 0)}</span>
      </div>
    </div>

    <div class="card">
      <h2>الملاحظات المكتشفة (الزبدة)</h2>
      {findings or '<p>لا توجد ثغرات مكتشفة.</p>'}
    </div>

    <div class="card">
      <h2>نقاط القوة</h2>
      <div class="grid">{strengths or '<p>لا توجد نقاط قوة واضحة.</p>'}</div>
    </div>

    <div class="card">
      <h2>الاستطلاع الفني</h2>
      <table>
        <tr><th>DNS</th><td>{escape(', '.join(dns.get('addresses', [])) or 'N/A')}</td></tr>
        <tr><th>Reverse DNS</th><td>{escape(dns.get('reverse_dns') or 'N/A')}</td></tr>
      </table>
    </div>

    <div class="card">
      <h2>خطوات التحسين</h2>
      <ul>{next_steps}</ul>
    </div>
  </div>
</body>
</html>"""

def render_finding(item: dict) -> str:
    vuln_type = item.get("vuln_type") or item.get("category")
    vuln_info = get_vulnerability_info(vuln_type)
    
    exploitation_html = ""
    if vuln_info:
        steps = "".join(f"<li>{escape(s)}</li>" for s in vuln_info["exploitation"]["steps"])
        exploitation_html = f"""
        <div class="exploitation">
          <strong>طريقة الاستغلال:</strong>
          <ul>{steps}</ul>
          <strong>Payload:</strong>
          <div class="payload">{escape(vuln_info["exploitation"]["payload"])}</div>
        </div>
        """
    elif item.get("exploitation_steps"):
        steps = "".join(f"<li>{escape(s)}</li>" for s in item["exploitation_steps"])
        exploitation_html = f"""
        <div class="exploitation">
          <strong>طريقة الاستغلال:</strong>
          <ul>{steps}</ul>
          <div class="payload">{escape(item.get("exploitation_payload", ""))}</div>
        </div>
        """

    severity = item.get("severity", "info")
    return f"""
    <div class="finding {severity}">
      <h3>{escape(item.get('title', ''))}</h3>
      <p><strong>الأثر:</strong> {escape(item.get('impact', 'لا يوجد بيانات'))}</p>
      {exploitation_html}
      <p style="font-size: 12px; color: #64748b; margin-top: 10px;">OWASP: {escape(item.get('owasp_category', 'N/A'))}</p>
    </div>
    """
