<script setup lang="ts">
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '~/components/ui/table'

const { data, refresh, pending } = await useFetch('/api/admin/sources')

const isRunning = computed(() => data.value?.lastRun?.status === 'RUNNING')
const reingesting = ref(false)

async function reingest() {
  reingesting.value = true
  try {
    await $fetch('/api/admin/reingest', { method: 'POST' })
    // Пуллим статус, пока идёт прогон.
    const poll = setInterval(async () => {
      await refresh()
      if (!isRunning.value) clearInterval(poll)
    }, 3000)
    setTimeout(() => clearInterval(poll), 300000)
  } finally {
    reingesting.value = false
  }
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

const runStatus = computed(() => {
  const s = data.value?.lastRun?.status
  if (s === 'SUCCESS') return { variant: 'success' as const, label: 'Успешно', icon: CheckCircle2 }
  if (s === 'FAILED') return { variant: 'destructive' as const, label: 'Ошибка', icon: XCircle }
  if (s === 'RUNNING') return { variant: 'warning' as const, label: 'Выполняется', icon: Loader2 }
  return { variant: 'secondary' as const, label: 'Нет данных', icon: XCircle }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Источники базы знаний</h1>
        <p class="text-muted-foreground text-sm">Список источников, статус последнего парсинга и запуск обновления.</p>
      </div>
      <Button :disabled="isRunning || reingesting" @click="reingest">
        <RefreshCw :class="['size-4', (isRunning || reingesting) && 'animate-spin']" />
        {{ isRunning ? 'Обновляется…' : 'Переобновить' }}
      </Button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader><CardDescription>Источников</CardDescription><CardTitle class="text-3xl">{{ data?.stats.sourceCount ?? 0 }}</CardTitle></CardHeader>
      </Card>
      <Card>
        <CardHeader><CardDescription>Проектов</CardDescription><CardTitle class="text-3xl">{{ data?.stats.projectCount ?? 0 }}</CardTitle></CardHeader>
      </Card>
      <Card>
        <CardHeader><CardDescription>Чанков в базе</CardDescription><CardTitle class="text-3xl">{{ data?.stats.chunkCount ?? 0 }}</CardTitle></CardHeader>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Последний парсинг</CardTitle>
          <Badge :variant="runStatus.variant">
            <component :is="runStatus.icon" :class="['size-3', isRunning && 'animate-spin']" />
            {{ runStatus.label }}
          </Badge>
        </div>
      </CardHeader>
      <CardContent v-if="data?.lastRun" class="text-sm">
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div><span class="text-muted-foreground">Начат:</span> {{ fmtDate(data.lastRun.startedAt) }}</div>
          <div><span class="text-muted-foreground">Завершён:</span> {{ fmtDate(data.lastRun.finishedAt) }}</div>
          <div><span class="text-muted-foreground">Источников OK:</span> {{ data.lastRun.sourcesOk }}/{{ data.lastRun.sourcesTotal }}</div>
          <div><span class="text-muted-foreground">Чанков:</span> {{ data.lastRun.chunksTotal }}</div>
          <div><span class="text-muted-foreground">Новых док.:</span> {{ data.lastRun.documentsNew }}</div>
          <div><span class="text-muted-foreground">Переисп.:</span> {{ data.lastRun.documentsReused }}</div>
          <div><span class="text-muted-foreground">Сканы (OCR):</span> {{ data.lastRun.needsOcr }}</div>
          <div><span class="text-muted-foreground">Ошибок:</span> {{ data.lastRun.sourcesFailed }}</div>
        </div>
      </CardContent>
      <CardContent v-else class="text-muted-foreground text-sm">Парсинг ещё не запускался.</CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Источники ({{ data?.sources.length ?? 0 }})</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Проект</TableHead>
              <TableHead>Документов</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="s in data?.sources ?? []" :key="s.id">
              <TableCell class="font-medium">{{ s.title ?? '—' }}</TableCell>
              <TableCell class="text-muted-foreground max-w-xs truncate text-xs">{{ s.url }}</TableCell>
              <TableCell><Badge variant="outline">{{ s.projectId ?? 'общее' }}</Badge></TableCell>
              <TableCell>{{ s._count.documents }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p v-if="pending" class="text-muted-foreground py-4 text-center text-sm">Загрузка…</p>
      </CardContent>
    </Card>
  </div>
</template>
