import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useStatsCategory, useStatsByCategoryByCountry } from '@/services/statsService'
import { feature as CountryFeature } from '@rapideditor/country-coder'

export const useEonetStore = defineStore('eonet', () => {
    const eonetData = ref([])         // displayed on globe (may be aggregated)
    const eonetRawPoints = ref([])    // ← always the full un-aggregated list, used for stats
    const eonetCategories = ref([])
    const eonetStats = ref({
        byCategory: [],
        byCategoryByCountry: []
    })
    const isLoading = ref(false)

    const AGGREGATION_THRESHOLD = 500

    async function fetchEonetData() {
        isLoading.value = true

        try {
            const response = await fetch(
                'https://eonet.gsfc.nasa.gov/api/v3/events/geojson?days=365'
            )
            if (!response.ok) throw new Error('Erreur API EONET')

            const data = await response.json()

            const rawPoints = data.features
                .filter(f => f.geometry?.coordinates?.length)
                .map(feature => {
                    const props  = feature.properties
                    const coords = feature.geometry.coordinates

                    let lng, lat
                    if (feature.geometry.type === 'Point') {
                        lng = coords[0]
                        lat = coords[1]
                    } else {
                        lng = coords[0][0][0]
                        lat = coords[0][0][1]
                    }

                    const result  = CountryFeature([lng, lat])
                    const country = result?.properties?.nameEn || 'Unknown'

                    return {
                        lng,
                        lat,
                        country,
                        size:           0.3,
                        catId:          props.categories?.[0]?.id    || '',
                        category:       props.categories?.[0]?.title || 'Unknown',
                        color:          getColor(props.categories?.[0]?.id),
                        label:          props.title,
                        date:           props.date?.split('T')[0]    || '',
                        magnitudeValue: props.magnitudeValue          || 0,
                        magnitudeUnit:  props.magnitudeUnit           || '',
                        closedAt:       props.closed ? new Date(props.closed).getTime() : null,
                        count:          1,   // always 1 for raw points
                    }
                })

            // Always keep the full un-aggregated list for stats
            eonetRawPoints.value = rawPoints

            // Only aggregate for the globe rendering
            eonetData.value =
                rawPoints.length > AGGREGATION_THRESHOLD
                    ? aggregatePoints(rawPoints)
                    : rawPoints

        } catch (error) {
            console.error('Error fetching EONET data:', error)
        } finally {
            isLoading.value = false
        }
    }

    function aggregatePoints(points) {
        const grouped = {}

        points.forEach(p => {
            const key = `${p.country}-${p.category}`
            if (!grouped[key]) {
                grouped[key] = {
                    country:     p.country,
                    catId:       p.catId,
                    category:    p.category,
                    count:       0,
                    latSum:      0,
                    lngSum:      0,
                    color:       p.color,
                    latestDate:  p.date,
                }
            }
            if (p.date > grouped[key].latestDate) grouped[key].latestDate = p.date
            grouped[key].count++
            grouped[key].latSum += p.lat
            grouped[key].lngSum += p.lng
        })

        return Object.values(grouped).map(g => ({
            lat:      g.latSum / g.count,
            lng:      g.lngSum / g.count,
            country:  g.country,
            catId:    g.catId,
            category: g.category,
            size:     Math.min(0.2 + g.count * 0.02, 1.5),
            color:    g.color,
            label:    `${g.category} — ${g.country} (${g.count})`,
            date:     g.latestDate,
            closedAt: null,
            count:    g.count,
        }))
    }

    async function fetchEonetCategories() {
        isLoading.value = true
        try {
            const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/categories')
            if (!response.ok) throw new Error('Erreur API EONET')
            const data = await response.json()
            eonetCategories.value = data.categories.map(cat => ({
                id:          cat.id,
                title:       cat.title,
                color:       getColor(cat.id),
                description: cat.description
            }))
        } catch (error) {
            console.error('Error fetching EONET categories:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function getStats() {
        try {
            // Use rawPoints (ref wrapper) so statsService sees un-aggregated data
            const rawRef = { value: eonetRawPoints.value }
            eonetStats.value = {
                byCategory:          await useStatsCategory(rawRef),
                byCategoryByCountry: await useStatsByCategoryByCountry(rawRef),
            }
        } catch (error) {
            console.error('Error setting EONET stats:', error)
        }
    }

    function getColor(categoryId) {
        switch (categoryId) {
            case 'drought':      return '#e0c36a'
            case 'dustHaze':     return '#c2b280'
            case 'wildfires':    return '#ff3b30'
            case 'floods':       return '#1e90ff'
            case 'severeStorms': return '#6a5acd'
            case 'volcanoes':    return '#ff7f11'
            case 'waterColor':   return '#00c2a8'
            case 'landslides':   return '#8b5e3c'
            case 'seaLakeIce':   return '#b0e0e6'
            case 'earthquakes':  return '#ff006e'
            case 'snow':         return '#ccebff'
            case 'tempExtremes': return '#ff9500'
            case 'manmade':      return '#9b5de5'
            default:             return '#1cf'
        }
    }

    return {
        eonetData,
        eonetRawPoints,
        eonetCategories,
        eonetStats,
        isLoading,
        fetchEonetData,
        fetchEonetCategories,
        getStats,
    }
})