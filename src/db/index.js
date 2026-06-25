import Dexie from 'dexie'

export const db = new Dexie('TeamDatabase')

db.version(1).stores({
  teachers: '++id, name, title, department',
  taskBooks: '++id, taskName, leader, year, target',
  plans: '++id, teacherId, year, dimension, expectedTarget',
  assessments: '++id, teacherId, year, dimension, expectedTarget, actualAchievement, completionRate, selfScore, teamScore, totalScore, personalPerfScore, teamContribScore, overallTotal'
})

export const DIMENSIONS = [
  '专业建设',
  '课程与教学改革',
  '教材建设',
  '职业技能竞赛',
  '科研及社会服务',
  '个人培训',
  '其他规划'
]

export const DIMENSION_ALIASES = {
  '专业建设方面': '专业建设',
  '课程与教学改革方面': '课程与教学改革',
  '教材建设方面': '教材建设',
  '职业技能竞赛方面': '职业技能竞赛',
  '科研及社会服务方面': '科研及社会服务',
  '科研、社会服务方面': '科研及社会服务',
  '个人培训及其他': '个人培训',
  '个人参加培训方面': '个人培训',
  '其他规划': '其他规划'
}

export const TEACHER_NAMES = [
  '赵莉', '刘电威', '左锋', '徐文瑞', '倪志敏',
  '朱海鹏', '赵亚杰', '郑延', '王建林', '齐芯',
  '张丹', '李大铭', '刘祎', '闫鑫', '黄波',
  '陈洁玲', '徐庆佳', '林良彬', '陈萌梦', '徐婷婷'
]

export const TITLES = ['教授', '副教授', '讲师', '助教']
export const DEPARTMENTS = ['电子商务系', '数字商业学院', '经贸学院']

export const TASK_NAMES = [
  '教师能力提升',
  '团队建设',
  '科学研究',
  '课程体系建设与模块化教学',
  '团队协作共同体建设',
  '特色创新及成果推广',
  '社会服务'
]

export const TASK_LEADERS = ['郑延', '徐文瑞', '朱海鹏', '倪志敏', '左锋', '赵亚杰', '赵亚杰']

export default db
