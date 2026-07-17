<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next'

// Часть 3 ТЗ — «Главный экран» приложения партнёра BAZA, перенесён из макета
// Figma (Elvikom, node 932:22716) через Figma MCP. Полноэкранный мобильный мокап —
// собственный layout, без admin-навбара.
definePageMeta({ layout: false })
useHead({
  title: 'BAZA — Главный экран',
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
})

interface SectionCard {
  label: string
  img: string
  wide?: boolean
}

// Сетка разделов: «Проекты» занимает всю ширину строки (col-span-2), остальные — половину.
const cards: SectionCard[] = [
  { label: 'Клиенты', img: 'card-clients' },
  { label: 'Обучения\nи мероприятия', img: 'card-events' },
  { label: 'Проекты', img: 'card-projects', wide: true },
  { label: 'Грейд', img: 'card-grade' },
  { label: 'Документы', img: 'card-docs' },
  { label: 'Профиль', img: 'card-profile' },
  { label: 'ИИ - помощник', img: 'card-ai' },
]
</script>

<template>
  <div class="stage">
    <!-- Рамка телефона: 390×844, скругление 44, как в макете -->
    <div class="screen" data-node-id="932:22716">
      <!-- ── Header (iOS) ─────────────────────────────────────────── -->
      <header class="header">
        <div class="statusbar">
          <span class="statusbar__time font-ios">9:41</span>
          <div class="statusbar__icons">
            <img src="/figma/cellular.svg" alt="" class="h-[12px] w-[19px]" >
            <img src="/figma/wifi.svg" alt="" class="h-[12px] w-[17px]" >
            <span class="battery">
              <span class="battery__level" />
              <img src="/figma/battery-cap.svg" alt="" class="battery__cap" >
            </span>
          </div>
        </div>
        <div class="header__lip" />
        <div class="header__bar">
          <span class="text-[16px] text-[color:var(--muted)]">Закрыть</span>
          <span class="logo">
            <img src="/figma/logo-top.svg" alt="BAZA" class="logo__top" >
            <img src="/figma/logo-bottom.svg" alt="Development" class="logo__bottom" >
          </span>
          <span class="header__more">
            <Ellipsis class="size-[15px]" :stroke-width="2.5" />
          </span>
        </div>
      </header>

      <!-- ── Прокручиваемый контент ───────────────────────────────── -->
      <main class="list">
        <!-- Слайдер: карточка ближайшего мероприятия -->
        <section class="slider">
          <article class="event">
            <div class="event__top">
              <div class="event__head">
                <div class="event__meta">
                  <span class="event__tag">Мероприятие</span>
                  <div class="flex flex-col gap-[4px]">
                    <p class="text-[16px] font-bold text-[color:var(--ink)]">Бизнес-завтрак с BAZA</p>
                    <p class="text-[14px] text-[color:var(--muted)]">25 апреля, 10:00</p>
                  </div>
                </div>
                <img src="/figma/qr.svg" alt="QR" class="size-[62px] shrink-0" >
              </div>
              <p class="event__desc">
                В неформальной атмосфере обсудим текущую ситуацию на рынке недвижимости,
                разберем реальные кейсы продаж и поделимся инструментами, которые помогают
                быстрее закрывать сделки.
              </p>
            </div>
            <div class="event__foot">
              <div class="event__place">
                <img src="/figma/pin.svg" alt="" class="mt-[1px] size-[16px] shrink-0" >
                <div class="flex flex-col gap-[4px]">
                  <p class="text-[14px] font-bold text-[color:var(--ink)]">БЦ «Высоцкий», г.Екатеринбург</p>
                  <p class="text-[14px] text-[color:var(--muted)]">ул.Малышева 51, 1 этаж</p>
                </div>
              </div>
              <span class="event__icon">
                <img src="/figma/icon-box.svg" alt="" class="size-[16px]" >
              </span>
            </div>
          </article>
          <img src="/figma/pagination.svg" alt="" class="h-[16px] w-[48px]" >
        </section>

        <!-- Сетка разделов -->
        <section class="grid grid-cols-2 gap-[8px]">
          <article
            v-for="card in cards"
            :key="card.label"
            class="card"
            :class="{ 'col-span-2': card.wide }"
          >
            <img :src="`/figma/${card.img}.png`" alt="" class="size-[52px] object-cover" >
            <span class="card__label font-display">{{ card.label }}</span>
          </article>
        </section>
      </main>

      <!-- ── Нижняя кнопка ────────────────────────────────────────── -->
      <footer class="buttonbox">
        <button type="button" class="cta">Зафиксировать клиента</button>
        <span class="home-indicator" />
      </footer>
    </div>
  </div>
</template>

<style scoped>
.stage {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #e6edf4;
}

.screen {
  /* Токены дизайн-системы из макета (Figma variables --01..--07) */
  --red: #e20617;
  --ink: #2f2c27;
  --bg: #f4f8fb;
  --navy: #002346;
  --muted: #6c8daf;
  --border: #d8e6f4;
  --red-soft: rgba(226, 6, 23, 0.06);

  position: relative;
  width: 390px;
  height: 844px;
  overflow: hidden;
  border-radius: 44px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: var(--bg);
  font-family: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -0.4px;
  line-height: 1.2;
  color: var(--ink);
  box-shadow: 0 24px 60px rgba(0, 35, 70, 0.18);
}

.font-ios {
  font-family: -apple-system, 'SF Pro Text', 'SF Pro', system-ui, sans-serif;
}
.font-display {
  font-family: 'Unbounded Variable', ui-sans-serif, system-ui, sans-serif;
}

/* ── Header ──────────────────────────────────────────────────── */
.header {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  background: rgba(244, 248, 251, 0.8);
  backdrop-filter: blur(25px);
}
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 54px;
  padding: 0 20px 0 32px;
}
.statusbar__time {
  font-size: 17px;
  font-weight: 590;
  color: #000;
}
.statusbar__icons {
  display: flex;
  align-items: center;
  gap: 7px;
}
.battery {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 25px;
  height: 13px;
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 4.3px;
}
.battery__level {
  position: absolute;
  inset: 2px;
  right: 4px;
  background: #000;
  border-radius: 2.5px;
}
.battery__cap {
  position: absolute;
  left: 100%;
  margin-left: 1px;
  height: 5px;
  width: 2px;
}
.header__lip {
  height: 10px;
  margin: 0 16px;
  border-radius: 10px 10px 0 0;
  background: #f4f4f7;
}
.header__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 4px 16px;
}
.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 45px;
  height: 33px;
}
/* preserveAspectRatio="none" в исходных SVG → задаём точные габариты долей 45×33 из макета */
.logo__top {
  display: block;
  width: 45px;
  height: 21px;
}
.logo__bottom {
  display: block;
  width: 45px;
  height: 7px;
}
.header__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  border: 1.4px solid rgba(108, 141, 175, 0.5);
  color: var(--muted);
}

/* ── Прокручиваемый список ───────────────────────────────────── */
.list {
  position: absolute;
  inset: 122px 0 0 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 16px 112px;
}

/* ── Слайдер / карточка мероприятия ──────────────────────────── */
.slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.event {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 243px;
  padding: 16px;
  border-radius: 20px;
  background: #fff;
  box-shadow: -4px -4px 20px rgba(0, 35, 70, 0.06), 4px 4px 20px rgba(0, 35, 70, 0.06);
}
.event__top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.event__head {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.event__meta {
  display: flex;
  flex: 1 0 0;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.event__tag {
  align-self: flex-start;
  padding: 4px 8px;
  border-radius: 100px;
  background: var(--red);
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
.event__desc {
  height: 50px;
  overflow: hidden;
  font-size: 14px;
  color: var(--muted);
}
.event__foot {
  display: flex;
  align-items: center;
  gap: 16px;
}
.event__place {
  display: flex;
  flex: 1 0 0;
  gap: 8px;
  align-items: flex-start;
  min-width: 0;
}
.event__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--red-soft);
  flex-shrink: 0;
}

/* ── Карточки разделов ───────────────────────────────────────── */
.card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 116px;
  padding: 8px;
  border-radius: 20px;
  background: #fff;
  overflow: hidden;
  box-shadow: 4px 4px 10px rgba(0, 35, 70, 0.06), -4px -4px 10px rgba(0, 35, 70, 0.06);
}
.card__label {
  padding: 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: pre-line;
  color: var(--navy);
}

/* ── Нижняя кнопка ───────────────────────────────────────────── */
.buttonbox {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px 16px 8px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(2px);
}
.cta {
  width: 358px;
  height: 46px;
  border-radius: 1000px;
  background: var(--red);
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
}
.home-indicator {
  width: 139px;
  height: 5px;
  border-radius: 100px;
  background: #000;
}
</style>
