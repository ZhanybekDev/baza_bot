<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '~/components/ui/table'

const page = ref(1)
const projectId = ref('')
const search = ref('')

const query = computed(() => ({ page: page.value, projectId: projectId.value, search: search.value }))
const { data, pending } = await useFetch('/api/admin/knowledge', { query })

watch([projectId, search], () => { page.value = 1 })

const projects = computed(() => data.value?.projects ?? [])
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">База знаний</h1>
      <p class="text-muted-foreground text-sm">Что лежит в базе: чанки по проектам, с фильтром и поиском.</p>
    </div>

    <Card>
      <CardContent class="flex flex-wrap items-center gap-3 pt-6">
        <select
          v-model="projectId"
          class="h-9 rounded-md border bg-transparent px-3 text-sm outline-none"
        >
          <option value="">Все проекты</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <div class="relative flex-1 min-w-48">
          <Search class="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
          <Input v-model="search" placeholder="Поиск по содержимому…" class="pl-8" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Чанки{{ data ? ` (${data.total})` : '' }}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-28">Проект</TableHead>
              <TableHead class="w-48">Раздел</TableHead>
              <TableHead>Содержимое</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="c in data?.chunks ?? []" :key="c.id">
              <TableCell><Badge variant="outline">{{ c.projectId ?? 'общее' }}</Badge></TableCell>
              <TableCell class="text-muted-foreground text-xs">{{ c.section }}</TableCell>
              <TableCell class="text-sm">{{ c.content }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <p v-if="pending" class="text-muted-foreground py-4 text-center text-sm">Загрузка…</p>
        <p v-else-if="!data?.chunks.length" class="text-muted-foreground py-4 text-center text-sm">Ничего не найдено.</p>

        <div v-if="data && data.totalPages > 1" class="flex items-center justify-between pt-4">
          <span class="text-muted-foreground text-sm">Стр. {{ data.page }} из {{ data.totalPages }}</span>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" :disabled="page <= 1" @click="page--">Назад</Button>
            <Button variant="outline" size="sm" :disabled="page >= data.totalPages" @click="page++">Вперёд</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
