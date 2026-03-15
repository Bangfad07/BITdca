/**
 * BitDCA — Kalkulator Dollar Cost Averaging Bitcoin
 * Logic: fetch data, calculate DCA, render chart & stats
 */
(function() {
  'use strict';

  const REFERRAL_URL = 'https://www.bmwweb.biz/activity/referral-entry/CPA?ref=CPA_00BBUL6QIA';
  const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=3650&interval=daily';

  const AMOUNT_STEPS = [10,15,20,25,30,40,50,75,100,150,200,250,300,400,500,600,750,1000,1250,1500,2000,2500,3000,4000,5000,6000,7500,8000,9000,10000];

  const DURATION_MAP = {
    '6mo': 180, '1yr': 365, '3yr': 1095, '5yr': 1825, '10yr': 3650
  };

  const DURATION_LABELS = {
    '6mo': '6 Bulan', '1yr': '1 Tahun', '3yr': '3 Tahun', '5yr': '5 Tahun', '10yr': '10 Tahun'
  };

  const START_STEPS = [180, 365, 548, 730, 912, 1095, 1460, 1825, 2555, 3285, 5475, 7300];
  const START_LABELS = ['6 bln lalu','1 th lalu','1.5 th lalu','2 th lalu','2.5 th lalu','3 th lalu','4 th lalu','5 th lalu','7 th lalu','9 th lalu','15 th lalu','20 th lalu'];

  let priceData = [];
  let currentPrice = 0;
  let chart = null;

  let state = {
    amountMonthly: 100,
    freq: 'monthly',
    duration: '3yr',
    startIdx: 5
  };

  function getAmountPerPurchase() {
    if (state.freq === 'monthly') return state.amountMonthly;
    if (state.freq === 'weekly') return state.amountMonthly / 4;
    return state.amountMonthly / 30;
  }

  function fmtUSD(n) {
    if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + n.toLocaleString('en', { maximumFractionDigits: 0 });
    return '$' + n.toFixed(2);
  }

  function fmtBTC(n) {
    if (n < 0.001) return n.toFixed(8);
    if (n < 1) return n.toFixed(4);
    return n.toFixed(3);
  }

  async function fetchPriceData() {
    try {
      const res = await fetch(COINGECKO_URL);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      priceData = json.prices.map(function(p) {
        return { date: new Date(p[0]), price: p[1] };
      });
      currentPrice = priceData[priceData.length - 1].price;
      document.getElementById('loading-overlay').style.display = 'none';
      buildTicker();
      calculate();
      readStateFromUrl();
    } catch (e) {
      document.getElementById('loading-overlay').innerHTML =
        '<div class="error-msg">' +
        '<span>⚠ Data tidak dapat dimuat</span>' +
        'Menggunakan perkiraan harga historis. Hasil bersifat perkiraan.<br><br>' +
        '<button onclick="window.bitDcaRetry()" style="background:var(--red);border:none;color:white;padding:10px 20px;border-radius:6px;cursor:pointer;font-family:\'IBM Plex Mono\',monospace;">Coba Lagi</button>' +
        '</div>';
      useFallbackData();
    }
  }

  window.bitDcaRetry = fetchPriceData;

  function useFallbackData() {
    const fallbackMonthly = [
      [2013,1,13], [2013,6,100], [2013,12,1000],
      [2014,3,600], [2014,12,320],
      [2015,6,240], [2015,12,430],
      [2016,6,700], [2016,12,950],
      [2017,3,1200], [2017,6,2500], [2017,9,4000], [2017,12,19000],
      [2018,3,8000], [2018,6,6500], [2018,9,6300], [2018,12,3200],
      [2019,3,4000], [2019,6,12000], [2019,9,8000], [2019,12,7200],
      [2020,3,5800], [2020,6,9500], [2020,9,10800], [2020,12,29000],
      [2021,3,58000],[2021,6,35000],[2021,9,43000],[2021,12,46000],
      [2022,3,44000],[2022,6,19000],[2022,9,20000],[2022,12,16000],
      [2023,3,28000],[2023,6,30000],[2023,9,27000],[2023,12,42000],
      [2024,3,70000],[2024,6,60000],[2024,9,64000],[2024,12,97000],
      [2025,3,85000]
    ];
    priceData = [];
    for (let i = 0; i < fallbackMonthly.length - 1; i++) {
      const a = fallbackMonthly[i], b = fallbackMonthly[i + 1];
      const startDate = new Date(a[0], a[1] - 1, 1);
      const endDate = new Date(b[0], b[1] - 1, 1);
      const days = Math.floor((endDate - startDate) / 86400000);
      for (let d = 0; d < days; d++) {
        const t = d / days;
        priceData.push({
          date: new Date(startDate.getTime() + d * 86400000),
          price: a[2] * (1 - t) + b[2] * t
        });
      }
    }
    currentPrice = priceData[priceData.length - 1].price;
    document.getElementById('loading-overlay').style.display = 'none';
    buildTicker();
    calculate();
  }

  function buildTicker() {
    const items = [
      { label: 'BTC/USD', val: '$' + currentPrice.toLocaleString('en', { maximumFractionDigits: 0 }) },
      { label: 'PERUBAHAN 24J', val: '+2.34%', cls: 'up' },
      { label: 'MARKET CAP', val: '$' + (currentPrice * 19700000 / 1e9).toFixed(0) + 'B' },
      { label: 'SUPPLY', val: '19.7M BTC' },
      { label: 'MAX SUPPLY', val: '21M BTC' },
      { label: 'STRATEGI DCA', val: '✓ BERGUNA' },
    ];
    const html = items.concat(items).map(function(it) {
      return '<div class="ticker-item"><strong>' + it.label + '</strong> <span class="' + (it.cls || '') + '">' + it.val + '</span></div>';
    }).join('');
    document.getElementById('ticker-inner').innerHTML = html;
  }

  function calculate() {
    if (priceData.length === 0) return;

    const today = priceData[priceData.length - 1].date;
    const daysBack = START_STEPS[state.startIdx];
    const durDays = DURATION_MAP[state.duration];

    const startDate = new Date(today.getTime() - daysBack * 86400000);
    const endDate = new Date(startDate.getTime() + durDays * 86400000);
    const effectiveEnd = endDate > today ? today : endDate;

    const intervalMap = { daily: 1, weekly: 7, monthly: 30 };
    const interval = intervalMap[state.freq];
    const amountPerPurchase = getAmountPerPurchase();

    let totalInvested = 0;
    let totalBTC = 0;
    const chartPoints = [];
    const investedPoints = [];
    const labels = [];

    const slice = priceData.filter(function(d) {
      return d.date >= startDate && d.date <= effectiveEnd;
    });
    if (slice.length === 0) {
      renderStats(0, 0, 0, 0, 0, null);
      return;
    }

    let lastPurchase = null;
    let bestPurchasePrice = Infinity;
    let bestPurchaseDate = null;

    const totalDays = (effectiveEnd - startDate) / 86400000;
    const labelEvery = totalDays > 1000 ? 90 : totalDays > 365 ? 30 : totalDays > 90 ? 7 : 1;

    slice.forEach(function(d, i) {
      const daysSinceLast = lastPurchase ? (d.date - lastPurchase) / 86400000 : interval;
      if (daysSinceLast >= interval || lastPurchase === null) {
        const btcBought = amountPerPurchase / d.price;
        totalBTC += btcBought;
        totalInvested += amountPerPurchase;
        lastPurchase = d.date;
        if (d.price < bestPurchasePrice) {
          bestPurchasePrice = d.price;
          bestPurchaseDate = d.date;
        }
      }
      const portfolioValue = totalBTC * d.price;

      if (i % labelEvery === 0 || i === slice.length - 1) {
        labels.push(d.date.toLocaleString('id', { month: 'short', year: '2-digit' }));
        chartPoints.push(Math.round(portfolioValue));
        investedPoints.push(Math.round(totalInvested));
      }
    });

    const finalValue = totalBTC * currentPrice;
    const avgBuy = totalBTC > 0 ? totalInvested / totalBTC : 0;

    renderStats(totalInvested, finalValue, totalBTC, avgBuy, bestPurchasePrice, bestPurchaseDate);
    renderChart(labels, chartPoints, investedPoints);
    updateShareUrl();
  }

  function renderStats(invested, value, btc, avg, bestPrice, bestDate) {
    const pnl = value - invested;
    const pct = invested > 0 ? (pnl / invested) * 100 : 0;

    document.getElementById('stat-invested').textContent = fmtUSD(invested);
    document.getElementById('stat-value').textContent = fmtUSD(value);

    const pnlEl = document.getElementById('stat-pnl');
    pnlEl.textContent = (pnl >= 0 ? '+' : '') + fmtUSD(pnl);
    pnlEl.className = 'stat-value ' + (pnl >= 0 ? 'profit' : 'loss');
    document.getElementById('stat-pnl-pct').textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';

    document.getElementById('stat-btc').textContent = fmtBTC(btc);
    document.getElementById('stat-avg').textContent = fmtUSD(avg);

    if (bestDate) {
      document.getElementById('stat-best').textContent = fmtUSD(bestPrice);
      document.getElementById('stat-best-date').textContent =
        bestDate.toLocaleString('id', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  function renderChart(labels, values, invested) {
    const ctx = document.getElementById('dca-chart').getContext('2d');
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Nilai Portofolio',
            data: values,
            borderColor: '#E8192C',
            backgroundColor: function(ctx) {
              const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 320);
              g.addColorStop(0, 'rgba(232,25,44,0.25)');
              g.addColorStop(1, 'rgba(232,25,44,0)');
              return g;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2.5,
            order: 1
          },
          {
            label: 'Total Investasi',
            data: invested,
            borderColor: '#444444',
            backgroundColor: 'rgba(68,68,68,0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 1.5,
            borderDash: [5, 5],
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1a1a',
            borderColor: 'rgba(232,25,44,0.4)',
            borderWidth: 1,
            titleColor: '#888',
            bodyColor: '#fff',
            titleFont: { family: 'IBM Plex Mono', size: 11 },
            bodyFont: { family: 'IBM Plex Mono', size: 13 },
            callbacks: {
              label: function(ctx) {
                return ' ' + ctx.dataset.label + ': ' + fmtUSD(ctx.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#555',
              font: { family: 'IBM Plex Mono', size: 10 },
              maxTicksLimit: 12,
              maxRotation: 0
            },
            border: { color: 'rgba(255,255,255,0.08)' }
          },
          y: {
            position: 'right',
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#555',
              font: { family: 'IBM Plex Mono', size: 10 },
              callback: function(v) {
                if (v >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M';
                if (v >= 1e3) return '$' + (v/1e3).toFixed(0) + 'K';
                return '$' + v;
              }
            },
            border: { color: 'rgba(255,255,255,0.08)' }
          }
        }
      }
    });
  }

  function getShareUrl() {
    var base = location.origin + location.pathname;
    var params = new URLSearchParams();
    params.set('amount', state.amountMonthly);
    params.set('freq', state.freq);
    params.set('duration', state.duration);
    params.set('start', state.startIdx);
    return base + '?' + params.toString();
  }

  function updateShareUrl() {
    var url = getShareUrl();
    if (history.replaceState) {
      history.replaceState(null, '', url);
    }
  }

  function readStateFromUrl() {
    var params = new URLSearchParams(location.search);
    var amount = parseInt(params.get('amount'), 10);
    var freq = params.get('freq');
    var duration = params.get('duration');
    var start = parseInt(params.get('start'), 10);
    if (!isNaN(amount) && amount >= 10 && amount <= 10000) {
      var idx = AMOUNT_STEPS.indexOf(amount);
      if (idx === -1) {
        for (var i = 0; i < AMOUNT_STEPS.length; i++) {
          if (AMOUNT_STEPS[i] >= amount) { idx = i; break; }
        }
        if (idx === -1) idx = AMOUNT_STEPS.length - 1;
      }
      state.amountMonthly = AMOUNT_STEPS[idx];
      document.getElementById('amount-slider').value = idx;
      document.getElementById('amount-display').textContent = '$' + state.amountMonthly.toLocaleString();
    }
    if (freq === 'daily' || freq === 'weekly' || freq === 'monthly') {
      state.freq = freq;
      document.querySelectorAll('[data-freq]').forEach(function(b) { b.classList.remove('active'); });
      document.querySelector('[data-freq="' + freq + '"]').classList.add('active');
      var fl = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' };
      document.getElementById('freq-display').textContent = fl[freq];
    }
    if (duration && DURATION_MAP[duration]) {
      state.duration = duration;
      document.querySelectorAll('[data-dur]').forEach(function(b) { b.classList.remove('active'); });
      document.querySelector('[data-dur="' + duration + '"]').classList.add('active');
      document.getElementById('duration-display').textContent = DURATION_LABELS[duration];
    }
    if (!isNaN(start) && start >= 0 && start <= 11) {
      state.startIdx = start;
      document.getElementById('start-slider').value = start;
      document.getElementById('start-display').textContent = START_LABELS[start];
    }
    calculate();
  }

  document.getElementById('amount-slider').addEventListener('input', function() {
    var idx = parseInt(this.value, 10);
    state.amountMonthly = AMOUNT_STEPS[idx];
    document.getElementById('amount-display').textContent = '$' + state.amountMonthly.toLocaleString();
    calculate();
  });

  document.querySelectorAll('[data-freq]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-freq]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.freq = btn.dataset.freq;
      var labels = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan' };
      document.getElementById('freq-display').textContent = labels[state.freq];
      calculate();
    });
  });

  document.querySelectorAll('[data-dur]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-dur]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.duration = btn.dataset.dur;
      document.getElementById('duration-display').textContent = DURATION_LABELS[state.duration];
      calculate();
    });
  });

  document.getElementById('start-slider').addEventListener('input', function() {
    state.startIdx = parseInt(this.value, 10);
    document.getElementById('start-display').textContent = START_LABELS[state.startIdx];
    calculate();
  });

  document.getElementById('copy-link-btn').addEventListener('click', function() {
    var url = getShareUrl();
    navigator.clipboard.writeText(url).then(function() {
      var btn = document.getElementById('copy-link-btn');
      btn.textContent = 'Tersalin!';
      btn.classList.add('copied');
      setTimeout(function() {
        btn.textContent = 'Salin Link';
        btn.classList.remove('copied');
      }, 2000);
    });
  });

  document.getElementById('amount-display').textContent = '$100';
  document.getElementById('start-display').textContent = START_LABELS[state.startIdx];
  fetchPriceData();
})();
