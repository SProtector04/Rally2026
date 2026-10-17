<script setup lang="ts">
import { cn } from 'cn'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    class?: string
  }>(),
  { modelValue: false },
)

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

function toggle() {
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :class="
      cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        modelValue ? 'bg-emerald-500' : 'bg-muted',
        props.class,
      )
    "
    @click="toggle"
  >
    <span
      class="inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0.5'"
    />
  </button>
</template>
