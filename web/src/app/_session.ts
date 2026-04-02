export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const k = "mfb_session_id";
  let v = window.localStorage.getItem(k);
  if (!v) {
    v = `sess_${crypto.randomUUID().replace(/-/g, "")}`;
    window.localStorage.setItem(k, v);
  }
  return v;
}
