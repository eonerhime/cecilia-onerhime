"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { hasRole, type Role } from "@/lib/roles";

type EditModeContextValue = {
  loggedIn: boolean;
  canEdit: boolean;
  editMode: boolean;
  activeEditorId: string | null;
  setActiveEditorId: (id: string | null) => void;
};

const EditModeContext = createContext<EditModeContextValue>({
  loggedIn: false,
  canEdit: false,
  editMode: false,
  activeEditorId: null,
  setActiveEditorId: () => {},
});

export function useEditMode() {
  return useContext(EditModeContext);
}

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const [role, setRole] = useState<Role | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then((body) => {
        if (!cancelled) setRole(body?.data?.role ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const canEdit = hasRole(role, "editor");

  return (
    <EditModeContext.Provider
      value={{
        loggedIn: role !== null,
        canEdit,
        editMode: canEdit && editMode,
        activeEditorId,
        setActiveEditorId,
      }}
    >
      {children}
      {canEdit && !isAdminRoute && (
        <button
          type="button"
          onClick={() => {
            setActiveEditorId(null);
            setEditMode((value) => !value);
          }}
          className="fixed bottom-5 right-5 z-50 rounded-full bg-[#1f2d2b] px-5 py-3 text-xs font-semibold uppercase tracking-[.12em] text-[#fbf8f2] shadow-lg"
        >
          {editMode ? "Editing: On" : "Editing: Off"}
        </button>
      )}
    </EditModeContext.Provider>
  );
}
