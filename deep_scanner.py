"""محرك الفحص العميق المتقدم"""
import re
import json
from urllib.parse import urlparse, parse_qs
from vulnerabilities_db import VULNERABILITIES_DB


def scan_javascript_security(body: str) -> list:
    """فحص أمان ملفات JavaScript"""
    findings = []
    
    # كشف API Keys المكشوفة
    api_key_patterns = [
        r'api[_-]?key\s*[:=]\s*["\']([a-zA-Z0-9\-_]{20,})["\']',
        r'secret\s*[:=]\s*["\']([a-zA-Z0-9\-_]{20,})["\']',
        r'token\s*[:=]\s*["\']([a-zA-Z0-9\-_\.]{20,})["\']',
        r'password\s*[:=]\s*["\']([^"\']+)["\']',
    ]
    
    for pattern in api_key_patterns:
        if re.search(pattern, body, re.IGNORECASE):
            findings.append({
                "type": "exposed_secrets",
                "severity": "critical",
                "title": "تسريب Secrets في الكود",
                "payload": pattern,
                "impact": "سرقة مفاتيح API والوصول للخدمات"
            })
    
    # كشف eval و innerHTML
    dangerous_functions = [
        (r'eval\s*\(', "eval() - تنفيذ كود ديناميكي"),
        (r'innerHTML\s*=', "innerHTML - عرضة للـ XSS"),
        (r'document\.write\s*\(', "document.write - عرضة للـ XSS"),
    ]
    
    for pattern, name in dangerous_functions:
        if re.search(pattern, body, re.IGNORECASE):
            findings.append({
                "type": "dangerous_function",
                "severity": "high",
                "title": f"استخدام دالة خطرة: {name}",
                "payload": pattern,
                "impact": "احتمالية تنفيذ كود خبيث"
            })
    
    return findings


def scan_database_security(body: str) -> list:
    """فحص أمان قاعدة البيانات"""
    findings = []
    
    # كشف SQL Queries المكشوفة
    sql_patterns = [
        r'SELECT\s+\*\s+FROM',
        r'INSERT\s+INTO',
        r'UPDATE\s+\w+\s+SET',
        r'DELETE\s+FROM',
    ]
    
    for pattern in sql_patterns:
        if re.search(pattern, body, re.IGNORECASE):
            findings.append({
                "type": "sql_exposure",
                "severity": "high",
                "title": "تسريب استعلامات SQL",
                "payload": pattern,
                "impact": "معلومات عن بنية قاعدة البيانات"
            })
    
    return findings


def scan_authentication_security(body: str) -> list:
    """فحص آليات المصادقة"""
    findings = []
    
    # كشف عدم وجود CSRF Token
    if not re.search(r'csrf|_token|authenticity_token', body, re.IGNORECASE):
        findings.append({
            "type": "missing_csrf",
            "severity": "high",
            "title": "غياب حماية CSRF",
            "payload": "No CSRF token detected",
            "impact": "تنفيذ عمليات غير مصرح بها"
        })
    
    # كشف عدم استخدام HTTPS في النماذج
    if re.search(r'<form[^>]*action=["\']http://', body, re.IGNORECASE):
        findings.append({
            "type": "insecure_form",
            "severity": "high",
            "title": "نموذج يرسل البيانات عبر HTTP",
            "payload": "form action=http://",
            "impact": "اعتراض بيانات المستخدم"
        })
    
    # كشف عدم استخدام HttpOnly في الكوكيز
    if not re.search(r'HttpOnly|Secure|SameSite', body, re.IGNORECASE):
        findings.append({
            "type": "weak_cookies",
            "severity": "medium",
            "title": "إعدادات الكوكيز ضعيفة",
            "payload": "Missing HttpOnly/Secure/SameSite",
            "impact": "احتمالية سرقة الجلسات"
        })
    
    return findings


def scan_dependency_security(body: str) -> list:
    """فحص أمان المكتبات والتبعيات"""
    findings = []
    
    # كشف المكتبات القديمة والضعيفة
    vulnerable_libs = {
        r'jquery[/-]?1\.[0-4]': ("jQuery 1.x", "critical"),
        r'bootstrap[/-]?2': ("Bootstrap 2", "high"),
        r'angular[/-]?1\.[0-5]': ("AngularJS 1.x", "high"),
        r'lodash[/-]?4\.[0-9]\.[0-9]': ("Lodash 4.x", "medium"),
    }
    
    for pattern, (name, severity) in vulnerable_libs.items():
        if re.search(pattern, body, re.IGNORECASE):
            findings.append({
                "type": "vulnerable_library",
                "severity": severity,
                "title": f"مكتبة قديمة: {name}",
                "payload": pattern,
                "impact": "ثغرات معروفة في المكتبة"
            })
    
    return findings


def scan_information_disclosure(body: str, headers: dict) -> list:
    """فحص تسريب المعلومات"""
    findings = []
    
    # كشف معلومات الخادم
    server_info = headers.get("server", "")
    if server_info:
        findings.append({
            "type": "server_disclosure",
            "severity": "low",
            "title": "كشف معلومات الخادم",
            "payload": server_info,
            "impact": "معلومات عن البيئة التقنية"
        })
    
    # كشف X-Powered-By
    powered_by = headers.get("x-powered-by", "")
    if powered_by:
        findings.append({
            "type": "tech_disclosure",
            "severity": "low",
            "title": "كشف تقنية التطوير",
            "payload": powered_by,
            "impact": "معلومات عن الإطار المستخدم"
        })
    
    # كشف معلومات في التعليقات
    comments = re.findall(r'<!--(.*?)-->', body, re.DOTALL)
    for comment in comments:
        if any(word in comment.lower() for word in ['todo', 'fixme', 'bug', 'hack', 'password', 'key']):
            findings.append({
                "type": "comment_disclosure",
                "severity": "medium",
                "title": "معلومات حساسة في التعليقات",
                "payload": comment[:100],
                "impact": "تسريب معلومات عن الكود"
            })
    
    return findings


def scan_logic_vulnerabilities(body: str) -> list:
    """فحص الثغرات المنطقية"""
    findings = []
    
    # كشف عدم التحقق من الصلاحيات
    if re.search(r'if\s*\(\s*\$_SESSION\s*\[\s*["\']admin["\']', body, re.IGNORECASE):
        findings.append({
            "type": "weak_authorization",
            "severity": "high",
            "title": "فحص ضعيف للصلاحيات",
            "payload": "Weak authorization check",
            "impact": "احتمالية تجاوز الصلاحيات"
        })
    
    # كشف عدم التحقق من الإدخال
    if re.search(r'\$_GET\[|_POST\[|_REQUEST\[', body) and not re.search(r'sanitize|htmlspecialchars|filter', body, re.IGNORECASE):
        findings.append({
            "type": "no_input_validation",
            "severity": "high",
            "title": "عدم التحقق من الإدخال",
            "payload": "Direct use of $_GET/$_POST",
            "impact": "احتمالية حقن الأكواد"
        })
    
    return findings


def scan_network_security(headers: dict) -> list:
    """فحص أمان الشبكة والترويسات"""
    findings = []
    
    required_headers = {
        "strict-transport-security": ("HSTS", "critical"),
        "content-security-policy": ("CSP", "high"),
        "x-frame-options": ("X-Frame-Options", "medium"),
        "x-content-type-options": ("X-Content-Type-Options", "medium"),
    }
    
    for header, (name, severity) in required_headers.items():
        if header not in headers:
            findings.append({
                "type": "missing_header",
                "severity": severity,
                "title": f"غياب الترويسة الأمنية: {name}",
                "payload": f"Missing {header}",
                "impact": f"ضعف الحماية من هجمات {name}"
            })
    
    # كشف CORS Misconfiguration
    cors = headers.get("access-control-allow-origin", "")
    if cors == "*":
        findings.append({
            "type": "cors_misconfiguration",
            "severity": "high",
            "title": "CORS Misconfiguration",
            "payload": "Access-Control-Allow-Origin: *",
            "impact": "السماح بالوصول من أي موقع"
        })
    
    return findings


def run_deep_scan(body: str, headers: dict) -> list:
    """تشغيل الفحص العميق الشامل"""
    all_findings = []
    
    all_findings.extend(scan_javascript_security(body))
    all_findings.extend(scan_database_security(body))
    all_findings.extend(scan_authentication_security(body))
    all_findings.extend(scan_dependency_security(body))
    all_findings.extend(scan_information_disclosure(body, headers))
    all_findings.extend(scan_logic_vulnerabilities(body))
    all_findings.extend(scan_network_security(headers))
    
    return all_findings
