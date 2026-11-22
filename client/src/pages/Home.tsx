import { Link } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Scan,
  FileSearch,
  Lock,
  Bug,
  Network,
  ChevronRight,
  Zap,
  Globe,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { healthCheck } from "@/lib/api";

const fadeIn = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

const features = [
  {
    icon: Scan,
    title: "Passive Security Assessment",
    desc: "Inspect public DNS, HTTPS reachability, response timing, and browser security headers without exploit payloads or intrusive sweeps.",
  },
  {
    icon: FileSearch,
    title: "Structured Security Reports",
    desc: "Generate scored JSON reports with findings, strengths, executive summary, and practical remediation steps.",
  },
  {
    icon: Lock,
    title: "Authorization-Gated Only",
    desc: "Every scan requires explicit confirmation that you own the target or have permission to assess it.",
  },
  {
    icon: Bug,
    title: "Header & Transport Analysis",
    desc: "Evaluate HSTS quality, CSP, clickjacking protections, referrer policy, and other browser-facing controls.",
  },
  {
    icon: Network,
    title: "Public Surface Evidence",
    desc: "Resolve public DNS records and record response timing without modifying the target or following redirects blindly.",
  },
  {
    icon: Terminal,
    title: "Exportable Evidence",
    desc: "Store each completed assessment locally and download structured JSON reports for review.",
  },
];

const stats = [
  { value: "Passive", label: "Assessment mode" },
  { value: "DNS + HTTPS", label: "Public evidence" },
  { value: "JSON", label: "Report export" },
  { value: "No exploit", label: "Safety boundary" },
];

export default function Home() {
  const [serviceOnline, setServiceOnline] = useState(false);

  useEffect(() => {
    healthCheck()
      .then(() => setServiceOnline(true))
      .catch(() => setServiceOnline(false));
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <img src="/manus-storage/hero-bg.png" alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>
        <div className="absolute inset-0 grid-overlay opacity-30" />

        <div className="container relative z-10">
          <div className="max-w-3xl">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeIn}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Defensive Passive Assessment Platform
                <span
                  className={`ml-1 inline-flex items-center gap-1 text-xs ${
                    serviceOnline ? "text-emerald-300" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      serviceOnline ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                  />
                  {serviceOnline ? "API online" : "API checking"}
                </span>
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeIn}
              className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] tracking-tight mb-6"
            >
              Assess Authorized Targets{" "}
              <span className="text-gradient-cyan">With Clear Evidence</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeIn}
              className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-xl"
            >
              Al-Kunooze Security performs passive, authorization-gated reviews of public DNS,
              HTTPS posture, response timing, and security headers — then turns the evidence
              into a scored, exportable report.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeIn}
              className="flex flex-wrap gap-4"
            >
              <Link href="/scanner">
                <Button
                  size="lg"
                  className="bg-primary text-background hover:bg-primary/90 font-semibold text-base px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 active:scale-[0.97]"
                >
                  <Scan className="w-5 h-5 mr-2" />
                  Start Security Scan
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border text-foreground hover:bg-white/5 font-medium text-base px-8"
                >
                  Learn More
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={4}
              variants={fadeIn}
              className="flex flex-wrap gap-6 mt-10"
            >
              {["Authorization required", "Passive checks only", "Local JSON reports"].map((point) => (
                <span key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {point}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-1">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                variants={fadeIn}
              >
                <Card className="bg-card/50 border-border backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <p className="font-display font-bold text-2xl lg:text-3xl text-primary">{stat.value}</p>
                    <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={0}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-3xl lg:text-4xl tracking-tight mb-4">
              Platform <span className="text-gradient-cyan">Capabilities</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Focused defensive tools for authorized passive assessment and clear, actionable
              reporting.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                custom={i}
                variants={fadeIn}
              >
                <Card className="bg-card/60 border-border backdrop-blur-sm hover:border-primary/30 transition-all duration-300 h-full glow-border group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scanning Visual Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/manus-storage/scanning-visual.png" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background" />
        </div>
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={0}
              variants={fadeIn}
            >
              <h2 className="font-display font-bold text-3xl lg:text-4xl tracking-tight mb-6">
                Clear Evidence From{" "}
                <span className="text-gradient-cyan">Authorized Targets</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                The scanner makes one controlled request, evaluates transport and response
                headers, records timing and DNS context, then produces a scored report you can
                export.
              </p>
              <div className="space-y-4">
                {[
                  "Public DNS resolution and target reachability",
                  "HTTPS, redirect, and browser security header evaluation",
                  "HSTS quality analysis and severity-ranked findings",
                  "Authorized passive assessment with no exploit payloads",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="text-sm text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/scanner">
                  <Button className="bg-primary text-background hover:bg-primary/90 font-semibold shadow-lg shadow-primary/25">
                    Launch Scanner
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={1}
              variants={fadeIn}
              className="relative"
            >
              <div className="bg-card/40 border border-border rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-muted-foreground ml-2 font-mono">ak-security-scanner</span>
                </div>
                <div className="font-mono text-sm space-y-2">
                  <p className="text-primary">$ ak-scan --target example.com --profile deep</p>
                  <p className="text-muted-foreground">Waiting for an authorized target...</p>
                  <p className="text-emerald-400">[+] DNS resolution and reachability</p>
                  <p className="text-emerald-400">[+] HTTPS and redirect inspection</p>
                  <p className="text-emerald-400">[+] Security header evaluation</p>
                  <p className="text-emerald-400">[+] HSTS quality analysis</p>
                  <p className="text-yellow-400">[!] Findings ranked by practical severity</p>
                  <p className="text-emerald-400">[+] No exploit payloads sent</p>
                  <p className="text-emerald-400">[+] JSON report persisted locally</p>
                  <p className="text-muted-foreground">Evidence is ready for review...</p>
                  <p className="text-primary">Assessment complete. Review the report.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/manus-storage/cta-bg.png" alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/50" />
        </div>
        <div className="container relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            custom={0}
            variants={fadeIn}
          >
            <h2 className="font-display font-bold text-3xl lg:text-5xl tracking-tight mb-6">
              Ready to Assess an{" "}
              <span className="text-gradient-cyan">Authorized Target</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Run a passive security assessment and get a clear, scored report in minutes.
            </p>
            <Link href="/scanner">
              <Button
                size="lg"
                className="bg-primary text-background hover:bg-primary/90 font-semibold text-base px-10 shadow-lg shadow-primary/25"
              >
                <Globe className="w-5 h-5 mr-2" />
                Start Your First Scan
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
