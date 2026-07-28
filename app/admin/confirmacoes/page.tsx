import { AdminConfirmationsPanel } from "@/components/AdminConfirmationsPanel";
import { AdminLogin } from "@/components/AdminLogin";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/auth";
import { getAdminRsvps } from "@/lib/data";
import type { AdminRsvp } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminConfirmationsPage() {
  const configured = isAdminPasswordConfigured();

  if (!configured || !isAdminAuthenticated()) {
    return <AdminLogin configured={configured} />;
  }

  let rsvps: AdminRsvp[] = [];
  let loadError: string | null = null;

  try {
    rsvps = await getAdminRsvps();
  } catch {
    loadError = "Não foi possível carregar as confirmações. Verifique a conexão com o banco.";
  }

  return <AdminConfirmationsPanel rsvps={rsvps} loadError={loadError} />;
}
