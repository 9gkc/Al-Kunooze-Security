import { motion } from "framer-motion";
import { FileText, Shield, AlertTriangle, CheckCircle, Download, Eye, Calendar, Target, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fadeIn = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

const sampleReports = [
  { id: "AKR-2024-001", target: "corporate-portal.example.com", date: "2024-11-15", score: 42, posture: "Critical", critical: 5, high: 3, medium: 4, low: 2, info: 3, summary: "Multiple critical vulnerabilities identified including SQL injection vectors, authentication bypass, and sensitive data exposure. Immediate remediation required." },
  { id: "AKR-2024-002", target: "api.service.example.com", date: "2024-11-20", score: 78, posture: "Moderately Secured", critical: 1, high: 2, medium: 3, low: 4, info: 2, summary: "API endpoints show moderate security posture. Key findings include rate limiting gaps and authentication token handling improvements needed." },
  { id: "AKR-2024-003", target: "admin.dashboard.example.com", date: "2024-12-01", score: 65, posture: "Needs Improvement", critical: 2, high: 1, medium: 5, low: 3, info: 4, summary: "Admin panel requires immediate security hardening. Findings include weak session management, insufficient access controls, and exposed internal endpoints." },
  { id: "AKR-2024-004", target: "ecommerce.example.com", date: "2024-12-10", score: 85, posture: "Well Secured", critical: 0, high: 1, medium: 2, low: 3, info: 5, summary: "E-commerce platform demonstrates strong security posture with minor findings. Payment processing and customer data protection are well implemented." },
];

export default function Reports() {
  return (
    <div>
      <section className="py-12 lg:py-16">
        <div className="container">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeIn}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
              <FileText className="w-4 h-4" />
              Security Intelligence Reports
            </span>
            <h1 className="font-display font-bold text-4xl lg:text-5xl tracking-tight mb-4">
              Professional Security <span className="text-gradient-cyan">Reports</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Comprehensive security assessment reports with detailed findings, risk analysis, and actionable remediation recommendations.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <Tabs defaultValue="all" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <TabsList className="bg-card/60 border border-border">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary/20">All Reports</TabsTrigger>
                <TabsTrigger value="critical" className="data-[state=active]:bg-primary/20">Critical</TabsTrigger>
                <TabsTrigger value="secured" className="data-[state=active]:bg-primary/20">Secured</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4" />
                <span>{sampleReports.length} reports available</span>
              </div>
            </div>

            <TabsContent value="all" className="space-y-4 mt-0">
              {sampleReports.map((report, i) => (
                <motion.div key={report.id} initial="hidden" animate="visible" custom={i} variants={fadeIn}>
                  <Card className="bg-card/60 border-border backdrop-blur-sm hover:border-primary/30 transition-all duration-300 glow-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">{report.id}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{report.date}</span>
                          </div>
                          <h3 className="font-display font-semibold text-lg mb-1">{report.target}</h3>
                          <p className="text-muted-foreground text-sm">{report.summary}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Critical: {report.critical}</Badge>
                            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">High: {report.high}</Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Medium: {report.medium}</Badge>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Low: {report.low}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 lg:border-l lg:border-border lg:pl-6">
                          <div className="text-center">
                            <p className={`font-display font-bold text-3xl ${report.score >= 80 ? "text-emerald-400" : report.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>{report.score}</p>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="border-border hover:bg-white/5"><Eye className="w-4 h-4" /></Button>
                            <Button variant="outline" size="sm" className="border-border hover:bg-white/5"><Download className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="critical" className="mt-0 space-y-4">
              {sampleReports.filter(r => r.score < 60).map((report, i) => (
                <motion.div key={report.id} initial="hidden" animate="visible" custom={i} variants={fadeIn}>
                  <Card className="bg-card/60 border-red-500/20 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <Badge variant="outline" className="font-mono text-xs text-red-300 border-red-500/30">{report.id}</Badge>
                        <span className="text-xs text-red-400">{report.posture}</span>
                      </div>
                      <h3 className="font-display font-semibold text-lg">{report.target}</h3>
                      <p className="text-muted-foreground text-sm mt-2">{report.summary}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <p className="text-2xl font-display font-bold text-red-400">{report.score}</p>
                        <Button size="sm" className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30">View Full Report</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="secured" className="mt-0 space-y-4">
              {sampleReports.filter(r => r.score >= 80).map((report, i) => (
                <motion.div key={report.id} initial="hidden" animate="visible" custom={i} variants={fadeIn}>
                  <Card className="bg-card/60 border-emerald-500/20 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <Badge variant="outline" className="font-mono text-xs text-emerald-300 border-emerald-500/30">{report.id}</Badge>
                        <span className="text-xs text-emerald-400">{report.posture}</span>
                      </div>
                      <h3 className="font-display font-semibold text-lg">{report.target}</h3>
                      <p className="text-muted-foreground text-sm mt-2">{report.summary}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <p className="text-2xl font-display font-bold text-emerald-400">{report.score}</p>
                        <Button size="sm" className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30">View Full Report</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={5} variants={fadeIn} className="mt-16">
            <Card className="bg-card/40 border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-2">
                  <div className="p-8">
                    <h3 className="font-display font-bold text-2xl mb-4">Report Template Preview</h3>
                    <p className="text-muted-foreground mb-6">Every scan generates a comprehensive report including executive summary, technical findings, risk scoring, and remediation roadmap.</p>
                    <div className="space-y-4">
                      {[{ icon: Target, label: "Executive Summary" }, { icon: AlertTriangle, label: "Vulnerability Findings" }, { icon: TrendingUp, label: "Risk Assessment" }, { icon: Shield, label: "Security Posture Analysis" }, { icon: CheckCircle, label: "Remediation Roadmap" }].map((item) => (
                        <div key={item.label} className="flex items-center gap-3 text-sm">
                          <item.icon className="w-4 h-4 text-primary" />
                          <span className="text-foreground/80">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-background/50 p-8 font-mono text-xs leading-relaxed">
                    <div className="text-primary mb-4">// Report Structure</div>
                    <div className="space-y-1 text-muted-foreground">
                      <p>{"{"}</p>
                      <p className="pl-4">"report_id": <span className="text-primary">"AKR-2024-XXX"</span>,</p>
                      <p className="pl-4">"target": <span className="text-emerald-400">"example.com"</span>,</p>
                      <p className="pl-4">"scanned_at": <span className="text-primary">"2024-12-15T..."</span>,</p>
                      <p className="pl-4">"summary": {"{"}</p>
                      <p className="pl-8">"score": <span className="text-yellow-400">78</span>,</p>
                      <p className="pl-8">"posture": <span className="text-primary">"Moderately Secured"</span>,</p>
                      <p className="pl-8">"counts": {"{"}</p>
                      <p className="pl-12">"critical": <span className="text-red-400">1</span>,</p>
                      <p className="pl-12">"high": <span className="text-orange-400">2</span>,</p>
                      <p className="pl-12">"medium": <span className="text-blue-400">3</span>,</p>
                      <p className="pl-12">"low": <span className="text-green-400">4</span>,</p>
                      <p className="pl-12">"info": <span className="text-slate-400">5</span></p>
                      <p className="pl-8">{"}"}</p>
                      <p className="pl-4">{"}"}</p>
                      <p>{"}"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
