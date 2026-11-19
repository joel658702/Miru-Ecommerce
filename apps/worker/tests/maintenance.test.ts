import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { EVENT_RETENTION_DAYS, purgeOldEvents } from "../src/maintenance.js";

interface Calls {
  table?: string;
  lt?: [string, string];
}

function fakeClient(result: { data: unknown[] | null; error: unknown }): {
  client: SupabaseClient;
  calls: Calls;
} {
  const calls: Calls = {};

  const client = {
    from(table: string) {
      calls.table = table;
      return {
        delete() {
          return {
            lt(column: string, value: string) {
              calls.lt = [column, value];
              return {
                select() {
                  return Promise.resolve(result);
                },
              };
            },
          };
        },
      };
    },
  };

  return { client: client as unknown as SupabaseClient, calls };
}

describe("purgeOldEvents", () => {
  it("borra por received_at con el corte de 14 días", async () => {
    const now = new Date("2026-11-19T12:00:00.000Z");
    const { client, calls } = fakeClient({ data: [{ id: "a" }, { id: "b" }], error: null });

    const deleted = await purgeOldEvents(client, now);

    expect(deleted).toBe(2);
    expect(calls.table).toBe("webhook_events");
    expect(calls.lt?.[0]).toBe("received_at");
    expect(calls.lt?.[1]).toBe("2026-11-05T12:00:00.000Z");
    expect(EVENT_RETENTION_DAYS).toBe(14);
  });

  it("respeta una retención distinta", async () => {
    const now = new Date("2026-11-19T00:00:00.000Z");
    const { client, calls } = fakeClient({ data: [], error: null });

    await purgeOldEvents(client, now, 7);

    expect(calls.lt?.[1]).toBe("2026-11-12T00:00:00.000Z");
  });

  it("propaga el error de la base", async () => {
    const { client } = fakeClient({ data: null, error: new Error("boom") });

    await expect(purgeOldEvents(client)).rejects.toThrow("boom");
  });
});
