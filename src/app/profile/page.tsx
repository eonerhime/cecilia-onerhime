import { getMemorialSettings, getProfileImages } from "@/lib/memorial";
import { getContentBlocks, block } from "@/lib/content";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { Editable, EditableSetting } from "@/components/editable";
import SiteNav from "@/components/site-nav";
import Reveal from "@/components/reveal";
import { renderFormattedText } from "@/lib/rich-text";
import { ProfileBannerEditor, ProfileSupportingImagesEditor } from "@/components/profile-images-editor";

export default async function Profile() {
  const [settings, blocks, profileImages] = await Promise.all([
    getMemorialSettings(),
    getContentBlocks(DEFAULT_TENANT_ID),
    getProfileImages(),
  ]);
  const { banner, supporting } = profileImages;
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
    <main className="paper-grain min-h-screen">
      <SiteNav displayName={settings.displayName} heroImageUrl={settings.heroImageUrl} current="profile" />
      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
        <Reveal as="div" className="grid items-center gap-10 md:grid-cols-[1.1fr_.9fr]">
          <div>
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
          </div>
          <ProfileBannerEditor image={banner} />
        </Reveal>
        {/* Plain grid, deliberately NOT wrapped in <Reveal>: `.reveal.is-visible`
            sets `transform: translateY(0)` rather than `transform: none`, and
            any non-`none` transform on an ancestor gives `position: sticky`
            a new (wrong) containing block, silently breaking the pin below.
            The bio still gets its own fade-in via a nested Reveal instead. */}
        <div className="mt-12 grid gap-10 border-t border-[#d8cec0] pt-8 md:grid-cols-[.7fr_1.3fr]">
          {/* Sticky only from md up — on mobile this just stacks normally,
              since pinning a sidebar above scrolling text on a narrow screen
              would eat too much of the viewport to be useful. `self-start` is
              required, not optional: grid row height is set by content alone
              (align-items doesn't affect track sizing), so the row is already
              as tall as the bio regardless of this item's alignment. Without
              self-start, default `stretch` makes this item's own box exactly
              as tall as that row too — leaving sticky zero "slack" to move
              within, so it never visibly pins. `self-start` shrinks the box
              to its natural (short) content height while the row stays tall,
              which is what actually gives sticky room to work. */}
          <div className="md:sticky md:top-10 md:self-start">
            <Editable blockKey="profile.tagline" value={tagline}>
              <p className="display-font text-3xl leading-tight">{tagline}</p>
            </Editable>
            <ProfileSupportingImagesEditor images={supporting} />
          </div>
          <Reveal delayMs={100} as="div">
            <Editable blockKey="profile.bio" value={bio} multiline richText>
              <div className="space-y-5 text-sm leading-7 text-[#536b60]">
                {bio
                  .split("\n")
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{renderFormattedText(paragraph)}</p>
                  ))}
              </div>
            </Editable>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
