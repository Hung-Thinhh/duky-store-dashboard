"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconGripVertical,
  IconLock,
  IconLockOpen,
  IconPlus,
  IconTrash,
  IconPhoto,
  IconTypography,
  IconClick,
  IconLayersIntersect,
  IconLayoutSidebar,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SlideLayer, LayerType } from "@/app/(dashboard)/hero-slider/types"

// ─── Types ────────────────────────────────────────────────────────────────

interface FloatingLayersPanelProps {
  layers: SlideLayer[]
  selectedLayerIndex: number | null
  onSelectLayer: (index: number | null) => void
  onAddLayer: (type: LayerType) => void
  onRemoveLayer: (index: number) => void
  onReorderLayers: (oldIndex: number, newIndex: number) => void
  onUpdateLayer: (layerIndex: number, updater: (l: SlideLayer) => SlideLayer) => void
  onToggleLayerLock: (layerIndex: number) => void
  onClose: () => void
}

const TYPE_ICONS: Record<string, string> = {
  image: "🖼️",
  text: "📝",
  button: "🔘",
}

// ─── Sortable Layer Item ──────────────────────────────────────────────────

function SortableLayerItem({
  layer,
  index,
  isSelected,
  onSelect,
  onRemove,
  onRename,
  onToggleLock,
}: {
  layer: SlideLayer
  index: number
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
  onRename: (name: string) => void
  onToggleLock: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `layer-${index}` })

  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const displayName = layer.name || layer.type

  const startRename = () => {
    setEditValue(layer.name || "")
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitRename = () => {
    setIsEditing(false)
    onRename(editValue.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitRename()
    if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(layer.name || "")
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2 rounded-xl border p-2 cursor-pointer transition-all select-none overflow-hidden ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5 font-medium"
          : "border-muted hover:border-muted-foreground bg-card"
      }`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="touch-none shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="size-3.5" />
      </button>

      {/* Thumbnail or Icon */}
      {layer.src ? (
        <img src={layer.src} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xs border">
          {TYPE_ICONS[layer.type] ?? "📦"}
        </div>
      )}

      {/* Layer Name / Z-index */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-5 text-[10px] px-1 rounded-sm w-full"
            placeholder={layer.type}
          />
        ) : (
          <p
            className="text-[11px] font-semibold truncate capitalize leading-tight"
            onDoubleClick={(e) => {
              e.stopPropagation()
              startRename()
            }}
            title="Double-click để đổi tên"
          >
            {displayName}
          </p>
        )}
        <p className="text-[9px] text-muted-foreground truncate mt-0.5">
          z-index: {layer.zIndex}
        </p>
      </div>

      {/* Hover action overlay */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="size-5 shrink-0 rounded-md"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock()
          }}
          title={layer.locked ? "Unlock layer" : "Lock layer"}
        >
          {layer.locked ? (
            <IconLock className="size-3 text-orange-500" />
          ) : (
            <IconLockOpen className="size-3 text-muted-foreground" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="size-5 text-destructive shrink-0 rounded-md hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <IconTrash className="size-3" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Floating Panel Component ───────────────────────────────────────

export function FloatingLayersPanel({
  layers,
  selectedLayerIndex,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onReorderLayers,
  onUpdateLayer,
  onToggleLayerLock,
  onClose,
}: FloatingLayersPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const layerIdPattern = /^layer-(\d+)$/
    const oldMatch = String(active.id).match(layerIdPattern)
    const newMatch = String(over.id).match(layerIdPattern)
    if (oldMatch && newMatch) {
      const oldIndex = parseInt(oldMatch[1], 10)
      const newIndex = parseInt(newMatch[1], 10)
      if (oldIndex !== newIndex) {
        onReorderLayers(oldIndex, newIndex)
      }
    }
  }

  return (
    <div className="absolute top-4 left-4 z-30 w-64 h-[420px] bg-background/80 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5">
          <IconLayersIntersect className="size-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Danh sách Layer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-bold">
            {layers.length}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={onClose}
            title="Đóng danh sách Layer"
          >
            <IconLayoutSidebar className="size-4" />
          </Button>
        </div>
      </div>

      {/* Add buttons */}
      <div className="p-2 border-b grid grid-cols-3 gap-1 shrink-0 bg-muted/10">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddLayer("image")}
          className="h-8 rounded-lg text-[10px] flex items-center justify-center gap-1 hover:border-primary shrink-0 bg-background/50"
        >
          <IconPlus className="size-3 text-muted-foreground" />
          <IconPhoto className="size-3 text-muted-foreground" />
          <span>Ảnh</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddLayer("text")}
          className="h-8 rounded-lg text-[10px] flex items-center justify-center gap-1 hover:border-primary shrink-0 bg-background/50"
        >
          <IconPlus className="size-3 text-muted-foreground" />
          <IconTypography className="size-3 text-muted-foreground" />
          <span>Chữ</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddLayer("button")}
          className="h-8 rounded-lg text-[10px] flex items-center justify-center gap-1 hover:border-primary shrink-0 bg-background/50"
        >
          <IconPlus className="size-3 text-muted-foreground" />
          <IconClick className="size-3 text-muted-foreground" />
          <span>Nút</span>
        </Button>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 min-h-0 select-none">
        <ScrollArea className="h-full">
          <div className="p-2.5 space-y-1.5">
            {layers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <IconLayersIntersect className="size-6 text-muted-foreground/30 mb-1" />
                <span className="text-[10px]">Chưa có layer nào</span>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={layers.map((_, i) => `layer-${i}`) ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  {layers.map((layer, index) => (
                    <SortableLayerItem
                      key={`layer-${index}`}
                      layer={layer}
                      index={index}
                      isSelected={selectedLayerIndex === index}
                      onSelect={() => onSelectLayer(index)}
                      onRemove={() => onRemoveLayer(index)}
                      onRename={(name) =>
                        onUpdateLayer(index, (l) => ({ ...l, name }))
                      }
                      onToggleLock={() => onToggleLayerLock(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
