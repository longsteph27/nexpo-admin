import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createDirectus,
  rest,
  authentication,
  realtime
} from "@directus/sdk";
import { tokenManager } from "@/lib/tokenManager";
import type { Registration } from "../types";

const DIRECTUS_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "https://app.nexpo.vn";

interface Params {
  eventId: number;
  enabled?: boolean;
}

/** Tạo Directus client (REST + Auth + Realtime) */
function createClient() {
  return createDirectus<{
    registrations: Registration[];
  }>(DIRECTUS_URL)
    .with(rest())
    .with(authentication("json", { autoRefresh: true }))
    .with(realtime());
}

/**
 * HOOK REALTIME — CHỈ LẮNG NGHE EVENT CREATE
 */
export function useRegistrationsRealtime({ eventId, enabled = true }: Params) {
  const queryClient = useQueryClient();
  const clientRef = useRef<any>(null);
  const stopRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || !eventId) {
      console.log("[Realtime] Disabled → skip");
      return;
    }

    if (typeof window === "undefined") {
      console.log("[Realtime] SSR → skip");
      return;
    }

    stopRef.current = false;

    async function setup() {
      try {
        const token = tokenManager.getBestAvailableToken();
        if (!token) {
          console.log("[Realtime] No token → skip");
          return;
        }

        console.log("[Realtime] Creating client…");

        const client = createClient();
        clientRef.current = client;
        await client.setToken(token);

        // Log trạng thái WebSocket
        client.onWebSocket?.("open", () =>
          console.log("%c[Realtime] WS OPEN", "color:#0f0;font-weight:bold")
        );
        client.onWebSocket?.("close", () =>
          console.log("%c[Realtime] WS CLOSED", "color:red")
        );
        client.onWebSocket?.("error", (err) =>
          console.log("%c[Realtime] WS ERROR", "color:red", err)
        );

        // === SUBSCRIBE (CHỈ EVENT CREATE) ===
        console.log(
          `[Realtime] Subscribing to registrations (event_id=${eventId}, event=create)`
        );

        const { subscription } = await client.subscribe("registrations", {
          event: "create",
          query: {
            filter: {
              event_id: { _eq: eventId }
            }
          }
        });

        // === LẮNG NGHE (for await … of) — kiểu mới ===
        (async () => {
          try {
            for await (const item of subscription) {
              if (stopRef.current) break;

              console.log(
                "%c[Realtime] CREATE EVENT RECEIVED",
                "color:#0af;font-weight:bold",
                item
              );

              // Refetch list registrations
              await queryClient.refetchQueries({
                queryKey: ["registrations", eventId],
                exact: false,
              });

              // Refetch PENDING + CHECKEDIN counts
              await queryClient.refetchQueries({
                queryKey: ["registrations-count-checkedin", eventId],
                exact: false,
              });

              await queryClient.refetchQueries({
                queryKey: ["registrations-count-pending", eventId],
                exact: false,
              });
            }
          } catch (err) {
            console.error("[Realtime] Subscription error:", err);
          }
        })();
      } catch (err) {
        console.error("[Realtime] Setup error:", err);
      }
    }

    setup();

    /** CLEANUP */
    return () => {
      stopRef.current = true;

      console.log("[Realtime] Cleanup subscription");

      try {
        clientRef.current?.disconnect?.();
      } catch (err) {
        console.error("[Realtime] Disconnect error:", err);
      }

      clientRef.current = null;
    };
  }, [eventId, enabled]);
}
