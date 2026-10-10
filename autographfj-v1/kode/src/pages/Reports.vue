<script setup>
import { computed } from 'vue'

const props = defineProps({
  jobs: Array,
  target: Number,
  totalPoints: Number
})

const groups = computed(() => {
  const map = {}

  props.jobs.forEach((job) => {
    const key = job.master?.name || 'Lainnya'

    if (!map[key]) {
      map[key] = {
        name: key,
        qty: 0,
        points: 0
      }
    }

    map[key].qty += Number(job.qty)
    map[key].points += job.total
  })

  return Object.values(map).sort((a, b) => b.points - a.points)
})

async function exportXLSX() {
  const ExcelJS = (await import('exceljs')).default

  const wb = new ExcelJS.Workbook()
  wb.creator = 'AutoGraph FJ'
  wb.created = new Date()

  const RED = 'C00000'
  const LIGHT = 'F2F2F2'
  const PINK = 'FCE4E4'
  const thin = { style: 'thin', color: { argb: 'BFBFBF' } }
  const border = { top: thin, left: thin, bottom: thin, right: thin }

  function styleHeader(row) {
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } }
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = border
    })
    row.height = 22
  }

  function styleTotal(row) {
    row.eachCell((cell, col) => {
      cell.font = { bold: true }
      cell.border = border
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PINK } }
      if (col >= 2) cell.alignment = { horizontal: 'right' }
    })
  }

  function addTitle(ws, title, subtitle, colCount) {
    ws.mergeCells(1, 1, 1, colCount)
    const t = ws.getCell(1, 1)
    t.value = title
    t.font = { bold: true, size: 14, color: { argb: RED } }
    ws.mergeCells(2, 1, 2, colCount)
    const s = ws.getCell(2, 1)
    s.value = subtitle
    s.font = { italic: true, size: 10, color: { argb: '808080' } }
  }

  const today = new Date().toISOString().slice(0, 10)

  let sumQty = 0
  let sumTotal = 0
  props.jobs.forEach((job) => {
    sumQty += Number(job.qty)
    sumTotal += Number(job.total)
  })

  // ---- Sheet 1: Rekap ----
  const ws1 = wb.addWorksheet('Rekap')
  ws1.columns = [
    { width: 14 }, { width: 10 }, { width: 26 },
    { width: 8 }, { width: 8 }, { width: 13 }
  ]
  addTitle(ws1, 'Rekap AutoGraph FJ — Technician Point', 'Diekspor ' + today, 6)
  styleHeader(ws1.addRow(['Tanggal', 'Kode', 'Pekerjaan', 'Qty', 'Poin', 'Total Poin']))

  props.jobs.forEach((job, i) => {
    const row = ws1.addRow([
      job.date,
      job.master?.code || '',
      job.master?.name || '',
      Number(job.qty),
      Number(job.points),
      Number(job.total)
    ])
    row.eachCell((cell, col) => {
      cell.border = border
      if (i % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }
      }
      if (col >= 4) cell.alignment = { horizontal: 'right' }
    })
  })
  styleTotal(ws1.addRow(['TOTAL', '', '', sumQty, '', sumTotal]))
  ws1.views = [{ state: 'frozen', ySplit: 3 }]

  // ---- Sheet 2: Per Jenis Pekerjaan ----
  const ws2 = wb.addWorksheet('Per Jenis Pekerjaan')
  ws2.columns = [{ width: 26 }, { width: 10 }, { width: 14 }]
  addTitle(ws2, 'Ringkasan per Jenis Pekerjaan', 'Diekspor ' + today, 3)
  styleHeader(ws2.addRow(['Pekerjaan', 'Qty', 'Total Poin']))

  groups.value.forEach((g, i) => {
    const row = ws2.addRow([g.name, g.qty, g.points])
    row.eachCell((cell, col) => {
      cell.border = border
      if (i % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }
      }
      if (col >= 2) cell.alignment = { horizontal: 'right' }
    })
  })
  styleTotal(ws2.addRow(['TOTAL', sumQty, sumTotal]))
  ws2.views = [{ state: 'frozen', ySplit: 3 }]

  // ---- Sheet 3: Ringkasan ----
  const ws3 = wb.addWorksheet('Ringkasan')
  ws3.columns = [{ width: 22 }, { width: 16 }]
  addTitle(ws3, 'Ringkasan Pencapaian', 'Diekspor ' + today, 2)

  const pct = props.target
    ? ((props.totalPoints / props.target) * 100).toFixed(1) + '%'
    : '0%'
  const rows3 = [
    ['Total pekerjaan', sumQty],
    ['Total poin', props.totalPoints],
    ['Target', props.target],
    ['Pencapaian', pct]
  ]
  rows3.forEach(([label, value]) => {
    const row = ws3.addRow([label, value])
    row.getCell(1).font = { bold: true }
    row.eachCell((cell) => {
      cell.border = border
    })
    row.getCell(2).alignment = { horizontal: 'right' }
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'rekap-autograph-fj.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <section class="page-head">
    <div>
      <span class="eyebrow">REPORTING</span>

      <h1>Laporan & Rekap</h1>

      <p>
        Ringkasan data pekerjaan dan estimasi poin.
      </p>
    </div>

    <button
      class="btn-primary"
      @click="exportXLSX"
    >
      ↓ Export XLSX
    </button>
  </section>

  <div class="report-cards">

    <div>
      <span>Total pekerjaan</span>
      <b>
        {{
          jobs.reduce(
            (total, job) => total + Number(job.qty),
            0
          )
        }}
      </b>
    </div>

    <div>
      <span>Total poin</span>
      <b>{{ totalPoints }}</b>
    </div>

    <div>
      <span>Target</span>
      <b>{{ target }}</b>
    </div>

    <div>
      <span>Pencapaian</span>
      <b>
        {{
          target
            ? ((totalPoints / target) * 100).toFixed(1)
            : 0
        }}%
      </b>
    </div>

  </div>

  <div class="content-grid">

    <section class="panel">

      <div class="panel-head">

        <div>
          <span class="eyebrow">BREAKDOWN</span>
          <h2>Per Jenis Pekerjaan</h2>
        </div>

      </div>

      <div class="breakdown">

        <div
          v-for="group in groups"
          :key="group.name"
          class="break-row"
        >

          <div>
            <b>{{ group.name }}</b>

            <small>
              {{ group.qty }} pekerjaan
            </small>
          </div>

          <strong>
            +{{ group.points }} poin
          </strong>

        </div>

        <div
          v-if="!groups.length"
          class="empty"
        >
          Belum ada data.
        </div>

      </div>

    </section>

    <section class="panel">

      <div class="panel-head">

        <div>
          <span class="eyebrow">TRANSPARANSI</span>
          <h2>Catatan</h2>
        </div>

      </div>

      <ul class="report-note">

        <li>
          Angka pada aplikasi merupakan hasil
          pencatatan mandiri.
        </li>

        <li>
          Bobot poin berasal dari master data
          yang dimasukkan pengguna/admin.
        </li>

        <li>
          Hasil aplikasi bukan angka penggajian
          resmi perusahaan.
        </li>

        <li>
          Gunakan laporan sebagai bahan monitoring
          dan pembanding.
        </li>

      </ul>

    </section>

  </div>
</template>