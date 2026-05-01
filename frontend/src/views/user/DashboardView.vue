<template>
  <div class="bg-background text-on-background min-h-screen">
    <!-- SideNavBar -->
    <aside class="fixed left-0 top-0 h-full w-[20%] flex flex-col py-16 bg-[#f1f4f6] dark:bg-slate-900 z-50 transition-all duration-300">
      <div class="px-8 mb-12">
        <router-link to="/" class="text-2xl font-bold tracking-tight text-[#335ea1] dark:text-blue-400 font-headline">OpenEdu</router-link>
        <p class="text-xs text-on-surface-variant mt-1 font-medium tracking-widest uppercase font-body">The Intellectual Canvas</p>
      </div>
      <div class="flex flex-col gap-1 flex-grow font-body">
        <!-- Active Tab: My Dashboard -->
        <a class="flex items-center gap-3 px-8 py-4 bg-[#dbe4e7] dark:bg-slate-800 text-[#335ea1] dark:text-blue-300 font-bold rounded-r-full transition-all duration-200 active:scale-95" href="#">
          <span class="material-symbols-outlined">dashboard</span>
          <span>My Dashboard</span>
        </a>
        <a class="flex items-center gap-3 px-8 py-4 text-[#586064] dark:text-slate-400 hover:text-[#335ea1] hover:bg-[#dbe4e7]/50 transition-colors duration-300" href="#">
          <span class="material-symbols-outlined">school</span>
          <span>Current Learning</span>
        </a>
        <a class="flex items-center gap-3 px-8 py-4 text-[#586064] dark:text-slate-400 hover:text-[#335ea1] hover:bg-[#dbe4e7]/50 transition-colors duration-300" href="#">
          <span class="material-symbols-outlined">favorite</span>
          <span>Favorites</span>
        </a>
        <a class="flex items-center gap-3 px-8 py-4 text-[#586064] dark:text-slate-400 hover:text-[#335ea1] hover:bg-[#dbe4e7]/50 transition-colors duration-300" href="#">
          <span class="material-symbols-outlined">history_edu</span>
          <span>AI History</span>
        </a>
        <a class="flex items-center gap-3 px-8 py-4 text-[#586064] dark:text-slate-400 hover:text-[#335ea1] hover:bg-[#dbe4e7]/50 transition-colors duration-300" href="#">
          <span class="material-symbols-outlined">volunteer_activism</span>
          <span>Donation Records</span>
        </a>
      </div>
      <div class="mt-auto px-8 flex flex-col gap-4 font-body">
        <button class="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold text-sm hover:bg-primary-dim transition-all">
          Support Public Welfare
        </button>
        <div class="pt-6 border-t border-outline-variant/20 flex flex-col gap-2">
          <a class="flex items-center gap-3 text-[#586064] text-sm hover:text-primary" href="#">
            <span class="material-symbols-outlined text-base">settings</span>
            <span>Settings</span>
          </a>
          <a class="flex items-center gap-3 text-[#586064] text-sm hover:text-primary" href="#">
            <span class="material-symbols-outlined text-base">help_outline</span>
            <span>Help</span>
          </a>
        </div>
      </div>
    </aside>

    <!-- TopNavBar -->
    <header class="fixed top-0 right-0 w-[80%] h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-40 shadow-[0px_12px_32px_rgba(43,52,55,0.06)] flex justify-between items-center px-12">
      <div class="flex items-center gap-8">
        <nav class="flex gap-8">
          <router-link to="/courses" class="text-[#335ea1] font-headline text-sm font-medium tracking-wide border-b-2 border-[#335ea1] pb-1">Explore</router-link>
          <a class="text-[#586064] font-headline text-sm font-medium tracking-wide hover:text-[#335ea1] transition-all" href="#">Archive</a>
          <a class="text-[#586064] font-headline text-sm font-medium tracking-wide hover:text-[#335ea1] transition-all" href="#">Community</a>
        </nav>
      </div>
      <div class="flex items-center gap-6">
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input class="bg-surface-container-high border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all font-body" placeholder="Search knowledge..." type="text"/>
        </div>
        <button class="text-on-surface-variant hover:text-primary transition-all">
          <span class="material-symbols-outlined">notifications</span>
        </button>
        <div class="flex items-center gap-3 pl-4 border-l border-outline-variant/30">
          <div class="text-right">
            <p class="text-sm font-bold text-on-surface font-body">李华</p>
            <p class="text-[10px] text-on-surface-variant tracking-wider uppercase font-body">Contributor</p>
          </div>
          <img alt="User Profile Avatar" class="w-10 h-10 rounded-full object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8pRBGm51kCSVpAdro22sxnOHwKz8JzHYsBQ6_rO_6OUT6iBmLzjQV0ch4_TmvrZWty7oz-lN9sEp-MX9rzOcbNpqVdmby804S60atGkihmFI-z_qkkulEGN5XXUIQQDQ1EHOOpCAxZtsmlC5aFcyh6jYq7rJnvqmIBRG73PYSva9fu3600630C8807R1udKrBfNkCcOPJSdN9KISqfF14SYYMwKWjQK1GbxqMDUmYeL2wPzWTr4KEbUOTSA_fNrFmgSb1icnPLng"/>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="ml-[20%] pt-20 min-h-screen">
      <div class="max-w-[1400px] mx-auto p-12">
        <!-- Hero Header Section -->
        <section class="mb-12 pt-12">
          <h2 class="text-4xl font-extrabold text-on-surface tracking-tight mb-2 font-headline">李华，今天也是充满干劲的一天！继续加油！</h2>
          <p class="text-on-surface-variant text-lg max-w-2xl font-light font-body">"Education is the most powerful weapon which you can use to change the world." — Nelson Mandela</p>
        </section>

        <!-- Statistics Grid -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-body">
          <div class="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(43,52,55,0.06)] flex flex-col">
            <span class="text-on-surface-variant text-sm font-medium uppercase tracking-widest mb-4">累计学习时长</span>
            <div class="flex items-baseline gap-2">
              <span class="text-5xl font-extrabold text-primary tracking-tighter">128</span>
              <span class="text-on-surface-variant font-medium">h</span>
            </div>
            <div class="mt-4 flex items-center gap-1 text-xs text-green-600 font-bold">
              <span class="material-symbols-outlined text-sm">trending_up</span>
              <span>较上月提升 12%</span>
            </div>
          </div>
          <div class="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(43,52,55,0.06)] flex flex-col border-l-4 border-tertiary">
            <span class="text-on-surface-variant text-sm font-medium uppercase tracking-widest mb-4">已完成课程数</span>
            <div class="flex items-baseline gap-2">
              <span class="text-5xl font-extrabold text-on-surface tracking-tighter">15</span>
              <span class="text-on-surface-variant font-medium">课程</span>
            </div>
            <div class="mt-4 flex items-center gap-1 text-xs text-on-surface-variant font-medium">
              <span class="material-symbols-outlined text-sm">check_circle</span>
              <span>本月新增 2 个</span>
            </div>
          </div>
          <div class="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(43,52,55,0.06)] flex flex-col">
            <span class="text-on-surface-variant text-sm font-medium uppercase tracking-widest mb-4">收藏资源数</span>
            <div class="flex items-baseline gap-2">
              <span class="text-5xl font-extrabold text-tertiary-dim tracking-tighter">42</span>
              <span class="text-on-surface-variant font-medium">项</span>
            </div>
            <div class="mt-4 flex items-center gap-1 text-xs text-on-surface-variant font-medium">
              <span class="material-symbols-outlined text-sm">bookmarks</span>
              <span>涵盖 5 个知识领域</span>
            </div>
          </div>
        </section>

        <div class="flex flex-col lg:flex-row gap-12 font-body">
          <!-- 70% Content Area -->
          <div class="lg:w-[70%] space-y-12">
            <!-- Continue Learning Card -->
            <div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_12px_32px_rgba(43,52,55,0.06)] flex flex-col md:flex-row">
              <div class="md:w-2/5 relative group cursor-pointer" @click="$router.push('/courses/1')">
                <img alt="Course Thumbnail" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKEuvmnof8il_m4eDxyH6LckCq85klTDMkolUtG8xqU2dIaxsGocn8DHjOhF14dCUpTmR1hgUO19sJoe2n1LTJvQKRxdcD0I7NaJ54XrudvoT90sxz9M6BCI_6gE-eYDm79BaBjiHptPxn_48wckkasZUxzA5W_asLI6Ctxc89dKB1LPYhfg6STmRj_6NZHRlZQGukxR4EXIa2HBP-1_sJ8wRvcFSJzG1TlW72eTt-9z8A8RZ7161oeE3Pao_ctjoDEgCf-haecmw"/>
                <div class="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span class="material-symbols-outlined text-white text-6xl">play_circle</span>
                </div>
              </div>
              <div class="md:w-3/5 p-8 flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Top Pick</span>
                    <span class="text-on-surface-variant text-xs font-medium">Python Data Science</span>
                  </div>
                  <h3 class="text-2xl font-extrabold text-on-surface mb-2 font-headline">Lesson 4: Pandas Basics</h3>
                  <p class="text-on-surface-variant text-sm mb-8">深入浅出讲解 Pandas 数据帧的操作与清洗技巧，为后续机器学习打好基础。</p>
                </div>
                <div class="space-y-4">
                  <div class="flex justify-between items-end mb-1">
                    <span class="text-xs font-bold text-on-surface-variant">Progress</span>
                    <span class="text-xs font-bold text-primary">65%</span>
                  </div>
                  <div class="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full" style="width: 65%"></div>
                  </div>
                  <div class="flex justify-end pt-2">
                    <button class="border-2 border-primary text-primary px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/5 transition-colors" @click="$router.push('/courses/1')">继续观看</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course Tabs Section -->
            <section>
              <div class="flex items-center gap-8 mb-8 border-b border-outline-variant/10">
                <button class="pb-4 text-primary font-bold border-b-2 border-primary text-sm uppercase tracking-widest transition-all">正在学习</button>
                <button class="pb-4 text-on-surface-variant font-bold hover:text-primary text-sm uppercase tracking-widest transition-all">已收藏</button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Course Item 1 -->
                <div class="flex gap-4 p-4 bg-surface-container-low rounded-xl group hover:bg-surface-container-high transition-all cursor-pointer">
                  <img alt="React Basics" class="w-24 h-24 rounded-lg object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ4HZ0ilkdhP02dUE6N_8q8Qr5oa_lNBdvkyFYL-A8t0On7u6uwXRlpVr3jVI1LkAV-_kRbjaq-M8CNBjqnzfOI6YKe0aUokuAdepk7XJsC5nLi2HG_Ku3I4iW4CchM9XGgHDvoJ4womqv--6VsyBoANbgD7EFRgZDYPNxFLinGtB9DYNy-5dlQCkyZad60YdyX6NtiRERMHIvUj9-srxJmbmWqPW9N0QGwTtXwrEq9k3NKfyql47dn0KpZSOG8EyAMvUjvdX7pRI"/>
                  <div class="flex flex-col justify-between py-1 w-full">
                    <div>
                      <h4 class="font-bold text-on-surface leading-tight group-hover:text-primary transition-colors text-sm">React 现代前端开发指南</h4>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] text-primary font-bold px-1.5 py-0.5 bg-white rounded shadow-sm border border-outline-variant/10">Bilibili</span>
                        <span class="text-[10px] text-on-surface-variant font-medium">上次学习: 2小时前</span>
                      </div>
                    </div>
                    <div class="h-1 w-full bg-white/50 rounded-full mt-auto">
                      <div class="h-full bg-primary/40 rounded-full w-[85%]"></div>
                    </div>
                  </div>
                </div>
                <!-- Course Item 2 -->
                <div class="flex gap-4 p-4 bg-surface-container-low rounded-xl group hover:bg-surface-container-high transition-all cursor-pointer">
                  <img alt="UI Design" class="w-24 h-24 rounded-lg object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwXlwn38ZcS8Fsu4f6AHobgDttw-lnNHhSJ6HfWK26w4Re336LzB4XXQ-PNRDSquAl_4vPDPkDNYF_HdLIMXDXlWKQFYlyMtF1Eg_2BfsloA7THxaYxmny7gBk3CT-nn5SHQk6WWbYHIaU7ag2It8Rmn9VdgjitJoB8A0kyX8Ap7johw0ro6UJy6mUXOde5rd0RU-EuURDU8Q4406EVgu0lOOiETMpqtUQYTbwcPn1EpLz1TJ7Oj2PGhHthP2knC0p10BjlAL6NQo"/>
                  <div class="flex flex-col justify-between py-1 w-full">
                    <div>
                      <h4 class="font-bold text-on-surface leading-tight group-hover:text-primary transition-colors text-sm">UI 设计原理与色彩美学</h4>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] text-error font-bold px-1.5 py-0.5 bg-white rounded shadow-sm border border-outline-variant/10">YouTube</span>
                        <span class="text-[10px] text-on-surface-variant font-medium">上次学习: 1天前</span>
                      </div>
                    </div>
                    <div class="h-1 w-full bg-white/50 rounded-full mt-auto">
                      <div class="h-full bg-primary/40 rounded-full w-[32%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- 30% Sidebar Area -->
          <div class="lg:w-[30%] space-y-8">
            <!-- AI Companion Recommendations -->
            <div class="bg-surface-container-low p-8 rounded-xl">
              <div class="flex items-center gap-3 mb-6">
                <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
                <h4 class="font-bold text-on-surface uppercase tracking-wider text-sm">AI 学习助手</h4>
              </div>
              <div class="space-y-6">
                <div class="p-4 bg-surface-container-lowest rounded-lg border-l-2 border-primary shadow-sm">
                  <p class="text-xs text-on-surface font-medium leading-relaxed">
                    基于你的学习进度，推荐查看<span class="text-primary font-bold">《线性代数基础》</span>。该内容与你正在学习的 Python 数据科学紧密相关。
                  </p>
                  <button class="mt-3 text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
                    查看课程 <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
                <div class="p-4 bg-surface-container-lowest rounded-lg border-l-2 border-tertiary shadow-sm">
                  <p class="text-xs text-on-surface font-medium leading-relaxed">
                    你已经连续 5 天保持学习了！建议今天下午 3 点安排一次<span class="text-tertiary-dim font-bold">复习测试</span>以巩固记忆。
                  </p>
                  <button class="mt-3 text-tertiary-dim text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
                    设定提醒 <span class="material-symbols-outlined text-sm">notifications_active</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Upcoming Tasks/Deadlines -->
            <div class="bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(43,52,55,0.06)] border border-outline-variant/10">
              <h4 class="font-bold text-on-surface mb-6 uppercase tracking-wider text-sm">即将到来</h4>
              <div class="space-y-4">
                <div class="flex gap-4">
                  <div class="bg-primary-container text-on-primary-container w-10 h-10 flex flex-col items-center justify-center rounded-lg">
                    <span class="text-[10px] leading-none uppercase font-bold">Oct</span>
                    <span class="text-sm font-extrabold">24</span>
                  </div>
                  <div class="flex-grow">
                    <p class="text-xs font-bold text-on-surface">期中模拟考试: 数据科学</p>
                    <p class="text-[10px] text-on-surface-variant">下午 2:00 - 4:00</p>
                  </div>
                </div>
                <div class="flex gap-4">
                  <div class="bg-surface-container-high text-on-surface-variant w-10 h-10 flex flex-col items-center justify-center rounded-lg">
                    <span class="text-[10px] leading-none uppercase font-bold">Oct</span>
                    <span class="text-sm font-extrabold">26</span>
                  </div>
                  <div class="flex-grow">
                    <p class="text-xs font-bold text-on-surface">社区学习研讨会</p>
                    <p class="text-[10px] text-on-surface-variant">全天 (在线会议)</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Donation Impact Card -->
            <div class="bg-[#335ea1] p-8 rounded-xl text-on-primary shadow-lg overflow-hidden relative">
              <div class="relative z-10">
                <span class="material-symbols-outlined mb-2 text-3xl">volunteer_activism</span>
                <h4 class="text-lg font-bold mb-2">你的公益影响力</h4>
                <p class="text-xs text-primary-fixed leading-relaxed mb-6">
                  感谢你的支持，你已通过学习为乡村小学捐赠了 12 本数字化图书。
                </p>
                <a class="text-xs font-bold bg-white text-primary px-4 py-2 rounded-lg hover:bg-primary-fixed transition-colors inline-block" href="#">查看捐赠详情</a>
              </div>
              <div class="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
</script>