import Link from "next/link";
import {
  ShieldCheck,
  Search,
  ClipboardList,
  MessagesSquare,
  HardHat,
  FileText,
  BarChart3,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";

const FEATURE_ICONS = [Search, ClipboardList, MessagesSquare, BarChart3, HardHat, FileText];
const HOW_ICONS = [ClipboardList, BarChart3, FileText];

export default async function Landing() {
  const t = await getDictionary();
  const l = t.landing;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold">HSE Dashboard</p>
              <p className="hidden text-[10px] text-muted-foreground sm:block">{t.brand.tagline}</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">{l.nav.features}</a>
            <a href="#how" className="transition-colors hover:text-foreground">{l.nav.howItWorks}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/login">
              <Button>{l.nav.signIn}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {l.hero.badge}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {l.hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            {l.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="h-11 px-6">
                {l.hero.ctaPrimary}
                <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="h-11 px-6">
                {l.hero.ctaSecondary}
                <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
              </Button>
            </a>
          </div>
          <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {l.hero.assurance}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {l.stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">{l.featuresTitle}</h2>
          <p className="mt-3 text-muted-foreground">{l.featuresSubtitle}</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {l.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">{l.howTitle}</h2>
            <p className="mt-3 text-muted-foreground">{l.howSubtitle}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {l.how.map((step, i) => {
              const Icon = HOW_ICONS[i % HOW_ICONS.length];
              return (
                <div key={step.title} className="relative rounded-xl border bg-background p-6">
                  <span className="absolute end-4 top-4 text-4xl font-extrabold text-primary/15">
                    {i + 1}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground md:py-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{l.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm opacity-90 md:text-base">{l.ctaSubtitle}</p>
          <div className="mt-7">
            <Link href="/login">
              <Button
                size="lg"
                className="h-11 bg-primary-foreground px-6 text-primary hover:bg-primary-foreground/90"
              >
                {t.common.signIn}
                <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">HSE Dashboard</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">© {new Date().getFullYear()} HSE Dashboard.</span>
            <span>{l.footer.rights}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}