import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, role: "student" | "teacher") => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

interface StoredUser extends User {
  password: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("attendifier_current_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const getUsers = (): StoredUser[] => {
    return JSON.parse(localStorage.getItem("attendifier_users") || "[]");
  };

  const login = (email: string, password: string): boolean => {
    const users = getUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem("attendifier_current_user", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const register = (name: string, email: string, password: string, role: "student" | "teacher"): boolean => {
    const users = getUsers();
    if (users.find((u) => u.email === email)) return false;
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role,
    };
    users.push(newUser);
    localStorage.setItem("attendifier_users", JSON.stringify(users));
    const { password: _, ...userData } = newUser;
    setUser(userData);
    localStorage.setItem("attendifier_current_user", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("attendifier_current_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
