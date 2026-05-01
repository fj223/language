import type { VideoResourceType } from '@/api/course'

export const RESOURCE_META: Record<VideoResourceType, { label: string; className: string }> = {
  local: { label: 'Local', className: 'bg-purple-100 text-purple-700' },
  youtube: { label: 'YouTube', className: 'bg-red-100 text-red-700' },
  bilibili: { label: 'Bilibili', className: 'bg-pink-100 text-pink-700' },
  external_link: { label: 'Link', className: 'bg-slate-100 text-slate-700' },
}

export function resourceLabel(t: VideoResourceType) {
  return RESOURCE_META[t].label
}

export function resourceTagClass(t: VideoResourceType) {
  return RESOURCE_META[t].className
}

