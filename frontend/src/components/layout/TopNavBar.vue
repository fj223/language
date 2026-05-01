<template>
  <nav class="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-sm dark:shadow-none h-16">
    <div class="h-full flex items-center justify-between px-8 max-w-7xl mx-auto">
      <!-- Brand Logo — 硬跳转确保不被 Vue Router 缓存拦截 -->
      <a
        href="/"
        class="text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400 font-headline flex-none"
        @click.prevent="() => { window.location.href = '/' }"
      >
        OpenEdu <span class="font-medium text-lg ml-1 opacity-80">无边界学习</span>
      </a>

      <!-- Navigation Links -->
      <nav class="hidden lg:flex items-center gap-8">
        <router-link to="/" class="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 font-body text-sm transition-colors duration-200">Explore Resources</router-link>
        <a class="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 font-body text-sm transition-colors duration-200" href="#">Donate/Support</a>
        <router-link to="/dashboard" class="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 font-body text-sm transition-colors duration-200">My Learning Path</router-link>
        <router-link to="/flashcards" class="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 font-body text-sm transition-colors duration-200 flex items-center gap-1">
          <span class="material-symbols-outlined text-base">style</span>
          知识卡片
        </router-link>
      </nav>

      <!-- Trailing Actions -->
      <div class="flex items-center gap-3 flex-none">
        <router-link
          to="/admin"
          class="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors text-xs font-bold tracking-wide flex items-center gap-1.5"
          title="管理员后台"
        >
          <span class="material-symbols-outlined text-sm">admin_panel_settings</span>
          Admin
        </router-link>
        <router-link to="/auth" class="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors duration-200">
          <span class="material-symbols-outlined text-on-surface-variant">account_circle</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
</script>