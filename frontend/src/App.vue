<template>
  <router-view />
  <ChatbotWidget v-if="showStudentAssistant" />
</template>

<script setup lang="ts">
import ChatbotWidget from '@/components/ChatbotWidget.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showStudentAssistant = computed(() => !route.path.startsWith('/admin'))
</script>

<style>
/* Global styles if any */
</style>
