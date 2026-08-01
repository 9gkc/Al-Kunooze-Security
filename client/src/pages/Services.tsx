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
  { icon: Scan, title: "Vulnerability Assessment", desc: "Comprehensive automated scanning of web applications to identify security weaknesses, misconfigurations, and potential attack vectors across your entire infrastructure.", features: ["OWASP Top 10 Analysis", "Automated Deep Scanning", "Multi-Layer Detection", "Real-time Monitoring"] },
  { icon: Shield, title: "Penetration Testing", desc: "Manual and automated penetration testing services simulating real-world attack scenarios to validate your security controls and identify exploitable vulnerabilities.", features: ["Black-box Testing", "Gray-box Testing", "White-box Testing", "Social Engineering"] },
  { icon: Network, title: "Network Security", desc: "Comprehensive network infrastructure assessment including firewall analysis, port scanning, service enumeration, and network topology mapping.", features: ["Port Scanning", "Firewall Analysis", "Network Mapping", "Protocol Analysis"] },
  { icon: Code, title: "Code Security Review", desc: "In-depth source code analysis to identify security flaws, insecure coding practices, and potential vulnerabilities before deployment.", features: ["Static Analysis", "Dependency Auditing", "Secret Detection", "Secure Coding Guidelines"] },
  { icon: FileSearch, title: "Security Reporting", desc: "Professional, academic-grade security reports with executive summaries, technical details, risk assessments, and actionable remediation recommendations.", features: ["Executive Summaries", "Risk Scoring", "Remediation Plans", "Compliance Mapping"] },
  { icon: Eye, title: "Continuous Monitoring", desc: "24/7 security monitoring and alerting for your web applications and infrastructure, providing real-time threat detection and response capabilities.", features: ["Real-time Alerts", "Anomaly Detection", "Incident Response", "Threat Intelligence"] },
  { icon: Server, title: "Infrastructure Hardening", desc: "Comprehensive server and infrastructure security hardening including OS-level configurations, service security, and access control optimization.", features: ["OS Hardening", "Service Configuration", "Access Control", "Encryption Setup"] },
  { icon: KeyRound, title: "Authentication & Access", desc: "Security assessment and implementation of authentication systems, access control mechanisms, and identity management solutions.", features: ["MFA Implementation", "OAuth/SSO Setup", "RBAC Design", "Session Management"] },
];

const processSteps = [
  { step: "01", title: "Discovery", desc: "Initial assessment of your infrastructure, defining scope, and identifying critical assets and attack surfaces." },
  { step: "02", title: "Analysis", desc: "Deep scanning and analysis using advanced tools and methodologies to identify vulnerabilities and security gaps." },
  { step: "03", title: "Reporting", desc: "Comprehensive documentation of findings with risk scores, impact analysis, and prioritized remediation recommendations." },
  { step: "04", title: "Remediation", desc: "Guided implementation of security fixes with ongoing validation and re-testing to ensure vulnerabilities are resolved." },
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
              From vulnerability assessment to continuous monitoring, we provide end-to-end cybersecurity services designed to protect your digital infrastructure against evolving threats.
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
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Start with a free deep scan to understand your current security level and receive actionable recommendations.</p>
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
