import { AdminLogin } from "@/components/AdminLogin";
import { AdminPanel } from "@/components/AdminPanel";
import { getAdminGifts, getAdminRsvps } from "@/lib/data";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/auth";
import type { AdminGift, AdminRsvp } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = isAdminPasswordConfigured();

  if (!configured || !isAdminAuthenticated()) {
    return <AdminLogin configured={configured} />;
  }

  let gifts: AdminGift[] = [];
  let rsvps: AdminRsvp[] = [];
  let loadError: string | null = null;

  try {
    gifts = await getAdminGifts();
  } catch {
    loadError = "Não foi possível carregar os presentes. Verifique a conexão com o banco.";
  }

  try {
    rsvps = await getAdminRsvps();
  } catch {
    rsvps = [];
  }

  return <AdminPanel gifts={gifts} rsvps={rsvps} loadError={loadError} />;
}
