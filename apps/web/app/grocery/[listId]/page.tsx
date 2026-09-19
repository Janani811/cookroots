"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api, type GroceryList } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export default function GroceryListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const listId = params.listId as string;

  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    api
      .getGroceryList(listId)
      .then((data) => {
        setList(data);
        setNameDraft(data.name);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : t("groceryList.failedToLoad"))
      )
      .finally(() => setLoading(false));
  }, [listId, user, authLoading, router]);

  async function handleToggle(itemId: string, checked: boolean) {
    // optimistic update
    setList((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items?.map((item) =>
              item.id === itemId ? { ...item, isChecked: checked } : item
            ),
          }
        : prev
    );

    try {
      await api.toggleGroceryItem(itemId, checked);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groceryList.updateItemFailed"));
      // revert on failure
      setList((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items?.map((item) =>
                item.id === itemId ? { ...item, isChecked: !checked } : item
              ),
            }
          : prev
      );
    }
  }

  async function handleRename() {
    if (!list || !nameDraft.trim() || nameDraft === list.name) {
      setEditingName(false);
      return;
    }

    setRenaming(true);
    try {
      const updated = await api.renameGroceryList(listId, nameDraft.trim());
      setList((prev) => (prev ? { ...prev, name: updated.name } : prev));
      toast.success(t("groceryList.listRenamedToast"));
      setEditingName(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groceryList.renameFailed"));
    } finally {
      setRenaming(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteGroceryList(listId);
      toast.success(t("grocery.listDeletedToast"));
      router.push("/grocery");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("grocery.deleteListFailed"));
      setDeleting(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setAddingItem(true);
    try {
      const item = await api.addGroceryItem(
        listId,
        newItemName.trim(),
        newItemQuantity.trim() || undefined
      );
      setList((prev) => (prev ? { ...prev, items: [...(prev.items ?? []), item] } : prev));
      setNewItemName("");
      setNewItemQuantity("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groceryList.addItemFailed"));
    } finally {
      setAddingItem(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    setRemovingItemId(itemId);
    try {
      await api.removeGroceryItem(itemId);
      setList((prev) =>
        prev ? { ...prev, items: prev.items?.filter((item) => item.id !== itemId) } : prev
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("groceryList.removeItemFailed"));
    } finally {
      setRemovingItemId(null);
    }
  }

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-destructive">{error || t("groceryList.listNotFound")}</p>
          <Link href="/grocery" className={cn(buttonVariants())}>
            {t("groceryList.backToLists")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          {editingName ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setNameDraft(list.name);
                    setEditingName(false);
                  }
                }}
                autoFocus
                className="text-2xl font-bold h-auto py-1"
              />
              <Button size="sm" onClick={handleRename} disabled={renaming}>
                {t("common.save")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNameDraft(list.name);
                  setEditingName(false);
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <h1
              className="text-3xl font-bold cursor-pointer hover:underline decoration-dashed underline-offset-4"
              onClick={() => setEditingName(true)}
              title={t("groceryList.clickToRename")}
            >
              {list.name}
            </h1>
          )}

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              🗑 {t("common.delete")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("groceryList.deleteDialogTitle")}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {t("groceryList.deleteDialogBody", { name: list.name })}
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? t("groceryList.deleting") : t("common.delete")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("groceryList.itemsLabel")}</CardTitle>
          </CardHeader>
          <CardContent>
            {list.items && list.items.length > 0 ? (
              <ul className="space-y-3 mb-4">
                {list.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-0">
                    <Checkbox
                      checked={item.isChecked}
                      onCheckedChange={(checked) => handleToggle(item.id, checked)}
                    />
                    <span
                      className={cn(
                        "flex-1 transition-all duration-200",
                        item.isChecked && "line-through text-muted-foreground opacity-60"
                      )}
                    >
                      {item.quantity ? `${item.quantity} ` : ""}
                      {item.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={removingItemId === item.id}
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mb-4">{t("groceryList.noItems")}</p>
            )}

            <form onSubmit={handleAddItem} className="flex gap-2 pt-2 border-t">
              <Input
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder={t("recipeNew.qty")}
                className="w-20"
              />
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={t("groceryList.addItemPlaceholder")}
                className="flex-1"
              />
              <Button type="submit" disabled={addingItem || !newItemName.trim()}>
                {t("recipeNew.addButton")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
