import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getDictionary } from "@/lib/i18n";
import { ShieldCheck, HardHat, ClipboardCheck } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const t = await getDictionary();
  const oauthProviders: ("google" | "linkedin")[] = [];
  if (process.env.GOOGLE_CLIENT_ID) oauthProviders.push("google");
  if (process.env.LINKEDIN_CLIENT_ID) oauthProviders.push("linkedin");

  const features = [
    { icon: <ShieldCheck className="h-4 w-4" />, label: t.login.featureFindings },
    { icon: <HardHat className="h-4 w-4" />, label: t.login.featurePpe },
    { icon: <ClipboardCheck className="h-4 w-4" />, label: t.login.featurePermits },
  ];

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center p-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-primary p-8 text-primary-foreground md:flex">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">HSE Dashboard</p>
                <p className="text-xs opacity-80">{t.brand.tagline}</p>
              </div>
            </div>
            <h1 className="mt-8 text-2xl font-bold leading-tight">{t.login.panelTitle}</h1>
          </div>
          <ul className="space-y-2 text-sm">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-2">
                {f.icon}
                {f.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-8">
          <div className="mb-6 md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="font-bold">HSE Dashboard</p>
            </div>
          </div>
          <h2 className="text-xl font-bold">{t.login.heading}</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">{t.login.subtitle}</p>
          {oauthProviders.length === 0 && (
            <p className="mb-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              {t.login.oauthUnavailable}
            </p>
          )}
          <LoginForm oauthProviders={oauthProviders} />
          <div className="mt-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">{t.login.demoTitled}</p>
            <p>{t.login.demoAdmin}</p>
            <p>{t.login.demoEditor}</p>
            <p>{t.login.demoViewer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}