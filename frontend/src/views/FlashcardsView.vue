<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="font-headline text-2xl font-bold text-on-surface">复习大厅</h1>
          <p class="text-sm text-slate-500 mt-1">{{ cards.length }} 张知识卡片</p>
        </div>
        <RouterLink to="/" class="text-sm text-primary hover:underline flex items-center gap-1">
          <span class="material-symbols-outlined text-base">arrow_back</span>
          返回课程
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <span class="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
      </div>

      <!-- Empty -->
      <div v-else-if="cards.length === 0" class="text-center py-20 text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-3 block">style</span>
        <p class="text-sm">还没有知识卡片，去 AI 助手那里生成一些吧</p>
      </div>

      <!-- Cards grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="card in cards"
          :key="card.id"
          class="group perspective-1000 h-44 cursor-pointer"
          @click="toggle(card.id)"
        >
          <div
            class="relative w-full h-full transition-transform duration-500 transform-style-3d"
            :class="flipped.has(card.id) ? 'rotate-y-180' : ''"
          >
            <!-- Front -->
            <div class="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center p-5 gap-2">
              <span class="material-symbols-outlined text-primary text-2xl">style</span>
              <p class="font-headline font-bold text-base text-center text-on-surface leading-snug">{{ card.term }}</p>
              <p class="text-[10px] text-slate-400 uppercase tracking-wider">点击翻转</p>
            </div>

            <!-- Back -->
            <div class="absolute inset-0 backface-hidden rotate-y-180 bg-primary/5 dark:bg-primary/10 rounded-2xl shadow-sm border border-primary/20 flex flex-col justify-between p-5 overflow-hidden">
              <div>
                <p class="text-xs font-semibold text-primary mb-1">解释</p>
                <p class="text-sm text-on-surface leading-relaxed line-clamp-4">{{ card.definition }}</p>
              </div>
              <div v-if="card.example" class="mt-2">
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">例句</p>
                <p class="text-xs text-slate-500 italic line-clamp-2">{{ card.example }}</p>
              </div>
              <!-- Actions -->
              <div class="absolute top-3 right-3 flex items-center gap-1">
                <button
                  class="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-primary transition-colors"
                  title="回顾视频"
                  @click.stop="router.push(`/courses/${card.videoId}`)"
                >
                  <span class="material-symbols-outlined text-base">play_circle</span>
                </button>
                <button
                  class="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
                  title="删除"
                  @click.stop="remove(card.id)"
                >
                  <span class="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { fetchFlashcards, deleteFlashcard, type Flashcard } from '@/api/flashcard'

const router = useRouter()
const cards = ref<Flashcard[]>([])
const loading = ref(true)
const flipped = ref(new Set<string>())

function toggle(id: string) {
  if (flipped.value.has(id)) flipped.value.delete(id)
  else flipped.value.add(id)
  flipped.value = new Set(flipped.value) // trigger reactivity
}

async function remove(id: string) {
  await deleteFlashcard(id)
  cards.value = cards.value.filter((c) => c.id !== id)
}

onMounted(async () => {
  try {
    cards.value = await fetchFlashcards()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.perspective-1000 { perspective: 1000px; }
.transform-style-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
</style>
