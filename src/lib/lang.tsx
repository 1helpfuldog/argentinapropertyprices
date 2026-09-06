import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { copy, type Copy, type Lang } from "./i18n";

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Copy } | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = localStorage.getItem("app.lang");
    if (stored === "en" || stored === "es") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("app.lang", l);
  };

  const value = useMemo(() => ({ lang, setLang, t: copy[lang] }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="chip">
      <button type="button" className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>
        ES
      </button>
      <button type="button" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
        EN
      </button>
    </div>
  );
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("LangProvider missing");
  return ctx;
}
