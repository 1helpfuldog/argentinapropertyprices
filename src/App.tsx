import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { AmbaMap } from "./pages/AmbaMap";
import { LangProvider } from "./lib/lang";
import { SoundDock } from "./components/SoundDock";

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/amba" element={<AmbaMap />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <SoundDock />
    </LangProvider>
  );
}
