<template>
  <footer class="w-full mt-auto border-t border-outline-variant/15 bg-white/70 backdrop-blur-xl">
    <div class="flex flex-col md:flex-row justify-between items-center px-6 sm:px-12 py-10 gap-8 max-w-7xl mx-auto">
      <div class="space-y-2 text-center md:text-left">
        <router-link to="/" class="inline-flex items-center gap-2 font-headline font-extrabold text-primary text-xl">
          <span class="material-symbols-outlined text-lg">school</span>
          OpenEdu
        </router-link>
        <p class="font-body text-xs text-on-surface-variant">
          © {{ currentYear }} {{ $t('footer.copyright') }}
        </p>
      </div>
      <div class="flex flex-wrap justify-center gap-6">
        <router-link class="footer-link" to="/courses">{{ $t('footer.courses') }}</router-link>
        <router-link class="footer-link" to="/dashboard">{{ $t('footer.dashboard') }}</router-link>
        <router-link class="footer-link" to="/review-hall">{{ $t('footer.reviewHall') }}</router-link>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.footer-link {
  color: var(--color-on-surface-variant);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-decoration: none;
}

.footer-link:hover {
  color: var(--color-primary);
}
</style>
