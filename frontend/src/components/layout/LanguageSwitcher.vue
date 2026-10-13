<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex min-h-10 items-center gap-1 rounded-xl px-2.5 py-1.5 transition-colors"
      :class="inverse ? 'text-white hover:bg-white/10' : 'text-on-surface-variant hover:bg-surface-container'"
      :aria-label="$t('navbar.switchLang')"
      :aria-expanded="open"
      aria-haspopup="menu"
      data-testid="language-switcher"
      @click="open = !open"
    >
      <span class="material-symbols-outlined text-base" aria-hidden="true">language</span>
      <span class="text-xs font-extrabold uppercase tracking-wide">{{ langStore.lang }}</span>
      <span
        class="material-symbols-outlined text-sm transition-transform"
        :class="{ 'rotate-180': open }"
        aria-hidden="true"
      >expand_more</span>
    </button>

    <Transition name="language-menu">
      <div
        v-if="open"
        class="absolute right-0 top-full z-[80] mt-2 w-44 overflow-hidden rounded-2xl border border-outline-variant/20 bg-white py-1.5 shadow-xl"
        role="menu"
      >
        <button
          v-for="option in options"
          :key="option.code"
          type="button"
          class="flex w-full items-center gap-2.5 border-0 bg-transparent px-4 py-2 text-on-surface transition-colors hover:bg-surface-container-low"
          :class="{ 'bg-primary-container font-bold': langStore.lang === option.code }"
          :aria-current="langStore.lang === option.code ? 'true' : undefined"
          role="menuitem"
          @click="select(option.code)"
        >
          <span aria-hidden="true">{{ option.flag }}</span>
          <span class="flex-1 text-left text-sm">{{ option.label }}</span>
          <span
            v-if="langStore.lang === option.code"
            class="material-symbols-outlined text-sm text-primary"
            aria-hidden="true"
          >check</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useLangStore, type Lang } from '@/stores/useLangStore'

defineProps<{ inverse?: boolean }>()

const langStore = useLangStore()
const root = ref<HTMLElement | null>(null)
const open = ref(false)

const options: Array<{ code: Lang; label: string; flag: string }> = [
  { code: 'zh', label: '简体中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
]

function select(locale: Lang) {
  langStore.setLang(locale)
  open.value = false
}

function onOutsideClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onOutsideClick)
  document.addEventListener('keydown', onEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', onOutsideClick)
  document.removeEventListener('keydown', onEscape)
})
</script>

<style scoped>
.language-menu-enter-active,
.language-menu-leave-active {
  transform-origin: top right;
  transition: opacity 160ms ease, transform 160ms ease;
}

.language-menu-enter-from,
.language-menu-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.96);
}
</style>
