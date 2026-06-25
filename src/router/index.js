import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页可视化看板', icon: 'DataBoard' }
      },
      {
        path: 'task-book',
        name: 'TaskBook',
        component: () => import('@/views/TaskBook.vue'),
        meta: { title: '团队任务书', icon: 'Document' }
      },
      {
        path: 'planning',
        name: 'Planning',
        component: () => import('@/views/Planning.vue'),
        meta: { title: '教师个人规划', icon: 'User' }
      },
      {
        path: 'assessment',
        name: 'Assessment',
        component: () => import('@/views/Assessment.vue'),
        meta: { title: '年度考核表', icon: 'Histogram' }
      },
      {
        path: 'data-manager',
        name: 'DataManager',
        component: () => import('@/views/DataManager.vue'),
        meta: { title: '数据管理', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
