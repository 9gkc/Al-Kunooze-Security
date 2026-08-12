export type ScanProfile = "quick" | "deep" | "authorized_deep";
export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface ScanFinding {
  severity: Severity;
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface ScanResult {
  id: string;
  target: string;
  normalizedTarget: string;
  scannedAt: string;
  profile: ScanProfile;
  score: number;
  posture: string;
  https: boolean;
  tls: string;
  responseTime: number;
  ports: { port: number; label: string; state: string }[];
  findings: ScanFinding[];
  strengths: { title: string; description: string }[];
  nextSteps: string[];
  executiveSummary: string;
  dns: { addresses: string[]; reverse: string };
}

export interface ApiError {
  error: string;
  message?: string;
}
