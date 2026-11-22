import type { ScanProfile, ScanResult } from "@shared/types";

export interface ScanSummary extends Omit<ScanResult, "findings"> {
  findingCount: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  version?: string;
  timestamp: string;
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // ignore parse errors
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload.error === "string" && payload.error) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
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
  return request<HealthResponse>("/api/health");
}
