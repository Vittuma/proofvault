import { AgentRunManifest } from './types';

const STORAGE_KEY = 'proofvault_agent_runs';

export function getLocalRuns(): AgentRunManifest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AgentRunManifest[];
  } catch (e) {
    console.error('Failed to parse agent runs from local storage', e);
    return [];
  }
}

export function saveLocalRun(run: AgentRunManifest): void {
  if (typeof window === 'undefined') return;
  const runs = getLocalRuns();
  // Ensure no duplicates by runId
  const existingIdx = runs.findIndex(r => r.runId === run.runId);
  if (existingIdx !== -1) {
    runs[existingIdx] = run;
  } else {
    runs.unshift(run); // Add new runs to the top
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

export function updateLocalRun(runId: string, updates: Partial<AgentRunManifest>): void {
  if (typeof window === 'undefined') return;
  const runs = getLocalRuns();
  const existingIdx = runs.findIndex(r => r.runId === runId);
  if (existingIdx !== -1) {
    runs[existingIdx] = { ...runs[existingIdx], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  }
}
