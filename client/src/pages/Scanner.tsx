import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan, Globe, Shield, AlertTriangle, CheckCircle, Loader2,
  Target, Network, FileText, Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type ScanProfile = "quick" | "deep" | "authorized_deep";

interface ScanResult {
  target: string; score: number; posture: string; https: boolean; tls: string;
  responseTime: number;
  ports: { port: number; label: string; state: string }[];
  findings: { severity: string; category: string; title: string; description: string }[];
  strengths: { title: string; description: string }[];
  nextSteps: string[];
  executiveSummary: string;
  dns: { addresses: string[]; reverse: string };
}

const demoResult: ScanResult = {
  target: "example.com", score: 78, posture: "Moderately Secured", https: true, tls: "TLS 1.3",
  responseTime: 142,
  ports: [
    { port: 80, label: "HTTP", state: "open" },
    { port: 443, label: "HTTPS", state: "open" },
    { port: 22, label: "SSH", state: "filtered" },
  ],
  findings: [
    { severity: "critical", category: "Injection", title: "SQL Injection Potential", description: "2 endpoints show potential SQL injection vectors. Input validation is insufficient on form submissions." },
    { severity: "high", category: "XSS", title: "Reflected XSS Vulnerability", description: "User input is reflected without proper sanitization in search parameter handlers." },
    { severity: "medium", category: "Headers", title: "Missing Security Headers", description: "X-Content-Type-Options and X-Frame-Options headers are not configured." },
    { severity: "low", category: "Info Disclosure", title: "Server Version Exposure", description: "Server header reveals exact software version and OS details." },
    { severity: "info", category: "SSL/TLS", title: "Certificate Details", description: "SSL certificate expires in 284 days. Renewal recommended before 90-day window." },
  ],
  strengths: [
    { title: "HTTPS Enforced", description: "All traffic is redirected to HTTPS with HSTS enabled." },
    { title: "CSRF Protection", description: "Cross-Site Request Forgery tokens are present on all forms." },
    { title: "Content Security Policy", description: "CSP header is configured with restrictive directives." },
  ],
  nextSteps: [
    "Implement parameterized queries on all database interactions",
    "Add input sanitization libraries for user-facing endpoints",
    "Configure missing security headers (X-Content-Type-Options, X-Frame-Options)",
    "Implement rate limiting on authentication endpoints",
    "Schedule SSL certificate renewal before expiration window",
  ],
  executiveSummary: "The target website demonstrates moderate security posture with several areas requiring immediate attention. Critical vulnerabilities in SQL injection vectors and XSS reflect insufficient input validation.",
  dns: { addresses: ["93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946"], reverse: "example.com" },
};

const scanStages = [
  { label: "Initializing scan engine...", progress: 5 },
  { label: "Resolving DNS and mapping network surface...", progress: 15 },
  { label: "Checking HTTPS/TLS configuration...", progress: 30 },
  { label: "Analyzing security headers...", progress: 45 },
  { label: "Scanning known paths and sensitive files...", progress: 60 },
  { label: "Running vulnerability detection modules...", progress: 75 },
  { label: "Performing deep analysis...", progress: 88 },
  { label: "Generating comprehensive report...", progress: 95 },
];

export default function Scanner() {
  const [target, setTarget] = useState("");
  const [profile, setProfile] = useState<ScanProfile>("deep");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);

  const runScan = useCallback(async () => {
    if (!target.trim()) return;
    setScanning(true);
    setProgress(0);
    setResult(null);
    for (let i = 0; i < scanStages.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
      setProgress(scanStages[i].progress);
      setStageLabel(scanStages[i].label);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    setProgress(100);
    setStageLabel("Scan complete");
    const data = { ...demoResult, target: target.trim() };
    setResult(data);
    setScanning(false);
  }, [target]);

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-300 border-red-500/30",
    high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    low: "bg-green-500/20 text-green-300 border-green-500/30",
    info: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };

  return (
    <div className="min-h-screen">
      <section className="py-12 lg:py-16">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Defensive Security Scanner
            </span>
            <h1 className="font-display font-bold text-3xl lg:text-5xl tracking-tight mb-4">
              Deep Security <span className="text-gradient-cyan">Scanning</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Enter a domain or URL to run a comprehensive defensive security scan. For authorized use only.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <Card className="bg-card/60 border-border backdrop-blur-sm max-w-3xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input value={target} onChange={(e) => setTarget(e.target.value)}
                    placeholder="example.com or https://example.com"
                    className="pl-12 h-12 bg-background/50 border-border text-base"
                    onKeyDown={(e) => e.key === "Enter" && !scanning && runScan()} />
                </div>
                <Select value={profile} onValueChange={(v) => setProfile(v as ScanProfile)}>
                  <SelectTrigger className="w-full sm:w-48 h-12 bg-background/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick Scan</SelectItem>
                    <SelectItem value="deep">Deep Scan</SelectItem>
                    <SelectItem value="authorized_deep">Advanced Deep</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={runScan} disabled={scanning || !target.trim()} size="lg"
                  className="h-12 bg-primary text-background hover:bg-primary/90 font-semibold px-8 shadow-lg shadow-primary/25 min-w-[160px]">
                  {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5 mr-2" />}
                  {scanning ? "Scanning" : "Run Scan"}
                </Button>
              </div>

              <AnimatePresence>
                {scanning && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-primary font-medium flex items-center gap-2">
                        <Target className="w-4 h-4" />{stageLabel}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-background/50" />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            For defensive, academic, and research use only. Only scan websites you own or have explicit authorization to test.
          </p>
        </div>
      </section>

      <AnimatePresence>
        {result && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pb-16">
            <div className="container">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 bg-card/60 border border-border rounded-xl backdrop-blur-sm">
                <div>
                  <h2 className="font-display font-bold text-2xl mb-1">Security Assessment Result</h2>
                  <p className="text-muted-foreground text-sm">Target: <span className="font-mono text-foreground">{result.target}</span></p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-4">
                  <div className="text-center">
                    <p className={`font-display font-bold text-4xl ${result.score >= 80 ? "text-emerald-400" : result.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>{result.score}</p>
                    <p className="text-xs text-muted-foreground">/100</p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary">{result.posture}</Badge>
                </div>
              </div>

              <Tabs defaultValue="findings" className="space-y-6">
                <TabsList className="bg-card/60 border border-border">
                  <TabsTrigger value="findings" className="data-[state=active]:bg-primary/20"><Bug className="w-4 h-4 mr-2" />Findings</TabsTrigger>
                  <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20"><FileText className="w-4 h-4 mr-2" />Overview</TabsTrigger>
                  <TabsTrigger value="network" className="data-[state=active]:bg-primary/20"><Network className="w-4 h-4 mr-2" />Network</TabsTrigger>
                  <TabsTrigger value="remediation" className="data-[state=active]:bg-primary/20"><CheckCircle className="w-4 h-4 mr-2" />Remediation</TabsTrigger>
                </TabsList>

                <TabsContent value="findings" className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Critical: 1</Badge>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">High: 1</Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Medium: 1</Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Low: 1</Badge>
                    <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">Info: 1</Badge>
                  </div>
                  {result.findings.map((finding, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="bg-card/40 border-border">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className={`w-5 h-5 ${finding.severity === "critical" ? "text-red-400" : finding.severity === "high" ? "text-orange-400" : finding.severity === "medium" ? "text-blue-400" : finding.severity === "low" ? "text-green-400" : "text-slate-400"}`} />
                              <h3 className="font-display font-semibold">{finding.title}</h3>
                            </div>
                            <Badge className={severityColors[finding.severity]}>{finding.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                          <Badge variant="outline" className="text-xs">{finding.category}</Badge>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </TabsContent>

                <TabsContent value="overview">
                  <Card className="bg-card/40 border-border">
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <h3 className="font-display font-semibold mb-3">Executive Summary</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{result.executiveSummary}</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-background/50 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">HTTPS</p>
                          <p className="font-semibold text-emerald-400">{result.https ? "Enabled" : "Disabled"}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">TLS Version</p>
                          <p className="font-semibold">{result.tls}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Response Time</p>
                          <p className="font-semibold">{result.responseTime}ms</p>
                        </div>
                        <div className="p-4 rounded-xl bg-background/50 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">Open Ports</p>
                          <p className="font-semibold">{result.ports.length}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-display font-semibold mb-3">Strengths</h3>
                        <div className="grid gap-3">
                          {result.strengths.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                              <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                              <div><p className="text-sm font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{s.description}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="network">
                  <Card className="bg-card/40 border-border">
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <h3 className="font-display font-semibold mb-3">DNS Information</h3>
                        <div className="grid gap-3">
                          <div className="p-4 rounded-lg bg-background/50 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Resolved Addresses</p>
                            <div className="font-mono text-sm space-y-1">
                              {result.dns.addresses.map((addr) => <p key={addr} className="text-primary">{addr}</p>)}
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-background/50 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Reverse DNS</p>
                            <p className="font-mono text-sm text-primary">{result.dns.reverse}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-display font-semibold mb-3">Open Ports</h3>
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Port</th>
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">Service</th>
                            <th className="text-left py-3 px-4 text-muted-foreground font-medium">State</th>
                          </tr></thead>
                          <tbody>
                            {result.ports.map((p) => (
                              <tr key={p.port} className="border-b border-border/50">
                                <td className="py-3 px-4 font-mono">{p.port}</td>
                                <td className="py-3 px-4">{p.label}</td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className={p.state === "open" ? "text-emerald-400 border-emerald-500/30" : p.state === "filtered" ? "text-yellow-400 border-yellow-500/30" : "text-slate-400 border-slate-500/30"}>
                                    {p.state}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="remediation">
                  <Card className="bg-card/40 border-border">
                    <CardContent className="p-6">
                      <h3 className="font-display font-semibold mb-4">Suggested Remediation Steps</h3>
                      <div className="space-y-3">
                        {result.nextSteps.map((step, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border">
                            <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                            <p className="text-sm">{step}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
