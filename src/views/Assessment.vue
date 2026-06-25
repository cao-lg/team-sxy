<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">年度考核表</div>
      <div class="header-actions">
        <el-radio-group v-model="viewMode" size="default">
          <el-radio-button value="summary">汇总视图</el-radio-button>
          <el-radio-button value="detail">明细视图</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增考核记录</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <span class="filter-label">筛选条件：</span>
      <el-select v-model="filterYear" placeholder="选择年度" style="width: 120px" @change="loadData">
        <el-option :label="2024" :value="2024" />
        <el-option :label="2025" :value="2025" />
        <el-option :label="2026" :value="2026" />
      </el-select>
      <el-select v-model="filterTeacher" placeholder="选择教师" clearable style="width: 140px">
        <el-option
          v-for="t in teachers"
          :key="t.id"
          :label="t.name"
          :value="t.name"
        />
      </el-select>
      <el-button type="primary" plain :icon="Search" @click="loadData">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 汇总视图 -->
    <el-table
      v-if="viewMode === 'summary'"
      :data="summaryData"
      border
      stripe
      style="width: 100%"
      v-loading="loading"
      height="calc(100vh - 260px)"
    >
      <el-table-column prop="teacherName" label="姓名" width="90" align="center" fixed="left" />
      <el-table-column
        v-for="dim in DIMENSIONS"
        :key="dim"
        :label="dim"
        width="100"
        align="center"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span :style="{ color: getScoreColor(row.dimScores[dim]) }">
            {{ row.dimScores[dim] || '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="个人绩效分" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="getPerfTagType(row.personalPerfScore)" size="small">
            {{ row.personalPerfScore || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="团队贡献分" width="110" align="center">
        <template #default="{ row }">
          <span :style="{ color: getScoreColor(row.teamContribScore) }">
            {{ row.teamContribScore || '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="总评分" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <span class="total-score" :style="{ color: getScoreColor(row.overallTotal) }">
            {{ row.overallTotal }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="viewDetail(row)">查看明细</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 明细视图 -->
    <el-table
      v-else
      :data="tableData"
      border
      stripe
      style="width: 100%"
      v-loading="loading"
      height="calc(100vh - 260px)"
    >
      <el-table-column prop="teacherName" label="姓名" width="90" align="center" fixed="left" />
      <el-table-column prop="year" label="年度" width="80" align="center" />
      <el-table-column prop="dimension" label="维度" width="110" align="center" />
      <el-table-column prop="expectedTarget" label="预期目标(分)" width="110" align="center" />
      <el-table-column label="实际完成绩效" min-width="200">
        <template #default="{ row }">
          <div class="actual-text">{{ row.actualText || row.actualAchievement }}</div>
        </template>
      </el-table-column>
      <el-table-column label="任务完成率(%)" width="120" align="center">
        <template #default="{ row }">
          <el-tag
            :type="getRateTagType(row.completionRate)"
            size="small"
          >
            {{ row.completionRate }}%
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="actualAchievement" label="维度得分" width="100" align="center" />
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">修改</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="130px">
        <el-form-item label="教师" prop="teacherId">
          <el-select v-model="form.teacherId" placeholder="请选择教师" style="width: 100%" @change="handleTeacherChange">
            <el-option
              v-for="t in teachers"
              :key="t.id"
              :label="t.name"
              :value="t.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年度" prop="year">
          <el-select v-model="form.year" placeholder="请选择年度" style="width: 100%">
            <el-option :label="2024" :value="2024" />
            <el-option :label="2025" :value="2025" />
            <el-option :label="2026" :value="2026" />
          </el-select>
        </el-form-item>
        <el-form-item label="维度" prop="dimension">
          <el-select v-model="form.dimension" placeholder="请选择维度" style="width: 100%">
            <el-option
              v-for="d in DIMENSIONS"
              :key="d"
              :label="d"
              :value="d"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预期目标分" prop="expectedTarget">
          <el-input-number v-model="form.expectedTarget" :min="0" :max="200" :precision="1" style="width: 100%" @change="recalculateFromRate" />
          <div class="form-tip">该维度的权重/满分值</div>
        </el-form-item>
        <el-form-item label="实际绩效描述" prop="actualText">
          <el-input
            v-model="form.actualText"
            type="textarea"
            :rows="3"
            placeholder="请输入实际完成绩效描述"
          />
        </el-form-item>
        <el-form-item label="任务完成率(%)" prop="completionRate">
          <el-input-number
            v-model="form.completionRate"
            :min="0"
            :max="200"
            style="width: 100%"
            @change="recalculateFromRate"
          />
        </el-form-item>
        <el-form-item label="维度实际得分" prop="actualAchievement">
          <el-input-number
            v-model="form.actualAchievement"
            :min="0"
            :max="200"
            :precision="1"
            style="width: 100%"
            @change="recalculate"
          />
          <div class="form-tip">= 预期目标分 × 完成率（线性计算）</div>
        </el-form-item>

        <el-divider content-position="left">年度汇总（自动计算）</el-divider>

        <el-form-item label="整体完成率">
          <span class="summary-value">{{ overallCompletionRate }}%</span>
        </el-form-item>
        <el-form-item label="个人绩效分(阶梯)">
          <el-tag :type="getPerfTagType(form.personalPerfScore)" size="default">
            {{ form.personalPerfScore }} 分
          </el-tag>
          <div class="form-tip">≥80%得100分 | 60-80%得80分 | 40-60%得60分 | <40%得0分</div>
        </el-form-item>
        <el-form-item label="团队贡献分">
          <el-input-number
            v-model="form.teamContribScore"
            :min="0"
            :max="100"
            :precision="1"
            style="width: 60%"
            @change="updateOverallTotal"
          />
          <div class="form-tip">学院学术委员会评定</div>
        </el-form-item>
        <el-form-item label="年度总评分">
          <span class="total-score-display">{{ form.overallTotal }}</span>
          <span class="score-formula">= 个人绩效分 × 70% + 团队贡献分 × 30%</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { db, DIMENSIONS } from '@/db'
import { useDataStore } from '@/stores/data'
import { storeToRefs } from 'pinia'

const dataStore = useDataStore()
const { assessments, teachers } = storeToRefs(dataStore)

const loading = ref(false)
const filterYear = ref(2025)
const filterTeacher = ref('')
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)
const viewMode = ref('summary')

const dialogTitle = computed(() => isEdit.value ? '修改考核记录' : '新增考核记录')

const tableData = computed(() => {
  let data = assessments.value.filter(a => a.year === filterYear.value)
  if (filterTeacher.value) {
    data = data.filter(a => a.teacherName === filterTeacher.value)
  }
  return data
})

const summaryData = computed(() => {
  const yearAssess = assessments.value.filter(a => a.year === filterYear.value)
  const teacherMap = {}
  yearAssess.forEach(a => {
    if (!teacherMap[a.teacherId]) {
      teacherMap[a.teacherId] = {
        teacherId: a.teacherId,
        teacherName: a.teacherName,
        overallTotal: a.overallTotal || 0,
        personalPerfScore: a.personalPerfScore || 0,
        teamContribScore: a.teamContribScore || 0,
        dimScores: {}
      }
    }
    teacherMap[a.teacherId].dimScores[a.dimension] = a.actualAchievement
    if (a.overallTotal) {
      teacherMap[a.teacherId].overallTotal = a.overallTotal
    }
    if (a.personalPerfScore) {
      teacherMap[a.teacherId].personalPerfScore = a.personalPerfScore
    }
    if (a.teamContribScore) {
      teacherMap[a.teacherId].teamContribScore = a.teamContribScore
    }
  })
  let result = Object.values(teacherMap)
  if (filterTeacher.value) {
    result = result.filter(r => r.teacherName === filterTeacher.value)
  }
  result.sort((a, b) => (b.overallTotal || 0) - (a.overallTotal || 0))
  return result
})

const form = reactive({
  teacherId: null,
  teacherName: '',
  year: 2025,
  dimension: '',
  expectedTarget: 15,
  actualText: '',
  actualAchievement: 15,
  completionRate: 100,
  personalPerfScore: 100,
  teamContribScore: 80,
  overallTotal: 94
})

const rules = {
  teacherId: [{ required: true, message: '请选择教师', trigger: 'change' }],
  year: [{ required: true, message: '请选择年度', trigger: 'change' }],
  dimension: [{ required: true, message: '请选择维度', trigger: 'change' }]
}

function getRateTagType(rate) {
  if (rate >= 100) return 'success'
  if (rate >= 80) return 'warning'
  return 'danger'
}

function getPerfTagType(score) {
  if (score >= 100) return 'success'
  if (score >= 80) return 'warning'
  if (score >= 60) return 'info'
  return 'danger'
}

function getScoreColor(score) {
  if (score >= 85) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}

async function loadData() {
  loading.value = true
  try {
    await dataStore.loadAssessments()
    await dataStore.loadTeachers()
  } finally {
    loading.value = false
  }
}

function handleTeacherChange(teacherId) {
  const teacher = teachers.value.find(t => t.id === teacherId)
  if (teacher) {
    form.teacherName = teacher.name
  }
}

const overallCompletionRate = computed(() => {
  if (!form.teacherId || !form.year) return 0
  const teacherAssess = assessments.value.filter(
    a => a.teacherId === form.teacherId && a.year === form.year
  )
  let totalExpected = form.expectedTarget
  let totalActual = form.actualAchievement
  teacherAssess.forEach(a => {
    if (!form.dimension || a.dimension !== form.dimension) {
      totalExpected += a.expectedTarget || 0
      totalActual += a.actualAchievement || 0
    } else if (isEdit.value && a.dimension === form.dimension) {
      totalExpected += 0
      totalActual += 0
    }
  })
  if (!isEdit.value && form.dimension) {
    totalExpected = form.expectedTarget
    totalActual = form.actualAchievement
    teacherAssess.forEach(a => {
      totalExpected += a.expectedTarget || 0
      totalActual += a.actualAchievement || 0
    })
  }
  return totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0
})

function calcPersonalPerf(rate) {
  if (rate >= 80) return 100
  if (rate >= 60) return 80
  if (rate >= 40) return 60
  return 0
}

function viewDetail(row) {
  filterTeacher.value = row.teacherName
  viewMode.value = 'detail'
}

function recalculate() {
  if (form.expectedTarget > 0) {
    form.completionRate = Math.round((form.actualAchievement / form.expectedTarget) * 100)
  }
  updateAnnualSummary()
}

function recalculateFromRate() {
  form.actualAchievement = Math.round(form.expectedTarget * form.completionRate / 100 * 10) / 10
  updateAnnualSummary()
}

function updateAnnualSummary() {
  form.personalPerfScore = calcPersonalPerf(overallCompletionRate.value)
  updateOverallTotal()
}

function updateOverallTotal() {
  form.overallTotal = Math.round((form.personalPerfScore * 0.7 + form.teamContribScore * 0.3) * 10) / 10
}

function handleAdd() {
  isEdit.value = false
  editId.value = null
  form.year = filterYear.value
  dialogVisible.value = true
  updateAnnualSummary()
}

function handleEdit(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    teacherId: row.teacherId,
    teacherName: row.teacherName,
    year: row.year,
    dimension: row.dimension,
    expectedTarget: row.expectedTarget,
    actualText: row.actualText || '',
    actualAchievement: row.actualAchievement,
    completionRate: row.completionRate,
    personalPerfScore: row.personalPerfScore || 100,
    teamContribScore: row.teamContribScore || 80,
    overallTotal: row.overallTotal || 0
  })
  dialogVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
  Object.assign(form, {
    teacherId: null,
    teacherName: '',
    year: filterYear.value || 2025,
    dimension: '',
    expectedTarget: 15,
    actualText: '',
    actualAchievement: 15,
    completionRate: 100,
    personalPerfScore: 100,
    teamContribScore: 80,
    overallTotal: 94
  })
  isEdit.value = false
  editId.value = null
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      updateAnnualSummary()
      const saveData = {
        teacherId: form.teacherId,
        teacherName: form.teacherName,
        year: form.year,
        dimension: form.dimension,
        expectedTarget: form.expectedTarget,
        actualText: form.actualText,
        actualAchievement: form.actualAchievement,
        completionRate: form.completionRate,
        selfScore: Math.round(form.actualAchievement * 0.7 * 10) / 10,
        teamScore: Math.round(form.actualAchievement * 0.3 * 10) / 10,
        totalScore: form.actualAchievement,
        personalPerfScore: form.personalPerfScore,
        teamContribScore: form.teamContribScore,
        overallTotal: form.overallTotal
      }
      if (isEdit.value) {
        await db.assessments.update(editId.value, saveData)
        ElMessage.success('修改成功')
      } else {
        await db.assessments.add(saveData)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      await dataStore.loadAssessments()
    } catch (error) {
      ElMessage.error('操作失败：' + error.message)
    }
  })
}

function handleReset() {
  filterTeacher.value = ''
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.total-score {
  font-weight: 700;
  font-size: 15px;
}

.total-score-display {
  font-size: 22px;
  font-weight: 700;
  color: #409eff;
}

.score-formula {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.actual-text {
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}
</style>
