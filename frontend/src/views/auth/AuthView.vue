<template>
  <main class="flex-grow flex flex-col md:flex-row min-h-screen">
    <!-- Left Column: Branding & Promotion -->
    <section class="hidden md:flex md:w-5/12 lg:w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden">
      <!-- Decorative Background Elements -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-white blur-3xl"></div>
        <div class="absolute bottom-[-5%] right-[-5%] w-80 h-80 rounded-full bg-primary-container blur-3xl"></div>
      </div>
      <div class="relative z-10 max-w-lg text-center md:text-left">
        <div class="mb-8 inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <span class="material-symbols-outlined text-white">school</span>
          <span class="text-white font-headline font-bold tracking-tight text-xl">OpenEdu</span>
        </div>
        <h1 class="text-white text-5xl lg:text-6xl font-headline font-extrabold leading-tight mb-6">
          OpenEdu：<br/><span class="text-primary-container">无边界学习</span>
        </h1>
        <p class="text-on-primary/80 text-lg font-body leading-relaxed mb-12 max-w-md">
          加入我们，开启全网免费精品资源学习之旅。我们致力于打破知识围墙，让教育公平惠及每一个人。
        </p>
        <!-- Visual Element: Abstract Card or Illustration -->
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-primary-fixed to-tertiary-fixed rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div class="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-xl shadow-2xl">
            <div class="flex items-center space-x-4 mb-6">
              <div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                <span class="material-symbols-outlined text-primary">auto_awesome</span>
              </div>
              <div>
                <h3 class="text-white font-headline font-semibold">智慧推荐系统</h3>
                <p class="text-on-primary/60 text-sm">为你量身定制学习路径</p>
              </div>
            </div>
            <div class="space-y-3">
              <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div class="h-full w-2/3 bg-primary-container"></div>
              </div>
              <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div class="h-full w-1/2 bg-tertiary-fixed"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Column: Forms Section -->
    <section class="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 bg-surface">
      <!-- Mobile Logo -->
      <div class="md:hidden mb-8 flex items-center space-x-2">
        <span class="material-symbols-outlined text-primary text-3xl">school</span>
        <span class="text-primary font-headline font-bold text-2xl tracking-tight">OpenEdu</span>
      </div>
      <div class="w-full max-w-md">
        <!-- Tabs Container -->
        <div class="bg-surface-container-low p-1 rounded-xl mb-10 flex space-x-1">
          <button 
            @click="isLogin = true"
            :class="[
              'flex-1 py-3 text-sm font-headline rounded-lg transition-all duration-300',
              isLogin ? 'bg-surface-container-lowest text-primary shadow-sm font-bold' : 'text-on-surface-variant font-medium hover:text-on-surface'
            ]"
          >
            登录
          </button>
          <button 
            @click="isLogin = false"
            :class="[
              'flex-1 py-3 text-sm font-headline rounded-lg transition-all duration-300',
              !isLogin ? 'bg-surface-container-lowest text-primary shadow-sm font-bold' : 'text-on-surface-variant font-medium hover:text-on-surface'
            ]"
          >
            免费注册
          </button>
        </div>

        <!-- Form Card -->
        <div class="bg-surface-container-lowest rounded-2xl p-8 lg:p-10 shadow-[0px_12px_32px_rgba(43,52,55,0.06)] relative">
          <!-- Login Form -->
          <div v-if="isLogin">
            <header class="mb-8">
              <h2 class="text-2xl font-headline font-bold text-on-surface">欢迎回来</h2>
              <p class="text-on-surface-variant text-sm mt-2">请登录您的账户以继续学习</p>
            </header>
            <form class="space-y-6" @submit.prevent="handleLogin">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">邮箱地址</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input class="w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all" placeholder="name@example.com" type="email"/>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">密码</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input class="w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all" placeholder="••••••••" type="password"/>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <label class="flex items-center space-x-2 cursor-pointer group">
                  <input class="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all" type="checkbox"/>
                  <span class="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">记住我</span>
                </label>
                <a class="text-sm font-medium text-primary hover:text-primary-dim transition-colors" href="#">忘记密码？</a>
              </div>
              <button class="w-full bg-primary hover:bg-primary-dim text-on-primary font-headline font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2" type="submit">
                <span>立即登录</span>
                <span class="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>
          </div>

          <!-- Register Form -->
          <div v-else>
            <header class="mb-8">
              <h2 class="text-2xl font-headline font-bold text-on-surface">创建新账户</h2>
              <p class="text-on-surface-variant text-sm mt-2">开启您的终身学习之旅</p>
            </header>
            <form class="space-y-5" @submit.prevent="handleRegister">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">用户名</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">person</span>
                  <input class="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all" placeholder="学习先行者" type="text"/>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">邮箱地址</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input class="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all" placeholder="edu@example.com" type="email"/>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">设置密码</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input class="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all" placeholder="至少8位字符" type="password"/>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">确认密码</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">verified_user</span>
                  <input class="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all" placeholder="再次输入密码" type="password"/>
                </div>
              </div>
              <button class="w-full bg-primary hover:bg-primary-dim text-on-primary font-headline font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2" type="submit">
                立即注册
              </button>
              <p class="text-center text-[10px] sm:text-xs text-on-surface-variant leading-relaxed px-4">
                注册即代表同意《OpenEdu 公益服务协议》和《用户隐私政策》。我们将保护您的数据安全。
              </p>
            </form>
          </div>
        </div>

        <!-- Alternative Entry Points -->
        <div class="mt-10 flex items-center justify-center space-x-6 text-on-surface-variant">
          <span class="h-px w-12 bg-outline-variant/30"></span>
          <span class="text-xs uppercase tracking-widest font-bold">第三方登录</span>
          <span class="h-px w-12 bg-outline-variant/30"></span>
        </div>
        <div class="mt-6 flex justify-center space-x-4">
          <button class="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-outline-variant/20 hover:bg-surface-container-low transition-all shadow-sm">
            <img alt="Google" class="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2dpzVZ362Rd8nCYnGL4z4XuzXWEEnw-R74ATeQ2qz5j18Oe_Rul06x9ZqD0-nSEzOqcj0zHCb8Uqubv9QydDqj3xrZOnWCL1n-D9vMlLN7-fn3-hO5D1YTM0lAjYHXuE5SdW8ZugdYvCloU5mClerHRCsI0zcibPGYg0xaPdMnNJM0FlwRTgaa6f_1SxaGtmUJvDImrB6vBMDljY9lwOv8I39D8naBY2kVvttuLIKghKdE5PjGRJI53jMF6PTIbHFpjG34ONDtYk"/>
          </button>
          <button class="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-outline-variant/20 hover:bg-surface-container-low transition-all shadow-sm">
            <img alt="GitHub" class="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEyRL-67Sl89uBBDjNK_NW7r3fDwNAlYJz3qnv1PHvnGAe_xoRO3CYjsVUnLMfxUjHLSHkklKN_d36zaeXhNn_zBnxtGIkmvgSiUoueJtXxMCu-zwwMJE7Ux1COc-wDghlTi_De3vUSOYgTDJPBdEQ7OHz_0AIF0qxxFTrWsKVgNfVqCZrNG18-3KTLlFqLB006Dn1E3jZhsAWFHOq2LgJT09X6ObYLNZ8QLawITJGVk0IM4N3vrwbIMwDpjKFB_Jw2hmH18LDLY4"/>
          </button>
          <button class="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-outline-variant/20 hover:bg-surface-container-low transition-all shadow-sm">
            <img alt="WeChat" class="w-6 h-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuARnECBghds9zRqgvYdFVHb5scMl2eBCw0iV4nOAfKBhgNTYf0vpg4RC4e5SOrS5Un8jE2_th6biEkS-j6utNaquehHDpQLUD3fYhUjWOLxi8l-kShvN8J1kuCXo-rClqokSGm_Iv4g6wy1k4JYu-B3XipI452RxImq8yX2WDpIu1NMZ_-estXkEYEm7WvtIeEstDgNbmnZPmpgh-9W434Ra8q7ZLgu3o7z7pHoo6OWa_ZjDiCZoKiFXFq8blsJAxsxeLiqlNfVygU"/>
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const isLogin = ref(true)
const router = useRouter()

const handleLogin = () => {
  // Mock login
  router.push('/dashboard')
}

const handleRegister = () => {
  // Mock register
  isLogin.value = true
}
</script>

<style scoped>
input:focus {
  border-bottom-width: 2px;
  border-color: var(--color-primary);
  outline: none;
}
</style>