import { FormEvent, useState } from "react";

const WEBHOOK = import.meta.env.VITE_NEWSLETTER_WEBHOOK;

export function Newsletter({
  defaultCity = "amba",
  compact = false,
}: {
  defaultCity?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

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
        {!compact && <h2>El brief de 3 minutos.</h2>}
        {!compact && (
        <p>
          Un correo corto cuando el mercado se mueve de verdad: regulación,
          precio del m² publicado, costo de construcción y señales de oferta.
          Sin tips genéricos. Sin newsletter semanal vacía.
        </p>
        )}
        {status === "ok" ? (
          <p className="fine">Listo. Te escribimos cuando haya un movimiento sustancial.</p>
        ) : (
          <form className="form" onSubmit={onSubmit}>
            <div className="form-row">
              <input name="name" placeholder="Nombre" autoComplete="name" />
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                autoComplete="email"
              />
            </div>
            <select name="city" defaultValue={defaultCity}>
              <option value="amba">Me interesa Buenos Aires · AMBA</option>
              <option value="cordoba">Córdoba — avisame cuando esté</option>
              <option value="rosario">Rosario — avisame cuando esté</option>
              <option value="mendoza">Mendoza — avisame cuando esté</option>
              <option value="bariloche">Bariloche — avisame cuando esté</option>
              <option value="all">Todo el país</option>
            </select>
            <button type="submit">Quiero el brief</button>
            {status === "err" && <p className="fine">Revisá el email.</p>}
            <p className="fine">
              Frecuencia irregular. Solo cuando hay un cambio que vale tres
              minutos. Podés salir en un clic.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
