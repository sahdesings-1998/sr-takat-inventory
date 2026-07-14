import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import authApi from "@/modules/auth/api/authApi";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Check if user is logged in on app load (run only once)
  useEffect(() => {
    if (sessionChecked) return;

    let isMounted = true;

    console.info("[auth] checking session on app load");

    authApi
      .getMe()
      .then((res) => {
        if (isMounted) {
          console.info("[auth] session found", { user: res.data.user?.fullName });
          // Only restore session for verified accounts
          const fetchedUser = res.data.user;
          if (fetchedUser && fetchedUser.isVerified) {
            setUser(fetchedUser);
          } else {
            console.info("[auth] session ignored - account not verified", { user: fetchedUser?.email });
            setUser(null);
          }
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.info("[auth] no active session", { status: error?.response?.status });
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setSessionChecked(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionChecked]);

  // Listen for logout events from failed auth requests
  useEffect(() => {
    const handleAuthLogout = () => {
      console.info("[auth] logout event received");
      setUser(null);
    };

    window.addEventListener("sr-takat:auth-logout", handleAuthLogout);
    return () => window.removeEventListener("sr-takat:auth-logout", handleAuthLogout);
  }, []);

  const login = useCallback(async (credentials) => {
    console.info("[auth] login attempt", { email: credentials.email });
    const res = await authApi.login(credentials);
    const loggedUser = res.data.user;
    console.info("[auth] login response", { user: loggedUser?.email });

    // Require verified account to complete login
    if (!loggedUser?.isVerified) {
      console.warn("[auth] login blocked - account not verified", { email: loggedUser?.email });
      // Ensure server-side cookies are cleared if any
      try {
        await authApi.logout();
      } catch (e) {
        console.info("[auth] logout after unverified login attempt failed", { error: e?.message });
      }
      throw new Error("Account not verified. Please verify your email before logging in.");
    }

    console.info("[auth] login success");
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback(async (payload) => {
    console.info("[auth] register attempt", { email: payload.email });
    const res = await authApi.register(payload);
    console.info("[auth] register success");
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    console.info("[auth] logout");
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      roleName: user?.roleId?.name,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export default AuthContext;
