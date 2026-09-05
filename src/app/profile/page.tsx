import Link from "next/link";
import { getMemorialSettings } from "@/lib/memorial";
import { getContentBlocks, block } from "@/lib/content";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { Editable, EditableSetting } from "@/components/editable";

export default async function Profile() {
  const [settings, blocks] = await Promise.all([
    getMemorialSettings(),
    getContentBlocks(DEFAULT_TENANT_ID),
  ]);
  const nameParts = settings.displayName.trim().split(/\s+/);
  const firstName = nameParts[0] || settings.displayName;
  const lastName = nameParts.slice(1).join(" ");

  const tagline = block(
    blocks,
    "profile.tagline",
    "A mother, a guide, a source of light.",
  );
  const bio = block(
    blocks,
    "profile.bio",
    "This is where the story of Cecilia will live: the places she called home, the people she loved, and the small everyday ways she made life brighter.",
  );

  return (
    <main className="paper-grain min-h-screen px-6 py-10 lg:px-10">
      <Link href="/" className="text-sm text-[#536b60]">
        ← Back home
      </Link>
      <section className="mx-auto max-w-4xl py-20">
        <Editable
          blockKey="profile.eyebrow"
          value={block(blocks, "profile.eyebrow", "Her story")}
        >
          <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
            {block(blocks, "profile.eyebrow", "Her story")}
          </p>
        </Editable>
        <EditableSetting
          instanceId="profile-heading"
          field="displayName"
          settings={settings}
        >
          <h1 className="display-font mt-6 text-7xl leading-[.9]">
            {firstName}
            {lastName && (
              <>
                <br />
                <span className="text-[#536b60]">{lastName}</span>
              </>
            )}
          </h1>
        </EditableSetting>
        <div className="mt-12 grid gap-10 border-t border-[#d8cec0] pt-8 md:grid-cols-[.7fr_1.3fr]">
          <Editable blockKey="profile.tagline" value={tagline}>
            <p className="display-font text-3xl leading-tight">{tagline}</p>
          </Editable>
          <Editable blockKey="profile.bio" value={bio} multiline>
            <div className="space-y-5 text-sm leading-7 text-[#536b60]">
              {bio
                .split("\n")
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </Editable>
        </div>
      </section>
    </main>
  );
}
