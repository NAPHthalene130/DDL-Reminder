import { jsonError } from "@/lib/api-response";
import { hasManageSession } from "@/lib/manage-auth";

export async function requireManageSession() {
  if (await hasManageSession()) {
    return null;
  }

  return jsonError("Management session required.", 401);
}
