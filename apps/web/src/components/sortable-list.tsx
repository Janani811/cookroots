"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-provider";

export type Keyed = { _key: string };

export function SortableList<T extends Keyed>({
  items,
  onReorder,
  renderItem,
  className,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item._key === active.id);
    const newIndex = items.findIndex((item) => item._key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item._key)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item, index) => (
            <SortableRow key={item._key} id={item._key}>
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-start gap-2", isDragging && "relative z-10 opacity-60")}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2 shrink-0 touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={t("common.dragToReorder")}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex flex-1 items-start gap-2">{children}</div>
    </div>
  );
}
