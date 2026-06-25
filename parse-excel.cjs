const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const workbook = XLSX.readFile(path.join(__dirname, '团队数据.xlsx'));

const DIMENSION_ALIASES = {
  '专业建设方面': '专业建设',
  '课程与教学改革方面': '课程与教学改革',
  '教材建设方面': '教材建设',
  '职业技能竞赛方面': '职业技能竞赛',
  '科研及社会服务方面': '科研及社会服务',
  '科研、社会服务方面': '科研及社会服务',
  '个人培训及其他': '个人培训',
  '个人参加培训方面': '个人培训',
  '其他规划': '其他规划'
};

function parseAssessCell(text) {
  if (!text) return { actual: '', rate: 0, score: 0 };
  const str = String(text);
  const parts = str.split('/').map(s => s.trim());
  let score = 0;
  let rate = 0;
  let actual = str;

  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];
    const scoreMatch = last.match(/^([\d.]+)$/);
    const rateMatch = secondLast.match(/(\d+)%/);

    if (scoreMatch && rateMatch) {
      score = parseFloat(scoreMatch[1]);
      rate = parseInt(rateMatch[1]);
      actual = parts.slice(0, parts.length - 2).join('、');
    } else if (rateMatch) {
      rate = parseInt(rateMatch[1]);
      actual = parts.slice(0, parts.length - 1).join('、');
    }
  }
  return { actual, rate, score };
}

function parsePlanYearText(text, year) {
  const yearStr = String(year);
  const regex = new RegExp(yearStr + '[：:](.+?)[；;]', 'g');
  let match;
  let result = '';
  if (text.indexOf(yearStr + '：') >= 0 || text.indexOf(yearStr + ':') >= 0) {
    const re = new RegExp(yearStr + '[：:](.+?)(?=[；;]|$)');
    const m = text.match(re);
    if (m) result = m[1].trim();
  }
  return result;
}

// 1. 解析建设任务书
const taskSheet = workbook.Sheets['建设任务书'];
const taskRows = XLSX.utils.sheet_to_json(taskSheet, { header: 1 });
const taskBooks = [];
for (let i = 2; i < taskRows.length; i++) {
  const row = taskRows[i];
  if (!row || !row[1]) continue;
  taskBooks.push({
    taskName: row[1],
    leader: row[2] || '',
    members: row[3] || '',
    target2024: row[4] || '',
    target2025: row[5] || '',
    target2026: row[6] || ''
  });
}
console.log('✅ 任务书:', taskBooks.length, '个');

// 2. 解析个人规划书 + 教师信息
const planSheet = workbook.Sheets['个人规划书'];
const planRows = XLSX.utils.sheet_to_json(planSheet, { header: 1 });

const teachers = [];
const plans = [];
const teacherMap = {};

const planDimCols = [
  { col: 3, dimKey: '专业建设方面' },
  { col: 4, dimKey: '课程与教学改革方面' },
  { col: 5, dimKey: '教材建设方面' },
  { col: 6, dimKey: '职业技能竞赛方面' },
  { col: 7, dimKey: '科研及社会服务方面' },
  { col: 8, dimKey: '个人培训及其他' }
];

let teacherId = 1;
for (let i = 3; i < planRows.length; i++) {
  const row = planRows[i];
  if (!row || !row[1]) continue;
  const name = row[1];
  const title = row[2] || '讲师';
  teachers.push({
    id: teacherId,
    name,
    title,
    department: '数字商业学院'
  });
  teacherMap[name] = teacherId;

  for (const pd of planDimCols) {
    const dim = DIMENSION_ALIASES[pd.dimKey] || pd.dimKey;
    const cellText = row[pd.col] || '';
    for (const year of [2024, 2025, 2026]) {
      const yearText = parsePlanYearText(cellText, year);
      plans.push({
        teacherId,
        teacherName: name,
        year,
        dimension: dim,
        expectedTarget: 15,
        targetText: yearText
      });
    }
  }
  for (const year of [2024, 2025, 2026]) {
    plans.push({
      teacherId,
      teacherName: name,
      year,
      dimension: '其他规划',
      expectedTarget: 5,
      targetText: ''
    });
  }
  teacherId++;
}
console.log('✅ 教师:', teachers.length, '位');
console.log('✅ 规划记录:', plans.length, '条');

// 3. 解析考核成果
const assessments = [];

const assessDimCols = [
  { col: 2, dimKey: '专业建设方面' },
  { col: 3, dimKey: '课程与教学改革方面' },
  { col: 4, dimKey: '教材建设方面' },
  { col: 5, dimKey: '职业技能竞赛方面' },
  { col: 6, dimKey: '科研、社会服务方面' },
  { col: 7, dimKey: '个人参加培训方面' },
  { col: 8, dimKey: '其他规划' }
];
const totalScoreCol = 9;

for (const yearStr of ['2024', '2025']) {
  const sheetName = yearStr + '考核成果';
  if (!workbook.Sheets[sheetName]) continue;
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const year = parseInt(yearStr);
  let count = 0;

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1]) continue;
    const name = row[1];
    let tid = teacherMap[name];
    // 如果教师不在规划表里，自动添加
    if (!tid) {
      tid = teacherId;
      teachers.push({
        id: tid,
        name,
        title: '讲师',
        department: '数字商业学院'
      });
      teacherMap[name] = tid;
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
          });
        }
      }
      teacherId++;
      console.log('ℹ️  自动添加教师:', name);
    }

    // 读取总分
    const overallTotal = parseFloat(row[totalScoreCol]) || 0;

    // 收集各维度数据，反推预期目标分
    const dimResults = [];
    let totalExpected = 0;
    let totalActual = 0;
    for (const ad of assessDimCols) {
      const dim = DIMENSION_ALIASES[ad.dimKey] || ad.dimKey;
      const parsed = parseAssessCell(row[ad.col] || '');
      // 反推预期目标分 = 实际得分 / (完成率/100)
      const expectedTarget = parsed.rate > 0
        ? Math.round((parsed.score / (parsed.rate / 100)) * 10) / 10
        : parsed.score;
      dimResults.push({
        dim,
        actual: parsed.actual,
        rate: parsed.rate,
        score: parsed.score,
        expectedTarget
      });
      totalExpected += expectedTarget;
      totalActual += parsed.score;
    }

    // 计算整体完成率
    const overallRate = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;

    // 根据考核方案，阶梯计算个人绩效分（满分100）
    let personalPerfScore = 0;
    if (overallRate >= 80) {
      personalPerfScore = 100;
    } else if (overallRate >= 60) {
      personalPerfScore = 80;
    } else if (overallRate >= 40) {
      personalPerfScore = 60;
    } else {
      personalPerfScore = 0;
    }

    // 反推团队贡献分：总分 = 个人绩效×70% + 团队贡献×30%
    // 团队贡献分 = (总分 - 个人绩效×0.7) / 0.3
    const teamContribScore = overallTotal >= personalPerfScore * 0.7
      ? Math.round((overallTotal - personalPerfScore * 0.7) / 0.3 * 10) / 10
      : 0;

    // 保存各维度记录
    for (const dr of dimResults) {
      // 该维度的个人绩效贡献（按比例，仅供参考）
      const dimSelfScore = Math.round(dr.score * 0.7 * 10) / 10;
      const dimTeamScore = Math.round(dr.score * 0.3 * 10) / 10;
      assessments.push({
        teacherId: tid,
        teacherName: name,
        year,
        dimension: dr.dim,
        expectedTarget: dr.expectedTarget,
        actualText: dr.actual,
        actualAchievement: dr.score,
        completionRate: dr.rate || 0,
        selfScore: dimSelfScore,
        teamScore: dimTeamScore,
        totalScore: dr.score,
        personalPerfScore,
        teamContribScore,
        overallTotal
      });
      count++;
    }
  }
  console.log('✅ ' + yearStr + ' 考核记录:', count, '条');
}
console.log('✅ 总考核记录:', assessments.length, '条');

// 用考核数据回填个人规划的预期目标分
for (const plan of plans) {
  const assess = assessments.find(
    a => a.teacherName === plan.teacherName && a.year === plan.year && a.dimension === plan.dimension
  );
  if (assess && assess.expectedTarget) {
    plan.expectedTarget = assess.expectedTarget;
  }
}
// 2026年没有考核数据，用2025年的
for (const plan of plans) {
  if (plan.year === 2026) {
    const assess2025 = plans.find(
      p => p.teacherName === plan.teacherName && p.year === 2025 && p.dimension === plan.dimension && p.expectedTarget > 5
    );
    if (!assess2025) continue;
    const assess = assessments.find(
      a => a.teacherName === plan.teacherName && a.year === 2025 && a.dimension === plan.dimension
    );
    if (assess && assess.expectedTarget) {
      plan.expectedTarget = assess.expectedTarget;
    }
  }
}

// 输出 JSON
const result = { teachers, taskBooks, plans, assessments };
fs.writeFileSync(path.join(__dirname, 'import-data.json'), JSON.stringify(result, null, 2));
console.log('\n🎉 数据解析完成，已保存到 import-data.json');
