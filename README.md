# Al-Kunooze Security

An advanced cybersecurity platform focused on **comprehensive and deep defensive scanning of authorized websites**. It features a professional Arabic/English interface and generates detailed reports for security analysis.

## Key Features

Unlike basic scanning tools, this platform provides an integrated solution combining multiple advanced security analysis layers:

- **HTTP/HTTPS Analysis**: Full inspection of redirects and security protocols.
- **Security Headers & CORS**: Detailed analysis of security headers and Cross-Origin Resource Sharing policies.
- **TLS/SSL Inspection**: Verification of certificates, encryption levels, and expiration dates.
- **DNS Reconnaissance**: Collection of DNS records and associated IP addresses.
- **Port Scanning**: Testing common web ports (80, 443, 8080, 8443).
- **Path Discovery**: Scanning for `robots.txt`, `sitemap.xml`, and sensitive administrative paths.
- **OWASP Integration**: Mapping findings to the **OWASP Top 10** vulnerabilities.
- **Professional Reporting**: Generating interactive HTML reports and JSON data.

## Scan Profiles

- **Quick Scan**: Rapid assessment covering essential security basics.
- **Deep Scan**: Comprehensive analysis with advanced internal crawling.
- **Advanced Deep Scan**: Specialized scanning including external tool integration (e.g., Nuclei/ZAP).

## Project Structure

- `app.py`: Main entry point for the application.
- `server.py`: HTTP server and API handler.
- `scanner.py`: Core scanning engine and reconnaissance logic.
- `advanced_scanner.py`: Dynamic vulnerability detection (SQLi, XSS, etc.).
- `deep_scanner.py`: In-depth content and JavaScript analysis.
- `static/`: Frontend user interface (HTML/CSS/JS).
- `demo/`: Static demo version for GitHub Pages.

## Legal & Ethical Notice

This platform is intended for **authorized defensive and academic use only**. It must only be used on systems you own or have explicit, documented permission to test. Unauthorized use is illegal and unethical.

---
*Developed as part of Project Zakaria.*
 
