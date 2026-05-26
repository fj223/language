<template>
  <div class="min-h-screen bg-slate-50/50">
    <div class="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 class="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            {{ $t('flashcard.title') }}
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            {{ $t('flashcard.subtitle', { count: filteredCards.length }) }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1 sm:flex-none">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              search
            </span>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="$t('flashcard.searchPlaceholder')"
              class="w-full sm:w-56 pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="n in 6"
          :key="n"
          class="h-44 rounded-2xl bg-white animate-pulse border border-slate-100"
        >
          <div class="flex flex-col items-center justify-center h-full gap-3">
            <div class="w-10 h-10 rounded-full bg-slate-200" />
            <div class="w-24 h-4 rounded bg-slate-200" />
            <div class="w-16 h-3 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="filteredCards.length === 0"
        class="text-center py-20"
      >
        <div
          v-if="cards.length === 0"
          class="flex flex-col items-center gap-4"
        >
          <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
            <span class="material-symbols-outlined text-4xl text-slate-300">style</span>
          </div>
          <h3 class="text-lg font-bold text-slate-500">{{ $t('flashcard.emptyTitle') }}</h3>
          <p class="text-sm text-slate-400 max-w-sm">
            {{ $t('flashcard.emptyHint') }}
          </p>
          <RouterLink
            to="/courses"
            class="inline-flex items-center gap-2 mt-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dim transition-colors shadow-sm"
          >
            <span class="material-symbols-outlined text-base">menu_book</span>
            {{ $t('flashcard.browseCourses') }}
          </RouterLink>
        </div>
        <div v-else class="flex flex-col items-center gap-2">
          <span class="material-symbols-outlined text-4xl text-slate-300">search_off</span>
          <p class="text-sm text-slate-400">{{ $t('flashcard.noSearchResults') }}</p>
        </div>
      </div>

      <!-- Cards Grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="card in filteredCards"
          :key="card.id"
          class="group perspective-800 h-48 cursor-pointer"
          @click="toggle(card.id)"
        >
          <div
            class="relative w-full h-full transition-transform duration-600 ease-out transform-style-3d"
            :class="flipped.has(card.id) ? 'rotate-y-180' : ''"
          >
            <!-- Front face -->
            <div
              class="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/20 transition-shadow duration-300 flex flex-col items-center justify-center p-6 gap-3"
            >
              <div class="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-primary text-xl">auto_awesome</span>
              </div>
              <p class="font-headline font-bold text-base text-center text-on-surface leading-snug select-none">
                {{ card.term }}
              </p>
              <span class="text-[10px] text-slate-400 uppercase tracking-wider select-none">
                {{ $t('flashcard.tapToFlip') }}
              </span>
            </div>

            <!-- Back face -->
            <div
              class="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-primary/5 to-blue-50 rounded-2xl shadow-sm border border-primary/20 flex flex-col justify-between p-5 overflow-hidden"
            >
              <div class="flex-1 overflow-y-auto pr-1">
                <div class="flex items-center gap-1.5 mb-2">
                  <span class="material-symbols-outlined text-primary text-sm">menu_book</span>
                  <p class="text-[11px] font-bold text-primary uppercase tracking-wider">
                    {{ $t('flashcard.definition') }}
                  </p>
                </div>
                <p class="text-sm text-on-surface leading-relaxed">
                  {{ card.definition }}
                </p>

                <div v-if="card.example" class="mt-3 pt-3 border-t border-primary/10">
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {{ $t('flashcard.example') }}
                  </p>
                  <p class="text-xs text-slate-500 italic leading-relaxed">
                    {{ card.example }}
                  </p>
                </div>
              </div>

              <!-- Actions bar -->
              <div class="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-primary/10">
                <button
                  class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-primary hover:bg-primary/5 transition-colors"
                  :title="$t('flashcard.reviewVideo')"
                  @click.stop="goToVideo(card.videoId)"
                >
                  <span class="material-symbols-outlined text-sm">play_circle</span>
                </button>
                <button
                  class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                  :title="$t('flashcard.delete')"
                  @click.stop="remove(card.id)"
                >
                  <span class="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card count -->
      <div
        v-if="cards.length > 0"
        class="mt-8 text-center text-xs text-slate-400"
      >
        {{ $t('flashcard.totalCount', { total: cards.length }) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { fetchFlashcards, deleteFlashcard, type Flashcard } from '@/api/flashcard'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const cards = ref<Flashcard[]>([])
const loading = ref(true)
const flipped = ref(new Set<string>())
const searchQuery = ref('')

const filteredCards = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return cards.value
  return cards.value.filter(
    (c) =>
      c.term.toLowerCase().includes(q) ||
      c.definition.toLowerCase().includes(q),
  )
})

async function loadCards() {
  loading.value = true
  flipped.value = new Set()
  try {
    cards.value = await fetchFlashcards()
  } finally {
    loading.value = false
  }
}

// 每次路由切换到 /review-hall 时重新加载卡片
watch(
  () => route.path,
  (path) => { if (path === '/review-hall') loadCards() },
)

function toggle(id: string) {
  const next = new Set(flipped.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  flipped.value = next
}

async function remove(id: string) {
  try {
    await deleteFlashcard(id)
    cards.value = cards.value.filter((c) => c.id !== id)
    ElMessage.success(t('flashcard.deleted'))
  } catch (e) {
    ElMessage.error(t('flashcard.deleteError'))
  }
}

function goToVideo(videoId: string) {
  if (videoId && videoId !== 'chatbot') {
    router.push(`/courses/${videoId}`)
  } else {
    ElMessage.info(t('flashcard.noVideoLinked'))
  }
}

onMounted(() => {
  loadCards()
})
</script>

<style scoped>
.perspective-800 { perspective: 800px; }
.transform-style-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
.duration-600 { transition-duration: 600ms; }

.overflow-y-auto::-webkit-scrollbar { width: 3px; }
.overflow-y-auto::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
</style>
