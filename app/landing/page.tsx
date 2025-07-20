// app/landing/page.tsx
'use client'

// IMPORTAMOS COMPONENTES DE LA LANDING
import HowItWorks from "./components/HowItWorks";

// Luego agregaremos el Hero y otros bloques

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center">
      {/* BLOQUE 1 - Hero (se agregará luego) */}
      {/* <Hero /> */}

      {/* BLOQUE 2 - ¿Cómo funciona CeoBot? */}
      <HowItWorks />
    </main>
  );
}
