import { cache } from "react";
import { getDatabase } from "@/lib/db";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";

export type MusicAutoplay = "off" | "always" | "once_per_session";

export const defaultMemorialSettings = {
  displayName: "Cecilia Onerhime",
  templateId: "editorial-memory",
  heroImageUrl: "",
  footerText:
    "Copyright © is the Moses Onerhime Family 2026 All rights reserved",
  musicUrl: "",
  musicAutoplay: "off" as MusicAutoplay,
  musicLoop: true,
  musicVolume: 80,
  colors: {
    background: "#f5f0e8",
    foreground: "#1f2d2b",
    paper: "#fbf8f2",
    sage: "#536b60",
    accent: "#c48a3a",
    line: "#d8cec0",
    rose: "#b8786f",
    peach: "#d9b5a8",
  },
};

export type ApprovedTribute = {
  id: string;
  name: string;
  message: string;
  attachmentUrl: string | null;
};

export type ApprovedMedia = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  albumId: string | null;
  thumbnailUrl: string | null;
};

export type Album = {
  id: string;
  name: string;
  coverUrl: string | null;
  hidden: boolean;
};

export const getMemorialSettings = cache(async () => {
  try {
    const sql = getDatabase();
    const [settings] = await sql`
      select memorial_settings.display_name, memorial_settings.footer_text,
        memorial_settings.hero_image_url, tenants.template_id,
        memorial_settings.music_url, memorial_settings.music_autoplay,
        memorial_settings.music_loop, memorial_settings.music_volume,
        memorial_settings.background_color, memorial_settings.foreground_color,
        memorial_settings.paper_color, memorial_settings.sage_color,
        memorial_settings.accent_color, memorial_settings.line_color,
        memorial_settings.rose_color, memorial_settings.peach_color
      from memorial_settings
      join tenants on tenants.id = memorial_settings.tenant_id
      where memorial_settings.tenant_id = ${DEFAULT_TENANT_ID}
    `;
    if (!settings) return defaultMemorialSettings;
    return {
      displayName: settings.display_name,
      templateId: settings.template_id,
      heroImageUrl: settings.hero_image_url,
      footerText: settings.footer_text,
      musicUrl: settings.music_url,
      musicAutoplay: settings.music_autoplay as MusicAutoplay,
      musicLoop: settings.music_loop,
      musicVolume: settings.music_volume,
      colors: {
        background: settings.background_color,
        foreground: settings.foreground_color,
        paper: settings.paper_color,
        sage: settings.sage_color,
        accent: settings.accent_color,
        line: settings.line_color,
        rose: settings.rose_color,
        peach: settings.peach_color,
      },
    };
  } catch (error) {
    console.error("Memorial settings lookup failed", error);
    return defaultMemorialSettings;
  }
});

export async function getApprovedTributesList(limit = 200) {
  try {
    const sql = getDatabase();
    const tributes = await sql`
      select id, name, message, attachment_url
      from tributes
      where tenant_id = ${DEFAULT_TENANT_ID} and status = 'approved'
      order by display_order asc, created_at desc
      limit ${limit}
    `;
    return tributes.map(({ attachment_url, ...row }) => ({
      ...row,
      attachmentUrl: attachment_url,
    })) as ApprovedTribute[];
  } catch (error) {
    console.error("Approved tributes lookup failed", error);
    return [];
  }
}

export async function getApprovedMediaList(limit = 200) {
  try {
    const sql = getDatabase();
    const media = await sql`
      select id, media_url, media_type, caption, album_id, thumbnail_url
      from media_submissions
      where tenant_id = ${DEFAULT_TENANT_ID} and status = 'approved'
      order by display_order asc, created_at desc
      limit ${limit}
    `;
    return media.map(({ media_url, media_type, album_id, thumbnail_url, ...item }) => ({
      ...item,
      mediaUrl: media_url,
      mediaType: media_type,
      albumId: album_id,
      thumbnailUrl: thumbnail_url,
    })) as ApprovedMedia[];
  } catch (error) {
    console.error("Approved media lookup failed", error);
    return [];
  }
}

export async function getAlbums({ includeHidden = false } = {}): Promise<Album[]> {
  try {
    const sql = getDatabase();
    const rows = includeHidden
      ? await sql`
          select id, name, cover_url, hidden from albums
          where tenant_id = ${DEFAULT_TENANT_ID}
          order by sort_order asc, created_at asc
        `
      : await sql`
          select id, name, cover_url, hidden from albums
          where tenant_id = ${DEFAULT_TENANT_ID} and hidden = false
          order by sort_order asc, created_at asc
        `;
    return rows.map(({ cover_url, ...row }) => ({
      ...row,
      coverUrl: cover_url,
    })) as Album[];
  } catch (error) {
    console.error("Albums lookup failed", error);
    return [];
  }
}

export async function getApprovedMemories() {
  const [tributes, media] = await Promise.all([
    getApprovedTributesList(3),
    getApprovedMediaList(6),
  ]);
  return { tributes, media };
}
