"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { useTranslation } from "@/lib/i18n/i18n-provider";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("resetPassword.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("resetPassword.passwordsDontMatch"));
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      toast.success(t("resetPassword.resetSuccessToast"));
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("resetPassword.linkInvalidOrExpired"));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {t("resetPassword.tokenMissing")}
        </p>
        <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline text-sm">
          {t("resetPassword.requestNewLink")}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <p className="rounded-md bg-primary/10 p-3 text-sm">{t("resetPassword.resetDone")}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="space-y-2">
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
          <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline text-sm">
            {t("resetPassword.requestNewLink")}
          </Link>
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          {t("resetPassword.newPassword")}
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
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="confirmPassword">
          {t("resetPassword.confirmNewPassword")}
        </label>
        <PasswordInput
          id="confirmPassword"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-10"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("resetPassword.resetting") : t("resetPassword.resetPassword")}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t("resetPassword.title")}</CardTitle>
            <CardDescription>{t("resetPassword.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={<p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
            >
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
