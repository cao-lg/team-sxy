import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import { seedDatabase } from '@/db/seed'

export const useAppStore = defineStore('app', () => {
  const isDbReady = ref(false)

  async function initDatabase() {
    try {
      await seedDatabase()
      isDbReady.value = true
    } catch (error) {
      console.error('Database initialization failed:', error)
    }
  }

  async function exportAllData() {
    const [teachers, taskBooks, plans, assessments] = await Promise.all([
      db.teachers.toArray(),
      db.taskBooks.toArray(),
      db.plans.toArray(),
      db.assessments.toArray()
    ])
    return { teachers, taskBooks, plans, assessments }
  }

  async function importAllData(data) {
    await db.transaction('rw', db.teachers, db.taskBooks, db.plans, db.assessments, async () => {
      await db.teachers.clear()
      await db.taskBooks.clear()
      await db.plans.clear()
      await db.assessments.clear()
      if (data.teachers?.length) await db.teachers.bulkAdd(data.teachers)
      if (data.taskBooks?.length) await db.taskBooks.bulkAdd(data.taskBooks)
      if (data.plans?.length) await db.plans.bulkAdd(data.plans)
      if (data.assessments?.length) await db.assessments.bulkAdd(data.assessments)
    })
  }

  return {
    isDbReady,
    initDatabase,
    exportAllData,
    importAllData
  }
})
