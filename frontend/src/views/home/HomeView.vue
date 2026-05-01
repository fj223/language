<template>
  <main class="pt-24">
    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-8 pt-24 pb-16 flex flex-col md:flex-row items-center gap-12">
      <div class="flex-1 space-y-8">
        <h1 class="text-5xl md:text-6xl font-extrabold tracking-tighter leading-tight text-on-surface">
          打破教育壁垒，<br/>
          <span class="text-primary">知识连接你我</span>
        </h1>
        <p class="text-xl text-on-surface-variant max-w-lg leading-relaxed">
          聚合全网优质免费公开课，AI 伴学，随时随地开启学习之旅。
        </p>
        <div class="relative group max-w-2xl">
          <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <span class="material-symbols-outlined text-outline">search</span>
          </div>
          <input class="w-full pl-14 pr-6 py-5 bg-surface-container-lowest rounded-2xl shadow-sm border-none ring-1 ring-on-surface/5 focus:ring-2 focus:ring-primary transition-all text-lg placeholder:text-outline-variant" placeholder="输入你想学的技能，如 Python、微积分..." type="text"/>
          <button class="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-6 py-2.5 rounded-xl font-medium hover:bg-primary-dim transition-colors">
            搜索
          </button>
        </div>
      </div>
      <div class="flex-1 w-full max-w-lg">
        <div class="relative rounded-3xl overflow-hidden bg-surface-container-low p-1">
          <img alt="Education Concept" class="rounded-[1.4rem] w-full aspect-square object-cover mix-blend-multiply opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvvwPUqGt7CV_le8YwY6WGcVUZiUMkg97h9NjU6VKFCjoAP6CjN9XHNF39VmzWyouAID73YfjllvtY-yK-FSyASvKnC6lQD5BOC02LEBxk5jhBpGel_0jb7PKavUHRVPlrEd0gEtvo0QgV0XUyqtRHOnXsw7AWd-Xw6p6z7knSumJbso2vZnY8UVP6fq-HELdo6LjgqLhc7I94NSwTLxs_aIfoJVZQ163C9w72rhet_AcPhA5vRqh7W-1NECVKpp1Eq35zJPdLH1I"/>
          <div class="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none"></div>
        </div>
      </div>
    </section>

    <!-- Resource Aggregation (Features) -->
    <section class="bg-surface-container-low py-24">
      <div class="max-w-7xl mx-auto px-8">
        <h2 class="text-3xl font-bold tracking-tight mb-12 text-center text-on-surface">我们为你聚合了...</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature Card 1 -->
          <div class="bg-surface-container-lowest p-8 rounded-3xl group hover:shadow-lg transition-all duration-300">
            <div class="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">auto_stories</span>
            </div>
            <h3 class="text-xl font-bold mb-3">本地精品</h3>
            <p class="text-on-surface-variant leading-relaxed">由 OpenEdu 精心制作的结构化进阶课程，完全免费且无广告。</p>
          </div>
          <!-- Feature Card 2 -->
          <div class="bg-surface-container-lowest p-8 rounded-3xl group hover:shadow-lg transition-all duration-300">
            <div class="w-14 h-14 bg-tertiary-container rounded-2xl flex items-center justify-center mb-6 text-tertiary group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">language</span>
            </div>
            <h3 class="text-xl font-bold mb-3">YouTube EDU</h3>
            <p class="text-on-surface-variant leading-relaxed">同步全球顶尖学术资源，涵盖科学、工程及人文社科领域。</p>
          </div>
          <!-- Feature Card 3 -->
          <div class="bg-surface-container-lowest p-8 rounded-3xl group hover:shadow-lg transition-all duration-300">
            <div class="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">play_circle</span>
            </div>
            <h3 class="text-xl font-bold mb-3">MOOC/B站</h3>
            <p class="text-on-surface-variant leading-relaxed">整合国内各大高校与优质创作者资源，打造零门槛学习社区。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Recommended Courses Grid -->
    <section class="py-24 max-w-7xl mx-auto px-8">
      <div class="flex justify-between items-end mb-12">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-on-surface">今日推荐免费资源</h2>
          <p class="text-on-surface-variant mt-2">基于全网学习热度为您实时更新</p>
        </div>
        <router-link to="/courses" class="text-primary font-semibold hover:underline flex items-center gap-1">
          查看全部 <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </router-link>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Course Card 1 -->
        <div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div class="aspect-video relative overflow-hidden">
            <img alt="Python Course" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBdy5-4n0u11_mursGb922jSM6IgHBbjMYLybogs3Qflrut6DuNxGXMrmbh9KTBZUIGeWoNj_jIG1fja_r5B3IR-njrQgLWDgiASxNghWKtU5E47GtCuSG4TQQhk4bC3VPm-rR5cm9SmFj7md2uS-OrIlDe_hzFpBZOo5esADpiFOmmD_r3Tl-vGWTVFDlqlhDA_Ufsi7tCg-ZZDMyF39UKbdmuuvISw8mV6jCKCY6tyfLdx-j5kSeSRjLVguGHvADqi2dYTYGxg0"/>
            <span class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">YouTube</span>
          </div>
          <div class="p-5">
            <h3 class="font-bold text-on-surface mb-4 line-clamp-2">Python 全栈开发：从基础到商业项目实战</h3>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-on-surface-variant text-sm">
                <span class="material-symbols-outlined text-base">visibility</span>
                <span>12.5k</span>
              </div>
              <button class="text-outline hover:text-primary transition-colors">
                <span class="material-symbols-outlined">bookmark</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Course Card 2 -->
        <div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div class="aspect-video relative overflow-hidden">
            <img alt="Math Course" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2CJe-fBI6hwU42UNs0f3y1c2PiwpNrCkwmUijHIyTNdgdcq109mY_0t5y9iKRGKjB0MQrzfa1b4DXdtgRSEEHkZ4BG07epf9JaLTkwwRuBFabSy92M39vjolXHIRp4MDGx-TGXnS_SMTWeXN8YUW5zS4-ZCGQHwMHuWLJRRpeirVCTSyk9dI0SrIpkByEqfWhXIQqlWvIv-sfKVqn4QMQRnnDuoaW4_-WLfK8tD0Gp2tEnaqSsz6a6radKFQ1cAxQxSz4Oxzqctk"/>
            <span class="absolute top-3 left-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Bilibili</span>
          </div>
          <div class="p-5">
            <h3 class="font-bold text-on-surface mb-4 line-clamp-2">微积分本质：用直觉理解深奥的数学理论</h3>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-on-surface-variant text-sm">
                <span class="material-symbols-outlined text-base">visibility</span>
                <span>45k</span>
              </div>
              <button class="text-outline hover:text-primary transition-colors">
                <span class="material-symbols-outlined">bookmark</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Course Card 3 -->
        <div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div class="aspect-video relative overflow-hidden">
            <img alt="CS Course" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCEW7rqXQRPXqC3e-ge6c614Ak5ZRO0FjKTOXNDxi8GmIrXUPF1zAF9qSZS-DjABOsf0i-dN4M51Cqrm8ORxD1mgU1hinXrtZzJMFOEghSlJ_RvatF8jNrS2rAIMJtFrQyTb5Iq-uFCCE8bHhqLrLK4R_gVyAV9DslVvdp3dWIobV0yAjSgEiXBlS6Pc45NuEGJ-IZXaatNelhSwnTxwEm8-sBPC4HevJyrlVxnXgsiz2ZjztY5dZKmr5A4lo89ZTLL3ojeSFwX64"/>
            <span class="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Local</span>
          </div>
          <div class="p-5">
            <h3 class="font-bold text-on-surface mb-4 line-clamp-2">计算机科学导论：哈佛大学 CS50 官方中文版</h3>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-on-surface-variant text-sm">
                <span class="material-symbols-outlined text-base">visibility</span>
                <span>8.9k</span>
              </div>
              <button class="text-outline hover:text-primary transition-colors">
                <span class="material-symbols-outlined">bookmark</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Course Card 4 -->
        <div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div class="aspect-video relative overflow-hidden">
            <img alt="Design Course" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq1EPYTOq4nhFH2BDVpQUTpe4uM4icRpM_CzoPdb0LtpnROLuXn1Iv3k0d1hXJFnN06sywfeTjUDD6An5-4zvPctDwKlPL6Ln7P1ae8VYDy1m0RsL2GQBR64d-YLGf3Y6dJ7huvQMxaScuVGzUv4npz3aXEw47aVlge8zL19gUgDfNrjunSjHQiSzf0TLKhJ3sX5uUcm1olWaJQPOjYEPLcV6udcipcBXoaK79eYCXfXTiRYTp_7i1wnuq1nW-IT8D-AQfGFdaBGo"/>
            <span class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">YouTube</span>
          </div>
          <div class="p-5">
            <h3 class="font-bold text-on-surface mb-4 line-clamp-2">UI 设计进阶：从色彩理论到现代网格系统</h3>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-on-surface-variant text-sm">
                <span class="material-symbols-outlined text-base">visibility</span>
                <span>21k</span>
              </div>
              <button class="text-outline hover:text-primary transition-colors">
                <span class="material-symbols-outlined">bookmark</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- AI Companion Banner -->
    <section class="max-w-7xl mx-auto px-8 mb-24">
      <div class="bg-primary text-on-primary rounded-[2.5rem] p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-primary-dim to-transparent opacity-50"></div>
        <div class="relative z-10 max-w-2xl">
          <div class="inline-flex items-center gap-2 bg-on-primary/10 px-4 py-1.5 rounded-full mb-6">
            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
            <span class="text-xs font-bold uppercase tracking-widest">Powered by AI</span>
          </div>
          <h2 class="text-3xl md:text-4xl font-bold mb-6 leading-tight">不仅是课程，更是你的专属 AI 助教。</h2>
          <p class="text-primary-fixed text-lg leading-relaxed mb-8">
            在学习中遇到难题？随时向 AI 发问。我们的 AI 助教已针对每门课程的知识点进行深度学习，为你提供即时的专业解答。
          </p>
          <button class="bg-surface-container-lowest text-primary px-10 py-4 rounded-xl font-bold hover:bg-surface-bright transition-all shadow-xl hover:-translate-y-1 active:scale-95">
            Try AI Companion
          </button>
        </div>
        <div class="relative z-10 hidden lg:block">
          <div class="w-64 h-64 bg-surface-container-lowest/10 backdrop-blur-xl rounded-full flex items-center justify-center p-8 ring-1 ring-on-primary/20 shadow-inner">
            <span class="material-symbols-outlined text-8xl opacity-80" style="font-variation-settings: 'FILL' 0, 'wght' 200;">smart_toy</span>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
</script>