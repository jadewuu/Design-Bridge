<script setup lang="ts">
import { onScopeDispose, shallowRef, watch } from 'vue'

const props = defineProps<{ loading?: boolean }>()
const svg = shallowRef<SVGSVGElement | null>(null)
const phase = shallowRef<'idle' | 'loading' | 'finishing' | 'restoring'>(
  props.loading ? 'loading' : 'idle'
)
let settleTimer: ReturnType<typeof setTimeout> | undefined

function settled() {
  if (props.loading) return
  clearTimeout(settleTimer)
  phase.value = 'idle'
}

function restore() {
  if (phase.value !== 'finishing') return
  clearTimeout(settleTimer)
  phase.value = 'restoring'
  // Fallback for animation events suppressed by a hidden or removed surface.
  settleTimer = setTimeout(settled, 260)
}

watch(
  () => props.loading,
  (loading) => {
    clearTimeout(settleTimer)
    if (loading) {
      phase.value = 'loading'
    } else if (svg.value?.querySelector('.tp-logo-plane')?.getAnimations().length) {
      // Keep the current loop and its phase; restore only at its next boundary.
      phase.value = 'finishing'
      settleTimer = setTimeout(restore, 2100)
    } else {
      settled()
    }
  },
  { flush: 'post' }
)

onScopeDispose(() => clearTimeout(settleTimer))
</script>

<template>
  <svg
    ref="svg"
    :class="{
      'tp-logo-loading': phase === 'loading' || phase === 'finishing',
      'tp-logo-restoring': phase === 'restoring'
    }"
    xmlns="http://www.w3.org/2000/svg"
    width="26"
    height="26"
    viewBox="0 0 128 128"
  >
    <path
      class="tp-logo-plane"
      fill="#2563EB"
      d="M26 104V64C26 12 102 12 102 64V104H88V64C88 31 40 31 40 64V104Z"
      @animationiteration="restore"
      @animationend="settled"
    />
    <path class="tp-logo-plane" fill="#38BDF8" d="M16 76H112V90H16Z" />
  </svg>
</template>

<style scoped>
.tp-logo-loading .tp-logo-plane {
  animation: db-logo-pulse 2s ease-in-out infinite;
}
.tp-logo-restoring .tp-logo-plane {
  animation: db-logo-settle 240ms ease-out forwards;
}
@keyframes db-logo-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
@keyframes db-logo-settle {
  from {
    opacity: 0.35;
  }
  to {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tp-logo-loading .tp-logo-plane,
  .tp-logo-restoring .tp-logo-plane {
    animation: none;
  }
}
</style>
