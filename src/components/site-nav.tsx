import Link from "next/link";
import AdminNavLink from "@/components/admin-nav-link";

type PageKey = "profile" | "gallery" | "tributes" | "programme";

const ALL_LINKS: Array<{ key: "home" | PageKey; href: string; label: string }> = [
  { key: "home", href: "/", label: "Home" },
  { key: "profile", href: "/profile", label: "Her story" },
  { key: "gallery", href: "/gallery", label: "Gallery" },
  { key: "tributes", href: "/tributes", label: "Tributes" },
  { key: "programme", href: "/programme", label: "Programme" },
];

export default function SiteNav({
  displayName,
  current,
}: {
  displayName: string;
  current: PageKey;
}) {
  const links = ALL_LINKS.filter((link) => link.key !== current);

  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
      <Link href="/" className="display-font text-2xl font-semibold tracking-tight">
        {displayName}
      </Link>
      <Link href="/" className="text-sm text-[#536b60] hover:text-[#c48a3a] md:hidden">
        ← Home
      </Link>
      <div className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[.18em] text-[#536b60] md:flex">
        {links.map((link) =>
          link.key === "programme" ? (
            <Link
              key={link.key}
              href={link.href}
              className="rounded-full bg-[#1f2d2b] px-5 py-3 text-[#fbf8f2] hover:bg-[#536b60]"
            >
              {link.label}
            </Link>
          ) : (
            <Link key={link.key} href={link.href} className="hover:text-[#c48a3a]">
              {link.label}
            </Link>
          ),
        )}
        <AdminNavLink className="hover:text-[#c48a3a]" />
      </div>
    </nav>
  );
}
