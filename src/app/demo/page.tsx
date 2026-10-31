import Script from "next/script";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Barra superior demo */}
      <div className="bg-teal-700 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Vista previa interactiva — Web de ejemplo con el widget de chat instalado</span>
        </div>
        <a
          href="/"
          className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-[11px] transition-colors"
        >
          ← Volver al Panel
        </a>
      </div>

      {/* Cabecera web de la clínica */}
      <header className="bg-white border-b border-slate-200 py-6 px-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-xl">
              L
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Clínica Dental Lumen
              </h1>
              <p className="text-xs text-slate-500">
                Odontología avanzada y estética dental · Madrid
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-xs font-medium text-slate-600">
            <span>Tratamientos</span>
            <span>Equipo médico</span>
            <span>Financiación</span>
            <span className="text-teal-700 font-bold">Tel: 912 345 678</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="max-w-2xl space-y-6">
          <span className="inline-block px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-semibold">
            Primera visita y radiografía 100% gratuita
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Cuidamos de tu sonrisa con tecnología y cercanía.
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Somos especialistas en ortodoncia invisible, implantes y estética dental sin dolor. Consulta con nuestro asistente virtual abajo a la derecha para pedir cita en tiempo real o resolver cualquier consulta.
          </p>
        </div>
      </main>

      {/* Inyección del script del widget */}
      <Script src="/widget.js" strategy="afterInteractive" />
    </div>
  );
}
