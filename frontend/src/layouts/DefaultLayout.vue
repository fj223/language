<template>
  <div class="min-h-screen flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
    <TopNavBar />
    <div class="flex-1 pt-16">
      <router-view />
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import TopNavBar from '../components/layout/TopNavBar.vue'
import AppFooter from '../components/layout/AppFooter.vue'
</script>