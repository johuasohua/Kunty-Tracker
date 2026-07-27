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
import { useAuth } from "@/lib/auth-context";

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

  const { session } = useAuth();
  const authUserId = session?.user.id ?? null;
  const storedActivePersonId = useLocalStorageValue(ACTIVE_PERSON_KEY);

  // The person whose auth_user_id matches the session is the sensible
  // *default* — but auto-detection has proven unreliable on some devices
  // (stale sessions, iOS PWA storage quirks), so it no longer hard-locks the
  // profile. Both people can always switch manually; a stored manual choice
  // takes priority over the auto-matched default once one exists.
  const matchedPerson = useMemo(() => {
    if (!authUserId) return null;
    return people.find((p) => p.auth_user_id === authUserId) ?? null;
  }, [people, authUserId]);

  const activePerson = useMemo(() => {
    if (people.length === 0) return null;
    const stored = people.find((p) => p.id === storedActivePersonId);
    return stored ?? matchedPerson ?? people[0] ?? null;
  }, [matchedPerson, people, storedActivePersonId]);

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
