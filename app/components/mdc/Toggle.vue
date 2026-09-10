<script setup lang="ts">
withDefaults(defineProps<{ title?: string }>(), {
  title: 'Toggle'
})
</script>

<template>
  <details data-notion-block class="notion-toggle my-2">
    <summary
      class="flex cursor-pointer list-none items-center gap-2 rounded px-1 py-1 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-callout-default"
    >
      <svg
        class="chevron h-3 w-3 shrink-0 text-ink-muted transition-transform duration-150"
        viewBox="0 0 12 12"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M4 2.5 8.5 6 4 9.5z" />
      </svg>
      <span>{{ title }}</span>
    </summary>

    <div class="toggle-body ml-[1.375rem] border-l border-line pl-3 pt-1 text-[0.9375rem] leading-relaxed">
      <slot />
    </div>
  </details>
</template>

<style scoped>
/* Hide the native disclosure marker across browsers. */
.notion-toggle summary::-webkit-details-marker {
  display: none;
}
.notion-toggle summary::marker {
  content: '';
}
.notion-toggle[open] > summary .chevron {
  transform: rotate(90deg);
}
.toggle-body :deep(> *:first-child) {
  margin-top: 0;
}
.toggle-body :deep(> *:last-child) {
  margin-bottom: 0;
}
</style>
