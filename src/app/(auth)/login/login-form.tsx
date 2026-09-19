"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";
import { useLocale } from "@/components/i18n/locale-provider";
import { OAuthButtons } from "./oauth-buttons";

export function LoginForm({ oauthProviders }: { oauthProviders: ("google" | "linkedin")[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError(t.login.invalidCredentials);
      return;
    }
    router.push(searchParams?.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {oauthProviders.length > 0 && (
        <>
          <OAuthButtons providers={oauthProviders} />
          <div className="relative my-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>{t.login.oauthDivider}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t.login.emailLabel}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.login.emailPlaceholder}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t.login.passwordLabel}</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Spinner />}
          {loading ? t.login.signingIn : t.common.signIn}
        </Button>
      </form>
    </div>
  );
}