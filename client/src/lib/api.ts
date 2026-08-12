import type { ScanProfile, ScanResult } from "@shared/types";

export interface ScanSummary extends Omit<ScanResult, "findings"> {
  findingCount: number;
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "The request could not be completed.");
  }
  return payload as T;
}

export function createScan(target: string, profile: ScanProfile, authorizationConfirmed: boolean) {
  return request<ScanResult>("/api/scans", {
    method: "POST",
    body: JSON.stringify({ target, profile, authorizationConfirmed }),
  });
}

export function listScans() {
  return request<ScanSummary[]>("/api/scans");
}

export function getScan(id: string) {
  return request<ScanResult>(`/api/scans/${encodeURIComponent(id)}`);
}

export function downloadScanUrl(id: string) {
  return `/api/scans/${encodeURIComponent(id)}/download`;
}

export function healthCheck() {
  return request<{ status: string; service: string; timestamp: string }>("/api/health");
}
