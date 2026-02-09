export async function fetchWithSession(
  input: RequestInfo,
  init?: RequestInit
) {
  const res = await fetch(input, init);

  if (
    res.status === 401 &&
    res.headers.get("x-session-expired") === "1"
  ) {
    // 🔥 GLOBAL OTURUM DÜŞTÜ
    window.location.href = "/login?reason=expired";
    return Promise.reject(new Error("SESSION_EXPIRED"));
  }

  return res;
}
