import { Fault, Incident } from '../types';

const API_BASE = '/api';

export async function fetchFaults(): Promise<Fault[]> {
  const res = await fetch(`${API_BASE}/faults`);
  if (!res.ok) throw new Error(`Failed to fetch faults: ${res.statusText}`);
  return res.json();
}

export async function createIncident(faultName: string, variant?: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fault_name: faultName, variant }),
  });
  if (!res.ok) throw new Error(`Failed to create incident: ${res.statusText}`);
  return res.json();
}

export async function getIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.statusText}`);
  return res.json();
}

export async function getIncident(id: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch incident ${id}: ${res.statusText}`);
  return res.json();
}

export async function analyzeIncident(id: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}/analyze`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to analyze incident: ${res.statusText}`);
  return res.json();
}

export async function resolveIncident(id: string): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to resolve incident: ${res.statusText}`);
  return res.json();
}

export function getExportMarkdownUrl(id: string): string {
  return `${API_BASE}/incidents/${id}/export.md`;
}

