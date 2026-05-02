# قاعدة بيانات الثغرات المتقدمة (الزبدة النهائية)
VULNERABILITIES_DB = {
    "sql_injection": {
        "title": "SQL Injection",
        "severity": "critical",
        "owasp": "A03:2021",
        "exploitation": {
            "payload": "' OR 1=1 --",
            "steps": ["حقن ' OR 1=1 -- في حقل الإدخال", "استخدام UNION SELECT لاستخراج الجداول", "استخدام sqlmap للأتمتة"],
            "impact": "السيطرة الكاملة على قاعدة البيانات"
        }
    },
    "xss": {
        "title": "Cross-Site Scripting (XSS)",
        "severity": "high",
        "owasp": "A03:2021",
        "exploitation": {
            "payload": "<script>alert(1)</script>",
            "steps": ["حقن كود JS في الحقول المعروضة", "استخدام <img src=x onerror=alert(1)>", "سرقة الكوكيز عبر fetch"],
            "impact": "سرقة الجلسات واختطاف الحسابات"
        }
    },
    "rce": {
        "title": "Remote Code Execution (RCE)",
        "severity": "critical",
        "owasp": "A03:2021",
        "exploitation": {
            "payload": "; whoami",
            "steps": ["حقن أوامر النظام عبر ; أو |", "استخدام nc لعمل Reverse Shell", "تنفيذ أوامر مباشرة على السيرفر"],
            "impact": "السيطرة الكاملة على السيرفر"
        }
    },
    "idor": {
        "title": "Insecure Direct Object Reference (IDOR)",
        "severity": "high",
        "owasp": "A01:2021",
        "exploitation": {
            "payload": "?id=101 -> ?id=102",
            "steps": ["تغيير معرف المورد في URL", "الوصول لبيانات مستخدم آخر", "تعديل بيانات غير مملوكة"],
            "impact": "تسريب بيانات المستخدمين"
        }
    },
    "lfi_rfi": {
        "title": "LFI / RFI",
        "severity": "high",
        "owasp": "A03:2021",
        "exploitation": {
            "payload": "/etc/passwd",
            "steps": ["تضمين ملفات النظام عبر ../", "استخدام php://filter للقراءة", "تضمين كود خارجي (RFI)"],
            "impact": "قراءة ملفات حساسة أو تنفيذ كود"
        }
    },
    "ssrf": {
        "title": "Server-Side Request Forgery (SSRF)",
        "severity": "high",
        "owasp": "A10:2021",
        "exploitation": {
            "payload": "http://169.254.169.254",
            "steps": ["إجبار السيرفر على طلب موارد داخلية", "الوصول لخدمات localhost", "سحب بيانات Metadata للسحابية"],
            "impact": "الوصول للشبكة الداخلية"
        }
    },
    "broken_auth": {
        "title": "Broken Authentication",
        "severity": "critical",
        "owasp": "A07:2021",
        "exploitation": {
            "payload": "admin:admin",
            "steps": ["تجربة كلمات مرور افتراضية", "تخمين الجلسات (Brute Force)", "تجاوز التحقق الثنائي"],
            "impact": "الدخول غير المصرح للحسابات"
        }
    },
    "insecure_deserialization": {
        "title": "Insecure Deserialization",
        "severity": "critical",
        "owasp": "A08:2021",
        "exploitation": {
            "payload": "Serialized Object",
            "steps": ["تعديل الكائنات المسلسلة", "حقن أكواد خبيثة في الكائن", "تنفيذ RCE عند فك التسلسل"],
            "impact": "تنفيذ كود عشوائي"
        }
    },
    "xxe": {
        "title": "XML External Entity (XXE)",
        "severity": "high",
        "owasp": "A03:2021",
        "exploitation": {
            "payload": "<!ENTITY xxe SYSTEM 'file:///etc/passwd'>",
            "steps": ["حقن كيانات XML خارجية", "قراءة ملفات السيرفر", "عمل DoS عبر Billion Laughs"],
            "impact": "قراءة ملفات أو DoS"
        }
    },
    "subdomain_takeover": {
        "title": "Subdomain Takeover",
        "severity": "high",
        "owasp": "A05:2021",
        "exploitation": {
            "payload": "CNAME pointing to expired service",
            "steps": ["البحث عن نطاقات فرعية مهملة", "حجز الخدمة المرتبطة بالنطاق", "السيطرة على النطاق الفرعي"],
            "impact": "انتحال الهوية وسرقة الكوكيز"
        }
    }
}

def get_vulnerability_info(vuln_type):
    return VULNERABILITIES_DB.get(vuln_type)
