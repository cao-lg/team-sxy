<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">数据管理</div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="data-card">
          <div class="card-header">
            <el-icon size="22" color="#409eff"><Download /></el-icon>
            <div class="card-title">数据备份导出</div>
          </div>
          <div class="card-desc">
            将当前系统中的所有数据（教师、任务书、规划、考核记录）打包为 JSON 文件下载到本地，防止数据丢失。
          </div>
          <el-button type="primary" size="large" :icon="Download" :loading="exporting" @click="handleExport">
            一键备份导出
          </el-button>
          <div class="card-footer">
            <el-icon size="13" color="#909399"><InfoFilled /></el-icon>
            <span>数据包含：teachers / taskBooks / plans / assessments 四张表</span>
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="data-card">
          <div class="card-header">
            <el-icon size="22" color="#67c23a"><Upload /></el-icon>
            <div class="card-title">JSON 数据导入</div>
          </div>
          <div class="card-desc">
            上传之前导出的 JSON 备份文件，将数据恢复到系统中。注意：此操作会覆盖当前所有数据，请谨慎操作。
          </div>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".json"
            :on-change="handleJsonImport"
          >
            <el-button type="success" size="large" :icon="Upload" :loading="importing">
              导入 JSON 数据
            </el-button>
          </el-upload>
          <div class="card-footer warning">
            <el-icon size="13" color="#e6a23c"><Warning /></el-icon>
            <span>导入将覆盖所有现有数据，建议先导出备份</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <div class="data-card">
          <div class="card-header">
            <el-icon size="22" color="#e6a23c"><Document /></el-icon>
            <div class="card-title">Excel 导入考核记录</div>
          </div>
          <div class="card-desc">
            上传预设格式的 Excel 文件，批量导入教师考核记录。Excel 需包含：姓名、年度、维度、预期目标、实际完成绩效等列。
          </div>
          <el-upload
            ref="excelUploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls"
            :on-change="handleExcelImport"
          >
            <el-button type="warning" size="large" :icon="Document" :loading="excelImporting">
              导入 Excel 考核表
            </el-button>
          </el-upload>
          <div class="card-footer">
            <el-icon size="13" color="#909399"><InfoFilled /></el-icon>
            <span>支持 .xlsx / .xls 格式，列名需与系统字段对应</span>
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="data-card">
          <div class="card-header">
            <el-icon size="22" color="#f56c6c"><Delete /></el-icon>
            <div class="card-title">数据统计概览</div>
          </div>
          <div class="card-desc">查看当前数据库中各表的数据量统计。</div>
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-num">{{ stats.teachers }}</div>
              <div class="stat-label">教师数量</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">{{ stats.taskBooks }}</div>
              <div class="stat-label">任务数量</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">{{ stats.plans }}</div>
              <div class="stat-label">规划记录</div>
            </div>
            <div class="stat-item">
              <div class="stat-num">{{ stats.assessments }}</div>
              <div class="stat-label">考核记录</div>
            </div>
          </div>
          <el-button type="info" plain :icon="Refresh" @click="refreshStats" size="small">刷新统计</el-button>
        </div>
      </el-col>
    </el-row>

    <div v-if="importResult.visible" class="import-result">
      <el-alert :title="importResult.title" :type="importResult.type" :description="importResult.desc" show-icon />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download, Upload, Document, Delete, Refresh, InfoFilled, Warning
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'
import { db, DIMENSION_ALIASES } from '@/db'

const appStore = useAppStore()
const dataStore = useDataStore()

const exporting = ref(false)
const importing = ref(false)
const excelImporting = ref(false)

const stats = reactive({
  teachers: 0,
  taskBooks: 0,
  plans: 0,
  assessments: 0
})

const importResult = reactive({
  visible: false,
  title: '',
  type: 'success',
  desc: ''
})

async function refreshStats() {
  stats.teachers = await db.teachers.count()
  stats.taskBooks = await db.taskBooks.count()
  stats.plans = await db.plans.count()
  stats.assessments = await db.assessments.count()
}

async function handleExport() {
  exporting.value = true
  try {
    const data = await appStore.exportAllData()
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `team-db-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('备份导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  } finally {
    exporting.value = false
  }
}

function handleJsonImport(file) {
  if (!file) return
  ElMessageBox.confirm(
    '导入将覆盖当前所有数据，确定继续吗？',
    '数据导入确认',
    { confirmButtonText: '确定导入', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    importing.value = true
    importResult.visible = false
    try {
      const text = await file.raw.text()
      const data = JSON.parse(text)
      await appStore.importAllData(data)
      await dataStore.loadAll()
      await refreshStats()
      importResult.visible = true
      importResult.title = '导入成功'
      importResult.type = 'success'
      importResult.desc = `成功导入 ${data.teachers?.length || 0} 位教师、${data.taskBooks?.length || 0} 个任务、${data.plans?.length || 0} 条规划、${data.assessments?.length || 0} 条考核记录`
      ElMessage.success('导入成功')
    } catch (error) {
      importResult.visible = true
      importResult.title = '导入失败'
      importResult.type = 'error'
      importResult.desc = error.message
      ElMessage.error('导入失败：' + error.message)
    } finally {
      importing.value = false
    }
  }).catch(() => {})
}

async function handleExcelImport(file) {
  if (!file) return
  excelImporting.value = true
  importResult.visible = false
  try {
    const buffer = await file.raw.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetNames = workbook.SheetNames

    const isTeamFormat = sheetNames.includes('建设任务书') && sheetNames.includes('个人规划书')

    if (isTeamFormat) {
      await importTeamFormatExcel(workbook)
    } else {
      await importSimpleFormatExcel(workbook)
    }

    await dataStore.loadAll()
    await refreshStats()
  } catch (error) {
    importResult.visible = true
    importResult.title = 'Excel 导入失败'
    importResult.type = 'error'
    importResult.desc = error.message
    ElMessage.error('导入失败：' + error.message)
  } finally {
    excelImporting.value = false
  }
}

async function importTeamFormatExcel(workbook) {
  await ElMessageBox.confirm(
    '检测到团队数据标准格式（含任务书、规划书、考核成果），将覆盖全部数据，确定继续吗？',
    '全量数据导入确认',
    { confirmButtonText: '确定导入', cancelButtonText: '取消', type: 'warning' }
  )
  const teachers = []
  const taskBooks = []
  const plans = []
  const assessments = []
  const teacherMap = {}

  // 解析建设任务书
  const taskSheet = workbook.Sheets['建设任务书']
  const taskRows = XLSX.utils.sheet_to_json(taskSheet, { header: 1 })
  for (let i = 2; i < taskRows.length; i++) {
    const row = taskRows[i]
    if (!row || !row[1]) continue
    taskBooks.push({
      taskName: row[1],
      leader: row[2] || '',
      members: row[3] || '',
      target2024: row[4] || '',
      target2025: row[5] || '',
      target2026: row[6] || ''
    })
  }

  // 解析个人规划书（同时提取教师信息）
  const planSheet = workbook.Sheets['个人规划书']
  const planRows = XLSX.utils.sheet_to_json(planSheet, { header: 1 })

  const planDimCols = [
    { col: 3, dimKey: '专业建设方面' },
    { col: 4, dimKey: '课程与教学改革方面' },
    { col: 5, dimKey: '教材建设方面' },
    { col: 6, dimKey: '职业技能竞赛方面' },
    { col: 7, dimKey: '科研及社会服务方面' },
    { col: 8, dimKey: '个人培训及其他' }
  ]

  function parsePlanYearText(text, year) {
    const yearStr = String(year)
    const re = new RegExp(yearStr + '[：:](.+?)(?=[；;]|$)')
    const m = String(text).match(re)
    return m ? m[1].trim() : ''
  }

  let teacherId = 1
  for (let i = 3; i < planRows.length; i++) {
    const row = planRows[i]
    if (!row || !row[1]) continue
    const name = row[1]
    const title = row[2] || '讲师'
    teachers.push({
      id: teacherId,
      name,
      title,
      department: '数字商业学院'
    })
    teacherMap[name] = teacherId

    for (const pd of planDimCols) {
      const dim = DIMENSION_ALIASES[pd.dimKey] || pd.dimKey
      const cellText = row[pd.col] || ''
      for (const year of [2024, 2025, 2026]) {
        const yearText = parsePlanYearText(cellText, year)
        plans.push({
          teacherId,
          teacherName: name,
          year,
          dimension: dim,
          expectedTarget: 80 + (year - 2024) * 5,
          targetText: yearText
        })
      }
    }
    // 第7个维度：其他规划
    for (const year of [2024, 2025, 2026]) {
      plans.push({
        teacherId,
        teacherName: name,
        year,
        dimension: '其他规划',
        expectedTarget: 70 + (year - 2024) * 5,
        targetText: ''
      })
    }
    teacherId++
  }

  // 解析考核成果
  const assessDimCols = [
    { col: 2, dimKey: '专业建设方面' },
    { col: 3, dimKey: '课程与教学改革方面' },
    { col: 4, dimKey: '教材建设方面' },
    { col: 5, dimKey: '职业技能竞赛方面' },
    { col: 6, dimKey: '科研、社会服务方面' },
    { col: 7, dimKey: '个人参加培训方面' },
    { col: 8, dimKey: '其他规划' }
  ]

  function parseAssessCell(text) {
    if (!text) return { actual: '', rate: 0, score: 0 }
    const str = String(text)
    const parts = str.split('/').map(s => s.trim())
    let score = 0
    let rate = 0
    let actual = str
    if (parts.length >= 2) {
      const last = parts[parts.length - 1]
      const secondLast = parts[parts.length - 2]
      const scoreMatch = last.match(/^([\d.]+)$/)
      const rateMatch = secondLast.match(/(\d+)%/)
      if (scoreMatch && rateMatch) {
        score = parseFloat(scoreMatch[1])
        rate = parseInt(rateMatch[1])
        actual = parts.slice(0, parts.length - 2).join('、')
      } else if (rateMatch) {
        rate = parseInt(rateMatch[1])
        actual = parts.slice(0, parts.length - 1).join('、')
      }
    }
    return { actual, rate, score }
  }

  for (const yearStr of ['2024', '2025']) {
    const sheetName = yearStr + '考核成果'
    if (!workbook.Sheets[sheetName]) continue
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    const year = parseInt(yearStr)

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i]
      if (!row || !row[1]) continue
      const name = row[1]
      let tid = teacherMap[name]
      // 如果教师不在规划表里，自动添加
      if (!tid) {
        tid = teacherId
        teachers.push({
          id: tid,
          name,
          title: '讲师',
          department: '数字商业学院'
        })
        teacherMap[name] = tid
        // 给新增教师也补上规划数据
        for (const dim of ['专业建设', '课程与教学改革', '教材建设', '职业技能竞赛', '科研及社会服务', '个人培训', '其他规划']) {
          for (const y of [2024, 2025, 2026]) {
            plans.push({
              teacherId: tid,
              teacherName: name,
              year: y,
              dimension: dim,
              expectedTarget: 80 + (y - 2024) * 5,
              targetText: ''
            })
          }
        }
        teacherId++
      }

      // 读取总分
      const overallTotal = parseFloat(row[9]) || 0

      // 先收集各维度得分，用于按比例分配总分
      const dimResults = []
      let totalDimScore = 0
      for (const ad of assessDimCols) {
        const dim = DIMENSION_ALIASES[ad.dimKey] || ad.dimKey
        const parsed = parseAssessCell(row[ad.col] || '')
        dimResults.push({ dim, ...parsed })
        totalDimScore += parsed.score
      }

      // 按比例把总分分配到各维度
      for (const dr of dimResults) {
        const dimScore = totalDimScore > 0
          ? Math.round((dr.score / totalDimScore) * overallTotal * 10) / 10
          : dr.score
        const selfScore = Math.round(dimScore * 0.7 * 10) / 10
        const teamScore = Math.round(dimScore * 0.3 * 10) / 10
        assessments.push({
          teacherId: tid,
          teacherName: name,
          year,
          dimension: dr.dim,
          expectedTarget: 80,
          actualText: dr.actual,
          actualAchievement: dr.score,
          completionRate: dr.rate || 80,
          selfScore,
          teamScore,
          totalScore: dimScore,
          overallTotal
        })
      }
    }
  }

  // 全量写入数据库
  await db.transaction('rw', db.teachers, db.taskBooks, db.plans, db.assessments, async () => {
    await db.teachers.clear()
    await db.taskBooks.clear()
    await db.plans.clear()
    await db.assessments.clear()
    await db.teachers.bulkAdd(teachers)
    await db.taskBooks.bulkAdd(taskBooks)
    await db.plans.bulkAdd(plans)
    await db.assessments.bulkAdd(assessments)
  })

  importResult.visible = true
  importResult.title = 'Excel 全量导入成功'
  importResult.type = 'success'
  importResult.desc = `成功导入 ${teachers.length} 位教师、${taskBooks.length} 个任务、${plans.length} 条规划、${assessments.length} 条考核记录`
  ElMessage.success('全量导入成功')
}

async function importSimpleFormatExcel(workbook) {
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(firstSheet)

  if (rows.length === 0) {
    throw new Error('Excel 文件为空')
  }

  const existingTeachers = await db.teachers.toArray()
  const teacherMap = {}
  existingTeachers.forEach(t => { teacherMap[t.name] = t.id })

  const records = []
  for (const row of rows) {
    const name = row['姓名'] || row['name'] || row.teacherName
    if (!name) continue

    let teacherId = teacherMap[name]
    if (!teacherId) {
      teacherId = await db.teachers.add({
        name,
        title: row['职称'] || row.title || '讲师',
        department: row['部门'] || row.department || '数字商业学院'
      })
      teacherMap[name] = teacherId
    }

    const year = Number(row['年度'] || row['year'] || 2025)
    const dimension = row['维度'] || row['dimension'] || '专业建设'
    const expectedTarget = Number(row['预期目标'] || row['expectedTarget'] || 80)
    const actualAchievement = Number(row['实际完成绩效'] || row['actualAchievement'] || 70)
    const completionRate = Number(row['完成率'] || row['completionRate'] || Math.round(actualAchievement / expectedTarget * 100))
    const selfScore = Number(row['个人自评分'] || row['selfScore'] || Math.round(actualAchievement * 0.7))
    const teamScore = Number(row['团队贡献分'] || row['teamScore'] || Math.round(actualAchievement * 0.3))
    const totalScore = Math.round(selfScore * 0.7 + teamScore * 0.3)

    records.push({
      teacherId,
      teacherName: name,
      year,
      dimension,
      expectedTarget,
      actualAchievement,
      completionRate,
      selfScore,
      teamScore,
      totalScore
    })
  }

  if (records.length > 0) {
    await db.assessments.bulkAdd(records)
    importResult.visible = true
    importResult.title = 'Excel 导入成功'
    importResult.type = 'success'
    importResult.desc = `成功导入 ${records.length} 条考核记录`
    ElMessage.success(`成功导入 ${records.length} 条考核记录`)
  }
}

onMounted(() => {
  refreshStats()
})
</script>

<style scoped>
.data-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
  min-height: 40px;
}

.card-footer {
  margin-top: 16px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-footer.warning {
  color: #e6a23c;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px 8px;
  text-align: center;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.import-result {
  margin-top: 20px;
}
</style>
