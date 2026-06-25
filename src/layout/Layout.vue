<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="24" color="#fff"><School /></el-icon>
        <span class="logo-text">教师团队发展管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
        background-color="#1f2937"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">{{ currentTitle }}</div>
        <div class="header-right">
          <el-icon size="18" style="margin-right: 8px"><UserFilled /></el-icon>
          <span>管理员</span>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view v-if="appStore.isDbReady" />
        <div v-else class="loading-page">
          <el-icon class="is-loading" size="40"><Loading /></el-icon>
          <p style="margin-top: 16px; color: #909396">数据加载中...</p>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

const menuItems = [
  { path: '/dashboard', title: '首页可视化看板', icon: 'DataBoard' },
  { path: '/task-book', title: '团队任务书', icon: 'Document' },
  { path: '/planning', title: '教师个人规划', icon: 'User' },
  { path: '/assessment', title: '年度考核表', icon: 'Histogram' },
  { path: '/data-manager', title: '数据管理', icon: 'Setting' }
]

const activeMenu = computed(() => route.path)

const currentTitle = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item ? item.title : ''
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #1f2937;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid #374151;
}

.logo-text {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
}

.sidebar-menu .el-menu-item:hover {
  background-color: #374151;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.main-content {
  background-color: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}

.loading-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}
</style>
