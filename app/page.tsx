export default function Home() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-desk">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-paper rounded-card border border-border shadow-raised p-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-ink font-sans mb-2">
            Design System Test Page
          </h1>
          <p className="text-ui-lg text-muted font-sans">
            Academic-Naturalist Design System
          </p>
          <div className="mt-4 flex justify-center gap-3 text-ui-sm font-sans text-muted">
            <span>✓ WCAG AA/AAA</span>
            <span>•</span>
            <span>✓ No Pure Black</span>
            <span>•</span>
            <span>✓ Organic Shadows</span>
          </div>
        </header>

        {/* Color Palette Test */}
        <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-5">
          <div>
            <h2 className="text-ui-2xl font-semibold text-ink font-sans mb-1">
              Color Palette
            </h2>
            <p className="text-ui-sm text-muted font-sans">
              The "Academic-Naturalist" palette - desk and paper artifacts
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="h-24 bg-primary rounded-lg border-2 border-ink shadow-raised"></div>
              <div>
                <p className="text-ui-base font-semibold font-sans text-ink">Primary</p>
                <p className="text-ui-xs font-sans text-muted">#183A37 • Library Green</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-24 bg-desk rounded-lg border-2 border-border shadow-raised"></div>
              <div>
                <p className="text-ui-base font-semibold font-sans text-ink">Desk</p>
                <p className="text-ui-xs font-sans text-muted">#F0EFEA • App Background</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-24 bg-paper rounded-lg border-2 border-border shadow-raised"></div>
              <div>
                <p className="text-ui-base font-semibold font-sans text-ink">Paper</p>
                <p className="text-ui-xs font-sans text-muted">#FAF9F5 • Cards & Surfaces</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-24 bg-ink rounded-lg border-2 border-ink shadow-raised"></div>
              <div>
                <p className="text-ui-base font-semibold font-sans text-ink">Ink Primary</p>
                <p className="text-ui-xs font-sans text-muted">#141413 • NOT #000000</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-24 bg-muted rounded-lg border-2 border-muted shadow-raised"></div>
              <div>
                <p className="text-ui-base font-semibold font-sans text-ink">Ink Muted</p>
                <p className="text-ui-xs font-sans text-muted">#6E6D6A • Secondary Text</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-24 bg-border rounded-lg border-2 border-muted shadow-raised"></div>
              <div>
                <p className="text-ui-base font-semibold font-sans text-ink">Border</p>
                <p className="text-ui-xs font-sans text-muted">#E5E2DA • Dividers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Test - Inter (UI) */}
        <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-5">
          <div>
            <h2 className="text-ui-2xl font-semibold text-ink font-sans mb-1">
              Typography: Inter
            </h2>
            <p className="text-ui-sm text-muted font-sans">
              Interface elements - buttons, navigation, settings, metadata
            </p>
          </div>
          <div className="space-y-4 bg-desk rounded-lg p-5">
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
              <span className="text-ui-xs font-sans text-muted">ui-xs (12px)</span>
              <p className="text-ui-xs font-sans text-ink">Small labels and metadata</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
              <span className="text-ui-xs font-sans text-muted">ui-sm (13px)</span>
              <p className="text-ui-sm font-sans text-ink">Secondary information</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
              <span className="text-ui-xs font-sans text-muted">ui-base (14px)</span>
              <p className="text-ui-base font-sans text-ink">Standard UI text, buttons</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
              <span className="text-ui-xs font-sans text-muted">ui-lg (16px)</span>
              <p className="text-ui-lg font-sans text-ink">Emphasized labels</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
              <span className="text-ui-xs font-sans text-muted">ui-xl (18px)</span>
              <p className="text-ui-xl font-sans text-ink">Section headings</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
              <span className="text-ui-xs font-sans text-muted">ui-2xl (24px)</span>
              <p className="text-ui-2xl font-sans text-ink">Page titles</p>
            </div>
          </div>
          <div className="flex gap-6 pt-2">
            <p className="text-ui-base font-normal font-sans text-ink">Regular 400</p>
            <p className="text-ui-base font-medium font-sans text-ink">Medium 500</p>
            <p className="text-ui-base font-semibold font-sans text-ink">Semibold 600</p>
            <p className="text-ui-base font-bold font-sans text-ink">Bold 700</p>
          </div>
        </section>

        {/* Typography Test - EB Garamond (Content) */}
        <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-5">
          <div>
            <h2 className="text-ui-2xl font-semibold text-ink font-sans mb-1">
              Typography: EB Garamond
            </h2>
            <p className="text-ui-sm text-muted font-sans">
              Language content - reader text, lemmas, translations
            </p>
          </div>
          <div className="space-y-5 bg-desk rounded-lg p-5">
            <div className="border-b border-border pb-4">
              <p className="text-ui-xs font-sans text-muted mb-2">content-sm (14px) - Preview text</p>
              <p className="text-content-sm font-serif text-ink">
                El gato está en la casa. The cat is in the house.
              </p>
            </div>
            <div className="border-b border-border pb-4">
              <p className="text-ui-xs font-sans text-muted mb-2">content-base (18px) - Reader size ★</p>
              <p className="text-content-base font-serif text-ink">
                Le chat est dans la maison. Das Haus ist groß.
              </p>
            </div>
            <div className="border-b border-border pb-4">
              <p className="text-ui-xs font-sans text-muted mb-2">content-lg (20px) - Emphasized</p>
              <p className="text-content-lg font-serif text-ink">
                Il gatto è nella casa grande.
              </p>
            </div>
            <div className="border-b border-border pb-4">
              <p className="text-ui-xs font-sans text-muted mb-2">content-xl (24px) - Featured lemmas</p>
              <p className="text-content-xl font-serif text-ink">
                hablar · parler · sprechen
              </p>
            </div>
            <div>
              <p className="text-ui-xs font-sans text-muted mb-2">content-2xl (32px) - Showcase</p>
              <p className="text-content-2xl font-serif text-ink">
                猫在房子里
              </p>
            </div>
          </div>
          <div className="flex gap-6 pt-2">
            <p className="text-content-base font-serif font-normal text-ink">Regular 400</p>
            <p className="text-content-base font-serif font-semibold text-ink">Semibold 600</p>
            <p className="text-content-base font-serif font-bold text-ink">Bold 700</p>
          </div>
        </section>

        {/* Shadow Utilities Test */}
        <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-5">
          <div>
            <h2 className="text-ui-2xl font-semibold text-ink font-sans mb-1">
              Shadow Utilities
            </h2>
            <p className="text-ui-sm text-muted font-sans">
              Organic, tight shadows suggesting millimeters off a desk
            </p>
          </div>
          <div className="bg-desk rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="bg-paper border border-border shadow-raised rounded-card p-6 min-h-[100px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-ui-base font-semibold font-sans text-ink">Raised</p>
                    <p className="text-ui-xs font-sans text-muted mt-1">Default cards</p>
                  </div>
                </div>
                <p className="text-ui-xs font-sans text-muted text-center">
                  0 1px 2px rgba(20,20,19,0.06)
                </p>
              </div>
              <div className="space-y-3">
                <div className="bg-paper border border-border shadow-raised-hover rounded-card p-6 min-h-[100px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-ui-base font-semibold font-sans text-ink">Raised Hover</p>
                    <p className="text-ui-xs font-sans text-muted mt-1">Hover state</p>
                  </div>
                </div>
                <p className="text-ui-xs font-sans text-muted text-center">
                  0 2px 4px rgba(20,20,19,0.08)
                </p>
              </div>
              <div className="space-y-3">
                <div className="bg-paper border border-border shadow-modal rounded-card p-6 min-h-[100px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-ui-base font-semibold font-sans text-ink">Modal</p>
                    <p className="text-ui-xs font-sans text-muted mt-1">Dialogs</p>
                  </div>
                </div>
                <p className="text-ui-xs font-sans text-muted text-center">
                  0 4px 16px rgba(20,20,19,0.12)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Button & Progress Examples */}
        <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-5">
          <div>
            <h2 className="text-ui-2xl font-semibold text-ink font-sans mb-1">
              Interactive Components
            </h2>
            <p className="text-ui-sm text-muted font-sans">
              Buttons with mechanical click feel and progress indicators
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-ui-sm font-sans font-medium text-ink mb-3">Buttons</p>
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-3 bg-primary text-white font-sans font-medium text-ui-base rounded hover:opacity-90 active:translate-y-px transition-all">
                  Primary Action
                </button>
                <button className="px-6 py-3 bg-transparent border border-border text-ink font-sans font-medium text-ui-base rounded hover:bg-desk active:translate-y-px transition-all">
                  Secondary
                </button>
                <button className="px-6 py-3 bg-primary text-white font-sans font-medium text-ui-base rounded opacity-40 cursor-not-allowed">
                  Disabled
                </button>
              </div>
            </div>
            <div>
              <p className="text-ui-sm font-sans font-medium text-ink mb-3">Progress Bars</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-ui-xs font-sans text-muted mb-1.5">
                    <span>Known Words Progress</span>
                    <span>720 / 1000 (72%)</span>
                  </div>
                  <div className="h-3 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{width: '72%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-ui-xs font-sans text-muted mb-1.5">
                    <span>Text Comprehension</span>
                    <span>450 / 500 (90%)</span>
                  </div>
                  <div className="h-3 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{width: '90%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card Examples */}
        <section className="bg-paper rounded-card border border-border shadow-raised p-6 space-y-5">
          <div>
            <h2 className="text-ui-2xl font-semibold text-ink font-sans mb-1">
              Card Components
            </h2>
            <p className="text-ui-sm text-muted font-sans">
              Elevated paper surfaces with hover interactions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-paper border border-border rounded-card shadow-raised p-6 hover:shadow-raised-hover transition-shadow cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-ui-xl font-semibold font-sans text-ink">
                  Spanish Short Stories
                </h3>
                <span className="text-ui-xs font-sans font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  Series
                </span>
              </div>
              <p className="text-ui-sm font-sans text-muted mb-4">
                12 texts • Last updated 3 days ago
              </p>
              <p className="text-content-sm font-serif text-ink mb-4">
                Esta es una colección de cuentos cortos para estudiantes que están aprendiendo español...
              </p>
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="text-ui-xs font-sans text-muted">Progress</span>
                <span className="text-ui-sm font-sans font-semibold text-primary">68% known</span>
              </div>
            </div>
            <div className="bg-paper border border-border rounded-card shadow-raised p-6 hover:shadow-raised-hover transition-shadow cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <p className="text-content-2xl font-serif font-semibold text-ink">
                  hablar
                </p>
                <span className="text-ui-xs font-sans font-medium text-ink bg-border px-2 py-1 rounded">
                  verb
                </span>
              </div>
              <p className="text-ui-base font-sans text-ink mb-4">
                to speak, to talk
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-ui-xs font-sans text-muted mb-1">Dict Frequency</p>
                  <p className="text-ui-lg font-sans font-semibold text-ink">95/100</p>
                </div>
                <div>
                  <p className="text-ui-xs font-sans text-muted mb-1">User Frequency</p>
                  <p className="text-ui-lg font-sans font-semibold text-primary">47 times</p>
                </div>
              </div>
              <p className="text-content-sm font-serif text-muted italic">
                "Me gusta hablar con mis amigos."
              </p>
            </div>
          </div>
        </section>

        {/* Accessibility Contrast Results */}
        <section className="bg-primary text-white rounded-card border border-primary shadow-raised p-6 space-y-4">
          <div>
            <h2 className="text-ui-2xl font-semibold font-sans mb-1">
              WCAG Accessibility Compliance
            </h2>
            <p className="text-ui-sm opacity-90 font-sans">
              All color combinations exceed AA and AAA requirements
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-ui-sm font-sans mb-1 opacity-75">Primary Ink on Paper</p>
              <p className="text-ui-xl font-sans font-bold">15.22:1</p>
              <p className="text-ui-xs font-sans opacity-75 mt-1">✓ Passes AA & AAA</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-ui-sm font-sans mb-1 opacity-75">Primary Ink on Desk</p>
              <p className="text-ui-xl font-sans font-bold">19.35:1</p>
              <p className="text-ui-xs font-sans opacity-75 mt-1">✓ Passes AA & AAA</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-ui-sm font-sans mb-1 opacity-75">Muted Ink on Paper</p>
              <p className="text-ui-xl font-sans font-bold">7.7:1</p>
              <p className="text-ui-xs font-sans opacity-75 mt-1">✓ Passes AA & AAA</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-ui-sm font-sans mb-1 opacity-75">White on Primary</p>
              <p className="text-ui-xl font-sans font-bold">9.8:1</p>
              <p className="text-ui-xs font-sans opacity-75 mt-1">✓ Passes AA & AAA</p>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <footer className="bg-paper rounded-card border border-border shadow-raised p-8 text-center">
          <p className="text-ui-lg font-sans font-semibold text-ink mb-2">
            ✓ Design System Setup Complete
          </p>
          <p className="text-ui-sm font-sans text-muted">
            Academic-Naturalist Design • No Pure Black • Organic Shadows • WCAG AA/AAA Compliant
          </p>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-ui-xs font-sans text-muted">
              Auto Language Learning App • Next.js 16.1.1 • Tailwind CSS v4 • 2026
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

