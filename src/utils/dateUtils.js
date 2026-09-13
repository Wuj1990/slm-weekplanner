// src/utils/dateUtils.js
export function getSchoolWeeksList() {
  const now = new Date()
  
  // Realistische schoolweken voor het schooljaar 2026-2027
  const rawWeeks = [
    { id: 'Week 1 (september)', label: 'Week 1 (01 sep - 04 sep)', start: new Date('2026-09-01'), end: new Date('2026-09-06') },
    { id: 'Week 2 (september)', label: 'Week 2 (07 sep - 11 sep)', start: new Date('2026-09-07'), end: new Date('2026-09-13') },
    { id: 'Week 3 (september)', label: 'Week 3 (14 sep - 18 sep)', start: new Date('2026-09-14'), end: new Date('2026-09-20') },
    { id: 'Week 4 (september)', label: 'Week 4 (21 sep - 25 sep)', start: new Date('2026-09-21'), end: new Date('2026-09-27') },
    { id: 'Week 5 (oktober)', label: 'Week 5 (28 sep - 02 okt)', start: new Date('2026-09-28'), end: new Date('2026-10-04') },
    { id: 'Week 6 (oktober)', label: 'Week 6 (05 okt - 09 okt)', start: new Date('2026-10-05'), end: new Date('2026-10-11') },
    { id: 'Week 7 (oktober)', label: 'Week 7 (12 okt - 16 okt)', start: new Date('2026-10-12'), end: new Date('2026-10-18') },
    { id: 'Week 8 (oktober)', label: 'Week 8 (19 okt - 23 okt)', start: new Date('2026-10-19'), end: new Date('2026-10-25') },
    { id: 'Week 9 (oktober)', label: 'Week 9 (26 okt - 30 okt)', start: new Date('2026-10-26'), end: new Date('2026-11-08') }, // Inclusief herfstvakantie
    { id: 'Week 10 (november)', label: 'Week 10 (09 nov - 13 nov)', start: new Date('2026-11-09'), end: new Date('2026-11-15') },
    { id: 'Week 11 (november)', label: 'Week 11 (16 nov - 20 nov)', start: new Date('2026-11-16'), end: new Date('2026-11-22') },
    { id: 'Week 12 (november)', label: 'Week 12 (23 nov - 27 nov)', start: new Date('2026-11-23'), end: new Date('2026-11-29') },
    { id: 'Week 13 (december)', label: 'Week 13 (30 nov - 04 dec)', start: new Date('2026-11-30'), end: new Date('2026-12-06') },
    { id: 'Week 14 (december)', label: 'Week 14 (07 dec - 11 dec)', start: new Date('2026-12-07'), end: new Date('2026-12-13') },
    { id: 'Week 15 (december)', label: 'Week 15 (14 dec - 18 dec)', start: new Date('2026-12-14'), end: new Date('2027-01-03') }, // Inclusief kerstvakantie
    { id: 'Week 16 (januari)', label: 'Week 16 (04 jan - 08 jan)', start: new Date('2027-01-04'), end: new Date('2027-01-10') },
    { id: 'Week 17 (januari)', label: 'Week 17 (11 jan - 15 jan)', start: new Date('2027-01-11'), end: new Date('2027-01-17') },
    { id: 'Week 18 (januari)', label: 'Week 18 (18 jan - 22 jan)', start: new Date('2027-01-18'), end: new Date('2027-01-24') },
    { id: 'Week 19 (januari)', label: 'Week 19 (25 jan - 29 jan)', start: new Date('2027-01-25'), end: new Date('2027-01-31') },
    { id: 'Week 20 (februari)', label: 'Week 20 (01 feb - 05 feb)', start: new Date('2027-02-01'), end: new Date('2027-02-14') }, // Inclusief krokusvakantie
    { id: 'Week 21 (februari)', label: 'Week 21 (15 feb - 19 feb)', start: new Date('2027-02-15'), end: new Date('2027-02-21') },
    { id: 'Week 22 (februari)', label: 'Week 22 (22 feb - 26 feb)', start: new Date('2027-02-22'), end: new Date('2027-02-28') },
    { id: 'Week 23 (maart)', label: 'Week 23 (01 mrt - 05 mrt)', start: new Date('2027-03-01'), end: new Date('2027-03-07') },
    { id: 'Week 24 (maart)', label: 'Week 24 (08 mrt - 12 mrt)', start: new Date('2027-03-08'), end: new Date('2027-03-14') },
    { id: 'Week 25 (maart)', label: 'Week 25 (15 mrt - 19 mrt)', start: new Date('2027-03-15'), end: new Date('2027-03-21') },
    { id: 'Week 26 (maart)', label: 'Week 26 (22 mrt - 26 mrt)', start: new Date('2027-03-22'), end: new Date('2027-04-11') }, // Inclusief paasvakantie
    { id: 'Week 27 (april)', label: 'Week 27 (12 apr - 16 apr)', start: new Date('2027-04-12'), end: new Date('2027-04-18') },
    { id: 'Week 28 (april)', label: 'Week 28 (19 apr - 23 apr)', start: new Date('2027-04-19'), end: new Date('2027-04-25') },
    { id: 'Week 29 (april)', label: 'Week 29 (26 apr - 30 apr)', start: new Date('2027-04-26'), end: new Date('2027-05-02') },
    { id: 'Week 30 (mei)', label: 'Week 30 (03 mei - 07 mei)', start: new Date('2027-05-03'), end: new Date('2027-05-09') },
    { id: 'Week 31 (mei)', label: 'Week 31 (10 mei - 14 mei)', start: new Date('2027-05-10'), end: new Date('2027-05-16') },
    { id: 'Week 32 (mei)', label: 'Week 32 (17 mei - 21 mei)', start: new Date('2027-05-17'), end: new Date('2027-05-23') },
    { id: 'Week 33 (mei)', label: 'Week 33 (24 mei - 28 mei)', start: new Date('2027-05-24'), end: new Date('2027-05-30') },
    { id: 'Week 34 (juni)', label: 'Week 34 (31 mei - 04 jun)', start: new Date('2027-05-31'), end: new Date('2027-06-06') },
    { id: 'Week 35 (juni)', label: 'Week 35 (07 jun - 11 jun)', start: new Date('2027-06-07'), end: new Date('2027-06-13') },
    { id: 'Week 36 (juni)', label: 'Week 36 (14 jun - 18 jun)', start: new Date('2027-06-14'), end: new Date('2027-06-20') },
    { id: 'Week 37 (juni)', label: 'Week 37 (21 jun - 25 jun)', start: new Date('2027-06-21'), end: new Date('2027-06-27') },
    { id: 'Week 38 (juni)', label: 'Week 38 (28 jun - 30 jun)', start: new Date('2027-06-28'), end: new Date('2027-06-30') }
  ]

  // Bepaal automatisch de juiste huidige week op basis van de datum, met een fallback naar Week 2
  let currentWeekId = 'Week 2 (september)'
  for (const w of rawWeeks) {
    if (now >= w.start && now <= w.end) {
      currentWeekId = w.id
      break
    }
  }

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