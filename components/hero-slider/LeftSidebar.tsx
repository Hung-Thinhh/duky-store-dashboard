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
  IconPhoto,
  IconPlus,
  IconTrash,
  IconLayersDifference,
  IconStack2,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SlideData, SlideLayer, LayerType, ViewportMode } from "@/app/(dashboard)/hero-slider/types"

// ─── Sortable Slide Item ──────────────────────────────────────────────────

function SortableSlideItem({
  slide,
  index,
  isSelected,
  totalSlides,
  viewport,
  onSelect,
  onRemove,
}: {
  slide: SlideData
  index: number
  isSelected: boolean
  totalSlides: number
  viewport: ViewportMode
  onSelect: () => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const thumbnail = slide.layers[viewport].find((l) => l.src)?.src

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors select-none ${
        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <button
        type="button"
        className="touch-none shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="size-3 text-muted-foreground" />
      </button>

      {thumbnail ? (
        <img src={thumbnail} alt="" className="w-10 h-7 rounded object-cover shrink-0" />
      ) : (
        <div className="w-10 h-7 rounded bg-muted flex items-center justify-center shrink-0">
          <IconPhoto className="size-3 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium truncate">
          {slide.text.title || `Slide ${index + 1}`}
        </p>
        <span className="text-[9px] text-muted-foreground">
          {slide.layers[viewport].length} layer{slide.layers[viewport].length !== 1 ? "s" : ""}
        </span>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="size-5 text-destructive shrink-0"
        disabled={totalSlides <= 1}
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
      >
        <IconTrash className="size-2.5" />
      </Button>
    </div>
  )
}

// ─── Sortable Layer Item ──────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  image: "🖼️",
  text: "📝",
  button: "🔘",
}

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
      className={`flex items-center gap-1.5 rounded-lg border p-1.5 cursor-pointer transition-colors select-none ${
        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <button
        type="button"
        className="touch-none shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="size-3 text-muted-foreground" />
      </button>

      {layer.src ? (
        <img src={layer.src} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0 text-xs">
          {TYPE_ICONS[layer.type] ?? "📦"}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-5 text-[10px] px-1 rounded-sm"
            placeholder={layer.type}
          />
        ) : (
          <p
            className="text-[11px] font-medium truncate capitalize"
            onDoubleClick={(e) => {
              e.stopPropagation()
              startRename()
            }}
            title="Double-click để đổi tên"
          >
            {displayName}
          </p>
        )}
        <p className="text-[8px] text-muted-foreground truncate">
          {layer.alt || (layer.src ? "Có ảnh" : "Chưa có ảnh")}
        </p>
      </div>

      <span className="text-[8px] text-muted-foreground shrink-0">
        z:{layer.zIndex}
      </span>

      <Button
        size="icon"
        variant="ghost"
        className="size-4 shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          onToggleLock()
        }}
        title={layer.locked ? "Unlock layer" : "Lock layer"}
      >
        {layer.locked ? <IconLock className="size-2.5 text-orange-500" /> : <IconLockOpen className="size-2.5 text-muted-foreground" />}
      </Button>

      <Button
        size="icon"
        variant="ghost"
        className="size-4 text-destructive shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
      >
        <IconTrash className="size-2.5" />
      </Button>
    </div>
  )
}

// ─── LeftSidebar Component ────────────────────────────────────────────────

interface LeftSidebarProps {
  slides: SlideData[]
  selectedSlideIndex: number
  selectedLayerIndex: number | null
  viewport: ViewportMode
  onSelectSlide: (index: number) => void
  onSelectLayer: (index: number | null) => void
  onReorderSlides: (oldIndex: number, newIndex: number) => void
  onAddSlide: () => void
  onRemoveSlide: (index: number) => void
  onAddLayer: (type: LayerType) => void
  onRemoveLayer: (index: number) => void
  onReorderLayers: (oldIndex: number, newIndex: number) => void
  onUpdateLayer: (layerIndex: number, updater: (l: SlideLayer) => SlideLayer) => void
  onToggleLayerLock: (layerIndex: number) => void
}

export function LeftSidebar({
  slides,
  selectedSlideIndex,
  selectedLayerIndex,
  viewport,
  onSelectSlide,
  onSelectLayer,
  onReorderSlides,
  onAddSlide,
  onRemoveSlide,
  onAddLayer,
  onRemoveLayer,
  onReorderLayers,
  onUpdateLayer,
  onToggleLayerLock,
}: LeftSidebarProps) {
  const selectedSlide = slides[selectedSlideIndex]
  const currentLayers = selectedSlide?.layers[viewport] ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleSlideDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = slides.findIndex((s) => s.id === active.id)
    const newIndex = slides.findIndex((s) => s.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderSlides(oldIndex, newIndex)
    }
  }

  const handleLayerDragEnd = (event: DragEndEvent) => {
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
    <div className="w-[220px] border-r bg-card flex flex-col shrink-0">
      <Tabs defaultValue="slides" className="flex-1 flex flex-col min-h-0">
        <TabsList className="rounded-none border-b h-9 shrink-0">
          <TabsTrigger value="slides" className="text-[10px] rounded-none flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <IconStack2 className="size-3 mr-1" />
            Slides
          </TabsTrigger>
          <TabsTrigger value="layers" className="text-[10px] rounded-none flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <IconLayersDifference className="size-3 mr-1" />
            Layers
          </TabsTrigger>
        </TabsList>

        {/* Slides Tab */}
        <TabsContent value="slides" className="flex-1 min-h-0 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1.5">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSlideDragEnd}
              >
                <SortableContext
                  items={slides.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {slides.map((slide, index) => (
                    <SortableSlideItem
                      key={slide.id}
                      slide={slide}
                      index={index}
                      isSelected={selectedSlideIndex === index}
                      totalSlides={slides.length}
                      viewport={viewport}
                      onSelect={() => onSelectSlide(index)}
                      onRemove={() => onRemoveSlide(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <Button
                size="sm"
                variant="outline"
                onClick={onAddSlide}
                className="w-full h-7 rounded-md text-xs"
              >
                <IconPlus className="size-3 mr-1" />
                Thêm slide
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Layers Tab */}
        <TabsContent value="layers" className="flex-1 min-h-0 m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1.5">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleLayerDragEnd}
              >
                <SortableContext
                  items={currentLayers.map((_, i) => `layer-${i}`) ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  {currentLayers.map((layer, index) => (
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
                      onToggleLock={() =>
                        onToggleLayerLock(index)
                      }
                    />
                  ))}
                </SortableContext>
              </DndContext>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddLayer("image")}
                className="w-full h-7 rounded-md text-xs"
              >
                <IconPlus className="size-3 mr-1" />
                Thêm layer
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
