import { motion } from "framer-motion";
import { Shield, Target, Users, BookOpen, Lock, Code, Globe, Mail, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeIn = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

const values = [
  { icon: Shield, title: "Defense First", desc: "Every tool we build is designed for defensive security. We protect, we don't attack." },
  { icon: BookOpen, title: "Academic Excellence", desc: "Our methodologies are grounded in academic research and industry standards like OWASP and NIST." },
  { icon: Lock, title: "Ethical Operations", desc: "Strict authorization protocols ensure all scanning is performed only on authorized targets." },
  { icon: Code, title: "Open Intelligence", desc: "Transparent methodologies and open-source tools empower the broader security community." },
];

const techStack = ["React 19", "TypeScript", "Vite 7", "Tailwind CSS 4", "Express", "Node.js", "Public DNS", "HTTPS Headers", "JSON Reports", "Framer Motion", "Wouter", "Vitest-ready"];

export default function About() {
  return (
    <div>
      <section className="py-12 lg:py-20">
        <div className="container">
          <motion.div initial="hidden" animate="visible" custom={0} variants={fadeIn} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              About Al-Kunooze Security
            </span>
            <h1 className="font-display font-bold text-4xl lg:text-5xl tracking-tight mb-6">
              Securing the Digital Frontier with <span className="text-gradient-cyan">Precision</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Al-Kunooze Security is an advanced cybersecurity platform built by security researchers and engineers committed to making professional-grade defensive security tools accessible to organizations worldwide. Our mission is to bridge the gap between complex security tools and user-friendly interfaces.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={1} variants={fadeIn}>
              <h2 className="font-display font-bold text-3xl mb-6">Our <span className="text-gradient-cyan">Mission</span></h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We believe that every organization deserves access to understandable security evidence. Al-Kunooze Security currently focuses on passive external assessment: public DNS resolution, HTTPS reachability, response headers, response timing, and actionable remediation guidance — all designed with a defensive mindset.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                The platform combines an Express API with a React workspace to turn each authorized assessment into a timestamped JSON report that teams can review and export. It does not exploit vulnerabilities, perform intrusive port sweeps, or modify targets.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-primary text-background hover:bg-primary/90 font-semibold">
                  <Globe className="w-4 h-4 mr-2" />Explore Platform
                </Button>
                <a href="https://github.com/9gkc/Al-Kunooze-Security" target="_blank" rel="noreferrer">
                  <Button variant="outline" className="border-border hover:bg-white/5">
                    <Github className="w-4 h-4 mr-2" />View on GitHub
                  </Button>
                </a>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={2} variants={fadeIn}>
              <div className="grid grid-cols-2 gap-4">
                {values.map((value) => (
                  <Card key={value.title} className="bg-card/60 border-border backdrop-blur-sm">
                    <CardContent className="p-5">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <value.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-display font-semibold text-sm mb-2">{value.title}</h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">{value.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={0} variants={fadeIn} className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl lg:text-4xl tracking-tight mb-4">Security <span className="text-gradient-cyan">Research Team</span></h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built by cybersecurity professionals with deep expertise in offensive and defensive security, web application security, and infrastructure protection.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Ali Al-Karrar", role: "Lead Security Engineer", desc: "Cybersecurity Engineer & Web Developer. Expert in ethical hacking, secure development, and vulnerability research.", skills: ["Penetration Testing", "Web Security", "Secure Code"] },
              { name: "Security Research Team", role: "Vulnerability Analysts", desc: "Specialized team focused on discovering, analyzing, and documenting web application vulnerabilities using advanced methodologies.", skills: ["OWASP Research", "Exploit Analysis", "Threat Modeling"] },
              { name: "Platform Engineers", role: "Development Team", desc: "Full-stack engineers building the scanning platform, report generation systems, and user interfaces with security-first principles.", skills: ["React/TypeScript", "Python", "Cloud Security"] },
            ].map((member, i) => (
              <motion.div key={member.name} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={i + 1} variants={fadeIn}>
                <Card className="bg-card/60 border-border backdrop-blur-sm text-center h-full">
                  <CardContent className="p-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-1">{member.name}</h3>
                    <p className="text-primary text-sm mb-3">{member.role}</p>
                    <p className="text-muted-foreground text-sm mb-4">{member.desc}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {member.skills.map((skill) => (
                        <span key={skill} className="px-3 py-1 rounded-full bg-background/60 border border-border text-xs text-muted-foreground">{skill}</span>
                      ))}
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
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={0} variants={fadeIn} className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl tracking-tight mb-4">Technology <span className="text-gradient-cyan">Stack</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Built with modern, secure, and scalable technologies.</p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {techStack.map((tech) => (
              <span key={tech} className="px-4 py-2 rounded-lg bg-card/60 border border-border text-sm font-mono text-foreground/80 backdrop-blur-sm">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={0} variants={fadeIn}>
            <Card className="bg-card/40 border-border backdrop-blur-sm">
              <CardContent className="p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="font-display font-bold text-2xl lg:text-3xl mb-4">Get in Touch</h2>
                    <p className="text-muted-foreground mb-6">Have questions about our security platform? Need a custom security assessment? We're here to help secure your digital infrastructure.</p>
                    <div className="space-y-3">
                      <a href="mailto:contact@al-kunooze.security" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="w-4 h-4" />contact@al-kunooze.security
                      </a>
                      <a href="https://github.com/9gkc/Al-Kunooze-Security" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Github className="w-4 h-4" />github.com/9gkc/Al-Kunooze-Security
                      </a>
                      <a href="#" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="w-4 h-4" />LinkedIn Profile
                      </a>
                    </div>
                  </div>
                  <div className="flex justify-center lg:justify-end">
                    <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 flex items-center justify-center">
                      <Shield className="w-24 h-24 text-primary/40" />
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
