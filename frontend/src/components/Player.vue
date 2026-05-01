<template>
  <div class="relative w-full h-full">
    <!-- local -->
    <template v-if="resource?.resource_type === 'local'">
      <video
        ref="videoEl"
        class="w-full h-full object-contain bg-black"
        controls
        :src="resource.source_url"
        @play="onPlay"
        @pause="emit('pause')"
        @ended="emit('ended')"
        @loadedmetadata="emit('loadedmetadata')"
      />
    </template>

    <!-- youtube -->
    <template v-else-if="resource?.resource_type === 'youtube'">
      <iframe
        v-if="youtubeEmbedUrl"
        class="w-full h-full"
        :src="youtubeEmbedUrl"
        title="YouTube player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
      <div v-else class="w-full h-full flex items-center justify-center text-white/80 text-sm">YouTube 链接无效</div>
    </template>

    <!-- bilibili -->
    <template v-else-if="resource?.resource_type === 'bilibili'">
      <iframe
        v-if="bilibiliEmbedUrl"
        class="w-full h-full"
        :src="bilibiliEmbedUrl"
        title="Bilibili player"
        frameborder="0"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
      />
      <div v-else class="w-full h-full flex items-center justify-center p-6">
        <div class="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 text-center">
          <div class="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-pink-300 text-2xl">play_circle</span>
          </div>
          <div class="text-white font-semibold text-base mb-1">无法内嵌播放</div>
          <div class="text-white/60 text-sm mb-5">该 Bilibili 链接无法解析，请前往原网页观看。</div>
          <div class="text-white/40 text-xs break-all bg-black/30 rounded-lg px-3 py-2 mb-5">{{ resource?.source_url }}</div>
          <a
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors text-sm font-semibold"
            :href="resource?.source_url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="material-symbols-outlined text-base">open_in_new</span>
            跳转至原网页播放
          </a>
        </div>
      </div>
    </template>

    <!-- external / fallback -->
    <template v-else-if="resource">
      <div class="w-full h-full flex items-center justify-center p-6">
        <div class="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6">
          <div class="text-white font-semibold text-lg mb-2">外部资源</div>
          <div class="text-white/80 text-sm mb-4">该内容需要前往第三方网站/平台学习。</div>
          <div class="text-white/70 text-xs break-all bg-black/30 rounded-lg p-3 mb-4">{{ resource.source_url }}</div>
          <a
            class="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-dim transition-colors text-sm font-semibold"
            :href="resource.source_url"
            target="_blank"
            rel="noopener noreferrer"
          >
            前往外部学习
          </a>
        </div>
      </div>
    </template>

    <!-- null -->
    <div v-else class="w-full h-full flex items-center justify-center text-white/50 text-sm">暂无资源</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { VideoResourceDto } from '@/api/course'

const props = withDefaults(defineProps<{
  resource: VideoResourceDto | null
  startTime?: number
}>(), { startTime: 0 })

const emit = defineEmits<{
  play: [video: HTMLVideoElement]
  pause: []
  ended: []
  loadedmetadata: []
}>()

const videoEl = ref<HTMLVideoElement | null>(null)

function onPlay(e: Event) {
  emit('play', e.target as HTMLVideoElement)
}

// --- YouTube ---
const youtubeEmbedUrl = computed(() => {
  if (props.resource?.resource_type !== 'youtube') return ''
  const id = extractYouTubeId(props.resource.source_url)
  return id ? `https://www.youtube.com/embed/${id}` : ''
})

function extractYouTubeId(input: string): string {
  try {
    if (/^[a-zA-Z0-9_-]{6,}$/.test(input) && !/^https?:\/\//.test(input)) return input
    const u = new URL(input)
    if (u.hostname === 'youtu.be') return u.pathname.replace(/^\//, '')
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/').filter(Boolean)
      const ei = parts.indexOf('embed')
      if (ei >= 0 && parts[ei + 1]) return parts[ei + 1]!
      const si = parts.indexOf('shorts')
      if (si >= 0 && parts[si + 1]) return parts[si + 1]!
    }
  } catch { /* ignore */ }
  return ''
}

// --- Bilibili ---
const bilibiliEmbedUrl = computed(() => {
  if (props.resource?.resource_type !== 'bilibili') return ''
  const base = extractBilibiliEmbedUrl(props.resource.source_url)
  if (!base) return ''
  return props.startTime > 0 ? `${base}&t=${props.startTime}` : base
})

function extractBilibiliEmbedUrl(input: string): string {
  const src = input.trim()
  if (/^BV[0-9A-Za-z]{10,}$/.test(src)) {
    const url = `https://player.bilibili.com/player.html?bvid=${src}&as_wide=1&high_quality=1&danmaku=1`
    console.log('[bilibili] embed url:', url)
    return url
  }
  try {
    const u = new URL(src)
    const host = u.hostname.toLowerCase()
    if (host === 'b23.tv') { console.log('[bilibili] b23.tv — fallback'); return '' }
    if (host === 'www.bilibili.com' || host === 'm.bilibili.com') {
      const match = u.pathname.match(/\/video\/(BV[0-9A-Za-z]{10,})/)
      if (match?.[1]) {
        const url = `https://player.bilibili.com/player.html?bvid=${match[1]}&as_wide=1&high_quality=1&danmaku=1`
        console.log('[bilibili] embed url:', url)
        return url
      }
    }
  } catch { /* ignore */ }
  console.log('[bilibili] failed to parse:', src)
  return ''
}

// Expose videoEl for parent断点续播
defineExpose({ videoEl })
</script>
