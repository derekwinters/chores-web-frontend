import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "../api/client";

/**
 * Polls the caller's notifications on the same 60s cadence the Dashboard uses
 * (src/pages/Dashboard.jsx). The default fetch excludes dismissed rows (server
 * default), so this poll drives the bell badge and the arrival toast.
 *
 * Backend owns delivery state (chores-web-backend#39): the first listing sets
 * delivered_at server-side; the client never writes it. "Unread" here means a
 * row that has not been acknowledged (acknowledged_at === null).
 *
 * @returns {{ notifications: Array, unreadCount: number, query: object }}
 */
export function useNotifications() {
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 60_000,
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter(
    (n) => n.acknowledged_at === null || n.acknowledged_at === undefined
  ).length;

  return { notifications, unreadCount, query };
}
