function shopBase() {
  return (
    process.env.NEXT_PUBLIC_SHOP_URL?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production"
      ? "https://printoe.com"
      : "http://localhost:3002")
  );
}

function apiBaseFallback() {
  return (
    (typeof window !== "undefined" ? window.sessionStorage.getItem("printoe_api") : null) ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    (process.env.NODE_ENV === "production"
      ? "https://api.printoe.com/api"
      : "http://localhost:4000/api")
  );
}

export function redirectToPrintoeLogin() {
  const next = encodeURIComponent(window.location.href);
  window.location.replace(`${shopBase()}/editor-auth?next=${next}`);
}

export async function requirePrintoeSession(token: string | null, api: string | null) {
  if (!token) {
    redirectToPrintoeLogin();
    return false;
  }
  const base = (api || apiBaseFallback()).replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      window.sessionStorage.removeItem("printoe_pt");
      redirectToPrintoeLogin();
      return false;
    }
    return true;
  } catch {
    redirectToPrintoeLogin();
    return false;
  }
}
