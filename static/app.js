const form = document.getElementById("scan-form");
const targetInput = document.getElementById("target");
const profileSelect = document.getElementById("profile");
const scanButton = document.getElementById("scan-button");
const statusCard = document.getElementById("status-card");
const resultsContainer = document.getElementById("results");
const findingTemplate = document.getElementById("finding-template");
const progressCard = document.getElementById("progress-card");
const progressLabel = document.getElementById("progress-label");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");
let progressTimer = null;
let currentReport = null;

const translations = {
  ar: {
    badge: "منصة فحص أمني متقدمة",
    title: "Al-Kunooze Security",
    description: "منصة دفاعية عربية متقدمة للفحص الأمني العميق والشامل للمواقع المصرح بها، مع تقارير احترافية شاملة تساعد في تحديد وتحليل المخاطر الأمنية بشكل واضح ودقيق.",
    points: ["تقارير فورية شاملة", "تقييم أمني متقدم", "تشغيل محلي آمن وموثوق"],
    scanTitle: "بدء الفحص الأمني",
    scanDesc: "أدخل رابط الموقع أو اسم النطاق المراد فحصه ثم شغّل الفحص الدفاعي العميق والشامل للموقع المصرح به.",
    notice: "للاستخدام الدفاعي والأكاديمي والبحثي فقط",
    targetLabel: "الموقع المستهدف",
    targetPlaceholder: "example.com أو https://example.com",
    quickScan: "فحص سريع",
    deepScan: "فحص عميق",
    authorizedDeep: "فحص عميق متقدم",
    scanButton: "تشغيل الفحص",
    preparing: "جاري التحضير والإعداد...",
    dnsNetwork: "جمع معلومات DNS والشبكة...",
    httpsTls: "فحص HTTPS وTLS والترويسات الأمنية...",
    pathsFiles: "تحليل المسارات والملفات المعروفة...",
    internalPages: "زحف الصفحات الداخلية بشكل آمن...",
    externalTools: "محاولة تشغيل الأدوات الخارجية المتقدمة...",
    finalReport: "إعداد التقرير النهائي الشامل...",
    quickPreparing: "تهيئة الفحص السريع...",
    quickAnalysis: "تحليل النتائج الأولية...",
    deepPreparing: "تهيئة الفحص العميق المتقدم...",
    deepNetwork: "جمع معلومات الشبكة والويب الشاملة...",
    deepPaths: "تحليل المسارات والترويسات الأمنية...",
    deepPages: "فحص الصفحات الداخلية والروابط...",
    deepReport: "إعداد التقرير المفصل...",
    authorizedPreparing: "تهيئة الفحص العميق المتقدم والمصرح به...",
    scanFailed: "فشل الفحص",
    enterTarget: "أدخل اسم النطاق أو رابط الموقع أولاً.",
    scanning: "جاري تنفيذ الفحص والتحليل",
    collecting: "وجمع مؤشرات الأمان الشاملة...",
    securityAssessment: "التقييم الأمني العام",
    displays: "يعرض هذا المؤشر نتيجة الفحص الدفاعي الموسع والعميق للموقع المستهدف.",
    reportTitle: "نتيجة الفحص الأمني المتقدم",
    scopeNotice: "تقرير فحص أمني دفاعي شامل ومعمق للموقع المصرح به.",
    reportId: "معرّف التقرير الفريد",
    printReport: "فتح تقرير الطباعة / PDF",
    target: "الهدف الأساسي",
    ipAddress: "العنوان IP الأساسي",
    securityPosture: "الوضع الأمني العام",
    https: "تفعيل HTTPS",
    tls: "إصدار TLS",
    responseTime: "زمن الاستجابة",
    ms: "ms",
    dnsNetworkTitle: "DNS وسطح الشبكة والعناوين",
    discoveredAddresses: "العناوين المكتشفة",
    reverseDns: "بحث Reverse DNS",
    ports: "المنافذ المكتشفة",
    pageProfile: "بروفايل الصفحة والمحتوى",
    titleLabel: "عنوان الصفحة",
    forms: "نماذج الإدخال",
    scriptTags: "علامات JavaScript",
    csrfMeta: "علامات الحماية من CSRF",
    internalCrawl: "الزحف الداخلي والأدوات والموارد",
    pagesVisited: "الصفحات المفحوصة",
    jsFiles: "ملفات JavaScript",
    emailsFound: "عناوين بريدية مكتشفة",
    htmlComments: "تعليقات HTML",
    knownPaths: "الملفات والمسارات المعروفة",
    type: "نوع الملف",
    path: "المسار",
    status: "حالة الاستجابة",
    timeMs: "الزمن ms",
    deepPaths: "المسارات العميقة والحساسة المكتشفة",
    noDeepPaths: "لم يتم اكتشاف مسارات عميقة إضافية ضمن هذا النطاق.",
    findingsTitle: "الملاحظات والثغرات المكتشفة",
    nextStepsTitle: "خطوات التحسين والمعالجة المقترحة",
    executiveSummary: "الملخص التنفيذي والتقييم",
    defenderView: "منظور المدافع والحماية",
    attackerView: "منظور المهاجم والتهديد",
    topRisks: "أبرز الأخطار والثغرات",
    strength: "نقطة قوة وحماية",
    strengthsTitle: "نقاط القوة والحماية الموجودة",
    noStrengths: "لم تُرصد نقاط قوة واضحة وملموسة في هذا النطاق من الفحص.",
    critical: "حرجة",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
    info: "معلومة",
    owasp: "OWASP",
    fixPriority: "أولوية الإصلاح",
    impact: "الأثر",
    attackerPerspective: "كيفية رؤية المهاجم لها",
    suggestedAction: "الإجراء المقترح والحل الموصى به",
    toggleButton: "English",
    yes: "موجود",
    no: "غير موجود",
    frameworkHints: "لم تُرصد مؤشرات إطار عمل واضحة"
  },
  en: {
    badge: "Advanced Security Scanning Platform",
    title: "Al-Kunooze Security",
    description: "An advanced Arabic defensive platform for comprehensive deep security scanning of authorized websites, with professional reports that help identify and analyze security risks and protections clearly and accurately.",
    points: ["Comprehensive Reports", "Advanced Security Assessment", "Secure Local Execution"],
    scanTitle: "Start Security Scan",
    scanDesc: "Enter the website URL or domain name to be scanned, then run the comprehensive defensive deep scan for the authorized website.",
    notice: "For defensive, academic, and research use only",
    targetLabel: "Target Site",
    targetPlaceholder: "example.com or https://example.com",
    quickScan: "Quick Scan",
    deepScan: "Deep Scan",
    authorizedDeep: "Advanced Deep Scan",
    scanButton: "Run Scan",
    preparing: "Preparing and initializing...",
    dnsNetwork: "Collecting comprehensive DNS and network information...",
    httpsTls: "Scanning HTTPS, TLS, and security headers...",
    pathsFiles: "Analyzing known paths and sensitive files...",
    internalPages: "Safely crawling internal pages and resources...",
    externalTools: "Attempting to run advanced external tools...",
    finalReport: "Preparing comprehensive final report...",
    quickPreparing: "Initializing quick scan mode...",
    quickAnalysis: "Analyzing initial results...",
    deepPreparing: "Initializing advanced deep scan...",
    deepNetwork: "Collecting comprehensive network and web information...",
    deepPaths: "Analyzing paths and security headers...",
    deepPages: "Scanning internal pages and links...",
    deepReport: "Preparing detailed report...",
    authorizedPreparing: "Initializing advanced authorized deep scan...",
    scanFailed: "Scan Failed",
    enterTarget: "Enter domain name or website URL first.",
    scanning: "Executing comprehensive scan",
    collecting: "and collecting comprehensive security indicators...",
    securityAssessment: "Overall Security Assessment",
    displays: "This indicator displays the result of the comprehensive extended defensive scan for the target website.",
    reportTitle: "Advanced Security Scan Result",
    scopeNotice: "Comprehensive defensive security scan report for authorized website.",
    reportId: "Report ID",
    printReport: "Open Print / PDF Report",
    target: "Primary Target",
    ipAddress: "Primary IP Address",
    securityPosture: "Overall Security Posture",
    https: "HTTPS Enabled",
    tls: "TLS Version",
    responseTime: "Response Time",
    ms: "ms",
    dnsNetworkTitle: "DNS and Network Surface",
    discoveredAddresses: "Discovered Addresses",
    reverseDns: "Reverse DNS Lookup",
    ports: "Discovered Ports",
    pageProfile: "Page Profile and Content",
    titleLabel: "Page Title",
    forms: "Input Forms",
    scriptTags: "JavaScript Tags",
    csrfMeta: "CSRF Protection Tags",
    internalCrawl: "Internal Crawl and Resources",
    pagesVisited: "Pages Scanned",
    jsFiles: "JavaScript Files",
    emailsFound: "Discovered Email Addresses",
    htmlComments: "HTML Comments",
    knownPaths: "Known Files and Paths",
    type: "File Type",
    path: "Path",
    status: "Response Status",
    timeMs: "Time ms",
    deepPaths: "Discovered Deep and Sensitive Paths",
    noDeepPaths: "No additional deep paths discovered within this scope.",
    findingsTitle: "Detected Vulnerabilities and Issues",
    nextStepsTitle: "Suggested Remediation Steps",
    executiveSummary: "Executive Summary and Assessment",
    defenderView: "Defender and Protection Perspective",
    attackerView: "Attacker and Threat Perspective",
    topRisks: "Top Vulnerabilities and Risks",
    strength: "Strength and Protection",
    strengthsTitle: "Strengths and Existing Protections",
    noStrengths: "No clear and measurable strengths detected in this scan scope.",
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    info: "Info",
    owasp: "OWASP",
    fixPriority: "Fix Priority",
    impact: "Impact",
    attackerPerspective: "How the attacker sees it",
    suggestedAction: "Suggested Action and Remediation",
    toggleButton: "العربية",
    yes: "موجود",
    no: "غير موجود",
    frameworkHints: "لم تُرصد مؤشرات إطار عمل واضحة"
  }
};

let currentLang = 'ar';

function updateLanguage() {
  const t = translations[currentLang];
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.getElementById('badge').textContent = t.badge;
  document.getElementById('description').textContent = t.description;
  document.getElementById('point1').textContent = t.points[0];
  document.getElementById('point2').textContent = t.points[1];
  document.getElementById('point3').textContent = t.points[2];
  document.getElementById('scanTitle').textContent = t.scanTitle;
  document.getElementById('scanDesc').textContent = t.scanDesc;
  document.getElementById('notice').textContent = t.notice;
  document.getElementById('targetLabel').textContent = t.targetLabel;
  document.getElementById('target').placeholder = t.targetPlaceholder;
  document.querySelector('option[value="quick"]').textContent = t.quickScan;
  document.querySelector('option[value="deep"]').textContent = t.deepScan;
  document.querySelector('option[value="authorized_deep"]').textContent = t.authorizedDeep;
  document.getElementById('scan-button').textContent = t.scanButton;
  document.getElementById('language-toggle').textContent = t.toggleButton;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function severityLabel(key) {
  return translations[currentLang][key] || key;
}

function renderStatus(message, score = null) {
  statusCard.classList.remove("hidden");
  statusCard.innerHTML = `
    <div>
      <strong>${escapeHtml(message)}</strong>
      <p>${translations[currentLang].displays}</p>
    </div>
    ${score === null ? "" : `<div class="score-pill">${score}</div>`}
  `;
}

function setProgress(percent, label) {
  progressCard.classList.remove("hidden");
  progressFill.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
  progressLabel.textContent = label;
}

function startProgress(profile) {
  clearInterval(progressTimer);
  const stages = profile === "authorized_deep"
    ? [
      [8, translations[currentLang].authorizedPreparing],
      [18, translations[currentLang].dnsNetwork],
      [32, translations[currentLang].httpsTls],
      [48, translations[currentLang].pathsFiles],
      [64, translations[currentLang].internalPages],
      [78, translations[currentLang].externalTools],
      [90, translations[currentLang].finalReport],
    ]
    : profile === "deep"
      ? [
        [10, translations[currentLang].deepPreparing],
        [28, translations[currentLang].deepNetwork],
        [48, translations[currentLang].deepPaths],
        [68, translations[currentLang].deepPages],
        [88, translations[currentLang].deepReport],
      ]
      : [
        [12, translations[currentLang].quickPreparing],
        [38, translations[currentLang].quickAnalysis],
        [70, translations[currentLang].deepReport],
        [90, translations[currentLang].finalReport],
      ];

  let index = 0;
  setProgress(3, translations[currentLang].preparing);
  progressTimer = setInterval(() => {
    if (index >= stages.length) {
      clearInterval(progressTimer);
      return;
    }
    const [percent, label] = stages[index];
    setProgress(percent, label);
    index += 1;
  }, 1400);
}

function finishProgress() {
  clearInterval(progressTimer);
  setProgress(100, translations[currentLang].finalReport);
  setTimeout(() => {
    progressCard.classList.add("hidden");
  }, 1200);
}

function badge(text) {
  return `<span class="mini-badge">${escapeHtml(text)}</span>`;
}

function renderReport(report) {
  currentReport = report;
  const counts = report.summary.counts;
  const reportHtmlLink = `/report.html?id=${encodeURIComponent(report.report_id)}`;
  const strengths = (report.strengths || [])
    .map(
      (item) => `
        <article class="strength-card">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.description)}</p>
        </article>
      `
    )
    .join("");
  const ports = report.recon.ports
    .map((item) => badge(`${item.port}/${item.label}: ${item.state}`))
    .join("");
  const paths = report.recon.known_paths
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.label)}</td>
          <td>${escapeHtml(item.path)}</td>
          <td>${escapeHtml(item.status ?? item.error ?? "غير متاح")}</td>
          <td>${escapeHtml(item.elapsed_ms ?? "-")}</td>
        </tr>
      `
    )
    .join("");
  const deepPaths = (report.recon.deep_paths || [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.path)}</td>
          <td>${escapeHtml(item.status ?? item.error ?? "غير متاح")}</td>
          <td>${escapeHtml(item.elapsed_ms ?? "-")}</td>
        </tr>
      `
    )
    .join("");
  const frameworkHints = (report.recon.page_profile.framework_hints || [])
    .map((item) => badge(item))
    .join("");
  const externalTools = report.recon.external_tools || {};
  const crawl = report.recon.crawl || {};
  const externalToolBadges = [
    externalTools.nuclei ? badge(`Nuclei: ${externalTools.nuclei.status}`) : "",
    externalTools.zap ? badge(`ZAP: ${externalTools.zap.status}`) : "",
    badge(`Profile: ${report.scan_profile || "deep"}`),
  ].join("");

  resultsContainer.classList.remove("hidden");
  resultsContainer.innerHTML = `
    <div class="results-header">
      <div>
        <h2>${translations[currentLang].reportTitle}</h2>
        <p>${escapeHtml(report.scope_notice)}</p>
      </div>
      <div>
        <div class="notice">${translations[currentLang].reportId}: ${escapeHtml(report.report_id)}</div>
        <a class="report-link" href="${reportHtmlLink}" target="_blank" rel="noreferrer">${translations[currentLang].printReport}</a>
      </div>
    </div>

    <div class="meta-grid">
      <article><h3>${translations[currentLang].target}</h3><p>${escapeHtml(report.target)}</p></article>
      <article><h3>${translations[currentLang].ipAddress}</h3><p>${escapeHtml(report.ip_address || translations[currentLang].noStrengths)}</p></article>
      <article><h3>${translations[currentLang].securityPosture}</h3><p>${escapeHtml(report.summary.posture)}</p></article>
      <article><h3>${translations[currentLang].https}</h3><p>${escapeHtml(report.surface.https.status ?? report.surface.https.error ?? translations[currentLang].noStrengths)}</p></article>
      <article><h3>${translations[currentLang].tls}</h3><p>${escapeHtml(report.surface.tls?.version || report.surface.tls?.error || translations[currentLang].noStrengths)}</p></article>
      <article><h3>${translations[currentLang].responseTime}</h3><p>${escapeHtml(report.surface.https.elapsed_ms ?? report.surface.http.elapsed_ms ?? "-")} ${translations[currentLang].ms}</p></article>
    </div>
    <div class="badge-wrap">${externalToolBadges}</div>

    <div class="severity-row">
      <span class="severity critical">${translations[currentLang].critical}: ${counts.critical}</span>
      <span class="severity high">${translations[currentLang].high}: ${counts.high}</span>
      <span class="severity medium">${translations[currentLang].medium}: ${counts.medium}</span>
      <span class="severity low">${translations[currentLang].low}: ${counts.low}</span>
      <span class="severity info">${translations[currentLang].info}: ${counts.info}</span>
    </div>

    <article class="detail-card narrative-card">
      <h3>${translations[currentLang].executiveSummary}</h3>
      <p>${escapeHtml(report.narrative?.executive_summary || translations[currentLang].noStrengths)}</p>
      <p>${escapeHtml(report.narrative?.defender_view || "")}</p>
      <p>${escapeHtml(report.narrative?.attacker_view || "")}</p>
      <div class="badge-wrap">
        ${(report.narrative?.top_risks || []).map((item) => badge(`${translations[currentLang].topRisks}: ${item}`)).join("")}
      </div>
      <div class="badge-wrap">
        ${(report.narrative?.top_strengths || []).map((item) => badge(`${translations[currentLang].strength}: ${item}`)).join("")}
      </div>
    </article>

    <article class="detail-card strengths-panel">
      <h3>${translations[currentLang].strengthsTitle}</h3>
      <div class="strengths-grid">
        ${strengths || `<p>${translations[currentLang].noStrengths}</p>`}
      </div>
    </article>

    <div class="detail-grid">
      <article class="detail-card">
        <h3>${translations[currentLang].dnsNetworkTitle}</h3>
        <p>${translations[currentLang].discoveredAddresses}: ${escapeHtml((report.recon.dns.addresses || []).join(", ") || translations[currentLang].noStrengths)}</p>
        <p>${translations[currentLang].reverseDns}: ${escapeHtml(report.recon.dns.reverse_dns || translations[currentLang].noStrengths)}</p>
        <div class="badge-wrap">${ports || badge(translations[currentLang].ports)}</div>
      </article>

      <article class="detail-card">
        <h3>${translations[currentLang].pageProfile}</h3>
        <p>${translations[currentLang].titleLabel}: ${escapeHtml(report.recon.page_profile.title || translations[currentLang].noStrengths)}</p>
        <p>${translations[currentLang].forms}: ${escapeHtml(report.recon.page_profile.forms_count)}</p>
        <p>${translations[currentLang].scriptTags}: ${escapeHtml(report.recon.page_profile.script_tags)}</p>
        <p>${translations[currentLang].csrfMeta}: ${escapeHtml(report.recon.page_profile.csrf_meta_present ? translations[currentLang].yes : translations[currentLang].no)}</p>
        <div class="badge-wrap">${frameworkHints || badge(translations[currentLang].frameworkHints)}</div>
      </article>
      <article class="detail-card">
        <h3>${translations[currentLang].internalCrawl}</h3>
        <p>${translations[currentLang].pagesVisited}: ${escapeHtml(crawl.pages_visited ?? 0)}</p>
        <p>${translations[currentLang].jsFiles}: ${escapeHtml((crawl.javascript_files || []).length)}</p>
        <p>${translations[currentLang].emailsFound}: ${escapeHtml((crawl.emails || []).length)}</p>
        <p>${translations[currentLang].htmlComments}: ${escapeHtml((crawl.html_comments || []).length)}</p>
        <div class="badge-wrap">${externalToolBadges}</div>
      </article>
    </div>

    <article class="detail-card table-card">
      <h3>${translations[currentLang].knownPaths}</h3>
      <table class="report-table">
        <thead>
          <tr>
            <th>${translations[currentLang].type}</th>
            <th>${translations[currentLang].path}</th>
            <th>${translations[currentLang].status}</th>
            <th>${translations[currentLang].timeMs}</th>
          </tr>
        </thead>
        <tbody>${paths}</tbody>
      </table>
    </article>

    <article class="detail-card table-card">
      <h3>${translations[currentLang].deepPaths}</h3>
      <table class="report-table">
        <thead>
          <tr>
            <th>${translations[currentLang].path}</th>
            <th>${translations[currentLang].status}</th>
            <th>${translations[currentLang].timeMs}</th>
          </tr>
        </thead>
        <tbody>${deepPaths || `<tr><td colspan="3">${translations[currentLang].noDeepPaths}</td></tr>`}</tbody>
      </table>
    </article>

    <h3 class="findings-title">${translations[currentLang].findingsTitle}</h3>
    <div id="findings-grid" class="findings-grid"></div>

    <h3 class="next-steps-title">${translations[currentLang].nextStepsTitle}</h3>
    <ul class="next-steps">
      ${report.next_steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
    </ul>
  `;

  const grid = document.getElementById("findings-grid");
  report.findings.forEach((item) => {
    const node = findingTemplate.content.cloneNode(true);
    node.querySelector(".severity").textContent = severityLabel(item.severity);
    node.querySelector(".severity").classList.add(item.severity);
    node.querySelector(".category").textContent = item.category;
    node.querySelector(".title").textContent = item.title;
    const description = [
      item.description,
      item.owasp_category ? `OWASP: ${item.owasp_category}` : "",
      item.fix_priority ? `أولوية الإصلاح: ${item.fix_priority}` : "",
      item.impact ? `الأثر: ${item.impact}` : "",
      item.risk_story ? `كيف ينظر لها المهاجم: ${item.risk_story}` : "",
      item.remediation ? `الإجراء المقترح: ${item.remediation}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    node.querySelector(".description").textContent = description;
    grid.appendChild(node);
  });
}

async function startScan(target, profile) {
  scanButton.disabled = true;
  renderStatus(`${translations[currentLang].scanning} ${profile} ${translations[currentLang].collecting}`);
  startProgress(profile);
  resultsContainer.classList.add("hidden");
  resultsContainer.innerHTML = "";

  try {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, profile }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || translations[currentLang].scanFailed);
    renderStatus(`${translations[currentLang].securityAssessment}: ${data.summary.posture}`, data.summary.score);
    renderReport(data);
    finishProgress();
  } catch (error) {
    renderStatus(`${translations[currentLang].scanFailed}: ${error.message}`);
    clearInterval(progressTimer);
    setProgress(100, translations[currentLang].scanFailed);
  } finally {
    scanButton.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const target = targetInput.value.trim();
  const profile = profileSelect.value;
  if (!target) {
    renderStatus(translations[currentLang].enterTarget);
    return;
  }
  startScan(target, profile);
});

document.getElementById('language-toggle').addEventListener('click', () => {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  updateLanguage();
  // If report is visible, re-render it
  if (!resultsContainer.classList.contains('hidden')) {
    // Assume report data is stored somewhere, but for now, just update static texts
    // In a real app, store the report data globally
  }
});

updateLanguage();
