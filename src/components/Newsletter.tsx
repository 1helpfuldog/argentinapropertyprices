import { FormEvent, useState } from "react";
import { useLang } from "../lib/lang";

const WEBHOOK = import.meta.env.VITE_NEWSLETTER_WEBHOOK;

export function Newsletter({
  defaultCity = "amba",
  compact = false,
}: {
  defaultCity?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const { t } = useLang();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") || "").trim(),
      name: String(form.get("name") || "").trim(),
      city: String(form.get("city") || defaultCity),
      source: "landing",
      ts: new Date().toISOString(),
    };
    if (!payload.email.includes("@")) {
      setStatus("err");
      return;
    }

    const local = JSON.parse(localStorage.getItem("app-waitlist") || "[]");
    local.push(payload);
    localStorage.setItem("app-waitlist", JSON.stringify(local));

    if (WEBHOOK) {
      try {
        await fetch(WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        /* still stored locally */
      }
    }
    setStatus("ok");
    e.currentTarget.reset();
  }

  return (
    <section className={compact ? "newsletter compact" : "newsletter"} id={compact ? undefined : "brief"}>
      <div className="newsletter-inner">
        {!compact && <h2>{t.briefTitle}</h2>}
        {!compact && <p>{t.briefBody}</p>}
        {status === "ok" ? (
          <p className="fine">{t.briefOk}</p>
        ) : (
          <form className="form" onSubmit={onSubmit}>
            <div className="form-row">
              <input name="name" placeholder={t.name} autoComplete="name" />
              <input name="email" type="email" required placeholder={t.email} autoComplete="email" />
            </div>
            <select name="city" defaultValue={defaultCity}>
              <option value="amba">{t.cityAmba}</option>
              <option value="cordoba">{t.cityCordoba}</option>
              <option value="rosario">{t.cityRosario}</option>
              <option value="mendoza">{t.cityMendoza}</option>
              <option value="bariloche">{t.cityBari}</option>
              <option value="all">{t.cityAll}</option>
            </select>
            <button type="submit">{t.briefCta}</button>
            {status === "err" && <p className="fine">{t.emailErr}</p>}
            <p className="fine">{t.briefFine}</p>
          </form>
        )}
      </div>
    </section>
  );
}
