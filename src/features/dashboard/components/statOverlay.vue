<template>
    <div class="so-root">

        <!-- ══════════════════════
             FLOATING CARDS
        ══════════════════════ -->
        <div class="so-cards" :class="{ 'so-cards--shifted': panelOpen }">

            <button class="so-card so-card--live" @click="panelOpen = true">
                <div class="so-card-left">
                    <span class="so-pulse"><span class="so-pulse-ring"></span></span>
                    <div class="so-card-body">
                        <span class="so-card-label">Events visible</span>
                        <span class="so-card-num so-card-num--amber">{{ visibleCount }}</span>
                    </div>
                </div>
                <span class="so-badge">LIVE</span>
            </button>

            <div v-for="cat in topFive" :key="cat.id" class="so-card"
                :class="{ 'so-card--hovered': hovered === cat.id }" @mouseenter="hovered = cat.id"
                @mouseleave="hovered = null">
                <div class="so-card-left">
                    <span class="so-dot" :style="{ background: cat.color }"></span>
                    <div class="so-card-body">
                        <span class="so-card-label">{{ cat.title }}</span>
                        <span class="so-card-num">{{ cat.rawCount }}</span>
                    </div>
                </div>
                <svg class="so-mini-spark" viewBox="0 0 56 26" preserveAspectRatio="none">
                    <defs>
                        <linearGradient :id="`mg-${cat.id}`" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" :stop-color="cat.color" stop-opacity="0.4" />
                            <stop offset="100%" :stop-color="cat.color" stop-opacity="0" />
                        </linearGradient>
                    </defs>
                    <polygon :fill="`url(#mg-${cat.id})`" :points="areaPoints(cat.spark7, 56, 26)" />
                    <polyline fill="none" :stroke="cat.color" stroke-width="1.5" stroke-linecap="round"
                        stroke-linejoin="round" :points="linePoints(cat.spark7, 56, 26)" />
                </svg>
            </div>
        </div>

        <!-- ══════════════════════
             SIDE PANEL
        ══════════════════════ -->
        <transition name="panel-slide">
            <aside v-if="panelOpen" class="so-panel">

                <header class="so-ph">
                    <div class="so-ph-title">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" class="so-ph-icon">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2" />
                            <circle cx="7" cy="7" r="2.2" fill="currentColor" />
                            <line x1="7" y1="1" x2="7" y2="3.8" stroke="currentColor" stroke-width="1.2" />
                            <line x1="7" y1="10.2" x2="7" y2="13" stroke="currentColor" stroke-width="1.2" />
                            <line x1="1" y1="7" x2="3.8" y2="7" stroke="currentColor" stroke-width="1.2" />
                            <line x1="10.2" y1="7" x2="13" y2="7" stroke="currentColor" stroke-width="1.2" />
                        </svg>
                        Earth Monitor
                    </div>
                    <button class="so-close-btn" @click="panelOpen = false">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5"
                                stroke-linecap="round" />
                        </svg>
                    </button>
                </header>

                <!-- 4 KPIs -->
                <div class="so-kpis">
                    <div class="so-kpi">
                        <span class="so-kpi-val so-kpi-val--amber">{{ visibleCount }}</span>
                        <span class="so-kpi-lbl">Visible</span>
                    </div>
                    <div class="so-kpi-sep"></div>
                    <div class="so-kpi">
                        <span class="so-kpi-val">{{ totalRaw.toLocaleString() }}</span>
                        <span class="so-kpi-lbl">Total / year</span>
                    </div>
                    <div class="so-kpi-sep"></div>
                    <div class="so-kpi">
                        <span class="so-kpi-val">{{ activeCatCount }}</span>
                        <span class="so-kpi-lbl">Categories</span>
                    </div>
                    <div class="so-kpi-sep"></div>
                    <div class="so-kpi so-kpi--sm" :title="topCountryName">
                        <span class="so-kpi-val so-kpi-val--country">{{ topCountryName }}</span>
                        <span class="so-kpi-lbl">Top country</span>
                    </div>
                </div>

                <!-- Tabs -->
                <nav class="so-tabs">
                    <button v-for="t in tabs" :key="t.id" class="so-tab" :class="{ 'so-tab--on': tab === t.id }"
                        @click="tab = t.id">{{ t.lbl }}</button>
                </nav>

                <!-- ── OVERVIEW ── -->
                <div v-show="tab === 'overview'" class="so-body">
                    <p class="so-sec">By category <span class="so-sub">— all year · raw events</span></p>

                    <div class="so-catbars">
                        <div v-for="c in rawCatStats" :key="c.catId" class="so-catbar">
                            <div class="so-catbar-row">
                                <span class="so-dot" :style="{ background: c.color }"></span>
                                <span class="so-catbar-name">{{ c.category }}</span>
                                <span class="so-catbar-n">{{ c.count }}</span>
                                <span class="so-catbar-pct">{{ pct(c.count, totalRaw) }}%</span>
                            </div>
                            <div class="so-track">
                                <div class="so-track-fill"
                                    :style="{ width: pct(c.count, maxRawCat) + '%', background: c.color }" />
                            </div>
                        </div>
                    </div>

                    <p class="so-sec" style="margin-top:20px">7-day trend <span class="so-sub">— top categories</span>
                    </p>
                    <div class="so-spark-grid">
                        <div v-for="c in topFive.slice(0, 6)" :key="'sk' + c.id" class="so-spark-tile">
                            <div class="so-spark-head">
                                <span class="so-dot" :style="{ background: c.color }"></span>
                                <span class="so-spark-name">{{ c.title }}</span>
                                <span class="so-spark-n">{{ c.rawCount }}</span>
                            </div>
                            <svg viewBox="0 0 80 34" preserveAspectRatio="none" class="so-spark-svg">
                                <defs>
                                    <linearGradient :id="`tg-${c.id}`" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" :stop-color="c.color" stop-opacity="0.3" />
                                        <stop offset="100%" :stop-color="c.color" stop-opacity="0" />
                                    </linearGradient>
                                </defs>
                                <polygon :fill="`url(#tg-${c.id})`" :points="areaPoints(c.spark7, 80, 34)" />
                                <polyline fill="none" :stroke="c.color" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" :points="linePoints(c.spark7, 80, 34)" />
                            </svg>
                        </div>
                    </div>

                    <p class="so-sec" style="margin-top:20px">365-day trend <span class="so-sub">— top categories</span>
                    </p>
                    <div class="so-spark-grid">
                        <div v-for="c in topFive.slice(0, 6)" :key="'sk' + c.id" class="so-spark-tile">
                            <div class="so-spark-head">
                                <span class="so-dot" :style="{ background: c.color }"></span>
                                <span class="so-spark-name">{{ c.title }}</span>
                                <span class="so-spark-n">{{ c.rawCount }}</span>
                            </div>
                            <svg viewBox="0 0 80 34" preserveAspectRatio="none" class="so-spark-svg">
                                <defs>
                                    <linearGradient :id="`tg-${c.id}`" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" :stop-color="c.color" stop-opacity="0.3" />
                                        <stop offset="100%" :stop-color="c.color" stop-opacity="0" />
                                    </linearGradient>
                                </defs>
                                <polygon :fill="`url(#tg-${c.id})`" :points="areaPoints(c.spark365, 80, 34)" />
                                <polyline fill="none" :stroke="c.color" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" :points="linePoints(c.spark365, 80, 34)" />
                            </svg>
                        </div>
                    </div>
                </div>


                <!-- ── CATEGORIES ── -->
                <div v-show="tab === 'categories'" class="so-body">
                    <p class="so-sec">All categories <span class="so-sub">{{ formattedDate }}</span></p>
                    <table class="so-tbl">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th class="r">Raw</th>
                                <th class="r">Visible</th>
                                <th>Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="c in mergedCatStats" :key="'tr' + c.catId" :class="{ 'dim': !c.enabled }">
                                <td class="td-cat">
                                    <span class="so-dot" :style="{ background: c.color }"></span>
                                    {{ c.category }}
                                </td>
                                <td class="r mono">{{ c.count }}</td>
                                <td class="r mono">{{ c.visibleCount }}</td>
                                <td>
                                    <div class="so-share-cell">
                                        <div class="so-share-track">
                                            <div class="so-share-fill"
                                                :style="{ width: pct(c.count, totalRaw) + '%', background: c.color }" />
                                        </div>
                                        <span class="so-share-pct mono">{{ pct(c.count, totalRaw) }}%</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- ── COUNTRIES ── -->
                <div v-show="tab === 'countries'" class="so-body">
                    <div class="so-ctry-hd">
                        <p class="so-sec" style="margin:0">Top countries <span class="so-sub">— raw events</span></p>
                        <select class="so-sel" v-model="ctryFilter">
                            <option value="">All categories</option>
                            <option v-for="c in rawCatStats" :key="c.catId" :value="c.category">{{ c.category }}
                            </option>
                        </select>
                    </div>

                    <div class="so-ctry-list">
                        <div v-for="(c, i) in filteredCountries" :key="c.country" class="so-ctry-row">
                            <span class="so-ctry-rank mono">{{ i + 1 }}</span>
                            <span class="so-ctry-name">{{ c.country }}</span>
                            <div class="so-track so-track--ctry">
                                <div class="so-track-fill so-track-fill--amber"
                                    :style="{ width: pct(c.count, filteredCountries[0]?.count || 1) + '%' }" />
                            </div>
                            <span class="so-ctry-n mono">{{ c.count }}</span>
                        </div>
                    </div>
                </div>

            </aside>
        </transition>

        <div v-if="panelOpen" class="so-scrim" @click="panelOpen = false"></div>
    </div>
</template>

<script>
export default {
    name: 'StatsOverlay',

    props: {
        filteredPoints: { type: Array, default: () => [] },
        rawPoints: { type: Array, default: () => [] },
        categories: { type: Array, default: () => [] },
        selectedTime: { type: Number, default: null },
        formattedDate: { type: String, default: '' },
    },

    data() {
        return {
            panelOpen: false,
            hovered: null,
            tab: 'overview',
            ctryFilter: '',
            tabs: [
                { id: 'overview', lbl: 'Overview' },
                { id: 'categories', lbl: 'Categories' },
                { id: 'countries', lbl: 'Countries' },
            ],
        }
    },

    computed: {
        visibleCount() { return this.filteredPoints.length },
        totalRaw() { return this.rawPoints.length },

        activeCatCount() {
            return this.categories.filter(c => c.enabled && c.count > 0).length
        },

        rawCatStats() {
            const acc = {}
            this.rawPoints.forEach(p => {
                const id = p.catId || ''
                if (!acc[id]) {
                    acc[id] = {
                        catId: id,
                        category: p.category || 'Unknown',
                        color: p.color || '#888',
                        count: 0,
                        enabled: this.categories.find(c => c.id === id)?.enabled ?? true,
                    }
                }
                acc[id].count++
            })
            return Object.values(acc).sort((a, b) => b.count - a.count)
        },

        maxRawCat() {
            return Math.max(...this.rawCatStats.map(c => c.count), 1)
        },

        mergedCatStats() {
            const visAcc = {}
            this.filteredPoints.forEach(p => { visAcc[p.catId] = (visAcc[p.catId] || 0) + 1 })
            return this.rawCatStats.map(c => ({ ...c, visibleCount: visAcc[c.catId] || 0 }))
        },

        topFive() {
            return this.rawCatStats.slice(0, 5).map(c => ({
                id: c.catId,
                title: c.category,
                color: c.color,
                rawCount: c.count,
                spark7: this.buildSparkline(c.catId,7),
                spark365: this.buildSparkline(c.catId,365),
                enabled: c.enabled,
            }))
        },

        rawCountryStats() {
            const acc = {}
            this.rawPoints.forEach(p => {
                const k = p.country || 'Unknown'
                if (!acc[k]) acc[k] = { country: k, total: 0, byCat: {} }
                acc[k].total++
                acc[k].byCat[p.category] = (acc[k].byCat[p.category] || 0) + 1
            })
            return Object.values(acc).sort((a, b) => b.total - a.total)
        },

        topCountryName() { return this.rawCountryStats[0]?.country || '—' },

        filteredCountries() {
            if (!this.ctryFilter) {
                return this.rawCountryStats.map(c => ({ country: c.country, count: c.total })).slice(0, 25)
            }
            return this.rawCountryStats
                .map(c => ({ country: c.country, count: c.byCat[this.ctryFilter] || 0 }))
                .filter(c => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 25)
        },
    },

    methods: {
        pct(v, total) { return total ? Math.round(v / total * 100) : 0 },

        buildSparkline(catId, days = 7) {
            if (!this.selectedTime || !this.rawPoints.length) {
                return new Array(days).fill(0)
            }

            const DAY = 86_400_000
            const buckets = new Array(days).fill(0)

            this.rawPoints.forEach(p => {
                if (p.catId !== catId) return

                const t = new Date(p.date).getTime()
                if (isNaN(t)) return

                const idx = Math.floor((this.selectedTime - t) / DAY)

                if (idx >= 0 && idx < days) {
                    buckets[days - 1 - idx]++
                }
            })

            return buckets
        },

        linePoints(data, w, h) {
            const max = Math.max(...data, 1), pad = 2
            return data.map((v, i) => {
                const x = pad + (i / (data.length - 1)) * (w - pad * 2)
                const y = h - pad - (v / max) * (h - pad * 2)
                return `${x.toFixed(1)},${y.toFixed(1)}`
            }).join(' ')
        },

        areaPoints(data, w, h) {
            const max = Math.max(...data, 1), pad = 2
            const pts = data.map((v, i) => {
                const x = pad + (i / (data.length - 1)) * (w - pad * 2)
                const y = h - pad - (v / max) * (h - pad * 2)
                return `${x.toFixed(1)},${y.toFixed(1)}`
            })
            return [...pts, `${w - pad},${h}`, `${pad},${h}`].join(' ')
        },
    },
}
</script>

<style scoped>
/* ══ tokens ══ */
.so-root {
    --bg: #080b12;
    --bg2: #0d1120;
    --bdr: rgba(255, 255, 255, 0.07);
    --bdr2: rgba(255, 255, 255, 0.13);
    --tx: rgba(255, 255, 255, 0.85);
    --muted: rgba(255, 255, 255, 0.38);
    --amber: #f0a500;
    --amberDim: rgba(240, 165, 0, 0.14);
    --pw: 360px;
    --mono: 'IBM Plex Mono', 'Fira Mono', 'Courier New', monospace;
    --sans: 'IBM Plex Sans', 'Helvetica Neue', sans-serif;

    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 50;
    font-family: var(--sans);
}

/* ══ floating cards ══ */
.so-cards {
    position: absolute;
    bottom: 76px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: auto;
    transition: right 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.so-cards--shifted {
    right: calc(var(--pw) + 22px);
}

.so-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 9px 13px;
    min-width: 198px;
    background: rgba(8, 11, 18, 0.84);
    backdrop-filter: blur(18px) saturate(1.4);
    border: 0.5px solid var(--bdr);
    border-radius: 10px;
    cursor: default;
    font-family: var(--sans);
    text-align: left;
    color: inherit;
    transition: background .18s, border-color .18s, transform .15s;
}

.so-card:hover,
.so-card--hovered {
    background: rgba(14, 18, 34, 0.96);
    border-color: var(--bdr2);
    transform: translateX(-3px);
}

.so-card--live {
    border-color: rgba(240, 165, 0, .22);
    cursor: pointer;
}

.so-card--live:hover {
    border-color: rgba(240, 165, 0, .48);
    transform: translateX(-3px);
}

.so-card-left {
    display: flex;
    align-items: center;
    gap: 10px;
}

.so-card-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.so-card-label {
    font-size: 9px;
    font-weight: 500;
    color: var(--muted);
    letter-spacing: .08em;
    text-transform: uppercase;
}

.so-card-num {
    font-family: var(--mono);
    font-size: 18px;
    font-weight: 600;
    color: var(--tx);
    line-height: 1.1;
}

.so-card-num--amber {
    color: var(--amber);
}

.so-badge {
    font-family: var(--mono);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: .12em;
    color: var(--amber);
    background: var(--amberDim);
    border: 0.5px solid rgba(240, 165, 0, .3);
    border-radius: 3px;
    padding: 2px 5px;
    flex-shrink: 0;
}

.so-pulse {
    width: 8px;
    height: 8px;
    position: relative;
    flex-shrink: 0;
}

.so-pulse::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--amber);
}

.so-pulse-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1.5px solid var(--amber);
    animation: so-pulse 2.2s ease-out infinite;
}

@keyframes so-pulse {
    0% {
        transform: scale(.5);
        opacity: .9;
    }

    100% {
        transform: scale(2.2);
        opacity: 0;
    }
}

.so-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
}

.so-mini-spark {
    width: 56px;
    height: 26px;
    flex-shrink: 0;
    overflow: visible;
}

/* ══ panel ══ */
.so-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--pw);
    background: var(--bg);
    border-left: 0.5px solid var(--bdr);
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    z-index: 200;
    overflow: hidden;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
    transition: transform .32s cubic-bezier(.22, 1, .36, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
    transform: translateX(100%);
}

.so-ph {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 0.5px solid var(--bdr);
    flex-shrink: 0;
}

.so-ph-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--amber);
}

.so-ph-icon {
    color: var(--amber);
    flex-shrink: 0;
}

.so-close-btn {
    background: rgba(255, 255, 255, .05);
    border: 0.5px solid var(--bdr2);
    border-radius: 5px;
    color: var(--muted);
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: background .15s, color .15s;
}

.so-close-btn:hover {
    background: rgba(255, 255, 255, .1);
    color: var(--tx);
}

.so-kpis {
    display: flex;
    align-items: center;
    padding: 14px 18px;
    border-bottom: 0.5px solid var(--bdr);
    flex-shrink: 0;
}

.so-kpi {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    min-width: 0;
}

.so-kpi--sm {}

.so-kpi-val {
    font-family: var(--mono);
    font-size: 17px;
    font-weight: 700;
    color: var(--tx);
    line-height: 1;
    white-space: nowrap;
}

.so-kpi-val--amber {
    color: var(--amber);
}

.so-kpi-val--country {
    font-size: 10px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 62px;
    display: block;
}

.so-kpi-lbl {
    font-size: 8px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
    white-space: nowrap;
}

.so-kpi-sep {
    width: 0.5px;
    height: 28px;
    background: var(--bdr2);
    flex-shrink: 0;
}

.so-tabs {
    display: flex;
    gap: 3px;
    padding: 10px 14px 0;
    flex-shrink: 0;
}

.so-tab {
    flex: 1;
    padding: 7px 4px;
    background: transparent;
    border: 0.5px solid var(--bdr);
    border-radius: 5px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .06em;
    cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;
}

.so-tab:hover {
    background: rgba(255, 255, 255, .05);
    color: rgba(255, 255, 255, .65);
}

.so-tab--on {
    background: var(--amberDim);
    border-color: rgba(240, 165, 0, .35);
    color: var(--amber);
}

.so-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 18px 28px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, .1) transparent;
}

.so-sec {
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .09em;
    margin-bottom: 12px;
}

.so-sub {
    font-weight: 400;
    opacity: .65;
    text-transform: none;
    letter-spacing: 0;
}

/* catbars */
.so-catbars {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.so-catbar-row {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 4px;
}

.so-catbar-name {
    font-size: 11px;
    color: var(--tx);
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.so-catbar-n {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--tx);
    flex-shrink: 0;
}

.so-catbar-pct {
    font-family: var(--mono);
    font-size: 9px;
    color: var(--muted);
    width: 28px;
    text-align: right;
    flex-shrink: 0;
}

.so-track {
    height: 3px;
    background: rgba(255, 255, 255, .06);
    border-radius: 2px;
    overflow: hidden;
}

.so-track--ctry {
    flex: 1;
}

.so-track-fill {
    height: 100%;
    border-radius: 2px;
    opacity: .72;
    transition: width .55s cubic-bezier(.22, 1, .36, 1);
}

.so-track-fill--amber {
    background: var(--amber) !important;
}

/* sparkline grid */
.so-spark-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.so-spark-tile {
    background: var(--bg2);
    border: 0.5px solid var(--bdr);
    border-radius: 8px;
    padding: 9px 10px;
}

.so-spark-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
}

.so-spark-name {
    font-size: 9px;
    color: var(--muted);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.so-spark-n {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--tx);
}

.so-spark-svg {
    width: 100%;
    height: 34px;
    display: block;
}

/* table */
.so-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
}

.so-tbl thead th {
    font-family: var(--mono);
    font-size: 8px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
    padding: 0 6px 8px 0;
    border-bottom: 0.5px solid var(--bdr);
    text-align: left;
}

.so-tbl thead th.r {
    text-align: right;
}

.so-tbl tbody td {
    padding: 7px 6px 7px 0;
    border-bottom: 0.5px solid rgba(255, 255, 255, .04);
    color: var(--tx);
    vertical-align: middle;
}

.td-cat {
    display: flex;
    align-items: center;
    gap: 7px;
}

.r {
    text-align: right;
}

.mono {
    font-family: var(--mono);
}

.dim {
    opacity: .25;
}

.so-share-cell {
    display: flex;
    align-items: center;
    gap: 5px;
    padding-left: 6px;
}

.so-share-track {
    flex: 1;
    height: 3px;
    background: rgba(255, 255, 255, .06);
    border-radius: 2px;
    overflow: hidden;
}

.so-share-fill {
    height: 100%;
    border-radius: 2px;
    opacity: .68;
    transition: width .55s cubic-bezier(.22, 1, .36, 1);
}

.so-share-pct {
    font-size: 9px;
    color: var(--muted);
    width: 26px;
    text-align: right;
    flex-shrink: 0;
}

/* countries */
.so-ctry-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.so-sel {
    background: var(--bg2);
    border: 0.5px solid var(--bdr2);
    border-radius: 6px;
    color: var(--tx);
    font-family: var(--mono);
    font-size: 9px;
    padding: 5px 9px;
    cursor: pointer;
    outline: none;
    max-width: 148px;
    transition: border-color .15s;
}

.so-sel:hover {
    border-color: rgba(240, 165, 0, .35);
}

.so-sel option {
    background: #0d1120;
}

.so-ctry-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.so-ctry-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.so-ctry-rank {
    font-size: 9px;
    color: rgba(255, 255, 255, .18);
    width: 16px;
    text-align: right;
    flex-shrink: 0;
}

.so-ctry-name {
    font-size: 11px;
    color: var(--tx);
    width: 98px;
    flex-shrink: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.so-ctry-n {
    font-size: 10px;
    color: var(--muted);
    width: 28px;
    text-align: right;
    flex-shrink: 0;
}

/* scrim */
.so-scrim {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, .42);
    z-index: 190;
    pointer-events: auto;
}

/* ══ responsive ══ */
@media (max-width: 767px) {
    .so-root {
        --pw: 100%;
    }

    .so-cards {
        bottom: 84px;
        right: 10px;
        gap: 5px;
    }

    .so-cards--shifted {
        right: 10px;
    }

    .so-card {
        min-width: 152px;
        padding: 7px 10px;
    }

    .so-card-num {
        font-size: 15px;
    }

    .so-mini-spark {
        display: none;
    }

    .so-panel {
        top: auto;
        bottom: 0;
        width: 100%;
        height: 80dvh;
        border-left: none;
        border-top: 0.5px solid var(--bdr);
        border-radius: 14px 14px 0 0;
        z-index: 300;
    }

    .panel-slide-enter-from,
    .panel-slide-leave-to {
        transform: translateY(100%);
    }

    .so-scrim {
        z-index: 290;
    }

    .so-kpi-val {
        font-size: 14px;
    }

    .so-spark-grid {
        grid-template-columns: 1fr;
    }
}

@media (min-width: 768px) and (max-width: 1080px) {
    .so-root {
        --pw: 300px;
    }

    .so-cards--shifted {
        right: calc(300px + 20px);
    }
}
</style>