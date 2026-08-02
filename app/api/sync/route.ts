import { NextRequest, NextResponse } from 'next/server';
import { PatientFormData, PatientRecord, FormStatus } from '@/types/patient';

interface ServerSession {
  sessionId: string;
  status: FormStatus;
  draftData: Partial<PatientFormData>;
  activeField: string | null;
  activeFieldName: string | null;
  lastUpdated: number;
}

interface ServerSyncStore {
  activeSessions: Record<string, ServerSession>;
  submittedRecords: PatientRecord[];
}

// Global server memory store persistent across API calls in the Node container
const store: ServerSyncStore = (globalThis as any).__AGNOS_SYNC_STORE__ || {
  activeSessions: {},
  submittedRecords: [],
};
(globalThis as any).__AGNOS_SYNC_STORE__ = store;

// Helper to clean up sessions that haven't sent heartbeats/updates in over 15 seconds
function cleanupStaleSessions() {
  const now = Date.now();
  const timeoutMs = 15000; // 15 seconds
  Object.keys(store.activeSessions).forEach((sId) => {
    const session = store.activeSessions[sId];
    if (session && now - session.lastUpdated > timeoutMs) {
      delete store.activeSessions[sId];
    }
  });
}

export async function GET() {
  cleanupStaleSessions();

  // Convert to array format compatible with PatientSession
  const activeSessionsArray = Object.values(store.activeSessions).map((s) => ({
    sessionId: s.sessionId,
    status: s.status,
    draftData: s.draftData,
    activeField: s.activeField,
    activeFieldName: s.activeFieldName,
    lastUpdated: new Date(s.lastUpdated).toISOString(),
  }));

  return NextResponse.json({
    activeSessions: store.activeSessions,
    activeSessionsArray,
    submittedRecords: store.submittedRecords,
    timestamp: Date.now(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, sessionId, status, formData, activeField, activeFieldName, record } = body;
    const now = Date.now();

    cleanupStaleSessions();

    if (sessionId) {
      if (type === 'draft_update') {
        store.activeSessions[sessionId] = {
          sessionId,
          status: status || 'filling',
          draftData: formData || {},
          activeField: activeField !== undefined ? activeField : null,
          activeFieldName: activeFieldName !== undefined ? activeFieldName : null,
          lastUpdated: now,
        };
      } else if (type === 'session_leave' || type === 'reset') {
        delete store.activeSessions[sessionId];
      } else if (type === 'submit') {
        delete store.activeSessions[sessionId];
        if (record) {
          // Avoid duplicate submissions
          const exists = store.submittedRecords.some((r) => r.id === record.id);
          if (!exists) {
            store.submittedRecords.unshift(record);
          }
        }
      } else if (type === 'heartbeat') {
        if (store.activeSessions[sessionId]) {
          store.activeSessions[sessionId].lastUpdated = now;
          if (formData) {
            store.activeSessions[sessionId].draftData = {
              ...store.activeSessions[sessionId].draftData,
              ...formData,
            };
          }
        } else if (status && status !== 'inactive') {
          store.activeSessions[sessionId] = {
            sessionId,
            status,
            draftData: formData || {},
            activeField: activeField || null,
            activeFieldName: activeFieldName || null,
            lastUpdated: now,
          };
        }
      }
    }

    const activeSessionsArray = Object.values(store.activeSessions).map((s) => ({
      sessionId: s.sessionId,
      status: s.status,
      draftData: s.draftData,
      activeField: s.activeField,
      activeFieldName: s.activeFieldName,
      lastUpdated: new Date(s.lastUpdated).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      activeSessions: store.activeSessions,
      activeSessionsArray,
      submittedRecords: store.submittedRecords,
      timestamp: now,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid sync payload' }, { status: 400 });
  }
}
