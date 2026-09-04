import { getDatabase } from "@/lib/db";

export const defaultMemorialSettings = {
  displayName: "Cecilia Onerhime",
  footerText:
    "Copyright © is the Moses Onerhime Family 2026 All rights reserved",
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
};

export type ApprovedMedia = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
};

export async function getMemorialSettings() {
  try {
    const sql = getDatabase();
    const [settings] = await sql`
      select display_name, footer_text, background_color, foreground_color,
        paper_color, sage_color, accent_color, line_color, rose_color, peach_color
      from memorial_settings
      where id = 'default'
    `;
    if (!settings) return defaultMemorialSettings;
    return {
      displayName: settings.display_name,
      footerText: settings.footer_text,
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
}

export async function getApprovedMemories() {
  try {
    const sql = getDatabase();
    const [tributes, media] = await Promise.all([
      sql`
        select id, name, message
        from tributes
        where status = 'approved'
        order by created_at desc
        limit 3
      `,
      sql`
        select id, media_url, media_type, caption
        from media_submissions
        where status = 'approved'
        order by created_at desc
        limit 6
      `,
    ]);
    return {
      tributes: tributes as ApprovedTribute[],
      media: media.map(({ media_url, media_type, ...item }) => ({
        ...item,
        mediaUrl: media_url,
        mediaType: media_type,
      })) as ApprovedMedia[],
    };
  } catch (error) {
    console.error("Approved memories lookup failed", error);
    return { tributes: [], media: [] };
  }
}
