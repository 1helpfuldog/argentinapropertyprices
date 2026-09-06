import { useEffect, useState } from "react";
import { armSoundtrack, setSoundWanted, soundWanted, startSoundtrack } from "../lib/soundtrack";
import { useLang } from "../lib/lang";

export function SoundDock() {
  const { t } = useLang();
  const [on, setOn] = useState(true);

  useEffect(() => {
    const wanted = soundWanted();
    setOn(wanted);
    armSoundtrack();
    if (wanted) void startSoundtrack();
  }, []);

  return (
    <button
      className="sound-dock"
      type="button"
      aria-pressed={on}
      aria-label={on ? t.mute : t.unmute}
      title={on ? t.mute : t.unmute}
      onClick={() => {
        const next = !on;
        setOn(next);
        setSoundWanted(next);
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
        {on ? (
          <path
            fill="currentColor"
            d="M4 9v6h3l4 4V5L7 9H4zm11.5 3a3.5 3.5 0 0 0-1.8-3.1v6.2A3.5 3.5 0 0 0 15.5 12zm0-8v2.1A7.4 7.4 0 0 1 20 12a7.4 7.4 0 0 1-4.5 5.9V20A9.5 9.5 0 0 0 22 12a9.5 9.5 0 0 0-6.5-8z"
          />
        ) : (
          <path
            fill="currentColor"
            d="M4 9v6h3l4 4V5L7 9H4zm12.5 1.1 1.4-1.4 1.4 1.4 1.4-1.4 1.4 1.4-1.4 1.4 1.4 1.4-1.4 1.4-1.4-1.4-1.4 1.4-1.4-1.4 1.4-1.4-1.4-1.4z"
          />
        )}
      </svg>
    </button>
  );
}
