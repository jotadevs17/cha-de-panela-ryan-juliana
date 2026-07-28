import { AdminLogin } from "@/components/AdminLogin";
import { AdminReceiptsPanel } from "@/components/AdminReceiptsPanel";
import { getAdminGifts } from "@/lib/data";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/auth";
import type { AdminGift } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminReceiptsPage() {
  const configured = isAdminPasswordConfigured();

  if (!configured || !isAdminAuthenticated()) {
    return <AdminLogin configured={configured} />;
  }

  let gifts: AdminGift[] = [];
  let loadError: string | null = null;

  try {
    gifts = await getAdminGifts();
  } catch {
    loadError = "Não foi possível carregar os recebimentos. Verifique a conexão com o banco.";
  }

  return <AdminReceiptsPanel gifts={gifts} loadError={loadError} />;
}
