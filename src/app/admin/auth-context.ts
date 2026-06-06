"use client";

import { createContext, useContext } from "react";

export type AdminRole = "super_admin" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: AdminRole;
}

export const AdminContext = createContext<AdminUser | null>(null);

export function useAdminUser(): AdminUser | null {
  return useContext(AdminContext);
}
