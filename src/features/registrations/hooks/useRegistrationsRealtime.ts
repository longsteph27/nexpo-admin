import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createDirectus,
  rest,
  staticToken,
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

/** Tạo Directus client với static token + Realtime */
function createClient(token: string) {
  return createDirectus<{
    registrations: Registration[];
  }>(DIRECTUS_URL)
    .with(rest())
    .with(staticToken(token))
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

        const client = createClient(token);
        clientRef.current = client;

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
            const msg = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err as object));
            console.error("[Realtime] Subscription error:", msg, err);
          }
        })();
      } catch (err) {
        // DOM Events (WebSocket error/close) are not Error instances — serialize safely
        let msg: string;
        if (err instanceof Error) {
          msg = err.message;
        } else if (err && typeof err === "object" && "type" in err) {
          msg = `WebSocket ${(err as Event).type} event — realtime unavailable`;
        } else {
          try {
            msg = JSON.stringify(err, Object.getOwnPropertyNames(err as object));
          } catch {
            msg = String(err);
          }
        }
        console.warn("[Realtime] Setup error (realtime disabled):", msg);
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
