import { motion } from "framer-motion";
import {
  Shield, Scan, FileSearch, Lock, Bug, Network, Server, Eye, Code, ChevronRight, Database, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

const fadeIn = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

const services = [
  { icon: Scan, title: "Passive Web Assessment", desc: "A safe external review of an authorized domain that checks reachability, HTTPS behavior, response timing, and browser-facing security headers.", features: ["DNS Resolution", "HTTPS and Redirect Checks", "Header Risk Review", "Severity-ranked Findings"] },
  { icon: Shield, title: "Security Evidence Reports", desc: "Structured reports turn observed response evidence into an understandable posture score and a prioritized remediation roadmap.", features: ["Executive Summary", "Posture Scoring", "Finding Recommendations", "JSON Export"] },
  { icon: Network, title: "Public Surface Context", desc: "Understand the public network context of a target without intrusive port sweeps, exploit payloads, or changes to the target.", features: ["Public IP Addresses", "Reverse DNS", "Response Timing", "Observed URL Services"] },
  { icon: Code, title: "Safe Assessment Boundary", desc: "The scanner explicitly avoids source-code access, exploit payloads, credential handling, and target modification.", features: ["No Exploitation", "No Credentials", "No Intrusive Sweep", "Clear Scope"] },
  { icon: FileSearch, title: "Security Reporting", desc: "Each completed scan becomes a timestamped report with technical evidence, risk scoring, and actionable remediation recommendations.", features: ["Executive Summary", "Risk Scoring", "Remediation Plans", "JSON Download"] },
  { icon: Eye, title: "Review Workspace", desc: "Browse previous local assessments, filter by posture, open full findings, and refresh the report list as new scans complete.", features: ["All Reports", "Needs Attention", "Strong Posture", "Refreshable List"] },
  { icon: Server, title: "Service Health", desc: "A lightweight health endpoint makes the platform easier to operate and gives the home page a live API status indicator.", features: ["Health Endpoint", "Express Runtime", "Unified Dev Server", "Production Build"] },
  { icon: KeyRound, title: "Authorization Gate", desc: "Every scan request requires an explicit authorization confirmation and rejects local or private network targets.", features: ["Explicit Consent", "Private IP Blocking", "Target Validation", "Safe Errors"] },
];

const processSteps = [
  { step: "01", title: "Authorize", desc: "Confirm ownership or explicit permission and provide the public domain or URL you want to assess." },
  { step: "02", title: "Observe", desc: "Resolve public DNS, fetch one controlled response, and evaluate HTTPS behavior and browser security headers." },
  { step: "03", title: "Report", desc: "Generate a timestamped report with posture scoring, severity-ranked findings, evidence, and remediation guidance." },
  { step: "04", title: "Improve", desc: "Apply the recommendations in your own environment, then repeat the assessment to validate the changes." },
];

export default function Services() {
  return (
    <div>
      <section className="relative py-16 lg:py-24">
        <div className="absolute inset-0">
          <img src="/manus-storage/services-bg.png" alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        </div>
        <div className="container relative z-10">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeIn} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              <Database className="w-4 h-4" />
              Professional Security Services
            </span>
            <h1 className="font-display font-bold text-4xl lg:text-5xl tracking-tight mb-4">
              Comprehensive Security <span className="text-gradient-cyan">Solutions</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              From passive target assessment to exportable evidence, the platform provides a focused security workflow designed to protect authorized digital infrastructure without intrusive testing.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div key={service.title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={i} variants={fadeIn}>
                <Card className="bg-card/60 border-border backdrop-blur-sm hover:border-primary/30 transition-all duration-300 h-full glow-border group">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                      <service.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-xl mb-3">{service.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {service.features.map((f) => (
                        <span key={f} className="px-3 py-1 rounded-full bg-background/60 border border-border text-xs text-muted-foreground">{f}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={0} variants={fadeIn} className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl lg:text-4xl tracking-tight mb-4">Our <span className="text-gradient-cyan">Process</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">A structured methodology ensuring thorough assessment and actionable results.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, i) => (
              <motion.div key={step.step} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={i + 1} variants={fadeIn}>
                <Card className="bg-card/40 border-border h-full relative overflow-hidden">
                  <CardContent className="p-6">
                    <span className="font-display font-bold text-5xl text-primary/10 absolute top-4 right-4">{step.step}</span>
                    <div className="relative z-10">
                      <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={0} variants={fadeIn} className="bg-card/60 border border-border rounded-2xl p-8 lg:p-12 text-center backdrop-blur-sm">
            <h2 className="font-display font-bold text-2xl lg:text-3xl mb-4">Ready to Strengthen Your Security Posture?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Start with a free passive assessment to understand your public security posture and receive actionable recommendations.</p>
            <Link href="/scanner">
              <Button className="bg-primary text-background hover:bg-primary/90 font-semibold px-8 shadow-lg shadow-primary/25">
                Start Free Scan <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
