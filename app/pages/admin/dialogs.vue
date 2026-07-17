<script setup lang="ts">
import { User, Bot, Mic } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'

const page = ref(1)
const { data, pending } = await useFetch('/api/admin/dialogs', { query: computed(() => ({ page: page.value })) })

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">История диалогов</h1>
      <p class="text-muted-foreground text-sm">Кто спросил, что ответил бот.</p>
    </div>

    <p v-if="pending" class="text-muted-foreground text-sm">Загрузка…</p>
    <p v-else-if="!data?.dialogs.length" class="text-muted-foreground text-sm">Диалогов пока нет.</p>

    <Card v-for="d in data?.dialogs ?? []" :key="d.id">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle class="text-base">{{ d.username ? '@' + d.username : 'chat ' + d.tgChatId }}</CardTitle>
          <span class="text-muted-foreground text-xs">{{ fmtDate(d.updatedAt) }}</span>
        </div>
      </CardHeader>
      <CardContent class="space-y-3">
        <div v-for="m in d.messages" :key="m.id" class="flex gap-3">
          <div class="mt-0.5 shrink-0">
            <User v-if="m.role === 'USER'" class="text-muted-foreground size-4" />
            <Bot v-else class="text-primary size-4" />
          </div>
          <div class="flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium">{{ m.role === 'USER' ? 'Агент' : 'Бот' }}</span>
              <Mic v-if="m.kind === 'VOICE'" class="text-muted-foreground size-3" />
              <Badge v-if="m.intent" variant="secondary" class="text-[10px]">{{ m.intent }}</Badge>
              <Badge v-for="pid in m.projectIds" :key="pid" variant="outline" class="text-[10px]">{{ pid }}</Badge>
            </div>
            <p class="text-sm whitespace-pre-line">{{ m.text }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <div v-if="data && data.totalPages > 1" class="flex items-center justify-between">
      <span class="text-muted-foreground text-sm">Стр. {{ data.page }} из {{ data.totalPages }}</span>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--">Назад</Button>
        <Button variant="outline" size="sm" :disabled="page >= data.totalPages" @click="page++">Вперёд</Button>
      </div>
    </div>
  </div>
</template>
