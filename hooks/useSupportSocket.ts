"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

/**
 * Shared realtime hook for the unified Support Center — revalidates the ticket
 * list/detail/analytics SWR caches on any ticket or message event instead of
 * each page inlining its own socket.on/off pair (the pattern every prior admin
 * support page duplicated).
 */
export function useSupportSocket(activeTicketId?: string | null) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const revalidateLists = () => {
      mutate((key) => typeof key === "string" && key.startsWith("support-center:tickets:"));
      mutate("support-center:analytics");
    };

    const handleNewMessage = (msg: { ticket_id?: string }) => {
      revalidateLists();
      if (activeTicketId && msg.ticket_id === activeTicketId) {
        mutate((key) => typeof key === "string" && key.includes(`:${activeTicketId}`));
      }
    };

    const handleStatusChange = () => revalidateLists();
    const handleNewTicket = () => revalidateLists();

    socket.on(SOCKET_EVENTS.SUPPORT_NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.SUPPORT_STATUS_CHANGE, handleStatusChange);
    socket.on(SOCKET_EVENTS.SUPPORT_NEW_TICKET, handleNewTicket);

    return () => {
      socket.off(SOCKET_EVENTS.SUPPORT_NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.SUPPORT_STATUS_CHANGE, handleStatusChange);
      socket.off(SOCKET_EVENTS.SUPPORT_NEW_TICKET, handleNewTicket);
    };
  }, [mutate, activeTicketId]);
}
