export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-xs font-semibold tracking-[0.2em] text-sky-400 uppercase">Miru</p>
      <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">
        Miru-Ecommerce — en construcción
      </h1>
      <p className="max-w-md text-sm text-slate-400 sm:text-base">
        Plataforma de pedidos, garantías, transportadoras y finanzas. Placeholder del scaffold:
        todavía no hay conexión con Supabase.
      </p>
    </main>
  );
}
