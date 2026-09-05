"use client";

import { useEditMode } from "@/components/edit-mode";

export default function AdminNavLink({ className }: { className?: string }) {
  const { role } = useEditMode();
  const label = role
    ? `${role.charAt(0).toUpperCase()}${role.slice(1)} panel`
    : "Family sign-in";
  return (
    <a href="/admin" className={className}>
      {label}
    </a>
  );
}
