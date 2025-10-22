<template>
  <div
    ref="dragSourceRef"
    class="grid-drag-source"
    :class="{ 
      'is-dragging': isDragging,
      'is-touch-dragging': isTouchDragging,
      'is-disabled': disabled
    }"
    :draggable="!disabled"
    @click="handleClick"
  >
    <slot :is-dragging="isDragging" />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, computed, type Ref } from 'vue'
import type { IGridInstance } from '../../../types'
import type { GridDragSourceProps } from '../types'

const props = withDefaults(defineProps<GridDragSourceProps>(), {
  helper: 'clone',
  revert: false,
  disabled: false
})

const emit = defineEmits<{
  dragstart: [data: any]
  dragend: [data: any]
  dropped: [target: IGridInstance, data: any]
  click: [event: MouseEvent]
}>()

const dragSourceRef = ref<HTMLElement>()
const isDragging = ref(false)
const isTouchDragging = ref(false)
// GridInstance is optional - when used outside GridStack, will drag to any accepting grid
const gridInstance = inject<Ref<IGridInstance> | undefined>('grid-instance', undefined)
let cleanup: (() => void) | undefined

// Compute if drag source is inside a grid
const isInsideGrid = computed(() => gridInstance?.value !== undefined)

onMounted(() => {
  if (!dragSourceRef.value || props.disabled) return

  const element = dragSourceRef.value

  // If inside a GridStack, register with its drag manager
  if (gridInstance?.value) {
    const dragManager = gridInstance.value.getDragManager()
    
    // Register drag source with enhanced options
    cleanup = dragManager.registerDragSource(element, {
      data: props.data,
      itemOptions: props.itemOptions,
      preview: props.preview,
      helper: props.helper,
      revert: props.revert
    })
  } else {
    // For external drag sources (outside any GridStack)
    // Make it work with ANY GridStack on the page
    setupExternalDragSource(element)
  }

  // Add drag event listeners
  const handleDragStart = (e: DragEvent) => {
    if (props.disabled) {
      e.preventDefault()
      return
    }

    isDragging.value = true
    emit('dragstart', props.data)
    
    // For external drag sources, set drag data
    if (!gridInstance?.value && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/json', JSON.stringify({
        data: props.data,
        itemOptions: props.itemOptions || {}
      }))

      // Set custom drag image if provided
      if (props.preview) {
        const previewEl = typeof props.preview === 'string'
          ? createPreviewElement(props.preview)
          : props.preview.cloneNode(true) as HTMLElement
        
        document.body.appendChild(previewEl)
        e.dataTransfer.setDragImage(previewEl, 0, 0)
        setTimeout(() => document.body.removeChild(previewEl), 0)
      }
    }
  }

  const handleDragEnd = (e: DragEvent) => {
    isDragging.value = false
    emit('dragend', props.data)
  }

  element.addEventListener('dragstart', handleDragStart)
  element.addEventListener('dragend', handleDragEnd)

  // Store cleanup for event listeners
  const originalCleanup = cleanup
  cleanup = () => {
    originalCleanup?.()
    element.removeEventListener('dragstart', handleDragStart)
    element.removeEventListener('dragend', handleDragEnd)
  }
})

onUnmounted(() => {
  cleanup?.()
})

/**
 * Setup external drag source (works with any GridStack on page)
 */
function setupExternalDragSource(element: HTMLElement) {
  // Store data on element for grid to pick up
  element.setAttribute('data-drag-source', JSON.stringify({
    data: props.data,
    itemOptions: props.itemOptions || {}
  }))

  // Make element draggable
  element.setAttribute('draggable', 'true')
}

/**
 * Create preview element from HTML string
 */
function createPreviewElement(html: string): HTMLElement {
  const temp = document.createElement('div')
  temp.innerHTML = html
  temp.style.position = 'absolute'
  temp.style.top = '-9999px'
  return temp.firstChild as HTMLElement || temp
}

/**
 * Handle click event
 */
function handleClick(e: MouseEvent) {
  if (!props.disabled) {
    emit('click', e)
  }
}

defineExpose({
  dragSourceRef,
  isDragging,
  isTouchDragging,
  isInsideGrid
})
</script>

<style scoped>
.grid-drag-source {
  cursor: grab;
  user-select: none;
  transition: all 0.2s ease;
  position: relative;
}

.grid-drag-source:active {
  cursor: grabbing;
}

.grid-drag-source.is-dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.grid-drag-source.is-touch-dragging {
  opacity: 0.8;
  z-index: 9999;
}

.grid-drag-source.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
}

.grid-drag-source:not(.is-disabled):hover {
  background-color: rgba(66, 133, 244, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Add visual feedback for touch devices */
@media (hover: none) and (pointer: coarse) {
  .grid-drag-source:active {
    background-color: rgba(66, 133, 244, 0.2);
  }
}
</style>













