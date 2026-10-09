<script setup>
import { computed } from 'vue'
import { formatRupiah } from '../utils/format.js'

// data: [{ label: 'Mei', income: 8500000, expense: 4285000 }, ...]
const props = defineProps({ data: { type: Array, required: true } })

const maxVal = computed(() => Math.max(...props.data.map((d) => Math.max(d.income, d.expense)), 1))
const h = (v) => Math.max(3, Math.round((v / maxVal.value) * 100))
</script>

<template>
  <div class="chart">
    <div v-for="d in data" :key="d.label" class="chart-col">
      <div class="chart-bars">
        <div
          class="bar bar-in"
          :style="{ height: h(d.income) + '%' }"
          :title="`Pemasukan: ${formatRupiah(d.income)}`"
        ></div>
        <div
          class="bar bar-out"
          :style="{ height: h(d.expense) + '%' }"
          :title="`Pengeluaran: ${formatRupiah(d.expense)}`"
        ></div>
      </div>
      <span class="chart-label">{{ d.label }}</span>
    </div>
  </div>
  <div class="chart-legend">
    <span><i class="dot dot-in"></i> Pemasukan</span>
    <span><i class="dot dot-out"></i> Pengeluaran</span>
  </div>
</template>
