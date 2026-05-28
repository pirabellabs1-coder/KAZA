"use server";

// Placeholders d'actions admin — branchera Supabase + audit log plus tard.

export async function suspendUsers(
  ids: string[],
  reason: string,
  notify: boolean,
) {
  void ids;
  void reason;
  void notify;
}

export async function banUsers(
  ids: string[],
  reason: string,
  notify: boolean,
) {
  void ids;
  void reason;
  void notify;
}

export async function reactivateUser(id: string) {
  void id;
}

export async function changeUserRole(id: string, role: string) {
  void id;
  void role;
}

export async function impersonateUser(id: string) {
  void id;
}
