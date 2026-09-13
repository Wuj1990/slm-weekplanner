// src/utils/dateUtils.js
export function getSchoolWeeksList() {
  // De actieve huidige week van het schooljaar
  const currentWeekId = 'Week 1 (september)'

  const rawWeeks = [
    { id: 'Week 1 (september)', label: 'Week 1 (september)' },
    { id: 'Week 2 (september)', label: 'Week 2 (september)' },
    { id: 'Week 3 (september)', label: 'Week 3 (september)' },
    { id: 'Week 4 (september)', label: 'Week 4 (september)' },
    { id: 'Week 5 (september)', label: 'Week 5 (september)' }
  ]

  const weeks = rawWeeks.map(w => {
    const isCurrent = (w.id === currentWeekId)
    return {
      id: w.id,
      label: isCurrent ? `${w.label} ⭐ (huidige week)` : w.label
    }
  })

  return {
    currentWeek: currentWeekId,
    weeks
  }
}