"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

interface Itinerary {
  itinerary: string;
  rating: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  itineraries: Itinerary[];
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>; // Added refresh user function
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const loadUser = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?._id) {
          setUser(parsedUser);
          return parsedUser;
        } else {
          console.warn("⚠️ Invalid user data in localStorage:", parsedUser);
          localStorage.removeItem("user");
        }
      }
      return null;
    } catch (error) {
      console.error("❌ Error parsing stored user:", error);
      localStorage.removeItem("user");
      return null;
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Fetch fresh user data from the server
  const refreshUser = async () => {
    try {
      const currentUser = loadUser();
      if (!currentUser?._id) return;

      const response = await fetch(`/api/auth/user?id=${currentUser._id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to refresh user data");
      }

      const data = await response.json();
      if (data.user && data.user._id) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (error) {
      console.error("❌ Error refreshing user data:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Sign in failed");
      }

      const data = await response.json();
      if (!data.user || !data.user._id) {
        throw new Error("Invalid user data from server");
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      console.error("❌ Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        throw new Error("Sign up failed");
      }

      await signIn(email, password); // Auto sign-in after sign-up
    } catch (error) {
      console.error("❌ Sign up error:", error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};