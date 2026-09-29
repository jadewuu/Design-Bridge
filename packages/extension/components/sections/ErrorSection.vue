<script setup lang="ts">
import Warning from '@/components/icons/Warning.vue'
import Section from '@/components/Section.vue'
</script>

<template>
  <Section flat class="tp-error">
    <template #header>
      <div class="tp-row tp-gap tp-error-title">
        <Warning class="tp-error-icon" /> Temporarily Unavailable
      </div>
    </template>
    <p>Figma has changed and Design Bridge is temporarily unavailable in view-only mode.</p>
    <p>Contact your internal maintainer for an updated company release.</p>
  </Section>
</template>

<style scoped>
.tp-error {
  background-color: var(--color-bg-warning-tertiary);
  color: var(--color-text-warning);
}

.tp-error-icon {
  margin: -4px;
  color: var(--color-icon-warning);
}

p {
  margin-bottom: 8px;
  hyphens: auto;
  line-height: var(--text-body-medium-line-height);
}

.tp-error-alert {
  color: var(--color-text-warning);
  font-weight: var(--font-weight-strong);
  cursor: help;
}
</style>
