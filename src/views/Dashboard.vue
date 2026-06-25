<template>
  <div class="dashboard-page">
    <div class="stat-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon teachers">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ teachers.length }}</div>
              <div class="stat-label">教师总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon tasks">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ taskBooks.length }}</div>
              <div class="stat-label">建设任务</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon assessments">
              <el-icon><Histogram /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ currentYearAvg }}%</div>
              <div class="stat-label">本年度平均完成率</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon dimensions">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">7</div>
              <div class="stat-label">考核维度</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">团队七维能力雷达图</div>
          <div ref="radarChartRef" class="chart radar-chart"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">
            个人能力雷达图
            <el-select v-model="selectedTeacher" size="small" style="width: 120px" @change="updateTeacherCharts">
              <el-option
                v-for="t in teachers"
                :key="t.id"
                :label="t.name"
                :value="t.name"
              />
            </el-select>
          </div>
          <div ref="teacherRadarChartRef" class="chart radar-chart"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">个人三年发展趋势</div>
          <div ref="lineChartRef" class="chart line-chart"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">任务书年度进度</div>
          <div ref="progressChartRef" class="chart"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">
            {{ currentYear }}年度各维度得分
            <el-select v-model="selectedTeacher" size="small" style="width: 120px" @change="updateTeacherCharts">
              <el-option
                v-for="t in teachers"
                :key="t.id"
                :label="t.name"
                :value="t.name"
              />
            </el-select>
          </div>
          <div ref="teacherBarChartRef" class="chart bar-chart"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">
            {{ currentYear }}年度总评排名
            <el-select v-model="currentYear" size="small" style="width: 100px" @change="updateYearCharts">
              <el-option :label="2024" :value="2024" />
              <el-option :label="2025" :value="2025" />
            </el-select>
          </div>
          <div ref="barChartRef" class="chart bar-chart"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { useDataStore } from '@/stores/data'
import { DIMENSIONS } from '@/db'
import { storeToRefs } from 'pinia'

const dataStore = useDataStore()
const { teachers, taskBooks, assessments } = storeToRefs(dataStore)

const radarChartRef = ref(null)
const teacherRadarChartRef = ref(null)
const lineChartRef = ref(null)
const progressChartRef = ref(null)
const teacherBarChartRef = ref(null)
const barChartRef = ref(null)

let radarChart = null
let teacherRadarChart = null
let lineChart = null
let progressChart = null
let teacherBarChart = null
let barChart = null

const selectedTeacher = ref('赵莉')
const currentYear = ref(2025)

const currentYearAvg = computed(() => {
  const yearAssessments = assessments.value.filter(a => a.year === currentYear.value)
  if (yearAssessments.length === 0) return 0
  const avg = yearAssessments.reduce((sum, a) => sum + a.completionRate, 0) / yearAssessments.length
  return avg.toFixed(1)
})

const radarData = computed(() => {
  const yearAssessments = assessments.value.filter(a => a.year === currentYear.value)
  return DIMENSIONS.map(dim => {
    const dimData = yearAssessments.filter(a => a.dimension === dim)
    if (dimData.length === 0) return 0
    const avg = dimData.reduce((sum, a) => sum + a.totalScore, 0) / dimData.length
    return Math.round(avg)
  })
})

const lineData = computed(() => {
  const teacherAssessments = assessments.value.filter(a => a.teacherName === selectedTeacher.value)
  const years = [2024, 2025]
  return years.map(year => {
    const yearData = teacherAssessments.filter(a => a.year === year)
    if (yearData.length === 0) return 0
    const first = yearData[0]
    if (first.overallTotal) return first.overallTotal
    const avg = yearData.reduce((sum, a) => sum + a.totalScore, 0) / yearData.length
    return Math.round(avg * 10) / 10
  })
})

const progressData = computed(() => {
  const yearAssessments = assessments.value.filter(a => a.year === currentYear.value)
  const completed = yearAssessments.filter(a => a.completionRate >= 100).length
  const total = yearAssessments.length
  const inProgress = yearAssessments.filter(a => a.completionRate >= 60 && a.completionRate < 100).length
  const notStarted = total - completed - inProgress
  return { completed, inProgress, notStarted, total }
})

const barData = computed(() => {
  const yearAssessments = assessments.value.filter(a => a.year === currentYear.value)
  const teacherScores = {}
  yearAssessments.forEach(a => {
    if (!teacherScores[a.teacherName]) {
      teacherScores[a.teacherName] = { overallTotal: a.overallTotal, dimScores: [] }
    }
    teacherScores[a.teacherName].dimScores.push(a.totalScore)
  })
  const result = Object.entries(teacherScores).map(([name, data]) => ({
    name,
    score: data.overallTotal || Math.round(data.dimScores.reduce((s, v) => s + v, 0) / data.dimScores.length * 10) / 10
  }))
  result.sort((a, b) => b.score - a.score)
  return result.slice(0, 10)
})

const teacherRadarData = computed(() => {
  const yearAssessments = assessments.value.filter(
    a => a.year === currentYear.value && a.teacherName === selectedTeacher.value
  )
  return DIMENSIONS.map(dim => {
    const dimData = yearAssessments.find(a => a.dimension === dim)
    return dimData ? Math.round(dimData.actualAchievement * 10) / 10 : 0
  })
})

// 获取选中教师的各维度预期目标分（用于雷达图最大值）
const teacherExpectedTargets = computed(() => {
  const yearAssessments = assessments.value.filter(
    a => a.year === currentYear.value && a.teacherName === selectedTeacher.value
  )
  return DIMENSIONS.map(dim => {
    const dimData = yearAssessments.find(a => a.dimension === dim)
    return dimData ? dimData.expectedTarget : 20
  })
})

const teacherDimBarData = computed(() => {
  const yearAssessments = assessments.value.filter(
    a => a.year === currentYear.value && a.teacherName === selectedTeacher.value
  )
  return DIMENSIONS.map(dim => {
    const dimData = yearAssessments.find(a => a.dimension === dim)
    return {
      name: dim,
      actual: dimData ? Math.round(dimData.actualAchievement * 10) / 10 : 0,
      expected: dimData ? dimData.expectedTarget : 20
    }
  })
})

function initRadarChart() {
  if (!radarChartRef.value) return
  radarChart = echarts.init(radarChartRef.value)
  updateRadarChart()
}

function updateRadarChart() {
  if (!radarChart) return
  const option = {
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: DIMENSIONS.map(d => ({ name: d, max: 25 })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#606266',
        fontSize: 11
      },
      splitLine: {
        lineStyle: { color: ['#e4e7ed'] }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(64, 158, 255, 0.02)', 'rgba(64, 158, 255, 0.05)']
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData.value,
        name: '团队均分',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.25)'
        },
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff'
        }
      }]
    }]
  }
  radarChart.setOption(option)
}

function initTeacherRadarChart() {
  if (!teacherRadarChartRef.value) return
  teacherRadarChart = echarts.init(teacherRadarChartRef.value)
  updateTeacherRadarChart()
}

function updateTeacherRadarChart() {
  if (!teacherRadarChart) return
  const maxValues = teacherExpectedTargets.value
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const dim = DIMENSIONS[params.seriesIndex]
        const actual = params.value[params.seriesIndex]
        const expected = maxValues[params.seriesIndex]
        const rate = expected > 0 ? ((actual / expected) * 100).toFixed(1) : 0
        return `${dim}<br/>实际：${actual}分<br/>目标：${expected}分<br/>完成率：${rate}%`
      }
    },
    legend: {
      bottom: 5,
      data: [selectedTeacher.value]
    },
    radar: {
      indicator: DIMENSIONS.map((d, i) => ({ name: d, max: maxValues[i] || 20 })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#606266',
        fontSize: 11
      },
      splitLine: {
        lineStyle: { color: ['#e4e7ed'] }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(103, 194, 58, 0.02)', 'rgba(103, 194, 58, 0.05)']
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: teacherRadarData.value,
        name: selectedTeacher.value,
        areaStyle: {
          color: 'rgba(103, 194, 58, 0.25)'
        },
        lineStyle: {
          color: '#67c23a',
          width: 2
        },
        itemStyle: {
          color: '#67c23a'
        }
      }]
    }]
  }
  teacherRadarChart.setOption(option)
}

function initLineChart() {
  if (!lineChartRef.value) return
  lineChart = echarts.init(lineChartRef.value)
  updateLineChart()
}

function updateLineChart() {
  if (!lineChart) return
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}年<br/>总评分：{c}分'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['2024', '2025', '2026'],
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' }
    },
    series: [{
      name: '总评分',
      type: 'line',
      smooth: true,
      data: [...lineData.value, null],
      lineStyle: { color: '#67c23a', width: 3 },
      itemStyle: { color: '#67c23a' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
          { offset: 1, color: 'rgba(103, 194, 58, 0.02)' }
        ])
      }
    }]
  }
  lineChart.setOption(option)
}

function initProgressChart() {
  if (!progressChartRef.value) return
  progressChart = echarts.init(progressChartRef.value)
  updateProgressChart()
}

function updateProgressChart() {
  if (!progressChart) return
  const { completed, inProgress, notStarted, total } = progressData.value
  const completedPct = total > 0 ? Math.round(completed / total * 100) : 0
  const inProgressPct = total > 0 ? Math.round(inProgress / total * 100) : 0
  const notStartedPct = total > 0 ? Math.round(notStarted / total * 100) : 0

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#606266', fontSize: 13 },
      itemGap: 16
    },
    series: [{
      type: 'pie',
      radius: ['55%', '75%'],
      center: ['30%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      labelLine: { show: false },
      data: [
        { value: completed, name: '已完成', itemStyle: { color: '#67c23a' } },
        { value: inProgress, name: '进行中', itemStyle: { color: '#e6a23c' } },
        { value: notStarted, name: '未完成', itemStyle: { color: '#f56c6c' } }
      ]
    }],
    graphic: [
      {
        type: 'text',
        left: '25%',
        top: '42%',
        style: {
          text: completedPct + '%',
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#303133',
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        left: '25%',
        top: '55%',
        style: {
          text: '完成率',
          fontSize: 12,
          fill: '#909399',
          textAlign: 'center'
        }
      }
    ]
  }
  progressChart.setOption(option)
}

function initTeacherBarChart() {
  if (!teacherBarChartRef.value) return
  teacherBarChart = echarts.init(teacherBarChartRef.value)
  updateTeacherBarChart()
}

function updateTeacherBarChart() {
  if (!teacherBarChart) return
  const data = teacherDimBarData.value
  const names = data.map(d => d.name)
  const actuals = data.map(d => d.actual)
  const expecteds = data.map(d => d.expected)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        const dim = params[0].name
        const actual = params[0].value
        const expected = params[1].value
        const rate = expected > 0 ? ((actual / expected) * 100).toFixed(1) : 0
        return `${dim}<br/><span style="color:#e6a23c">●</span> 实际：${actual}分<br/><span style="color:#909399">●</span> 目标：${expected}分<br/>完成率：${rate}%`
      }
    },
    legend: {
      bottom: 5,
      data: ['实际得分', '预期目标'],
      textStyle: { fontSize: 11 }
    },
    grid: {
      left: '3%',
      right: '12%',
      bottom: '15%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266', fontSize: 10, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' }
    },
    series: [
      {
        name: '实际得分',
        type: 'bar',
        data: actuals,
        barWidth: 12,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#e6a23c' },
            { offset: 1, color: '#f0c78a' }
          ])
        },
        label: {
          show: true,
          position: 'top',
          color: '#606266',
          fontSize: 10,
          formatter: '{c}'
        }
      },
      {
        name: '预期目标',
        type: 'bar',
        data: expecteds,
        barWidth: 12,
        barGap: '-100%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: 'rgba(144, 147, 153, 0.3)',
          borderColor: '#909399',
          borderWidth: 1
        },
        label: { show: false }
      }
    ]
  }
  teacherBarChart.setOption(option)
}

function initBarChart() {
  if (!barChartRef.value) return
  barChart = echarts.init(barChartRef.value)
  updateBarChart()
}

function updateBarChart() {
  if (!barChart) return
  const data = barData.value
  const names = data.map(d => d.name).reverse()
  const scores = data.map(d => d.score).reverse()

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>总评分：{c}分'
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#606266', fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: scores,
      barWidth: 14,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#409eff' },
          { offset: 1, color: '#66b1ff' }
        ])
      },
      label: {
        show: true,
        position: 'right',
        color: '#606266',
        fontSize: 12,
        formatter: '{c}分'
      }
    }]
  }
  barChart.setOption(option)
}

function handleResize() {
  radarChart?.resize()
  teacherRadarChart?.resize()
  lineChart?.resize()
  progressChart?.resize()
  teacherBarChart?.resize()
  barChart?.resize()
}

function updateTeacherCharts() {
  updateTeacherRadarChart()
  updateLineChart()
  updateTeacherBarChart()
}

function updateYearCharts() {
  updateRadarChart()
  updateTeacherRadarChart()
  updateTeacherBarChart()
  updateBarChart()
}

onMounted(async () => {
  await dataStore.loadAll()
  setTimeout(() => {
    initRadarChart()
    initTeacherRadarChart()
    initLineChart()
    initProgressChart()
    initTeacherBarChart()
    initBarChart()
  }, 50)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
  teacherRadarChart?.dispose()
  lineChart?.dispose()
  progressChart?.dispose()
  teacherBarChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
}

.stat-cards {
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
}

.stat-icon.teachers {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.tasks {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.assessments {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.stat-icon.dimensions {
  background: linear-gradient(135deg, #f56c6c, #f89898);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart {
  width: 100%;
  height: 280px;
}

.bar-chart {
  height: 280px;
}

.radar-chart {
  height: 260px;
}

.line-chart {
  height: 260px;
}

.teacher-selector,
.year-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.selector-label {
  font-size: 13px;
  color: #606266;
  font-weight: normal;
}
</style>
