// src/utils/dateUtils.js

const monthNamesNL = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'
]

// Hulpfunctie om de ISO-week te berekenen van een datum
function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export function getSchoolWeeksList() {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonthIndex = today.getMonth() // 0 = jan, 8 = sep
  const currentMonthName = monthNamesNL[currentMonthIndex]

  // Eerste en laatste dag van de huidige maand
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonthIndex + 1, 0)

  const weeks = []
  let currentIsoWeek = getISOWeekNumber(today)
  let activeWeekId = ''

  let weekCounter = 1
  let cursor = new Date(firstDayOfMonth)

  // Loop door de dagen van de maand om alle aanwezige weken op te halen
  while (cursor <= lastDayOfMonth) {
    const isoWeek = getISOWeekNumber(cursor)

    // Voeg toe als de week nog niet in de lijst staat
    if (!weeks.some(w => w.isoWeek === isoWeek)) {
      const weekId = `Week ${weekCounter}`
      const weekLabel = `Week ${weekCounter} (${currentMonthName})`

      weeks.push({
        id: weekId,
        label: weekLabel,
        isoWeek: isoWeek
      })

      // Koppel de actieve week van vandaag aan de teller
      if (isoWeek === currentIsoWeek) {
        activeWeekId = weekId
      }

      weekCounter++
    }

    // Ga 1 dag vooruit
    cursor.setDate(cursor.getDate() + 1)
  }

  // Fallback als we buiten de maand vallen
  if (!activeWeekId && weeks.length > 0) {
    activeWeekId = weeks[0].id
  }

  return {
    currentWeek: activeWeekId,
    weeks: weeks
  }
}