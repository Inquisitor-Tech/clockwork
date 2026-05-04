import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';


const API_URL = 'http://192.168.50.158:5000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  defaultRate: number;
  createdAt: string;
}

export interface Client {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  hourlyRate: number;
  notes: string;
  totalOwed: number;
  createdAt: string;
}

export interface Consultation {
  id: string;
  userId: string;
  clientId: string;
  clientName: string;
  startDatetime: string;
  endDatetime: string;
  durationMinutes: number;
  totalCharge: number;
  notes: string;
  createdAt: string;
}

interface AppContextType {
  currentUser: User | null;
  signUp: (email: string, password: string, defaultRate: number) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
  updateDefaultRate: (rate: number) => Promise<void>;
  clients: Client[];
  addClient: (data: Omit<Client, 'id' | 'userId' | 'totalOwed' | 'createdAt'>) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  consultations: Consultation[];
  addConsultation: (data: Omit<Consultation, 'id' | 'userId' | 'createdAt'>) => Promise<Consultation>;
  updateConsultation: (id: string, data: Partial<Consultation>) => Promise<void>;
  deleteConsultation: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── API helper ───────────────────────────────────────────────────────────────

async function api(
  method: string,
  path: string,
  body?: object,
  token?: string
): Promise<{ data?: any; error?: string; status: number }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return { status: 204 };

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? 'Something went wrong.', status: res.status };
    }

    return { data, status: res.status };
  } catch (e) {
    return { error: 'Could not reach the server. Check your connection.', status: 0 };
  }
}

// ─── Map API response (camelCase) to our types ────────────────────────────────

function mapClient(c: any): Client {
  return {
    id: String(c.id),
    userId: String(c.userId),
    fullName: c.fullName,
    email: c.email ?? '',
    phone: c.phone ?? '',
    hourlyRate: c.hourlyRate,
    notes: c.notes ?? '',
    totalOwed: c.totalOwed,
    createdAt: c.createdAt,
  };
}

function mapConsultation(c: any): Consultation {
  return {
    id: String(c.id),
    userId: String(c.userId),
    clientId: String(c.clientId),
    clientName: c.clientName,
    startDatetime: c.startDatetime,
    endDatetime: c.endDatetime,
    durationMinutes: c.durationMinutes,
    totalCharge: c.totalCharge,
    notes: c.notes ?? '',
    createdAt: c.createdAt,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  // Load saved token on mount
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem('cw_token');
        const savedUser = await AsyncStorage.getItem('cw_user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setCurrentUser(JSON.parse(savedUser));
        }
      } catch {}
    })();
  }, []);

  // Fetch clients + consultations whenever user logs in
  useEffect(() => {
    if (currentUser && token) {
      refreshData();
    } else {
      setClients([]);
      setConsultations([]);
    }
  }, [currentUser?.id]);

  async function refreshData() {
    if (!token) return;
    const [clientsRes, consultationsRes] = await Promise.all([
      api('GET', '/api/clients', undefined, token),
      api('GET', '/api/consultations', undefined, token),
    ]);
    if (clientsRes.data) setClients(clientsRes.data.map(mapClient));
    if (consultationsRes.data) setConsultations(consultationsRes.data.map(mapConsultation));
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function signUp(email: string, password: string, defaultRate: number) {
    const { data, error } = await api('POST', '/api/auth/signup', { email, password, defaultRate });
    if (error) return { error };
    await _saveSession(data.token, data.user);
    return {};
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await api('POST', '/api/auth/signin', { email, password });
    if (error) return { error };
    await _saveSession(data.token, data.user);
    return {};
  }

  async function _saveSession(jwt: string, user: any) {
    const u: User = {
      id: String(user.id),
      email: user.email,
      defaultRate: user.defaultRate,
      createdAt: user.createdAt,
    };
    setToken(jwt);
    setCurrentUser(u);
    await AsyncStorage.setItem('cw_token', jwt);
    await AsyncStorage.setItem('cw_user', JSON.stringify(u));
  }

  async function signOut() {
    setCurrentUser(null);
    setToken(null);
    setClients([]);
    setConsultations([]);
    await AsyncStorage.multiRemove(['cw_token', 'cw_user']);
  }

  async function updateDefaultRate(rate: number) {
    // Update locally for now — add a PATCH /api/auth/me endpoint later if needed
    if (!currentUser) return;
    const updated = { ...currentUser, defaultRate: rate };
    setCurrentUser(updated);
    await AsyncStorage.setItem('cw_user', JSON.stringify(updated));
  }

  // ── Clients ───────────────────────────────────────────────────────────────

  async function addClient(data: Omit<Client, 'id' | 'userId' | 'totalOwed' | 'createdAt'>) {
    const { data: res, error } = await api('POST', '/api/clients', {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      hourlyRate: data.hourlyRate,
      notes: data.notes,
    }, token!);
    if (error) throw new Error(error);
    const client = mapClient(res);
    setClients(prev => [...prev, client]);
    return client;
  }

  async function updateClient(id: string, data: Partial<Client>) {
    const { data: res, error } = await api('PUT', `/api/clients/${id}`, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      hourlyRate: data.hourlyRate,
      notes: data.notes,
    }, token!);
    if (error) throw new Error(error);
    const updated = mapClient(res);
    setClients(prev => prev.map(c => c.id === id ? updated : c));
  }

  async function deleteClient(id: string) {
    const { error } = await api('DELETE', `/api/clients/${id}`, undefined, token!);
    if (error) throw new Error(error);
    setClients(prev => prev.filter(c => c.id !== id));
  }

  // ── Consultations ─────────────────────────────────────────────────────────

  const sortedConsultations = [...consultations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  async function addConsultation(data: Omit<Consultation, 'id' | 'userId' | 'createdAt'>) {
    const { data: res, error } = await api('POST', '/api/consultations', {
      clientId: parseInt(data.clientId),
      clientName: data.clientName,
      startDatetime: data.startDatetime,
      endDatetime: data.endDatetime,
      durationMinutes: data.durationMinutes,
      totalCharge: data.totalCharge,
      notes: data.notes,
    }, token!);
    if (error) throw new Error(error);
    const consultation = mapConsultation(res);
    setConsultations(prev => [...prev, consultation]);
    // Refresh clients to get updated totalOwed
    const clientsRes = await api('GET', '/api/clients', undefined, token!);
    if (clientsRes.data) setClients(clientsRes.data.map(mapClient));
    return consultation;
  }

  async function updateConsultation(id: string, data: Partial<Consultation>) {
    const { data: res, error } = await api('PUT', `/api/consultations/${id}`, {
      totalCharge: data.totalCharge,
      notes: data.notes,
    }, token!);
    if (error) throw new Error(error);
    const updated = mapConsultation(res);
    setConsultations(prev => prev.map(c => c.id === id ? updated : c));
    // Refresh clients to get updated totalOwed
    const clientsRes = await api('GET', '/api/clients', undefined, token!);
    if (clientsRes.data) setClients(clientsRes.data.map(mapClient));
  }

  async function deleteConsultation(id: string) {
    const { error } = await api('DELETE', `/api/consultations/${id}`, undefined, token!);
    if (error) throw new Error(error);
    setConsultations(prev => prev.filter(c => c.id !== id));
    // Refresh clients to get updated totalOwed
    const clientsRes = await api('GET', '/api/clients', undefined, token!);
    if (clientsRes.data) setClients(clientsRes.data.map(mapClient));
  }

  return (
    <AppContext.Provider value={{
      currentUser,
      signUp, signIn, signOut, updateDefaultRate,
      clients,
      addClient, updateClient, deleteClient,
      consultations: sortedConsultations,
      addConsultation, updateConsultation, deleteConsultation,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
