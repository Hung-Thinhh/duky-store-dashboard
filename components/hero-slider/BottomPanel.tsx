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
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconGripVertical,
  IconPhoto,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import type { SlideData, ViewportMode } from "@/app/(dashboard)/hero-slider/types"

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
      className={`group relative w-32 h-16 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all select-none overflow-hidden shrink-0 ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold text-primary"
          : "border-muted hover:border-muted-foreground bg-card text-card-foreground"
      }`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div
        className="absolute top-1 left-1 touch-none cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted text-muted-foreground z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="size-3" />
      </div>

      {/* Thumbnail Background */}
      {thumbnail ? (
        <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
      ) : (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <IconPhoto className="size-4 text-muted-foreground/50" />
        </div>
      )}

      {/* Slide number badge */}
      <div className="absolute bottom-1 left-1.5 px-1 bg-black/60 text-white text-[9px] font-bold rounded backdrop-blur-sm">
        {index + 1}
      </div>

      {/* Title badge */}
      <div className="absolute bottom-1 right-1.5 px-1 bg-black/60 text-white text-[9px] truncate max-w-[65px] rounded backdrop-blur-sm">
        {slide.text.title || `Slide ${index + 1}`}
      </div>

      {/* Delete Button */}
      {totalSlides > 1 && (
        <Button
          size="icon"
          variant="destructive"
          className="absolute top-1 right-1 size-5 rounded-full opacity-0 group-hover:opacity-100 z-10 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <IconTrash className="size-2.5" />
        </Button>
      )}
    </div>
  )
}

// ─── BottomPanel Component ────────────────────────────────────────────────

interface BottomPanelProps {
  slides: SlideData[]
  selectedSlideIndex: number
  viewport: ViewportMode
  onSelectSlide: (index: number) => void
  onReorderSlides: (oldIndex: number, newIndex: number) => void
  onAddSlide: () => void
  onRemoveSlide: (index: number) => void
}

export function BottomPanel({
  slides,
  selectedSlideIndex,
  viewport,
  onSelectSlide,
  onReorderSlides,
  onAddSlide,
  onRemoveSlide,
}: BottomPanelProps) {
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

  return (
    <div className="h-28 border-t bg-card flex items-center px-4 py-2 gap-6 shrink-0 w-full overflow-hidden select-none">
      {/* Slides Section */}
      <div className="flex items-center gap-3 h-full shrink-0">
        <div className="flex flex-col justify-center h-full">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Slides
          </span>
          <div className="flex items-center gap-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSlideDragEnd}
            >
              <SortableContext
                items={slides.map((s) => s.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex items-center gap-2">
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
                </div>
              </SortableContext>
            </DndContext>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddSlide}
              className="w-16 h-16 rounded-xl border-dashed flex flex-col items-center justify-center text-[10px] gap-1 hover:border-primary shrink-0 text-muted-foreground"
            >
              <IconPlus className="size-4" />
              <span>Thêm</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
