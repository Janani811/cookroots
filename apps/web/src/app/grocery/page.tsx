"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Trash2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, type GroceryList } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export default function GroceryListsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    api
      .getGroceryListsForUser(user.id)
      .then(setLists)
      .catch((err) =>
        setError(err instanceof Error ? err.message : t("grocery.failedToLoadLists"))
      )
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  function requestDelete(e: React.MouseEvent, listId: string, name: string) {
    e.preventDefault();
    e.stopPropagation();
    setPendingDelete({ id: listId, name });
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const { id: listId } = pendingDelete;
    setDeletingId(listId);
    try {
      await api.deleteGroceryList(listId);
      setLists((prev) => prev.filter((l) => l.id !== listId));
      toast.success(t("grocery.listDeletedToast"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("grocery.deleteListFailed"));
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingCart className="size-5" />
          </div>
          <h1 className="text-3xl font-bold">{t("grocery.yourGroceryLists")}</h1>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">{t("common.loading")}</p>
        ) : lists.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShoppingCart className="size-6" />
            </div>
            <p className="text-muted-foreground mb-4">{t("grocery.noListsYet")}</p>
            <Link href="/recipes" className="text-primary hover:underline">
              {t("grocery.browseRecipes")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Link key={list.id} href={`/grocery/${list.id}`} className="group/card">
                <Card className="h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ShoppingCart className="size-4" />
                      </div>
                      <CardTitle className="line-clamp-2 pt-1 transition-colors group-hover/card:text-primary">
                        {list.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === list.id}
                      onClick={(e) => requestDelete(e, list.id, list.name)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {t("grocery.created", { date: new Date(list.createdAt).toLocaleDateString() })}
                    </span>
                    <ChevronRight className="size-4 transition-transform group-hover/card:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("groceryList.deleteDialogTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("groceryList.deleteDialogBody", { name: pendingDelete?.name ?? "" })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingId === pendingDelete?.id}
            >
              {deletingId === pendingDelete?.id ? t("groceryList.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
