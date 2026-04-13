<template>
    <div class="app">
        <div v-if="isLoading" class="loader">
            <div class="loader-spinner"></div>
            <span>Loading Earth data…</span>
        </div>

        <div class="globe-container" ref="globeContainer"></div>

        <!-- Timeline -->
        <div class="timeline-wrap">
            <p class="timeline-date">{{ formattedDate }}</p>
            <input
                class="timeline"
                type="range"
                min="0"
                max="100"
                step="1"
                v-model.number="progress"
                @input="onTimelineChange"
            />
        </div>

        <!-- Burger mobile -->
        <button class="burger" @click="panelOpen = !panelOpen" :class="{ open: panelOpen }">
            <span></span><span></span><span></span>
        </button>

        <!-- Panel -->
        <div class="ui-panel" :class="{ 'panel-open': panelOpen }">
            <div class="panel-header">
                <div>
                    <h2>🌍 Earth Events</h2>
                    <h4>Last 20 days</h4>
                </div>
                <button class="panel-close" @click="panelOpen = false">✕</button>
            </div>

            <div class="card">
                <span class="label">Events visible</span>
                <span class="value">{{ filteredPoints.length }}</span>
            </div>

            <div class="categories">
                <h3>Categories</h3>
                <div v-for="cat in categories" :key="cat.id" class="category-item">
                    <label>
                        <input type="checkbox" v-model="cat.enabled" @change="applyFilter" />
                        <span class="dot" :style="{ background: cat.color }"></span>
                        <span class="cat-title">{{ cat.title }}</span>
                        <span class="count">{{ cat.count || 0 }}</span>
                    </label>
                </div>
            </div>

            <div class="controls">
                <h3>Actions</h3>
                <button @click="toggleRotation">
                    {{ isRotating ? '⏹ Stop rotation' : '▶ Start rotation' }}
                </button>
                <button @click="toggleReload">
                    🔄 Reload data
                </button>
            </div>
        </div>

        <!-- Overlay mobile -->
        <div class="overlay" v-if="panelOpen" @click="panelOpen = false"></div>
    </div>
</template>

<script>
import Globe from 'globe.gl'
import { useEonetStore } from '@/stores/eonet'

export default {
    data() {
        return {
            globe: null,
            isRotating: false,
            panelOpen: false,

            allPoints: [],
            filteredPoints: [],
            categories: [],

            eonetStore: useEonetStore(),
            isLoading: true,

            selectedTime: null,
            minTime: null,
            maxTime: null,
            TIME_WINDOW: 20 * 24 * 60 * 60 * 1000,
            progress: 100,
        }
    },

    computed: {
        formattedDate() {
            if (!this.selectedTime) return ''
            return new Date(this.selectedTime).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            })
        }
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
            .pointLat('lat')
            .pointLng('lng')
            .pointColor(d => d.__hover ? '#ffffff' : d.color)
            .pointRadius(d => d.__hover ? 0.8 : d.size)
            .pointAltitude(d => d.__hover ? 0.2 : 0.05)
            .pointLabel(d => `
                <div style="background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:10px 14px;font-family:sans-serif;max-width:200px;">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                        <span style="width:8px;height:8px;border-radius:50%;background:${d.color};flex-shrink:0;display:inline-block;"></span>
                        <span style="font-size:11px;color:${d.color};">${d.category}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:6px;line-height:1.3;">${d.label}</div>
                    <div style="display:flex;flex-direction:column;gap:3px;">
                        <span style="font-size:11px;color:rgba(255,255,255,0.5);">📅 ${d.date || 'Date inconnue'}</span>
                        ${d.magnitudeValue ? `<span style="font-size:11px;color:rgba(255,255,255,0.5);">📏 ${d.magnitudeValue} ${d.magnitudeUnit}</span>` : ''}
                    </div>
                </div>
            `)
            .onPointHover((point, prevPoint) => {
                if (prevPoint) prevPoint.__hover = false
                if (point) point.__hover = true
                this.globe
                    .pointColor(d => d.__hover ? '#ffffff' : d.color)
                    .pointRadius(d => d.__hover ? 0.8 : d.size)
                    .pointAltitude(d => d.__hover ? 0.2 : 0.05)
            })

        // Resize responsive
        this._onResize = () => {
            this.globe
                .width(window.innerWidth)
                .height(window.innerHeight)
        }
        window.addEventListener('resize', this._onResize)

        this.globe.controls().autoRotate = false

        this.isLoading = true
        await this.eonetStore.fetchEonetCategories()
        await this.eonetStore.fetchEonetData()

        this.categories = this.eonetStore.eonetCategories.map(c => ({
            ...c,
            enabled: true,
            count: 0
        }))

        this.allPoints = this.eonetStore.eonetData

        const allDates = this.allPoints
            .map(p => new Date(p.date).getTime())
            .filter(t => !isNaN(t))

        this.minTime = Math.min(...allDates)
        this.maxTime = Math.max(...allDates)
        this.selectedTime = this.maxTime

        // Panel ouvert par défaut sur desktop uniquement
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
            this.allPoints = this.eonetStore.eonetData
            this.applyFilter()
            this.isLoading = false
        },

        applyFilter() {
            const enabledIds = this.categories
                .filter(c => c.enabled)
                .map(c => c.id)

            const timeFiltered = this.allPoints.filter(p => {
                const t = new Date(p.date).getTime()
                const isStillActive = p.closedAt === null || p.closedAt >= this.selectedTime - this.TIME_WINDOW
                return (
                    !isNaN(t) &&
                    t <= this.selectedTime &&
                    t >= this.selectedTime - this.TIME_WINDOW &&
                    isStillActive
                )
            })

            this.categories.forEach(c => { c.count = 0 })
            timeFiltered.forEach(p => {
                const cat = this.categories.find(c => c.id === p.catId)
                if (cat) cat.count++
            })

            if (enabledIds.length === 0) {
                this.filteredPoints = []
                this.globe.pointsData([])
                return
            }

            this.filteredPoints = timeFiltered
                .filter(p => enabledIds.includes(p.catId))
                .slice(0, 300)

            this.globe.pointsData(this.filteredPoints)
        },

        onTimelineChange() {
            if (this.minTime === null || this.maxTime === null) return
            const range = this.maxTime - this.minTime
            this.selectedTime = this.minTime + (this.progress / 100) * range
            this.applyFilter()
        }
    },

    beforeUnmount() {
        window.removeEventListener('resize', this._onResize)
        if (this.globe) this.globe._destructor?.()
    }
}
</script>

<style scoped>
.app {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: #000;
    overflow: hidden;
}

.globe-container {
    position: absolute;
    inset: 0;
}

/* ── Loader ── */
.loader {
    position: absolute;
    inset: 0;
    z-index: 999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    color: white;
    font-size: 15px;
    font-family: sans-serif;
}

.loader-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: #1cf;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* ── Timeline ── */
.timeline-wrap {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 10;
    /* ✅ évite que la timeline chevauche le panel sur mobile */
    max-width: calc(100vw - 40px);
}

.timeline-date {
    color: white;
    font-family: sans-serif;
    font-size: 13px;
    opacity: 0.8;
    margin: 0;
    white-space: nowrap;
}

.timeline {
    width: 400px;
    max-width: 100%;
    appearance: none;
    height: 6px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.2);
    outline: none;
    cursor: pointer;
}

.timeline::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1cf;
    cursor: pointer;
}

/* ── Burger ── */
.burger {
    display: none;
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 200;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    cursor: pointer;
    padding: 0;
}

.burger span {
    display: block;
    width: 18px;
    height: 2px;
    background: white;
    border-radius: 2px;
    transition: transform 0.2s, opacity 0.2s;
}

.burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.burger.open span:nth-child(2) { opacity: 0; }
.burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ── Panel ── */
.ui-panel {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 280px;
    padding: 20px;
    backdrop-filter: blur(12px);
    background: rgba(20, 20, 30, 0.75);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-family: sans-serif;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    z-index: 100;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.2) transparent;
}

.panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
}

.panel-header h2 { font-size: 16px; margin: 0 0 2px; }
.panel-header h4 { font-size: 12px; opacity: 0.5; margin: 0; font-weight: 400; }

.panel-close {
    display: none; /* visible uniquement mobile */
    background: none;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
}

/* ── Card stat ── */
.card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 4px;
}

.label { opacity: 0.6; font-size: 13px; }
.value { font-weight: bold; font-size: 18px; }

/* ── Categories ── */
.categories { margin-top: 16px; }
.categories h3 { font-size: 12px; opacity: 0.5; font-weight: 500; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.05em; }

.category-item { margin: 4px 0; }

.category-item label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 5px 4px;
    border-radius: 6px;
    transition: background 0.15s;
}

.category-item label:hover { background: rgba(255,255,255,0.05); }

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.cat-title { font-size: 13px; flex: 1; }

.count {
    font-size: 11px;
    background: rgba(255,255,255,0.08);
    padding: 1px 7px;
    border-radius: 10px;
    opacity: 0.7;
}

/* ── Controls ── */
.controls { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
.controls h3 { font-size: 12px; opacity: 0.5; font-weight: 500; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em; }

button {
    padding: 10px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.15s, transform 0.15s;
    text-align: left;
}

button:hover {
    background: rgba(255, 255, 255, 0.14);
    transform: translateY(-1px);
}

/* ── Overlay mobile ── */
.overlay {
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 90;
}

/* ── Responsive ── */
@media (max-width: 767px) {
    .burger {
        display: flex;
    }

    .panel-close {
        display: block;
    }

    .ui-panel {
        /* Panel caché hors écran sur mobile */
        top: 0;
        left: 0;
        width: 100%;
        max-width: 320px;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0 16px 16px 0;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        padding-top: 60px;
    }

    .ui-panel.panel-open {
        transform: translateX(0);
    }

    .overlay {
        display: block;
    }

    .timeline-wrap {
        /* ✅ décalé sur mobile pour ne pas chevaucher le globe */
        bottom: 20px;
        left: 50%;
        width: calc(100vw - 32px);
    }

    .timeline {
        width: 100%;
    }
}

@media (min-width: 768px) {
    .ui-panel {
        /* Desktop : toujours visible, transition douce */
        transition: opacity 0.2s;
    }

    .overlay {
        display: none !important;
    }
}
</style>