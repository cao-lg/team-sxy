<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">团队任务书管理</div>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增任务</el-button>
    </div>

    <el-table :data="taskBooks" border stripe style="width: 100%" v-loading="loading">
      <el-table-column type="index" label="序号" width="70" align="center" />
      <el-table-column prop="taskName" label="建设任务名" min-width="160" />
      <el-table-column prop="leader" label="负责人" width="100" align="center" />
      <el-table-column prop="members" label="团队成员" min-width="200" show-overflow-tooltip />
      <el-table-column prop="target2024" label="2024年目标" min-width="180" show-overflow-tooltip />
      <el-table-column prop="target2025" label="2025年目标" min-width="180" show-overflow-tooltip />
      <el-table-column prop="target2026" label="2026年目标" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="建设任务" prop="taskName">
          <el-input v-model="form.taskName" placeholder="请输入建设任务名称" />
        </el-form-item>
        <el-form-item label="负责人" prop="leader">
          <el-select v-model="form.leader" placeholder="请选择负责人" style="width: 100%">
            <el-option
              v-for="t in teachers"
              :key="t.id"
              :label="t.name"
              :value="t.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="团队成员" prop="members">
          <el-input v-model="form.members" placeholder="请输入团队成员，用顿号分隔" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="2024年目标" prop="target2024">
          <el-input v-model="form.target2024" placeholder="请输入2024年建设目标" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="2025年目标" prop="target2025">
          <el-input v-model="form.target2025" placeholder="请输入2025年建设目标" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="2026年目标" prop="target2026">
          <el-input v-model="form.target2026" placeholder="请输入2026年建设目标" type="textarea" :rows="2" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { db } from '@/db'
import { useDataStore } from '@/stores/data'
import { storeToRefs } from 'pinia'

const dataStore = useDataStore()
const { taskBooks, teachers } = storeToRefs(dataStore)

const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const isEdit = ref(false)
const editId = ref(null)

const dialogTitle = computed(() => isEdit.value ? '编辑任务书' : '新增任务书')

const form = reactive({
  taskName: '',
  leader: '',
  members: '',
  target2024: '',
  target2025: '',
  target2026: ''
})

const rules = {
  taskName: [{ required: true, message: '请输入建设任务名称', trigger: 'blur' }],
  leader: [{ required: true, message: '请选择负责人', trigger: 'change' }]
}

async function loadData() {
  loading.value = true
  try {
    await dataStore.loadTaskBooks()
    await dataStore.loadTeachers()
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  editId.value = null
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    taskName: row.taskName,
    leader: row.leader,
    members: row.members || '',
    target2024: row.target2024 || '',
    target2025: row.target2025 || '',
    target2026: row.target2026 || ''
  })
  dialogVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
  Object.assign(form, {
    taskName: '',
    leader: '',
    members: '',
    target2024: '',
    target2025: '',
    target2026: ''
  })
  isEdit.value = false
  editId.value = null
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      if (isEdit.value) {
        await db.taskBooks.update(editId.value, { ...form })
        ElMessage.success('修改成功')
      } else {
        await db.taskBooks.add({ ...form })
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      await dataStore.loadTaskBooks()
    } catch (error) {
      ElMessage.error('操作失败：' + error.message)
    }
  })
}

function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除任务「${row.taskName}」吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await db.taskBooks.delete(row.id)
      ElMessage.success('删除成功')
      await dataStore.loadTaskBooks()
    } catch (error) {
      ElMessage.error('删除失败：' + error.message)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>
