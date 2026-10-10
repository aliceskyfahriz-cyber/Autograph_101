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

function exportCSV() {
  const rows = [
    ['Tanggal', 'Kode', 'Pekerjaan', 'Qty', 'Poin', 'Total Poin']
  ]

  props.jobs.forEach((job) => {
    rows.push([
      job.date,
      job.master?.code || '',
      job.master?.name || '',
      job.qty,
      job.points,
      job.total
    ])
  })

  const csv = rows
    .map((row) => {
      return row
        .map((value) => {
          const safeValue = String(value).replace(/"/g, '""')
          return '"' + safeValue + '"'
        })
        .join(',')
    })
    .join('\n')

  const blob = new Blob(
    [csv],
    { type: 'text/csv;charset=utf-8' }
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'rekap-autograph-fj.csv'

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
      @click="exportCSV"
    >
      ↓ Export CSV
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