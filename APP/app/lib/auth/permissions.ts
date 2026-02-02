//APP\app\lib\auth\permissions.ts
export function isAdmin(role: string) {
  return role?.toLowerCase() === "admin";
}

export function isOperator(role: string) {
  return role?.toLowerCase() === "operator";
}

export function isManager(role: string) {
  return role?.toLowerCase() === "manager";
}

export function isPremium(org: any) {
  return org?.is_premium === true;
}
