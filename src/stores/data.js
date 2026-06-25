import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'

export const useDataStore = defineStore('data', () => {
  const teachers = ref([])
  const taskBooks = ref([])
  const plans = ref([])
  const assessments = ref([])

  async function loadAll() {
    teachers.value = await db.teachers.toArray()
    taskBooks.value = await db.taskBooks.toArray()
    plans.value = await db.plans.toArray()
    assessments.value = await db.assessments.toArray()
  }

  async function loadTeachers() {
    teachers.value = await db.teachers.toArray()
  }

  async function loadTaskBooks() {
    taskBooks.value = await db.taskBooks.toArray()
  }

  async function loadPlans() {
    plans.value = await db.plans.toArray()
  }

  async function loadAssessments() {
    assessments.value = await db.assessments.toArray()
  }

  const teacherMap = computed(() => {
    const map = {}
    teachers.value.forEach(t => { map[t.id] = t.name })
    return map
  })

  return {
    teachers,
    taskBooks,
    plans,
    assessments,
    teacherMap,
    loadAll,
    loadTeachers,
    loadTaskBooks,
    loadPlans,
    loadAssessments
  }
})
