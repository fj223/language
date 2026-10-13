<template>
  <main class="min-h-screen grid place-items-center px-6 py-20 bg-surface">
    <div class="fixed right-4 top-4 z-20 rounded-xl bg-white shadow-sm">
      <LanguageSwitcher />
    </div>
    <section class="surface-card max-w-xl w-full p-8 sm:p-12 text-center">
      <div class="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <span class="material-symbols-outlined text-3xl" aria-hidden="true">explore_off</span>
      </div>
      <p class="eyebrow mb-3">{{ $t('notFound.eyebrow') }}</p>
      <h1 class="font-headline text-3xl font-extrabold text-on-surface">{{ $t('notFound.title') }}</h1>
      <p class="mx-auto mt-4 max-w-md text-sm leading-7 text-on-surface-variant">
        {{ $t('notFound.description') }}
      </p>
      <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <router-link to="/" class="button-primary">{{ $t('notFound.home') }}</router-link>
        <router-link to="/courses" class="button-secondary">{{ $t('notFound.courses') }}</router-link>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
</script>
