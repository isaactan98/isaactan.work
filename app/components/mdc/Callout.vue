<script setup lang="ts">
type CalloutType = 'info' | 'warning' | 'success' | 'default'

const props = withDefaults(defineProps<{ type?: CalloutType }>(), {
  type: 'default'
})

const styles: Record<CalloutType, { box: string; icon: string }> = {
  default: { box: 'bg-callout-default', icon: '💡' },
  info: { box: 'bg-callout-info', icon: 'ℹ️' },
  warning: { box: 'bg-callout-warning', icon: '⚠️' },
  success: { box: 'bg-callout-success', icon: '✅' }
}

const variant = computed(() => styles[props.type] ?? styles.default)
</script>

<template>
  <div
    data-notion-block
    class="my-3 flex gap-3 rounded px-4 py-3 text-[0.9375rem] leading-relaxed text-ink"
    :class="variant.box"
  >
    <span class="select-none text-base leading-6" aria-hidden="true">{{ variant.icon }}</span>
    <div class="callout-body min-w-0 flex-1">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.callout-body :deep(> *:first-child) {
  margin-top: 0;
}
.callout-body :deep(> *:last-child) {
  margin-bottom: 0;
}
</style>
