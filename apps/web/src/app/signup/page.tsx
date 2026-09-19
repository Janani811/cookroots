"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
      router.push("/recipes/new");
    } catch {
      setError(t("signup.createAccountError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t("signup.title")}</CardTitle>
            <CardDescription>{t("signup.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  {t("signup.name")}
                </label>
                <input
                  id="name"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  {t("signup.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  {t("signup.password")}
                </label>
                <PasswordInput
                  id="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("signup.creatingAccount") : t("signup.signUp")}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("signup.alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                {t("signup.logIn")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
