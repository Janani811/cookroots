import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { api, type GroceryList } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function GroceryListDetailScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    if (authLoading || !listId) return;
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }
    api
      .getGroceryList(listId)
      .then((data) => {
        setList(data);
        setNameDraft(data.name);
      })
      .catch(() => setList(null))
      .finally(() => setLoading(false));
  }, [listId, user, authLoading]);

  async function handleToggle(itemId: string, checked: boolean) {
    setList((prev) =>
      prev ? { ...prev, items: prev.items?.map((i) => (i.id === itemId ? { ...i, isChecked: checked } : i)) } : prev
    );
    try {
      await api.toggleGroceryItem(itemId, checked);
    } catch (err) {
      setList((prev) =>
        prev
          ? { ...prev, items: prev.items?.map((i) => (i.id === itemId ? { ...i, isChecked: !checked } : i)) }
          : prev
      );
      alert(err instanceof Error ? err.message : "Failed to update item");
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
      setEditingName(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename list");
    } finally {
      setRenaming(false);
    }
  }

  function confirmDelete() {
    if (!list) return;
    Alert.alert("Delete this grocery list?", `This will permanently delete "${list.name}" and all its items.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await api.deleteGroceryList(listId);
            router.replace("/grocery");
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete list");
            setDeleting(false);
          }
        },
      },
    ]);
  }

  async function handleAddItem() {
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      const item = await api.addGroceryItem(listId, newItemName.trim(), newItemQuantity.trim() || undefined);
      setList((prev) => (prev ? { ...prev, items: [...(prev.items ?? []), item] } : prev));
      setNewItemName("");
      setNewItemQuantity("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setAddingItem(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await api.removeGroceryItem(itemId);
      setList((prev) => (prev ? { ...prev, items: prev.items?.filter((i) => i.id !== itemId) } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove item");
    }
  }

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <ActivityIndicator size="large" color="#4C9A2A" />
      </View>
    );
  }

  if (!list) {
    return (
      <ScreenContainer>
        <Text className="text-danger">List not found.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-row items-start justify-between gap-3">
        {editingName ? (
          <View className="flex-1 flex-row items-center gap-2">
            <Input value={nameDraft} onChangeText={setNameDraft} autoFocus className="flex-1" />
            <Button size="sm" fullWidth={false} onPress={handleRename} loading={renaming}>
              Save
            </Button>
          </View>
        ) : (
          <Pressable className="flex-1" onPress={() => setEditingName(true)}>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{list.name}</Text>
          </Pressable>
        )}
        <Pressable onPress={confirmDelete} disabled={deleting} hitSlop={8}>
          <MaterialCommunityIcons name="trash-can-outline" size={22} color="#a3a3a3" />
        </Pressable>
      </View>

      <View className="mt-6">
        {list.items && list.items.length > 0 ? (
          list.items.map((item) => (
            <View key={item.id} className="flex-row items-center gap-3 border-b border-neutral-100 py-3">
              <Pressable onPress={() => handleToggle(item.id, !item.isChecked)} hitSlop={8}>
                <MaterialCommunityIcons
                  name={item.isChecked ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={22}
                  color={item.isChecked ? "#4C9A2A" : "#a3a3a3"}
                />
              </Pressable>
              <Text className={`flex-1 ${item.isChecked ? "text-neutral-400 line-through" : "text-neutral-900 dark:text-neutral-50"}`}>
                {item.quantity ? `${item.quantity} ` : ""}
                {item.name}
              </Text>
              <Pressable onPress={() => handleRemoveItem(item.id)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={18} color="#a3a3a3" />
              </Pressable>
            </View>
          ))
        ) : (
          <Text className="text-neutral-500 dark:text-neutral-400">No items in this list</Text>
        )}
      </View>

      <View className="mt-4 flex-row items-center gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-4">
        <Input value={newItemQuantity} onChangeText={setNewItemQuantity} placeholder="Qty" className="w-20" />
        <Input value={newItemName} onChangeText={setNewItemName} placeholder="Add an item..." className="flex-1" />
        <Button size="sm" fullWidth={false} onPress={handleAddItem} loading={addingItem} disabled={!newItemName.trim()}>
          + Add
        </Button>
      </View>
    </ScreenContainer>
  );
}
