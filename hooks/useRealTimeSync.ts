'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FormStatus, PatientFormData, PatientRecord, PatientSession } from '@/types/patient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UseRealTimeSyncReturn {
  sessionId: string;
  isConnected: boolean;
  status: FormStatus;
  draftData: Partial<PatientFormData>;
  activeField: string | null;
  activeFieldName: string | null;
  activeSessions: PatientSession[];
  submittedRecords: PatientRecord[];
  lastUpdated: string | null;
  updateDraft: (formData: Partial<PatientFormData>, fieldName?: string, fieldLabel?: string) => Promise<void>;
  clearActiveField: (formData: Partial<PatientFormData>) => Promise<void>;
  submitPatientForm: (data: PatientFormData) => Promise<boolean>;
  resetSyncState: () => Promise<void>;
}

interface BroadcastPayload {
  type: 'draft_update' | 'submit' | 'reset' | 'request_state' | 'sync_state' | 'session_leave';
  sessionId: string;
  status?: FormStatus;
  formData?: Partial<PatientFormData>;
  activeField?: string | null;
  activeFieldName?: string | null;
  submittedRecords?: PatientRecord[];
  record?: PatientRecord;
  updatedAt?: string;
}

const REALTIME_CHANNEL_NAME = 'patient-registration-room';
const STORAGE_SUBMITTED_KEY = 'patient_submitted_records_v2';
const STORAGE_SYNC_EVENT_KEY = 'patient_sync_event_v2';
const STORAGE_ACTIVE_SESSIONS_KEY = 'patient_active_sessions_v3';

async function safeSendSupabase(channel: RealtimeChannel | null, payload: BroadcastPayload) {
  if (!channel) return;
  const broadcastData = {
    type: 'broadcast' as const,
    event: 'patient_event',
    payload,
  };

  try {
    channel.send(broadcastData);
  } catch {
    // Ignore error
  }
}

export function useRealTimeSync(): UseRealTimeSyncReturn {
  const [sessionId, setSessionId] = useState<string>('');
  const sessionIdRef = useRef<string>('');

  // Initialize session ID on client mount to prevent SSR hydration mismatches
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let stored = sessionStorage.getItem('patient_session_id');
      if (!stored) {
        stored = `SES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        sessionStorage.setItem('patient_session_id', stored);
      }
      sessionIdRef.current = stored;
      setSessionId(stored);
    }
  }, []);

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [status, setStatus] = useState<FormStatus>('inactive');
  const [draftData, setDraftData] = useState<Partial<PatientFormData>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [activeFieldName, setActiveFieldName] = useState<string | null>(null);

  // Multi-patient sessions map for staff tracking
  const [activeSessionsMap, setActiveSessionsMap] = useState<Record<string, PatientSession>>({});
  const [submittedRecords, setSubmittedRecords] = useState<PatientRecord[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Ref to hold state for state sync requests
  const stateRef = useRef({
    status,
    draftData,
    activeField,
    activeFieldName,
    submittedRecords,
    activeSessionsMap,
  });

  useEffect(() => {
    stateRef.current = {
      status,
      draftData,
      activeField,
      activeFieldName,
      submittedRecords,
      activeSessionsMap,
    };
  }, [status, draftData, activeField, activeFieldName, submittedRecords, activeSessionsMap]);

  // Save activeSessionsMap to localStorage
  const saveActiveSessionsMap = useCallback((map: Record<string, PatientSession>) => {
    if (typeof window !== 'undefined') {
      try {
        const filtered: Record<string, PatientSession> = {};
        Object.keys(map).forEach((k) => {
          if (map[k] && map[k].status !== 'inactive') {
            filtered[k] = map[k];
          }
        });
        localStorage.setItem(STORAGE_ACTIVE_SESSIONS_KEY, JSON.stringify(filtered));
      } catch (err) {
        console.warn('Failed to save active sessions map:', err);
      }
    }
  }, []);

  // Load saved submitted records and active sessions map from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_SUBMITTED_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSubmittedRecords(parsed);
          }
        }

        const savedSessions = localStorage.getItem(STORAGE_ACTIVE_SESSIONS_KEY);
        if (savedSessions) {
          const parsedSessions = JSON.parse(savedSessions);
          if (parsedSessions && typeof parsedSessions === 'object') {
            const validSessions: Record<string, PatientSession> = {};
            Object.keys(parsedSessions).forEach((key) => {
              if (parsedSessions[key] && parsedSessions[key].status !== 'inactive') {
                validSessions[key] = parsedSessions[key];
              }
            });
            setActiveSessionsMap(validSessions);
          }
        }
      } catch (err) {
        console.warn('Failed to load initial storage state:', err);
      }
    }
  }, []);

  // Sync submittedRecords to localStorage whenever updated
  const saveSubmittedRecords = useCallback((records: PatientRecord[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_SUBMITTED_KEY, JSON.stringify(records));
      } catch (err) {
        console.warn('Failed to save submitted records:', err);
      }
    }
  }, []);

  // Update a session in the multi-patient activeSessionsMap
  const updateSessionInMap = useCallback(
    (
      sId: string,
      updates: {
        status?: FormStatus;
        formData?: Partial<PatientFormData>;
        activeField?: string | null;
        activeFieldName?: string | null;
        updatedAt?: string;
      }
    ) => {
      if (!sId) return;
      const now = updates.updatedAt || new Date().toISOString();

      setActiveSessionsMap((prev) => {
        const existing = prev[sId] || {
          sessionId: sId,
          status: 'inactive' as FormStatus,
          draftData: {},
          activeField: null,
          activeFieldName: null,
          lastUpdated: now,
        };

        const updatedSession: PatientSession = {
          ...existing,
          status: updates.status !== undefined ? updates.status : existing.status,
          draftData: updates.formData
            ? { ...existing.draftData, ...updates.formData }
            : existing.draftData,
          activeField: updates.activeField !== undefined ? updates.activeField : existing.activeField,
          activeFieldName:
            updates.activeFieldName !== undefined ? updates.activeFieldName : existing.activeFieldName,
          lastUpdated: now,
        };

        const nextMap = {
          ...prev,
          [sId]: updatedSession,
        };

        saveActiveSessionsMap(nextMap);
        return nextMap;
      });
    },
    [saveActiveSessionsMap]
  );

  // Centralized message handler for incoming payloads (from Supabase, BroadcastChannel, or LocalStorage)
  const handleIncomingPayload = useCallback(
    (payload: BroadcastPayload) => {
      if (!payload || !payload.sessionId) return;

      const now = payload.updatedAt || new Date().toISOString();
      setLastUpdated(now);

      // Always update multi-patient state map
      if (payload.type === 'session_leave' || payload.type === 'reset' || payload.status === 'inactive') {
        setActiveSessionsMap((prev) => {
          const copy = { ...prev };
          delete copy[payload.sessionId];
          saveActiveSessionsMap(copy);
          return copy;
        });
      } else {
        updateSessionInMap(payload.sessionId, {
          status: payload.status,
          formData: payload.formData,
          activeField: payload.activeField,
          activeFieldName: payload.activeFieldName,
          updatedAt: now,
        });
      }

      // If payload belongs to THIS current tab, update local patient form state
      if (payload.sessionId === sessionId) {
        switch (payload.type) {
          case 'draft_update':
            if (payload.status) setStatus(payload.status);
            if (payload.formData) setDraftData((prev) => ({ ...prev, ...payload.formData }));
            if (payload.activeField !== undefined) setActiveField(payload.activeField);
            if (payload.activeFieldName !== undefined) setActiveFieldName(payload.activeFieldName);
            break;

          case 'submit':
            setStatus('submitted');
            setActiveField(null);
            setActiveFieldName(null);
            break;

          case 'reset':
            setStatus('inactive');
            setDraftData({});
            setActiveField(null);
            setActiveFieldName(null);
            break;

          default:
            break;
        }
      }

      // Handling global events
      if (payload.type === 'submit' && payload.record) {
        setSubmittedRecords((prev) => {
          const exists = prev.some((r) => r.id === payload.record!.id);
          if (exists) return prev;
          const updated = [payload.record!, ...prev];
          saveSubmittedRecords(updated);
          return updated;
        });
      } else if (payload.type === 'request_state') {
        // Peer asked for current state - if this is a patient tab with session, always respond with sync_state
        if (sessionId && (stateRef.current.status !== 'inactive' || Object.keys(stateRef.current.draftData).length > 0)) {
          const syncPayload: BroadcastPayload = {
            type: 'sync_state',
            sessionId,
            status: stateRef.current.status,
            formData: stateRef.current.draftData,
            activeField: stateRef.current.activeField,
            activeFieldName: stateRef.current.activeFieldName,
            submittedRecords: stateRef.current.submittedRecords,
            updatedAt: new Date().toISOString(),
          };

          if (bcRef.current) {
            bcRef.current.postMessage(syncPayload);
          }
          if (channelRef.current) {
            safeSendSupabase(channelRef.current, syncPayload);
          }
        }
      } else if (payload.type === 'sync_state') {
        if (payload.submittedRecords && payload.submittedRecords.length > 0) {
          setSubmittedRecords(payload.submittedRecords);
          saveSubmittedRecords(payload.submittedRecords);
        }
        if (payload.sessionId && payload.status && payload.status !== 'inactive') {
          updateSessionInMap(payload.sessionId, {
            status: payload.status,
            formData: payload.formData,
            activeField: payload.activeField,
            activeFieldName: payload.activeFieldName,
            updatedAt: now,
          });
        }
      }
    },
    [sessionId, updateSessionInMap, saveSubmittedRecords, saveActiveSessionsMap]
  );

  // Dispatch payload across all transport layers (BroadcastChannel, LocalStorage, Supabase)
  const safeSendPayload = useCallback(
    (payload: BroadcastPayload) => {
      // 1. Browser BroadcastChannel
      if (bcRef.current) {
        try {
          bcRef.current.postMessage(payload);
        } catch (err) {
          console.warn('BroadcastChannel post error:', err);
        }
      }

      // 2. LocalStorage cross-tab event trigger
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_SYNC_EVENT_KEY, JSON.stringify({ payload, t: Date.now() }));
        } catch (err) {
          console.warn('LocalStorage sync error:', err);
        }
      }

      // 3. Supabase Realtime channel
      if (channelRef.current) {
        safeSendSupabase(channelRef.current, payload);

        // Track state via Supabase Presence
        try {
          channelRef.current.track({
            sessionId,
            status: payload.status || stateRef.current.status,
            formData: payload.formData || stateRef.current.draftData,
            activeField: payload.activeField !== undefined ? payload.activeField : stateRef.current.activeField,
            activeFieldName: payload.activeFieldName !== undefined ? payload.activeFieldName : stateRef.current.activeFieldName,
            updatedAt: payload.updatedAt || new Date().toISOString(),
          });
        } catch {
          // Ignore presence error
        }
      }

      // 4. Server Sync API for cross-device (Mobile Phone <-> Desktop PC) compatibility
      if (typeof window !== 'undefined') {
        try {
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: payload.type === 'session_leave' || payload.type === 'reset',
          }).catch(() => {});
        } catch {
          // Ignore fetch error
        }
      }
    },
    [sessionId]
  );

  useEffect(() => {
    setIsConnected(true);

    // 1. Setup BroadcastChannel for Instant Browser Cross-Tab Sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
        bcRef.current = bc;
        bc.onmessage = (event) => {
          if (event.data) {
            handleIncomingPayload(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }
    }

    // 2. Setup LocalStorage event listener as secondary cross-tab fallback
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_SYNC_EVENT_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.payload) {
            handleIncomingPayload(parsed.payload);
          }
        } catch (err) {
          console.warn('Storage event parse error:', err);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
    }

    // 3. Initialize Supabase Realtime Channel with Presence & Broadcast
    const channel = supabase.channel(REALTIME_CHANNEL_NAME, {
      config: {
        broadcast: { self: true },
        presence: { key: sessionId },
      },
    });
    channelRef.current = channel;

    // Listen to Broadcast Events
    channel.on('broadcast', { event: 'patient_event' }, ({ payload }: { payload: BroadcastPayload }) => {
      handleIncomingPayload(payload);
    });

    // Listen to Presence Sync Events
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState<{
        sessionId: string;
        status: FormStatus;
        formData: Partial<PatientFormData>;
        activeField: string | null;
        activeFieldName: string | null;
        updatedAt: string;
      }>();

      const newMap: Record<string, PatientSession> = { ...stateRef.current.activeSessionsMap };

      Object.keys(presenceState).forEach((key) => {
        const presences = presenceState[key];
        if (presences && presences.length > 0) {
          const p = presences[presences.length - 1];
          if (p && p.sessionId) {
            newMap[p.sessionId] = {
              sessionId: p.sessionId,
              status: p.status || 'filling',
              draftData: p.formData || {},
              activeField: p.activeField || null,
              activeFieldName: p.activeFieldName || null,
              lastUpdated: p.updatedAt || new Date().toISOString(),
            };
          }
        }
      });

      setActiveSessionsMap(newMap);
      saveActiveSessionsMap(newMap);
    });

    // Listen to Presence Leave Events
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (leftPresences && Array.isArray(leftPresences)) {
        setActiveSessionsMap((prev) => {
          const copy = { ...prev };
          leftPresences.forEach((lp: any) => {
            if (lp && lp.sessionId) {
              delete copy[lp.sessionId];
            }
          });
          saveActiveSessionsMap(copy);
          return copy;
        });
      }
    });

    channel.subscribe((subStatus: string) => {
      if (subStatus === 'SUBSCRIBED') {
        setIsConnected(true);
        // Track presence for current session
        channel.track({
          sessionId,
          status: stateRef.current.status,
          formData: stateRef.current.draftData,
          activeField: stateRef.current.activeField,
          activeFieldName: stateRef.current.activeFieldName,
          updatedAt: new Date().toISOString(),
        });
        safeSendSupabase(channel, { type: 'request_state', sessionId });
      }
    });

    // Request state from active peers via BroadcastChannel
    if (bc) {
      try {
        bc.postMessage({ type: 'request_state', sessionId });
      } catch (err) {
        console.warn('BroadcastChannel request_state error:', err);
      }
    }

    // 4. Server Sync Polling Loop & Patient Heartbeat (100% Cross-Device Realtime Sync)
    const fetchServerSync = async () => {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const data = await res.json();
          if (data && data.activeSessions) {
            const activeSessionsServer: Record<string, PatientSession> = {};
            Object.keys(data.activeSessions).forEach((sId) => {
              const s = data.activeSessions[sId];
              activeSessionsServer[sId] = {
                sessionId: s.sessionId,
                status: s.status,
                draftData: s.draftData || {},
                activeField: s.activeField || null,
                activeFieldName: s.activeFieldName || null,
                lastUpdated: new Date(s.lastUpdated).toISOString(),
              };
            });
            setActiveSessionsMap(activeSessionsServer);
            saveActiveSessionsMap(activeSessionsServer);
          }
          if (data && Array.isArray(data.submittedRecords) && data.submittedRecords.length > 0) {
            setSubmittedRecords(data.submittedRecords);
            saveSubmittedRecords(data.submittedRecords);
          }
        }
      } catch {
        // Ignore fetch error
      }
    };

    fetchServerSync();
    const syncInterval = setInterval(fetchServerSync, 1000);

    const heartbeatInterval = setInterval(() => {
      if (sessionId && stateRef.current.status !== 'inactive') {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'heartbeat',
            sessionId,
            status: stateRef.current.status,
            formData: stateRef.current.draftData,
            activeField: stateRef.current.activeField,
            activeFieldName: stateRef.current.activeFieldName,
          }),
        }).catch(() => {});
      }
    }, 3000);

    return () => {
      clearInterval(syncInterval);
      clearInterval(heartbeatInterval);

      safeSendPayload({
        type: 'session_leave',
        sessionId,
        status: 'inactive',
        updatedAt: new Date().toISOString(),
      });
      if (bc) {
        bc.close();
        bcRef.current = null;
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageEvent);
      }
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
        channelRef.current = null;
      }
    };
  }, [sessionId, handleIncomingPayload]);

  const updateDraft = useCallback(
    async (formData: Partial<PatientFormData>, fieldName?: string, fieldLabel?: string) => {
      const now = new Date().toISOString();
      const mergedFormData = { ...stateRef.current.draftData, ...formData };
      const currentActiveField = fieldName !== undefined ? fieldName : stateRef.current.activeField;
      const currentActiveLabel = fieldLabel !== undefined ? fieldLabel : stateRef.current.activeFieldName;

      // Synchronously update stateRef for instant concurrent reads
      stateRef.current = {
        ...stateRef.current,
        status: 'filling',
        draftData: mergedFormData,
        activeField: currentActiveField,
        activeFieldName: currentActiveLabel,
      };

      setStatus('filling');
      setDraftData(mergedFormData);
      if (fieldName !== undefined) setActiveField(fieldName);
      if (fieldLabel !== undefined) setActiveFieldName(fieldLabel);
      setLastUpdated(now);

      // Update local session in activeSessionsMap
      updateSessionInMap(sessionId, {
        status: 'filling',
        formData: mergedFormData,
        activeField: currentActiveField,
        activeFieldName: currentActiveLabel,
        updatedAt: now,
      });

      safeSendPayload({
        type: 'draft_update',
        sessionId,
        status: 'filling',
        formData: mergedFormData,
        activeField: currentActiveField,
        activeFieldName: currentActiveLabel,
        updatedAt: now,
      });

      if (channelRef.current) {
        try {
          channelRef.current.track({
            sessionId,
            status: 'filling',
            formData: mergedFormData,
            activeField: currentActiveField,
            activeFieldName: currentActiveLabel,
            updatedAt: now,
          });
        } catch {
          // Ignore presence track error
        }
      }
    },
    [sessionId, safeSendPayload, updateSessionInMap]
  );

  const clearActiveField = useCallback(
    async (formData: Partial<PatientFormData>) => {
      const now = new Date().toISOString();

      const mergedFormData = { ...stateRef.current.draftData, ...formData };

      // Check if form contains any non-empty fields
      const hasAnyContent = Object.values(mergedFormData).some(
        (val) => val !== undefined && val !== null && String(val).trim() !== ''
      );

      const newStatus: FormStatus = hasAnyContent ? 'filling' : 'inactive';

      stateRef.current = {
        ...stateRef.current,
        status: newStatus,
        draftData: mergedFormData,
        activeField: null,
        activeFieldName: null,
      };

      setStatus(newStatus);
      setDraftData(mergedFormData);
      setActiveField(null);
      setActiveFieldName(null);
      setLastUpdated(now);

      updateSessionInMap(sessionId, {
        status: newStatus,
        formData: mergedFormData,
        activeField: null,
        activeFieldName: null,
        updatedAt: now,
      });

      safeSendPayload({
        type: 'draft_update',
        sessionId,
        status: newStatus,
        formData: mergedFormData,
        activeField: null,
        activeFieldName: null,
        updatedAt: now,
      });

      if (channelRef.current) {
        try {
          channelRef.current.track({
            sessionId,
            status: newStatus,
            formData: mergedFormData,
            activeField: null,
            activeFieldName: null,
            updatedAt: now,
          });
        } catch {
          // Ignore presence track error
        }
      }
    },
    [sessionId, safeSendPayload, updateSessionInMap]
  );

  const submitPatientForm = useCallback(
    async (data: PatientFormData): Promise<boolean> => {
      const now = new Date().toISOString();
      const newRecord: PatientRecord = {
        id: `PAT-${Date.now().toString().slice(-6)}`,
        data,
        submittedAt: now,
      };

      setStatus('submitted');
      setActiveField(null);
      setActiveFieldName(null);
      setLastUpdated(now);

      updateSessionInMap(sessionId, {
        status: 'submitted',
        formData: data,
        activeField: null,
        activeFieldName: null,
        updatedAt: now,
      });

      setSubmittedRecords((prev) => {
        const updated = [newRecord, ...prev];
        saveSubmittedRecords(updated);
        return updated;
      });

      safeSendPayload({
        type: 'submit',
        sessionId,
        status: 'submitted',
        record: newRecord,
        formData: data,
        updatedAt: now,
      });

      // Automatically reset state after 5 seconds
      setTimeout(() => {
        setStatus('inactive');
        setDraftData({});
        setActiveField(null);
        setActiveFieldName(null);

        updateSessionInMap(sessionId, {
          status: 'inactive',
          formData: {},
          activeField: null,
          activeFieldName: null,
          updatedAt: new Date().toISOString(),
        });

        safeSendPayload({
          type: 'reset',
          sessionId,
          status: 'inactive',
          updatedAt: new Date().toISOString(),
        });
      }, 5000);

      return true;
    },
    [sessionId, safeSendPayload, saveSubmittedRecords, updateSessionInMap]
  );

  const resetSyncState = useCallback(async () => {
    const now = new Date().toISOString();
    setStatus('inactive');
    setDraftData({});
    setActiveField(null);
    setActiveFieldName(null);
    setLastUpdated(now);

    setActiveSessionsMap((prev) => {
      const copy = { ...prev };
      delete copy[sessionId];
      return copy;
    });

    if (channelRef.current) {
      try {
        channelRef.current.untrack();
      } catch {
        // Ignore untrack error
      }
    }

    safeSendPayload({
      type: 'session_leave',
      sessionId,
      status: 'inactive',
      updatedAt: now,
    });
  }, [sessionId, safeSendPayload]);

  const activeSessions = Object.values(activeSessionsMap)
    .filter((s) => s.status !== 'inactive')
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return {
    sessionId,
    isConnected,
    status,
    draftData,
    activeField,
    activeFieldName,
    activeSessions,
    submittedRecords,
    lastUpdated,
    updateDraft,
    clearActiveField,
    submitPatientForm,
    resetSyncState,
  };
}
