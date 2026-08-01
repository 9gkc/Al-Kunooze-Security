import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/scanner", label: "Scanner" },
  { href: "/services", label: "Services" },
  { href: "/reports", label: "Reports" },
  { href: "/about", label: "About" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background grid-overlay">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-300">
              <Shield className="w-5 h-5 text-background" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Al-Kunooze<span className="text-primary">.</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/scanner">
              <Button
                size="sm"
                className="bg-primary text-background hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200"
              >
                Start Scan
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20 px-6 lg:hidden"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      location === link.href
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              <Link href="/scanner" onClick={() => setMobileOpen(false)}>
                <Button className="w-full mt-4 bg-primary text-background hover:bg-primary/90 font-semibold">
                  Start Scan
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-16 lg:pt-20">
        {children}
      </main>

      <footer className="border-t border-border mt-24">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-background" />
                </div>
                <span className="font-display font-bold text-lg">
                  Al-Kunooze<span className="text-primary">.</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Advanced cybersecurity platform providing deep defensive scanning, 
                vulnerability assessment, and comprehensive security intelligence 
                for authorized web applications.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm mb-4">Platform</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/scanner"><span className="text-muted-foreground text-sm hover:text-primary transition-colors">Security Scanner</span></Link>
                <Link href="/services"><span className="text-muted-foreground text-sm hover:text-primary transition-colors">Services</span></Link>
                <Link href="/reports"><span className="text-muted-foreground text-sm hover:text-primary transition-colors">Reports</span></Link>
              </nav>
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm mb-4">Company</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/about"><span className="text-muted-foreground text-sm hover:text-primary transition-colors">About Us</span></Link>
                <Link href="/about"><span className="text-muted-foreground text-sm hover:text-primary transition-colors">Contact</span></Link>
                <a href="https://github.com/9gkc/Al-Kunooze-Security" target="_blank" rel="noreferrer" className="text-muted-foreground text-sm hover:text-primary transition-colors">GitHub</a>
              </nav>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-xs">
              2024 Al-Kunooze Security. All rights reserved. For defensive, academic, and research use only.
            </p>
            <p className="text-muted-foreground text-xs font-mono">
              Built with precision. Secured by design.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
