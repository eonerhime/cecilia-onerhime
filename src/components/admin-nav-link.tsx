"use client";

import { useEditMode } from "@/components/edit-mode";

export default function AdminNavLink({ className }: { className?: string }) {
  const { loggedIn } = useEditMode();
  return (
    <a href="/admin" className={className}>
      {loggedIn ? "Admin panel" : "Family sign-in"}
    </a>
  );
}
