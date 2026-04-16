<template>
    <div class="app">

        <!-- Loader -->
        <transition name="fade">
            <div v-if="isLoading" class="loader">
                <div class="loader-ring"></div>
                <span class="loader-txt">Loading Earth data</span>
                <span class="loader-sub">NASA EONET · {{ new Date().getFullYear() }}</span>
            </div>
        </transition>

        <!-- Globe -->
        <div class="globe-container" ref="globeContainer"></div>

        <!-- Stats overlay (cards + side panel) -->
        <StatsOverlay
            :filtered-points="filteredPoints"
            :raw-points="rawPoints"
            :categories="categories"
            :selected-time="selectedTime"
            :formatted-date="formattedDate"
        />

        <!-- Timeline -->
        <div class="timeline-wrap">
            <span class="tl-date">{{ formattedDate }}</span>
            <input
                class="tl-range"
                type="range"
                min="0" max="100" step="1"
                v-model.number="progress"
                @input="onTimelineChange"
                :aria-label="`Timeline: ${formattedDate}`"
            />
            <span class="tl-date tl-date--right">{{ formattedDateMin }}</span>
        </div>

        <!-- Burger (mobile only) -->
        <button class="burger" :class="{ open: panelOpen }" @click="panelOpen = !panelOpen" aria-label="Toggle filters">
            <span></span><span></span><span></span>
        </button>

        <!-- Filter panel -->
        <nav class="ui-panel" :class="{ 'panel-open': panelOpen }" role="navigation" aria-label="Filters">

            <div class="panel-head">
                <div class="panel-head-text">
                    <h2 class="panel-title">Earth Events</h2>
                    <p class="panel-sub">NASA EONET · last 365 days</p>
                </div>
                <button class="panel-close-btn" @click="panelOpen = false" aria-label="Close panel">✕</button>
            </div>

            <!-- Quick stats row -->
            <div class="panel-stats">
                <div class="panel-stat">
                    <span class="ps-val">{{ filteredPoints.length }}</span>
                    <span class="ps-lbl">Visible</span>
                </div>
                <div class="panel-stat-sep"></div>
                <div class="panel-stat">
                    <span class="ps-val">{{ rawPoints.length }}</span>
                    <span class="ps-lbl">Total raw</span>
                </div>
            </div>

            <!-- Categories -->
            <div class="panel-section">
                <h3 class="panel-section-title">Filter categories</h3>
                <div class="cat-list">
                    <label
                        v-for="cat in categories" :key="cat.id"
                        class="cat-item"
                        :class="{ 'cat-item--off': !cat.enabled }"
                    >
                        <input type="checkbox" v-model="cat.enabled" @change="applyFilter" class="cat-check"/>
                        <span class="cat-dot" :style="{ background: cat.color }"></span>
                        <span class="cat-name">{{ cat.title }}</span>
                        <span class="cat-count">{{ cat.count || 0 }}</span>
                    </label>
                </div>
            </div>

            <!-- Controls -->
            <div class="panel-section">
                <h3 class="panel-section-title">Controls</h3>
                <div class="ctrl-list">
                    <button class="ctrl-btn" @click="toggleRotation">
                        <span class="ctrl-icon">{{ isRotating ? '⏹' : '▶' }}</span>
                        {{ isRotating ? 'Stop rotation' : 'Start rotation' }}
                    </button>
                    <button class="ctrl-btn" @click="toggleReload" :disabled="isLoading">
                        <span class="ctrl-icon" :class="{ spin: isLoading }">↺</span>
                        Reload data
                    </button>
                </div>
            </div>

        </nav>

        <div class="overlay" v-if="panelOpen" @click="panelOpen = false"></div>
    </div>
</template>

<script>
import Globe from 'globe.gl'
import { useEonetStore } from '@/stores/eonet'
import StatsOverlay from '@/features/dashboard/components/statOverlay.vue'

export default {
    components: { StatsOverlay },

    data() {
        return {
            globe:     null,
            isRotating: false,
            panelOpen: false,

            // Globe data (may be aggregated)
            filteredPoints: [],
            categories: [],

            eonetStore: useEonetStore(),
            isLoading:  true,

            selectedTime: null,
            minTime:      null,
            maxTime:      null,
            TIME_WINDOW:  365 * 24 * 60 * 60 * 1000,
            progress:     100,
        }
    },

    computed: {
        // Raw un-aggregated points — passed to StatsOverlay
        rawPoints() {
            return this.eonetStore.eonetRawPoints
        },

        // Globe displayed (aggregated or raw)
        allPoints() {
            return this.eonetStore.eonetData
        },

        formattedDate() {
            if (!this.selectedTime) return ''
            return new Date(this.selectedTime).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric'
            })
        },

        formattedDateMin() {
            if (!this.minTime) return ''
            return new Date(this.minTime).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'short', year: 'numeric'
            })
        },
    },

    async mounted() {
        const el = this.$refs.globeContainer

        this.globe = Globe()(el)
            .width(window.innerWidth)
            .height(window.innerHeight)
            .backgroundColor('#000')
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-day.jpg')
            .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
            .atmosphereColor('lightskyblue')
            .atmosphereAltitude(0.15)
            .pointsData([])
            .pointLat('lat').pointLng('lng')
            .pointColor(d => d.__hover ? '#ffffff' : d.color)
            .pointRadius(d => d.__hover ? 0.8 : d.size)
            .pointAltitude(d => d.__hover ? 0.2 : 0.05)
            .pointLabel(d => `
                <div style="background:rgba(5,8,16,0.92);border:0.5px solid rgba(255,255,255,0.14);border-radius:10px;padding:10px 14px;font-family:'IBM Plex Sans',sans-serif;max-width:210px;box-shadow:0 4px 20px rgba(0,0,0,.6)">
                    <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px">
                        <span style="width:7px;height:7px;border-radius:50%;background:${d.color};flex-shrink:0;display:inline-block"></span>
                        <span style="font-size:10px;color:${d.color};font-weight:500;letter-spacing:.04em;text-transform:uppercase">${d.category}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:7px;line-height:1.35">${d.label}</div>
                    <div style="display:flex;flex-direction:column;gap:3px">
                        <span style="font-size:10px;color:rgba(255,255,255,.45);font-family:'IBM Plex Mono',monospace">📅 ${d.date || '—'}</span>
                        ${d.magnitudeValue ? `<span style="font-size:10px;color:rgba(255,255,255,.45);font-family:'IBM Plex Mono',monospace">📏 ${d.magnitudeValue} ${d.magnitudeUnit}</span>` : ''}
                        ${d.country ? `<span style="font-size:10px;color:rgba(255,255,255,.45)">📍 ${d.country}</span>` : ''}
                    </div>
                </div>
            `)
            .onPointHover((point, prev) => {
                if (prev) prev.__hover = false
                if (point) point.__hover = true
                this.globe
                    .pointColor(d => d.__hover ? '#ffffff' : d.color)
                    .pointRadius(d => d.__hover ? 0.8 : d.size)
                    .pointAltitude(d => d.__hover ? 0.2 : 0.05)
            })

        this._onResize = () => this.globe.width(window.innerWidth).height(window.innerHeight)
        window.addEventListener('resize', this._onResize)
        this.globe.controls().autoRotate = false

        this.isLoading = true
        await this.eonetStore.fetchEonetCategories()
        await this.eonetStore.fetchEonetData()
        await this.eonetStore.getStats()

        this.categories = this.eonetStore.eonetCategories.map(c => ({
            ...c, enabled: true, count: 0
        }))

        const allDates = this.allPoints
            .map(p => new Date(p.date).getTime())
            .filter(t => !isNaN(t))

        this.minTime     = Math.min(...allDates)
        this.maxTime     = Math.max(...allDates)
        this.selectedTime = this.maxTime

        this.panelOpen = window.innerWidth >= 768
        this.applyFilter()
        this.isLoading = false
    },

    methods: {
        toggleRotation() {
            this.isRotating = !this.isRotating
            this.globe.controls().autoRotate = this.isRotating
        },

        async toggleReload() {
            this.isLoading = true
            await this.eonetStore.fetchEonetData()
            await this.eonetStore.getStats()
            this.applyFilter()
            this.isLoading = false
        },

        applyFilter() {
            const enabledIds = this.categories.filter(c => c.enabled).map(c => c.id)

            const timeFiltered = this.allPoints.filter(p => {
                const t = new Date(p.date).getTime()
                const active = p.closedAt === null || p.closedAt >= this.selectedTime - this.TIME_WINDOW
                return !isNaN(t) && t <= this.selectedTime && t >= this.selectedTime - this.TIME_WINDOW && active
            })

            this.categories.forEach(c => { c.count = 0 })
            timeFiltered.forEach(p => {
                const cat = this.categories.find(c => c.id === p.catId)
                if (cat) cat.count++
            })

            if (!enabledIds.length) {
                this.filteredPoints = []
                this.globe.pointsData([])
                return
            }

            this.filteredPoints = timeFiltered.filter(p => enabledIds.includes(p.catId)).slice(0, 300)
            this.globe.pointsData(this.filteredPoints)
        },

        onTimelineChange() {
            if (this.minTime === null || this.maxTime === null) return
            const range = this.maxTime - this.minTime
            this.selectedTime = this.minTime + (this.progress / 100) * range
            this.applyFilter()
        },
    },

    beforeUnmount() {
        window.removeEventListener('resize', this._onResize)
        if (this.globe) this.globe._destructor?.()
    },
}
</script>

<style scoped>
/* ══ fonts (CDN) ══ */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

/* ══ tokens ══ */
:root {
    --app-bg:    #080b12;
    --panel-bg:  rgba(8, 11, 18, 0.88);
    --bdr:       rgba(255,255,255,0.08);
    --bdr2:      rgba(255,255,255,0.14);
    --tx:        rgba(255,255,255,0.86);
    --muted:     rgba(255,255,255,0.38);
    --amber:     #f0a500;
    --amberDim:  rgba(240,165,0,0.12);
    --mono:      'IBM Plex Mono', 'Courier New', monospace;
    --sans:      'IBM Plex Sans', 'Helvetica Neue', sans-serif;
}

/* ══ layout ══ */
.app {
    position: relative;
    width: 100vw; height: 100vh;
    background: #000; overflow: hidden;
    font-family: var(--sans);
}

.globe-container {
    position: absolute; inset: 0;
}

/* ══ loader ══ */
.loader {
    position: absolute; inset: 0; z-index: 999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px;
    background: rgba(4,6,14,0.82);
    backdrop-filter: blur(12px);
    color: var(--tx);
}
.fade-leave-active { transition: opacity .5s; }
.fade-leave-to { opacity: 0; }

.loader-ring {
    width: 36px; height: 36px;
    border: 2px solid rgba(255,255,255,0.1);
    border-top-color: var(--amber);
    border-radius: 50%;
    animation: spin .9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.loader-txt {
    font-family: var(--mono); font-size: 13px; font-weight: 500;
    letter-spacing: .06em; text-transform: uppercase; color: var(--amber);
}
.loader-sub {
    font-family: var(--mono); font-size: 10px; color: var(--muted);
    letter-spacing: .04em;
}

/* ══ timeline ══ */
.timeline-wrap {
    position: absolute;
    bottom: 28px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 12px;
    z-index: 10;
    max-width: calc(100vw - 48px);
    background: rgba(8,11,18,0.72);
    backdrop-filter: blur(14px);
    border: 0.5px solid var(--bdr);
    border-radius: 10px;
    padding: 8px 16px;
}

.tl-date {
    font-family: var(--mono); font-size: 11px; font-weight: 500;
    color: var(--muted); white-space: nowrap; flex-shrink: 0;
}
.tl-date--right { color: rgba(255,255,255,0.25); }

.tl-range {
    flex: 1; min-width: 200px; max-width: 400px;
    appearance: none; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.15); outline: none; cursor: pointer;
}
.tl-range::-webkit-slider-thumb {
    appearance: none; width: 14px; height: 14px;
    border-radius: 50%; background: var(--amber); cursor: pointer;
    border: 2px solid rgba(76, 218, 123, 0.9);
}
.tl-range::-moz-range-thumb {
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--amber); cursor: pointer; border: none;
}

/* ══ burger ══ */
.burger {
    display: none;
    position: absolute; top: 16px; left: 16px; z-index: 201;
    width: 40px; height: 40px; border: none; border-radius: 9px;
    background: rgba(8,11,18,0.8); backdrop-filter: blur(10px);
    border: 0.5px solid var(--bdr);
    flex-direction: column; align-items: center; justify-content: center;
    gap: 5px; cursor: pointer; padding: 0;
    transition: background .15s;
}
.burger:hover { background: rgba(20,24,40,0.9); }
.burger span {
    display: block; width: 17px; height: 1.5px;
    background: var(--tx); border-radius: 2px;
    transition: transform .2s, opacity .2s;
}
.burger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
.burger.open span:nth-child(2) { opacity: 0; }
.burger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

/* ══ filter panel ══ */
.ui-panel {
    position: absolute;
    top: 20px; left: 20px;
    width: 268px;
    background: var(--panel-bg);
    backdrop-filter: blur(20px) saturate(1.4);
    border: 0.5px solid var(--bdr);
    border-radius: 14px;
    color: var(--tx);
    max-height: calc(100vh - 110px);
    overflow-y: auto;
    z-index: 100;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.panel-head {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 16px 16px 12px;
    border-bottom: 0.5px solid var(--bdr);
}

.panel-title {
    font-family: var(--mono); font-size: 12px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--amber); margin: 0 0 3px;
}
.panel-sub {
    font-family: var(--mono); font-size: 9px;
    color: var(--muted); margin: 0;
    letter-spacing: .04em;
}

.panel-close-btn {
    background: rgba(255,255,255,0.05);
    border: 0.5px solid var(--bdr2); border-radius: 5px;
    color: var(--muted); width: 24px; height: 24px;
    display: none; align-items: center; justify-content: center;
    cursor: pointer; font-size: 11px; padding: 0;
    transition: background .15s, color .15s;
}
.panel-close-btn:hover { background: rgba(255,255,255,.1); color: var(--tx); }

/* quick stats */
.panel-stats {
    display: flex; align-items: center;
    padding: 11px 16px;
    border-bottom: 0.5px solid var(--bdr);
}
.panel-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.panel-stat-sep { width: 0.5px; height: 24px; background: var(--bdr2); flex-shrink: 0; }
.ps-val { font-family: var(--mono); font-size: 18px; font-weight: 700; color: var(--tx); line-height: 1; }
.ps-lbl { font-size: 9px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: .07em; }

/* sections */
.panel-section { padding: 14px 16px; border-bottom: 0.5px solid var(--bdr); }
.panel-section:last-child { border-bottom: none; padding-bottom: 20px; }
.panel-section-title {
    font-family: var(--mono); font-size: 9px; font-weight: 600;
    color: var(--muted); text-transform: uppercase; letter-spacing: .09em;
    margin: 0 0 10px;
}

/* category list */
.cat-list { display: flex; flex-direction: column; gap: 2px; }
.cat-item {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 6px; border-radius: 7px; cursor: pointer;
    transition: background .12s;
}
.cat-item:hover { background: rgba(255,255,255,0.04); }
.cat-item--off { opacity: 0.4; }
.cat-item--off:hover { opacity: 0.6; }

.cat-check { appearance: none; width: 14px; height: 14px; flex-shrink: 0; border-radius: 3px; cursor: pointer;
    border: 0.5px solid var(--bdr2); background: transparent; position: relative;
    transition: background .15s, border-color .15s;
}
.cat-check:checked {
    background: var(--amber); border-color: var(--amber);
}
.cat-check:checked::after {
    content: ''; position: absolute; left: 3px; top: 1px;
    width: 5px; height: 8px;
    border: 1.5px solid #000; border-top: none; border-left: none;
    transform: rotate(42deg);
}

.cat-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.cat-name { font-size: 12px; color: var(--tx); flex: 1; }
.cat-count {
    font-family: var(--mono); font-size: 10px;
    color: var(--muted); flex-shrink: 0;
    background: rgba(255,255,255,0.06);
    padding: 1px 6px; border-radius: 4px;
}

/* controls */
.ctrl-list { display: flex; flex-direction: column; gap: 6px; }
.ctrl-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 12px; border-radius: 8px; cursor: pointer;
    background: rgba(255,255,255,0.05);
    border: 0.5px solid var(--bdr); color: var(--tx);
    font-family: var(--sans); font-size: 12px; font-weight: 500;
    transition: background .15s, border-color .15s, transform .12s;
    text-align: left;
}
.ctrl-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.09);
    border-color: var(--bdr2);
    transform: translateY(-1px);
}
.ctrl-btn:disabled { opacity: .4; cursor: not-allowed; }
.ctrl-icon { font-size: 13px; flex-shrink: 0; }
.spin { animation: spin .8s linear infinite; display: inline-block; }

/* overlay mobile */
.overlay {
    display: none; position: absolute; inset: 0;
    background: rgba(0,0,0,0.5); z-index: 90;
}

/* ══ responsive ══ */
@media (max-width: 767px) {
    .burger { display: flex; }
    .panel-close-btn { display: flex; }

    .ui-panel {
        top: 0; left: 0; width: 100%; max-width: 300px;
        height: 100vh; max-height: 100vh;
        border-radius: 0 14px 14px 0;
        transform: translateX(-100%);
        transition: transform .3s cubic-bezier(.22,1,.36,1);
        padding-top: 56px; z-index: 100;
    }
    .ui-panel.panel-open { transform: translateX(0); }
    .overlay { display: block; }

    .timeline-wrap {
        bottom: 16px; left: 50%;
        width: calc(100vw - 24px); gap: 8px;
        padding: 7px 12px;
    }
    .tl-date--right { display: none; }
    .tl-range { min-width: 100px; }
}

@media (min-width: 768px) {
    .ui-panel { transition: opacity .2s; }
    .overlay  { display: none !important; }
}
</style>