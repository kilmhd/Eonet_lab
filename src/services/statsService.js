
export async function useStatsCategory(eonetData) {
    const statsByCat = eonetData.value.reduce((acc, event) => {
        const cat = event.category

        if (!acc[cat]) {
            acc[cat] = 0
        }

        acc[cat]++

        return acc
    }, {})

    const statsByCatObj = Object.entries(statsByCat).map(([category, count]) => ({
        category,
        count
    }))

    return statsByCatObj;
}

export function useStatsByCategoryByCountry(eonetData) {
  const stats = eonetData.value.reduce((acc, event) => {
    const country = event.country || 'Unknown'
    const category = event.category || 'Inconnu'
    const key = `${category}-${country}`

    if (!acc[key]) {
      acc[key] = { category, country, count: 0 }
    }

    acc[key].count++

    return acc
  }, {})

  return Object.values(stats)
}