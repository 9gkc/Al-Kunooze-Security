import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Shield, AlertTriangle, CheckCircle, Download, Eye, Calendar, Target, TrendingUp, BarChart3, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScanResult, Severity } from "@shared/types";
import { downloadScanUrl, getScan, listScans, type ScanSummary } from "@/lib/api";

const severityColors: Record<Severity, string> = {
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  low: "bg-green-500/20 text-green-300 border-green-500/30",
  info: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

function scoreTone(score: number) {
  return score >= 85 ? "text-emerald-400" : score >= 70 ? "text-yellow-400" : "text-red-400";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function ReportRow({ report, onView }: { report: ScanSummary; onView: (id: string) => void }) {
  return (
    <Card className="bg-card/60 border-border backdrop-blur-sm hover:border-primary/30 transition-all duration-300 glow-border">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2"><Badge variant="outline" className="font-mono text-xs">{report.id}</Badge><span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(report.scannedAt)}</span><Badge variant="outline" className="text-xs">{report.profile}</Badge></div>
            <h3 className="font-display font-semibold text-lg mb-1 truncate">{report.normalizedTarget}</h3>
            <p className="text-muted-foreground text-sm">{report.posture} · {report.findingCount} finding{report.findingCount === 1 ? "" : "s"} · {report.responseTime}ms response time</p>
          </div>
          <div className="flex items-center gap-5 lg:border-l lg:border-border lg:pl-6"><div className="text-center"><p className={`font-display font-bold text-3xl ${scoreTone(report.score)}`}>{report.score}</p><p className="text-xs text-muted-foreground">Score</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => onView(report.id)} className="border-border hover:bg-white/5"><Eye className="w-4 h-4 mr-2" />View</Button><a href={downloadScanUrl(report.id)} download><Button variant="outline" size="sm" className="border-border hover:bg-white/5"><Download className="w-4 h-4" /></Button></a></div></div>
        </div>
      </CardContent>
    </Card>
  );
}

function FullReport({ report, onClose }: { report: ScanResult; onClose: () => void }) {
  const counts = report.findings.reduce<Record<Severity, number>>((acc, finding) => { acc[finding.severity] += 1; return acc; }, { critical: 0, high: 0, medium: 0, low: 0, info: 0 });
  return (
    <Card className="bg-card/50 border-primary/20 mb-8"><CardContent className="p-6 space-y-6"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-3 mb-2"><Badge variant="outline" className="font-mono text-xs">{report.id}</Badge><span className="text-xs text-muted-foreground">{formatDate(report.scannedAt)}</span></div><h2 className="font-display font-bold text-2xl">{report.normalizedTarget}</h2><p className="text-sm text-muted-foreground mt-1">{report.executiveSummary}</p></div><div className="flex items-center gap-3"><div className="text-center"><p className={`font-display font-bold text-4xl ${scoreTone(report.score)}`}>{report.score}</p><p className="text-xs text-muted-foreground">/100</p></div><Button variant="outline" onClick={onClose}>Close</Button></div></div><div className="flex flex-wrap gap-2">{(Object.keys(counts) as Severity[]).map((severity) => <Badge key={severity} className={severityColors[severity]}>{severity}: {counts[severity]}</Badge>)}</div><div className="grid md:grid-cols-2 gap-4"><div className="rounded-xl border border-border bg-background/40 p-4"><h3 className="font-display font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" />Findings</h3><div className="space-y-3">{report.findings.length === 0 ? <p className="text-sm text-muted-foreground">No findings in this profile.</p> : report.findings.slice(0, 6).map((finding) => <div key={finding.title} className="border-b border-border/70 pb-3 last:border-0 last:pb-0"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{finding.title}</p><Badge className={severityColors[finding.severity]}>{finding.severity}</Badge></div><p className="text-xs text-muted-foreground mt-1">{finding.recommendation}</p></div>)}</div></div><div className="rounded-xl border border-border bg-background/40 p-4"><h3 className="font-display font-semibold mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />Next steps</h3><ol className="space-y-2">{report.nextSteps.map((step, index) => <li key={step} className="flex items-start gap-2 text-sm"><span className="text-primary font-semibold">{index + 1}.</span><span className="text-muted-foreground">{step}</span></li>)}</ol></div></div><a href={downloadScanUrl(report.id)} download><Button className="bg-primary text-background hover:bg-primary/90"><Download className="w-4 h-4 mr-2" />Download full JSON report</Button></a></CardContent></Card>
  );
}

export default function Reports() {
  const [reports, setReports] = useState<ScanSummary[]>([]);
  const [selected, setSelected] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setError("");
    setRefreshing(true);
    try { setReports(await listScans()); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Reports could not be loaded."); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void loadReports(); }, []);

  const openReport = async (id: string) => {
    setError("");
    try { setSelected(await getScan(id)); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Report could not be opened."); }
  };

  const criticalReports = useMemo(() => reports.filter((report) => report.score < 60), [reports]);
  const securedReports = useMemo(() => reports.filter((report) => report.score >= 85), [reports]);

  return (
    <div>
      <section className="py-12 lg:py-16"><div className="container"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}><span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4"><FileText className="w-4 h-4" />Security Intelligence Reports</span><h1 className="font-display font-bold text-4xl lg:text-5xl tracking-tight mb-4">Your Security <span className="text-gradient-cyan">Reports</span></h1><p className="text-muted-foreground text-lg max-w-2xl">Every completed assessment is stored locally by the service so your team can review, export, and track security posture over time.</p></motion.div></div></section>
      <section className="pb-16"><div className="container">
        {selected && <FullReport report={selected} onClose={() => setSelected(null)} />}
        {error && <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        <Tabs defaultValue="all" className="space-y-6"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><TabsList className="bg-card/60 border border-border"><TabsTrigger value="all" className="data-[state=active]:bg-primary/20">All Reports</TabsTrigger><TabsTrigger value="critical" className="data-[state=active]:bg-primary/20">Needs Attention</TabsTrigger><TabsTrigger value="secured" className="data-[state=active]:bg-primary/20">Strong</TabsTrigger></TabsList><Button variant="outline" size="sm" onClick={() => void loadReports()} disabled={refreshing} className="border-border">{refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}Refresh</Button></div>
          <TabsContent value="all" className="space-y-4 mt-0">{loading ? <LoadingState /> : reports.length === 0 ? <EmptyState /> : reports.map((report) => <ReportRow key={report.id} report={report} onView={openReport} />)}</TabsContent>
          <TabsContent value="critical" className="space-y-4 mt-0">{loading ? <LoadingState /> : criticalReports.length === 0 ? <EmptyState title="No reports need urgent attention" description="Reports below a 60/100 score will appear here." /> : criticalReports.map((report) => <ReportRow key={report.id} report={report} onView={openReport} />)}</TabsContent>
          <TabsContent value="secured" className="space-y-4 mt-0">{loading ? <LoadingState /> : securedReports.length === 0 ? <EmptyState title="No strong reports yet" description="Assess an authorized target and reach 85/100 or higher to see it here." /> : securedReports.map((report) => <ReportRow key={report.id} report={report} onView={openReport} />)}</TabsContent>
        </Tabs>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16"><Card className="bg-card/40 border-border overflow-hidden"><CardContent className="p-0"><div className="grid lg:grid-cols-2"><div className="p-8"><h3 className="font-display font-bold text-2xl mb-4">Evidence-first reporting</h3><p className="text-muted-foreground mb-6">Reports now reflect what the passive scanner actually observed, not pre-populated sample findings. Each record includes a timestamp, profile, score, DNS evidence, response timing, and remediation guidance.</p><div className="space-y-4">{[{ icon: Target, label: "Target and authorization context" }, { icon: AlertTriangle, label: "Severity-ranked findings" }, { icon: TrendingUp, label: "Risk score and posture" }, { icon: Shield, label: "Transport and header evidence" }, { icon: CheckCircle, label: "Actionable remediation roadmap" }].map((item) => <div key={item.label} className="flex items-center gap-3 text-sm"><item.icon className="w-4 h-4 text-primary" /><span className="text-foreground/80">{item.label}</span></div>)}</div></div><div className="bg-background/50 p-8 font-mono text-xs leading-relaxed"><div className="text-primary mb-4">// Report lifecycle</div><div className="space-y-1 text-muted-foreground"><p>1. confirm authorization</p><p>2. resolve public DNS</p><p>3. fetch one passive response</p><p>4. evaluate security headers</p><p>5. persist a versioned JSON record</p><p>6. review and export evidence</p></div></div></div></CardContent></Card></motion.div>
      </div></section>
    </div>
  );
}

function LoadingState() { return <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card/40 p-10 text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin text-primary" />Loading reports...</div>; }
function EmptyState({ title = "No reports yet", description = "Run a passive scan from the Scanner page. Completed assessments will appear here automatically." }: { title?: string; description?: string }) { return <Card className="bg-card/40 border-border"><CardContent className="p-10 text-center"><BarChart3 className="w-10 h-10 text-primary mx-auto mb-3" /><h3 className="font-display font-semibold">{title}</h3><p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{description}</p></CardContent></Card>; }
