function App() {
  return (
    <main className="min-h-screen bg-stone-50 text-slate-800"> 
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <span className="mb-4 inline-flex w-fit rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
          Counselling practice
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
          Calm, professional support for life’s difficult moments.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          This public-facing website is being scaffolded for Mike&apos;s counselling practice. The first milestone establishes the foundation for a responsive marketing site, secure admin flows and a production-minded data model.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#contact"
            className="rounded-full bg-brand-700 px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            Get in touch
          </a>
          <a
            href="#about"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
          >
            Learn more
          </a>
        </div>
      </section>
    </main>
  );
}

export default App;
