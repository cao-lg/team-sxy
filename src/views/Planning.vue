<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">教师个人规划</div>
    </div>

    <div class="filter-bar">
      <span class="filter-label">筛选条件：</span>
      <el-select v-model="filterTeacher" placeholder="选择教师" clearable style="width: 140px" filterable>
        <el-option
          v-for="t in teachers"
          :key="t.id"
          :label="t.name"
          :value="t.name"
        />
      </el-select>
      <el-select v-model="filterDimension" placeholder="选择维度" clearable style="width: 140px">
        <el-option
          v-for="d in DIMENSIONS"
          :key="d"
          :label="d"
          :value="d"
        />
      </el-select>
      <el-button type="primary" plain :icon="Search" @click="loadData">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading">
      <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
      <el-table-column prop="teacherName" label="姓名" width="90" align="center" fixed="left" />
      <el-table-column label="职称" width="80" align="center" fixed="left">
        <template #default="{ row }">
          {{ getTeacherTitle(row.teacherId) }}
        </template>
      </el-table-column>
      <el-table-column prop="dimension" label="维度" width="130" align="center" fixed="left" />
      <el-table-column label="2024年预期目标" min-width="220">
        <template #default="{ row }">
          <div
            v-if="editingCell?.key === row.key && editingCell?.year === 2024"
            class="edit-cell"
          >
            <el-input
              v-model="editingValue"
              type="textarea"
              :rows="3"
              size="small"
              @blur="handleSaveEdit(row, 2024)"
              @keyup.ctrl.enter="handleSaveEdit(row, 2024)"
              ref="inputRef"
              v-focus
            />
          </div>
          <div v-else class="target-cell" @click="handleEdit(row, 2024)">
            <div class="target-text">{{ row.target2024 || '暂无目标描述' }}</div>
            <div class="target-score">目标分：{{ row.expected2024 }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="2025年预期目标" min-width="220">
        <template #default="{ row }">
          <div
            v-if="editingCell?.key === row.key && editingCell?.year === 2025"
            class="edit-cell"
          >
            <el-input
              v-model="editingValue"
              type="textarea"
              :rows="3"
              size="small"
              @blur="handleSaveEdit(row, 2025)"
              @keyup.ctrl.enter="handleSaveEdit(row, 2025)"
            />
          </div>
          <div v-else class="target-cell" @click="handleEdit(row, 2025)">
            <div class="target-text">{{ row.target2025 || '暂无目标描述' }}</div>
            <div class="target-score">目标分：{{ row.expected2025 }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="2026年预期目标" min-width="220">
        <template #default="{ row }">
          <div
            v-if="editingCell?.key === row.key && editingCell?.year === 2026"
            class="edit-cell"
          >
            <el-input
              v-model="editingValue"
              type="textarea"
              :rows="3"
              size="small"
              @blur="handleSaveEdit(row, 2026)"
              @keyup.ctrl.enter="handleSaveEdit(row, 2026)"
            />
          </div>
          <div v-else class="target-cell" @click="handleEdit(row, 2026)">
            <div class="target-text">{{ row.target2026 || '暂无目标描述' }}</div>
            <div class="target-score">目标分：{{ row.expected2026 }}</div>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-tip">
      <el-icon color="#909399" size="14"><InfoFilled /></el-icon>
      <span style="margin-left: 6px; font-size: 12px; color: #909399">
        点击目标描述区域可编辑内容，按 Ctrl+Enter 或点击其他区域自动保存
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, InfoFilled } from '@element-plus/icons-vue'
import { db, DIMENSIONS } from '@/db'
import { useDataStore } from '@/stores/data'
import { storeToRefs } from 'pinia'

const dataStore = useDataStore()
const { plans, teachers } = storeToRefs(dataStore)

const loading = ref(false)
const filterTeacher = ref('')
const filterDimension = ref('')
const editingCell = ref(null)
const editingValue = ref('')
const inputRef = ref(null)

const tableData = computed(() => {
  const planMap = {}
  plans.value.forEach(p => {
    const key = `${p.teacherId}_${p.dimension}`
    if (!planMap[key]) {
      planMap[key] = {
        key,
        teacherId: p.teacherId,
        teacherName: p.teacherName,
        dimension: p.dimension,
        target2024: '',
        target2025: '',
        target2026: '',
        expected2024: 0,
        expected2025: 0,
        expected2026: 0,
        id2024: null,
        id2025: null,
        id2026: null
      }
    }
    if (p.year === 2024) {
      planMap[key].target2024 = p.targetText || ''
      planMap[key].expected2024 = p.expectedTarget
      planMap[key].id2024 = p.id
    } else if (p.year === 2025) {
      planMap[key].target2025 = p.targetText || ''
      planMap[key].expected2025 = p.expectedTarget
      planMap[key].id2025 = p.id
    } else if (p.year === 2026) {
      planMap[key].target2026 = p.targetText || ''
      planMap[key].expected2026 = p.expectedTarget
      planMap[key].id2026 = p.id
    }
  })

  let data = Object.values(planMap)
  if (filterTeacher.value) {
    data = data.filter(p => p.teacherName === filterTeacher.value)
  }
  if (filterDimension.value) {
    data = data.filter(p => p.dimension === filterDimension.value)
  }
  return data
})

function getTeacherTitle(teacherId) {
  const t = teachers.value.find(t => t.id === teacherId)
  return t ? t.title : '-'
}

async function loadData() {
  loading.value = true
  try {
    await dataStore.loadPlans()
    await dataStore.loadTeachers()
  } finally {
    loading.value = false
  }
}

function handleEdit(row, year) {
  const textField = `target${year}`
  editingCell.value = { key: row.key, year }
  editingValue.value = row[textField] || ''
  nextTick(() => {
    inputRef.value?.focus()
  })
}

async function handleSaveEdit(row, year) {
  if (!editingCell.value) return
  const idField = `id${year}`
  const planId = row[idField]

  if (planId) {
    try {
      await db.plans.update(planId, { targetText: editingValue.value })
      await dataStore.loadPlans()
    } catch (error) {
      ElMessage.error('保存失败：' + error.message)
    }
  }
  editingCell.value = null
}

function handleReset() {
  filterTeacher.value = ''
  filterDimension.value = ''
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.target-cell {
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
  line-height: 1.5;
}

.target-cell:hover {
  background-color: #ecf5ff;
}

.target-text {
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.target-score {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}

.edit-cell {
  padding: 4px 0;
}

.table-tip {
  margin-top: 12px;
  display: flex;
  align-items: center;
}
</style>
