"""
ماسح متقدم لكشف الثغرات الديناميكية
"""
import re
from urllib.parse import urljoin, urlparse
from vulnerabilities_db import VULNERABILITIES_DB


def detect_dynamic_vulnerabilities(body: str, headers: dict, url: str) -> list[dict]:
    """كشف الثغرات الديناميكية من محتوى الصفحة"""
    findings = []
    
    # كشف SQL Injection
    sql_patterns = [
        r"(?i)(select|insert|update|delete|drop|union|where|from|join)",
        r"(?i)(sql|database|query|execute|prepare)",
    ]
    if any(re.search(p, body) for p in sql_patterns):
        findings.append(create_finding(
            "sql_injection",
            "medium",
            "مؤشرات SQL Injection محتملة",
            "تم رصد أنماط SQL في استجابة الخادم قد تشير لضعف في معالجة الإدخال",
            "injection"
        ))
    
    # كشف XSS
    xss_patterns = [
        r"<script[^>]*>",
        r"on\w+\s*=",
        r"javascript:",
        r"eval\(",
        r"innerHTML",
    ]
    if any(re.search(p, body, re.IGNORECASE) for p in xss_patterns):
        findings.append(create_finding(
            "xss",
            "high",
            "مؤشرات XSS محتملة",
            "تم رصد أنماط قد تسمح بحقن JavaScript",
            "injection"
        ))
    
    # كشف Path Traversal
    traversal_patterns = [
        r"\.\./",
        r"\.\.\\",
        r"%2e%2e",
        r"file://",
    ]
    if any(re.search(p, body, re.IGNORECASE) for p in traversal_patterns):
        findings.append(create_finding(
            "path_traversal",
            "high",
            "مؤشرات Path Traversal",
            "تم رصد أنماط قد تسمح بالوصول لملفات خارج المجلد المسموح",
            "injection"
        ))
    
    # كشف XXE
    if "<!DOCTYPE" in body or "<!ENTITY" in body:
        findings.append(create_finding(
            "xxe",
            "high",
            "مؤشرات XXE محتملة",
            "تم رصد معالجة XML قد تكون عرضة لهجمات XXE",
            "injection"
        ))
    
    # كشف CSRF
    csrf_token = re.search(r'name=["\']csrf["\']|name=["\']_token["\']', body, re.IGNORECASE)
    if not csrf_token:
        findings.append(create_finding(
            "csrf",
            "high",
            "غياب حماية CSRF",
            "لم يتم رصد token CSRF في النماذج",
            "auth"
        ))
    
    # كشف Missing Auth
    if "/admin" in body or "/dashboard" in body or "/api" in body:
        findings.append(create_finding(
            "missing_auth",
            "high",
            "مسارات إدارية محتملة بدون حماية",
            "تم رصد مسارات قد تكون إدارية وقد لا تكون محمية بالمصادقة",
            "auth"
        ))
    
    # كشف Weak Crypto
    if "md5" in body.lower() or "sha1" in body.lower():
        findings.append(create_finding(
            "weak_crypto",
            "medium",
            "استخدام تشفير ضعيف",
            "تم رصد استخدام MD5 أو SHA1 وهي ضعيفة",
            "crypto"
        ))
    
    # كشف CORS Misconfiguration
    cors_header = headers.get("access-control-allow-origin", "")
    if cors_header == "*":
        findings.append(create_finding(
            "cors_misconfiguration",
            "medium",
            "CORS Misconfiguration",
            "السماح بـ CORS من أي موقع (*)",
            "headers"
        ))
    
    # كشف Server Info Disclosure
    server = headers.get("server", "")
    if server:
        findings.append(create_finding(
            "info_disclosure",
            "low",
            "كشف معلومات الخادم",
            f"الخادم يكشف: {server}",
            "fingerprint"
        ))
    
    # كشف Outdated Libraries
    outdated_libs = detect_outdated_libraries(body)
    for lib in outdated_libs:
        findings.append(create_finding(
            "outdated_library",
            "medium",
            f"مكتبة قديمة: {lib}",
            f"تم رصد مكتبة قديمة قد تحتوي على ثغرات معروفة",
            "dependencies"
        ))
    
    return findings


def detect_outdated_libraries(body: str) -> list[str]:
    """كشف المكتبات القديمة"""
    outdated = []
    
    patterns = {
        r"jquery[/-]?1\.[0-4]": "jQuery 1.x",
        r"bootstrap[/-]?2": "Bootstrap 2",
        r"angular[/-]?1": "AngularJS 1",
        r"prototype[/-]?1\.[0-5]": "Prototype 1.x",
        r"dojo[/-]?1\.[0-3]": "Dojo 1.x",
    }
    
    for pattern, name in patterns.items():
        if re.search(pattern, body, re.IGNORECASE):
            outdated.append(name)
    
    return outdated


def detect_form_vulnerabilities(body: str, url: str) -> list[dict]:
    """كشف ثغرات في النماذج"""
    findings = []
    
    # استخراج النماذج
    forms = re.findall(r'<form[^>]*>(.*?)</form>', body, re.IGNORECASE | re.DOTALL)
    
    for form in forms:
        # كشف عدم استخدام HTTPS في الـ action
        action = re.search(r'action=["\']([^"\']+)["\']', form, re.IGNORECASE)
        if action:
            action_url = action.group(1)
            if not action_url.startswith("https://") and not action_url.startswith("/"):
                findings.append(create_finding(
                    "insecure_form",
                    "high",
                    "نموذج غير آمن",
                    f"النموذج يرسل البيانات عبر: {action_url}",
                    "forms"
                ))
        
        # كشف عدم استخدام POST
        method = re.search(r'method=["\']([^"\']+)["\']', form, re.IGNORECASE)
        if not method or method.group(1).upper() != "POST":
            findings.append(create_finding(
                "insecure_form_method",
                "medium",
                "نموذج يستخدم GET",
                "البيانات الحساسة قد تظهر في URL",
                "forms"
            ))
    
    return findings


def detect_api_vulnerabilities(body: str, url: str) -> list[dict]:
    """كشف ثغرات في APIs"""
    findings = []
    
    # كشف API endpoints
    api_patterns = [
        r'/api/v\d+',
        r'/rest/',
        r'/graphql',
        r'/swagger',
    ]
    
    for pattern in api_patterns:
        if re.search(pattern, body, re.IGNORECASE):
            findings.append(create_finding(
                "exposed_api",
                "medium",
                "API مكشوفة",
                "تم رصد endpoints API قد تكون مكشوفة",
                "api"
            ))
            break
    
    # كشف API Keys
    if re.search(r'api[_-]?key|apikey', body, re.IGNORECASE):
        findings.append(create_finding(
            "api_key_exposure",
            "critical",
            "تسرب API Keys",
            "تم رصد مؤشرات على وجود API keys في الكود",
            "secrets"
        ))
    
    return findings


def create_finding(vuln_type: str, severity: str, title: str, description: str, category: str) -> dict:
    """إنشاء finding مع معلومات الاستغلال"""
    vuln_info = VULNERABILITIES_DB.get(vuln_type, {})
    
    return {
        "severity": severity,
        "title": title,
        "description": description,
        "category": category,
        "vuln_type": vuln_type,
        "impact": vuln_info.get("exploitation", {}).get("impact", ""),
        "exploitation_steps": vuln_info.get("exploitation", {}).get("steps", []),
        "exploitation_payload": vuln_info.get("exploitation", {}).get("payload", ""),
        "owasp_category": vuln_info.get("owasp", ""),
        "fix_priority": infer_fix_priority(severity),
    }


def infer_fix_priority(severity: str) -> str:
    """حساب أولوية الإصلاح"""
    priority_map = {
        "critical": "فوري (24 ساعة)",
        "high": "عالي (أسبوع)",
        "medium": "متوسط (شهر)",
        "low": "منخفض (عند الصيانة)",
        "info": "معلومات فقط",
    }
    return priority_map.get(severity, "متوسط")
