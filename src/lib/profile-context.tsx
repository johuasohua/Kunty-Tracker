"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { PaymentMethod, Person } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase/client";

const ACTIVE_PERSON_KEY = "kunty.activePersonId";
const LAST_METHOD_KEY_PREFIX = "kunty.lastMethod.";

const storageListeners = new Set<() => void>();

function notifyStorageListeners() {
  for (const listener of storageListeners) listener();
}

function subscribeToStorage(listener: () => void) {
  storageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    storageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeLocalStorage(key: string, value: string) {
  window.localStorage.setItem(key, value);
  notifyStorageListeners();
}

function useLocalStorageValue(key: string | null): string | null {
  const getSnapshot = useCallback(
    () => (key ? window.localStorage.getItem(key) : null),
    [key]
  );
  const getServerSnapshot = useCallback(() => null, []);
  return useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);
}

interface ProfileContextValue {
  people: Person[];
  activePerson: Person | null;
  setActivePersonId: (id: string) => void;
  lastUsedMethod: PaymentMethod;
  setLastUsedMethod: (method: PaymentMethod) => void;
  loading: boolean;
  refreshPeople: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPeople = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) {
      setPeople(data as Person[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshPeople();
  }, [refreshPeople]);

  const storedActivePersonId = useLocalStorageValue(ACTIVE_PERSON_KEY);

  const activePerson = useMemo(() => {
    if (people.length === 0) return null;
    return (
      people.find((p) => p.id === storedActivePersonId) ?? people[0] ?? null
    );
  }, [people, storedActivePersonId]);

  const setActivePersonId = useCallback((id: string) => {
    writeLocalStorage(ACTIVE_PERSON_KEY, id);
  }, []);

  const lastMethodKey = activePerson
    ? `${LAST_METHOD_KEY_PREFIX}${activePerson.id}`
    : null;
  const storedLastMethod = useLocalStorageValue(lastMethodKey);
  const lastUsedMethod: PaymentMethod =
    storedLastMethod === "debit" ? "debit" : "credit";

  const setLastUsedMethod = useCallback(
    (method: PaymentMethod) => {
      if (lastMethodKey) writeLocalStorage(lastMethodKey, method);
    },
    [lastMethodKey]
  );

  const value: ProfileContextValue = {
    people,
    activePerson,
    setActivePersonId,
    lastUsedMethod,
    setLastUsedMethod,
    loading,
    refreshPeople,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
