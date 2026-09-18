"use client";

import Link from "next/link";
import { useState } from "react";
import AdminNavLink from "@/components/admin-nav-link";

export default function MobileNavMenu({
  links,
}: {
  links: Array<{ href: string; label: string; emphasize?: boolean }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
      >
        <span
          className={`block h-0.5 w-6 bg-[#1f2d2b] transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
        />
        <span className={`block h-0.5 w-6 bg-[#1f2d2b] transition-opacity ${open ? "opacity-0" : ""}`} />
        <span
          className={`block h-0.5 w-6 bg-[#1f2d2b] transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-t border-[#d8cec0] bg-[#fbf8f2] px-6 py-6 shadow-md">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-5 text-sm font-medium uppercase tracking-[.18em] text-[#536b60]">
            {links.map((link) =>
              link.emphasize ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#1f2d2b] px-5 py-3 text-[#fbf8f2]"
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="link-underline hover:text-[#c48a3a]"
                >
                  {link.label}
                </Link>
              ),
            )}
            <AdminNavLink className="link-underline hover:text-[#c48a3a]" />
          </div>
        </div>
      )}
    </div>
  );
}
