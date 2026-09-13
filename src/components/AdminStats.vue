<script setup>
import { computed } from 'vue'

const props = defineProps({
  reservations: { type: Array, default: () => [] },
  activities: { type: Array, default: () => [] },
  selectedWeek: { type: String, default: '' }
})

const currentWeekRes = computed(() => props.reservations.filter(r => String(r.week) === String(props.selectedWeek)))

const activityStats = computed(() => {
  const stats = {}
  props.activities.forEach(a => stats[a.id] = { name: a.name, color: a.color, count: 0 })
  
  currentWeekRes.value.forEach(r => {
    if (stats[r.activityId]) stats[r.activityId].count++
  })
  
  return Object.values(stats)
})
</script>

<template>
  <div class="admin-card">
    <h3>📈 Populaire Onderdelen in {{ selectedWeek }}</h3>
    <div class="stats-container">
      <div v-for="stat in activityStats" :key="stat.name" class="stat-bar-item">
        <div class="stat-label">
          <span class="badge" :style="{ backgroundColor: stat.color }"></span>
          <span>{{ stat.name }}</span>
          <strong>{{ stat.count }} uren</strong>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="{ width: `${Math.min(stat.count * 5, 100)}%`, backgroundColor: stat.color }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.admin-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #0f172a;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.stat-bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #1e293b;
}

.stat-label strong {
  margin-left: auto;
}

.badge {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.progress-bar-bg {
  width: 100%;
  background: #f1f5f9;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}
</style>