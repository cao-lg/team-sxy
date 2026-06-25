import { db, DIMENSIONS, TEACHER_NAMES, TITLES, DEPARTMENTS, TASK_NAMES, TASK_LEADERS } from './index'

export async function seedDatabase() {
  const teacherCount = await db.teachers.count()
  if (teacherCount > 0) return

  const teachers = TEACHER_NAMES.map((name, idx) => ({
    name,
    title: TITLES[idx % TITLES.length],
    department: DEPARTMENTS[idx % DEPARTMENTS.length]
  }))

  const teacherIds = await db.teachers.bulkAdd(teachers, { allKeys: true })

  const taskBooks = TASK_NAMES.map((taskName, idx) => ({
    taskName,
    leader: TASK_LEADERS[idx],
    members: TEACHER_NAMES.filter((_, i) => i % 7 === idx || i % 7 === (idx + 1) % 7).join('、'),
    target2024: `完成${taskName}基础框架搭建，建立工作机制`,
    target2025: `深化${taskName}内涵建设，取得阶段性成果`,
    target2026: `全面完成${taskName}建设目标，形成品牌特色`
  }))

  await db.taskBooks.bulkAdd(taskBooks)

  const plans = []
  const assessments = []

  teacherIds.forEach((teacherId, tIdx) => {
    DIMENSIONS.forEach((dimension, dIdx) => {
      const baseTarget = 70 + Math.floor(Math.random() * 30)

      ;[2024, 2025, 2026].forEach((year, yIdx) => {
        const expectedTarget = baseTarget + yIdx * 5 + Math.floor(Math.random() * 5)
        plans.push({
          teacherId,
          teacherName: TEACHER_NAMES[tIdx],
          year,
          dimension,
          expectedTarget
        })

        if (year < 2026) {
          const completionRate = 60 + Math.floor(Math.random() * 50)
          const actualAchievement = Math.round(expectedTarget * completionRate / 100 * 10) / 10
          const selfScore = Math.round(actualAchievement * 0.7 * 10) / 10
          const teamScore = Math.round(actualAchievement * 0.3 * 10) / 10
          const totalScore = actualAchievement

          assessments.push({
            teacherId,
            teacherName: TEACHER_NAMES[tIdx],
            year,
            dimension,
            expectedTarget,
            actualAchievement,
            completionRate,
            selfScore,
            teamScore,
            totalScore,
            personalPerfScore: 100,
            teamContribScore: 70 + Math.floor(Math.random() * 25),
            overallTotal: 0
          })
        }
      })
    })
  })

  // 计算每个教师每年的总分
  const yearTeacherMap = {}
  assessments.forEach(a => {
    const key = a.teacherId + '_' + a.year
    if (!yearTeacherMap[key]) {
      yearTeacherMap[key] = { totalExpected: 0, totalActual: 0, teamContribScore: a.teamContribScore }
    }
    yearTeacherMap[key].totalExpected += a.expectedTarget
    yearTeacherMap[key].totalActual += a.actualAchievement
  })
  assessments.forEach(a => {
    const key = a.teacherId + '_' + a.year
    const data = yearTeacherMap[key]
    const overallRate = data.totalExpected > 0 ? (data.totalActual / data.totalExpected) * 100 : 0
    let personalPerfScore = 0
    if (overallRate >= 80) personalPerfScore = 100
    else if (overallRate >= 60) personalPerfScore = 80
    else if (overallRate >= 40) personalPerfScore = 60
    a.personalPerfScore = personalPerfScore
    a.overallTotal = Math.round((personalPerfScore * 0.7 + data.teamContribScore * 0.3) * 10) / 10
  })

  await db.plans.bulkAdd(plans)
  await db.assessments.bulkAdd(assessments)
}
