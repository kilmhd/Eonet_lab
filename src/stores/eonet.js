import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useEonetStore = defineStore('eonet', () => {
    const eonetData = ref([])
    const eonetCategories = ref([])
    const isLoading = ref(false)

    async function fetchEonetData() {
        isLoading.value = true

        try {
            const response = await fetch(
                "https://eonet.gsfc.nasa.gov/api/v3/events/geojson?days=20"
            )

            if (!response.ok) throw new Error("Erreur API EONET")

            const data = await response.json()

            eonetData.value = data.features
                .filter(f => f.geometry?.coordinates?.length)
                .map(feature => {
                    const props = feature.properties
                    const coords = feature.geometry.coordinates

                    return {
                        lng: coords[0],
                        lat: coords[1],
                        size: 0.3,
                        catId: props.categories?.[0]?.id || '',       // ✅ string "wildfires"
                        category: props.categories?.[0]?.title || 'Inconnu',
                        color: getColor(props.categories?.[0]?.id),
                        label: props.title,
                        date: props.date?.split('T')[0] || '',
                        magnitudeValue: props.magnitudeValue || 0,
                        magnitudeUnit: props.magnitudeUnit || '',
                        closedAt: props.closed ? new Date(props.closed).getTime() : null,
                    }
                })

        } catch (error) {
            console.error('Error fetching EONET data:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function fetchEonetCategories() {
        isLoading.value = true

        try {
            // ✅ v3 au lieu de v2.1
            const response = await fetch(
                "https://eonet.gsfc.nasa.gov/api/v3/categories"
            )

            if (!response.ok) throw new Error("Erreur API EONET")

            const data = await response.json()

            // ✅ v3 : data.categories directement, ids sont des strings
            eonetCategories.value = data.categories.map(cat => ({
                id: cat.id,           // ✅ string "wildfires", pas Number()
                title: cat.title,
                color: getColor(cat.id),
                description: cat.description
            }))

        } catch (error) {
            console.error('Error fetching EONET categories:', error)
        } finally {
            isLoading.value = false
        }
    }

    // ✅ Switch sur les string ids v3
    function getColor(categoryId) {
        switch (categoryId) {
            case 'drought': return '#e0c36a'
            case 'dustHaze': return '#c2b280'
            case 'wildfires': return '#ff3b30'
            case 'floods': return '#1e90ff'
            case 'severeStorms': return '#6a5acd'
            case 'volcanoes': return '#ff7f11'
            case 'waterColor': return '#00c2a8'
            case 'landslides': return '#8b5e3c'
            case 'seaLakeIce': return '#b0e0e6'
            case 'earthquakes': return '#ff006e'
            case 'snow': return '#ccebff'
            case 'tempExtremes': return '#ff9500'
            case 'manmade': return '#9b5de5'
            default: return '#1cf'
        }
    }

    return {
        eonetData,
        eonetCategories,
        isLoading,
        fetchEonetData,
        fetchEonetCategories
    }
})