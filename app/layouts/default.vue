<script setup lang="ts">
import { Database, MessageSquare, LayoutDashboard } from 'lucide-vue-next'

const route = useRoute()
const nav = [
  { to: '/admin', label: 'Источники', icon: LayoutDashboard },
  { to: '/admin/knowledge', label: 'База знаний', icon: Database },
  { to: '/admin/dialogs', label: 'Диалоги', icon: MessageSquare },
]
const isActive = (to: string) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="border-b">
      <div class="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <span class="font-semibold">BAZA · Админка бота</span>
        <nav class="flex items-center gap-1">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive(item.to) ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            <component :is="item.icon" class="size-4" />
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-8">
      <slot />
    </main>
  </div>
</template>
