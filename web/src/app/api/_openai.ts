/* eslint-disable @typescript-eslint/no-explicit-any */
export function openaiKey() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("Missing OPENAI_API_KEY");
  return k;
}

export async function openaiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let j: any = null;
  try {
    j = JSON.parse(text);
  } catch {
    // keep text
  }
  if (!res.ok) {
    const msg = j?.error?.message || j?.message || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (j ?? ({} as any)) as T;
}
