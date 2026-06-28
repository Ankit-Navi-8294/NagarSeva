import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { User, ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setupRecaptcha: (elementId: string) => void;
  requestOTP: (phoneNumber: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let authResolved = false;

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        authResolved = true;
        setUser(user);
        setLoading(false);
      });

      // Fallback timeout in case Firebase is unreachable or blocked
      // Uses a flag variable (not `loading` state) to avoid stale closure
      timeoutId = setTimeout(() => {
        if (!authResolved) {
          console.warn("Firebase Auth timeout. Bypassing loading state.");
          setLoading(false);
        }
      }, 3000);

      return () => {
        unsubscribe();
        clearTimeout(timeoutId);
      };
    } catch (err) {
      console.error("Firebase auth init error:", err);
      setLoading(false);
      return () => {};
    }
  }, []);


  const setupRecaptcha = (elementId: string) => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          }
        });
      }
    } catch (err) {
      console.warn("Recaptcha setup failed. Likely due to missing Firebase config.", err);
    }
  };

  const requestOTP = async (phoneNumber: string) => {
    setError(null);
    try {
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) throw new Error("Recaptcha not initialized");
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error("Error requesting OTP", err);
      setError(err.message || "Failed to send OTP");
      throw err;
    }
  };

  const verifyOTP = async (otp: string) => {
    setError(null);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
      } else {
        throw new Error("No confirmation result available. Request OTP first.");
      }
    } catch (err: any) {
      console.error("Error verifying OTP", err);
      setError(err.message || "Failed to verify OTP");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      setUser(null); // Mock logout
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setupRecaptcha, requestOTP, verifyOTP, logout, error }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Add recaptchaVerifier to window object for TS
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
