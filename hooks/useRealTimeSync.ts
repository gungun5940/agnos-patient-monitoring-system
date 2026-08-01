'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FormStatus, PatientFormData, PatientRecord } from '@/types/patient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UseRealTimeSyncReturn {
  isConnected: boolean;
  status: FormStatus;
  draftData: Partial<PatientFormData>;
  activeField: string | null;
  activeFieldName: string | null;
  submittedRecords: PatientRecord[];
  lastUpdated: string | null;
  updateDraft: (formData: Partial<PatientFormData>, fieldName?: string, fieldLabel?: string) => Promise<void>;
  clearActiveField: (formData: Partial<PatientFormData>) => Promise<void>;
  submitPatientForm: (data: PatientFormData) => Promise<boolean>;
  resetSyncState: () => Promise<void>;
}

interface BroadcastPayload {
  type: 'draft_update' | 'submit' | 'reset' | 'request_state' | 'sync_state';
  status?: FormStatus;
  formData?: Partial<PatientFormData>;
  activeField?: string | null;
  activeFieldName?: string | null;
  submittedRecords?: PatientRecord[];
  record?: PatientRecord;
  updatedAt?: string;
}

const REALTIME_CHANNEL_NAME = 'patient-registration-room';
const STORAGE_SUBMITTED_KEY = 'patient_submitted_records_v1';
const STORAGE_SYNC_EVENT_KEY = 'patient_sync_event_v1';

async function safeSendSupabase(channel: RealtimeChannel | null, payload: BroadcastPayload) {
  if (!channel || (channel as any).state !== 'joined') return;
  const broadcastData = {
    type: 'broadcast' as const,
    event: 'patient_event',
    payload,
  };

  try {
    const res = channel.send(broadcastData);
    if (res && typeof res.catch === 'function') {
      await res.catch(() => {
        // Silently ignore fallback issues on demo key
      });
    }
  } catch {
    // Silently ignore
  }
}

export function useRealTimeSync(): UseRealTimeSyncReturn {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [status, setStatus] = useState<FormStatus>('inactive');
  const [draftData, setDraftData] = useState<Partial<PatientFormData>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [activeFieldName, setActiveFieldName] = useState<string | null>(null);
  const [submittedRecords, setSubmittedRecords] = useState<PatientRecord[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Refs to hold current values for peer sync response without stale closures
  const stateRef = useRef({
    status,
    draftData,
    activeField,
    activeFieldName,
    submittedRecords,
  });

  useEffect(() => {
    stateRef.current = {
      status,
      draftData,
      activeField,
      activeFieldName,
      submittedRecords,
    };
  }, [status, draftData, activeField, activeFieldName, submittedRecords]);

  // Load saved submitted records from localStorage on initial render
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
      } catch (err) {
        console.warn('Failed to load submitted records:', err);
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

  // Centralized message handler for incoming payloads (from Supabase, BroadcastChannel, or Storage)
  const handleIncomingPayload = useCallback((payload: BroadcastPayload) => {
    if (!payload) return;

    const now = payload.updatedAt || new Date().toISOString();
    setLastUpdated(now);

    switch (payload.type) {
      case 'draft_update':
        if (payload.status) {
          setStatus(payload.status);
        } else {
          setStatus('filling');
        }
        if (payload.formData) {
          setDraftData((prev) => ({ ...prev, ...payload.formData }));
        }
        if (payload.activeField !== undefined) {
          setActiveField(payload.activeField);
        }
        if (payload.activeFieldName !== undefined) {
          setActiveFieldName(payload.activeFieldName);
        }
        break;

      case 'submit':
        setStatus('submitted');
        setActiveField(null);
        setActiveFieldName(null);
        if (payload.record) {
          setSubmittedRecords((prev) => {
            const exists = prev.some((r) => r.id === payload.record!.id);
            if (exists) return prev;
            const updated = [payload.record!, ...prev];
            saveSubmittedRecords(updated);
            return updated;
          });
        }
        break;

      case 'reset':
        setStatus('inactive');
        setDraftData({});
        setActiveField(null);
        setActiveFieldName(null);
        break;

      case 'request_state':
        // Peer asked for current state, send current state back if we have data
        if (stateRef.current.submittedRecords.length > 0 || stateRef.current.status !== 'inactive') {
          const syncPayload: BroadcastPayload = {
            type: 'sync_state',
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
        break;

      case 'sync_state':
        if (payload.status) setStatus(payload.status);
        if (payload.formData) setDraftData(payload.formData);
        if (payload.activeField !== undefined) setActiveField(payload.activeField);
        if (payload.activeFieldName !== undefined) setActiveFieldName(payload.activeFieldName);
        if (payload.submittedRecords && payload.submittedRecords.length > 0) {
          setSubmittedRecords(payload.submittedRecords);
          saveSubmittedRecords(payload.submittedRecords);
        }
        break;

      default:
        break;
    }
  }, [saveSubmittedRecords]);

  // Dispatch payload across all transport layers (BroadcastChannel, LocalStorage, Supabase)
  const safeSendPayload = useCallback((payload: BroadcastPayload) => {
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
    }
  }, []);

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

    // 3. Initialize Supabase Realtime Channel
    const channel = supabase.channel(REALTIME_CHANNEL_NAME, {
      config: {
        broadcast: { self: true },
        presence: { key: `user-${Math.random().toString(36).substring(2, 9)}` },
      },
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'patient_event' }, ({ payload }: { payload: BroadcastPayload }) => {
        handleIncomingPayload(payload);
      })
      .subscribe((subStatus: string) => {
        if (subStatus === 'SUBSCRIBED') {
          setIsConnected(true);
          safeSendSupabase(channel, { type: 'request_state' });
        }
      });

    // Request state from active peers
    if (bc) {
      try {
        bc.postMessage({ type: 'request_state' });
      } catch (err) {
        console.warn('BroadcastChannel request_state error:', err);
      }
    }

    return () => {
      if (bc) {
        bc.close();
        bcRef.current = null;
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageEvent);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [handleIncomingPayload]);

  const updateDraft = useCallback(
    async (formData: Partial<PatientFormData>, fieldName?: string, fieldLabel?: string) => {
      const now = new Date().toISOString();
      setStatus('filling');
      setDraftData((prev) => ({ ...prev, ...formData }));
      if (fieldName !== undefined) setActiveField(fieldName);
      if (fieldLabel !== undefined) setActiveFieldName(fieldLabel);
      setLastUpdated(now);

      safeSendPayload({
        type: 'draft_update',
        status: 'filling',
        formData,
        activeField: fieldName,
        activeFieldName: fieldLabel,
        updatedAt: now,
      });
    },
    [safeSendPayload]
  );

  const clearActiveField = useCallback(
    async (formData: Partial<PatientFormData>) => {
      const now = new Date().toISOString();

      // Check if form contains any non-empty fields
      const hasAnyContent = Object.values(formData).some(
        (val) => val !== undefined && val !== null && String(val).trim() !== ''
      );

      const newStatus: FormStatus = hasAnyContent ? 'filling' : 'inactive';

      setStatus(newStatus);
      setDraftData((prev) => ({ ...prev, ...formData }));
      setActiveField(null);
      setActiveFieldName(null);
      setLastUpdated(now);

      safeSendPayload({
        type: 'draft_update',
        status: newStatus,
        formData,
        activeField: null,
        activeFieldName: null,
        updatedAt: now,
      });
    },
    [safeSendPayload]
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

      setSubmittedRecords((prev) => {
        const updated = [newRecord, ...prev];
        saveSubmittedRecords(updated);
        return updated;
      });

      safeSendPayload({
        type: 'submit',
        status: 'submitted',
        record: newRecord,
        formData: data,
        updatedAt: now,
      });

      // Automatically reset state after 4 seconds
      setTimeout(() => {
        setStatus('inactive');
        setDraftData({});
        setActiveField(null);
        setActiveFieldName(null);

        safeSendPayload({
          type: 'reset',
          status: 'inactive',
          updatedAt: new Date().toISOString(),
        });
      }, 4000);

      return true;
    },
    [safeSendPayload, saveSubmittedRecords]
  );

  const resetSyncState = useCallback(async () => {
    const now = new Date().toISOString();
    setStatus('inactive');
    setDraftData({});
    setActiveField(null);
    setActiveFieldName(null);
    setLastUpdated(now);

    safeSendPayload({
      type: 'reset',
      status: 'inactive',
      updatedAt: now,
    });
  }, [safeSendPayload]);

  return {
    isConnected,
    status,
    draftData,
    activeField,
    activeFieldName,
    submittedRecords,
    lastUpdated,
    updateDraft,
    clearActiveField,
    submitPatientForm,
    resetSyncState,
  };
}

