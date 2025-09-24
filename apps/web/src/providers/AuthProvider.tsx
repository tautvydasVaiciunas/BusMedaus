import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError, setAccessTokenProvider, API_REFRESH_BUFFER } from "../lib/apiClient";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type PersistedAuth = {
  user: AuthUser;
  session: Session;
};

export type TokenResponse = {
  user?: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  expiresAt?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

type AuthState =
  | { status: "loading"; user: null; session: null; error: null }
  | { status: "authenticated"; user: AuthUser; session: Session; error: null }
  | { status: "unauthenticated"; user: null; session: null; error: string | null };

type AuthContextValue = {
  status: AuthState["status"];
  user: AuthUser | null;
  error: string | null;
  isAuthenticated: boolean;
  isProcessing: boolean;
  accessToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const STORAGE_KEY = "busmedaus.auth";

const initialState: AuthState = {
  status: "loading",
  user: null,
  session: null,
  error: null
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const warnStorageError = (message: string, error: unknown) => {
  if (import.meta.env?.DEV) {
    console.warn(message, error);
  }
};

const persistSession = (payload: PersistedAuth) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    warnStorageError("Failed to persist auth session; continuing with in-memory state.", error);
  }
};

const removePersistedSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    warnStorageError("Failed to remove persisted auth session; clearing in-memory state only.", error);
  }
};

const loadPersistedSession = (): PersistedAuth | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as PersistedAuth;
  } catch (error) {
    warnStorageError("Failed to load persisted auth session; falling back to in-memory state.", error);
    return null;
  }
};

const computeExpiration = (payload: TokenResponse, fallback?: Session) => {
  if (payload.expiresAt) {
    const timestamp = new Date(payload.expiresAt).getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  if (typeof payload.expiresIn === "number") {
    const duration = Math.max(payload.expiresIn, 0);
    return Date.now() + duration;
  }

  return fallback?.expiresAt ?? Date.now() + 15 * 60 * 1000;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(initialState);
  const [isProcessing, setIsProcessing] = useState(false);
  const refreshTimeoutRef = useRef<number | null>(null);
  const stateRef = useRef<AuthState>(initialState);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const setUnauthenticated = useCallback(
    (error: string | null = null, { clearQueries }: { clearQueries?: boolean } = {}) => {
      clearRefreshTimer();
      removePersistedSession();
      setIsProcessing(false);
      setState({ status: "unauthenticated", user: null, session: null, error });
      if (clearQueries) {
        queryClient.clear();
      }
    },
    [clearRefreshTimer, queryClient]
  );

  const scheduleRefresh = useCallback(
    (expiresAt: number) => {
      clearRefreshTimer();

      if (typeof window === "undefined") {
        return;
      }

      const now = Date.now();
      const delay = Math.max(expiresAt - now - API_REFRESH_BUFFER, 0);

      refreshTimeoutRef.current = window.setTimeout(() => {
        if (!refreshRef.current) {
          return;
        }

        refreshRef.current().catch(() => {
          setUnauthenticated("Sesija baigėsi. Prisijunkite iš naujo.", { clearQueries: true });
        });
      }, delay);
    },
    [clearRefreshTimer, setUnauthenticated]
  );

  const applySession = useCallback(
    (payload: TokenResponse, fallback?: PersistedAuth) => {
      const user = payload.user ?? fallback?.user;

      if (!user) {
        throw new Error("Nepavyko gauti vartotojo duomenų.");
      }

      const expiresAt = computeExpiration(payload, fallback?.session);
      const session: Session = {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        expiresAt
      };

      const nextState: AuthState = {
        status: "authenticated",
        user,
        session,
        error: null
      };

      setState(nextState);
      persistSession({ user, session });
      scheduleRefresh(expiresAt);
    },
    [scheduleRefresh]
  );

  const refreshWithToken = useCallback(
    async (refreshToken: string, fallback?: PersistedAuth) => {
      const response = await apiClient.post<TokenResponse>(
        "/auth/refresh",
        { refreshToken },
        { withAuth: false }
      );

      applySession(response, fallback);
    },
    [applySession]
  );

  const refresh = useCallback(async () => {
    const current = stateRef.current;

    if (current.status !== "authenticated") {
      return;
    }

    await refreshWithToken(current.session.refreshToken, {
      user: current.user,
      session: current.session
    });
  }, [refreshWithToken]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsProcessing(true);
      setState((prev) => (prev.status === "unauthenticated" ? { ...prev, error: null } : prev));

      try {
        const response = await apiClient.post<TokenResponse>(
          "/auth/login",
          credentials,
          { withAuth: false }
        );

        applySession(response);
        queryClient.clear();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nepavyko prisijungti.";
        setUnauthenticated(message);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [applySession, queryClient, setUnauthenticated]
  );

  const logout = useCallback(async () => {
    setIsProcessing(true);
    const current = stateRef.current;

    try {
      if (current.status === "authenticated") {
        try {
          await apiClient.post(
            "/auth/logout",
            { refreshToken: current.session.refreshToken },
            { withAuth: true }
          );
        } catch (error) {
          if (import.meta.env?.DEV) {
            console.warn("Nepavyko iškviesti atsijungimo API:", error);
          }
        }
      }
    } finally {
      setIsProcessing(false);
      setUnauthenticated(null, { clearQueries: true });
    }
  }, [setUnauthenticated]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    setAccessTokenProvider(() => {
      const current = stateRef.current;
      return current.status === "authenticated" ? current.session.accessToken : null;
    });

    return () => setAccessTokenProvider(null);
  }, []);

  useEffect(() => {
    const initialise = async () => {
      const persisted = loadPersistedSession();

      if (!persisted) {
        setState({ status: "unauthenticated", user: null, session: null, error: null });
        return;
      }

      try {
        if (persisted.session.expiresAt <= Date.now()) {
          await refreshWithToken(persisted.session.refreshToken, persisted);
        } else {
          setState({ status: "authenticated", user: persisted.user, session: persisted.session, error: null });
          scheduleRefresh(persisted.session.expiresAt);
        }
      } catch (error) {
        const message = error instanceof ApiClientError ? error.message : null;
        setUnauthenticated(message, { clearQueries: true });
      }
    };

    void initialise();
  }, [refreshWithToken, scheduleRefresh, setUnauthenticated]);

  useEffect(() => () => clearRefreshTimer(), [clearRefreshTimer]);

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = state.status === "authenticated";

    return {
      status: state.status,
      user: isAuthenticated ? state.user : null,
      error: state.status === "unauthenticated" ? state.error : null,
      isAuthenticated,
      isProcessing,
      accessToken: isAuthenticated ? state.session.accessToken : null,
      login,
      logout,
      refresh
    };
  }, [login, logout, refresh, state, isProcessing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
