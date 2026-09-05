import { cache } from "react";
import { getDatabase } from "@/lib/db";

export const getContentBlocks = cache(
  async (tenantId: string): Promise<Record<string, string>> => {
    try {
      const sql = getDatabase();
      const rows = await sql`
        select block_key, value from content_blocks where tenant_id = ${tenantId}
      `;
      const map: Record<string, string> = {};
      for (const row of rows) map[row.block_key] = row.value;
      return map;
    } catch (error) {
      console.error("Content blocks lookup failed", error);
      return {};
    }
  },
);

export function block(
  blocks: Record<string, string>,
  key: string,
  fallback: string,
) {
  return blocks[key] ?? fallback;
}
