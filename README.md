# BitDCA — Kalkulator Dollar Cost Averaging Bitcoin

Website kalkulator DCA (Dollar Cost Averaging) Bitcoin untuk simulasi **Portfolio Value Over Time**.

## Fitur

- **Purchase Amount** — Nominal USD per bulan ($10 – $10.000) yang diinvestasikan
- **Repeat Purchase** — Frekuensi beli: Harian, Mingguan, atau Bulanan
- **Accumulate For** — Rentang simulasi: 6 bulan, 1 tahun, 3 tahun, 5 tahun, 10 tahun
- **Starting From** — Mulai simulasi dari 6 bulan lalu hingga 20 tahun lalu
- **Grafik** — Pertumbuhan nilai portofolio vs total investasi (Chart.js)
- **Statistik** — Total investasi, nilai portofolio, profit/loss, BTC terkumpul, harga beli rata-rata, pembelian terbaik
- **Salin Link** — URL berisi parameter saat ini agar bisa dibagikan
- **CTA Exchange** — Tombol daftar/mulai DCA ke exchange dengan link referral

## Struktur Proyek

```
Bit DCA/
├── index.html      # Halaman utama (HTML saja)
├── css/
│   └── style.css   # Semua style (variabel, layout, komponen, responsif)
├── js/
│   └── main.js     # Logic DCA, fetch data, chart, event handlers
└── README.md
```

## Cara Menjalankan

Buka `index.html` di browser (double-click atau lewat live server). Tidak perlu build.

## Tech

- HTML5, CSS3, Vanilla JS (file terpisah)
- [Chart.js](https://www.chartjs.org/) untuk grafik
- Data harga historis: [CoinGecko API](https://www.coingecko.com/en/api) (fallback data built-in jika API gagal)

## Desain

- Warna: Hitam (#080808), Merah (#E8192C), Putih (#FFFFFF)
- Font: Syne (heading), IBM Plex Mono (body)
- Responsif & user-friendly

## Link Referral

Tombol "Mulai DCA" / "Daftar & Mulai DCA" mengarah ke:
`https://www.bmwweb.biz/activity/referral-entry/CPA?ref=CPA_00BBUL6QIA`

---

*BitDCA — Bukan saran finansial. Data dari CoinGecko.*
