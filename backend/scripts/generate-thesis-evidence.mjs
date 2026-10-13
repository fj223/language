import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const backendDir = path.resolve(scriptDir, '..')
const projectDir = path.resolve(backendDir, '..')
const outputDir = path.join(backendDir, 'evaluation', 'thesis-evidence', 'latest')
const datasetPath = path.join(backendDir, 'evaluation', 'intent-evaluation.v1.json')
const evaluationPath = path.join(backendDir, 'evaluation', 'results', 'intent-evaluation-v1.json')
const generatedAt = new Date()
const runId = generatedAt.toISOString().replace(/[:.]/g, '-')

fs.mkdirSync(outputDir, { recursive: true })

function run(command, args, cwd = backendDir) {
  const startedAt = performance.now()
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: process.env,
    windowsHide: true,
  })
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
  return {
    command: [command, ...args].join(' '),
    passed: result.status === 0,
    exitCode: result.status,
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
    output: output.slice(-4000),
  }
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(headers, rows) {
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n') + '\n'
}

function writeText(name, content) {
  fs.writeFileSync(path.join(outputDir, name), content, 'utf8')
}

function round(value, digits = 4) {
  return Number(value.toFixed(digits))
}

function accuracy(rows) {
  return rows.length ? round(rows.filter((row) => row.correct).length / rows.length) : 0
}

function keywordBaseline(text) {
  if (/课表|timetable/i.test(text)) return 'TIMETABLE'
  if (/成绩|grade/i.test(text)) return 'GRADES'
  if (/推荐课程|recommend course/i.test(text)) return 'COURSE_DISCOVERY'
  if (/学习计划|study plan/i.test(text)) return 'STUDY_PLAN'
  if (/政策|policy/i.test(text)) return 'SCHOOL_POLICY'
  if (/翻译|translate/i.test(text)) return 'TRANSLATE'
  return 'GENERAL'
}

function barSvg(rows) {
  const width = 900
  const height = 390
  const left = 150
  const top = 60
  const chartWidth = 680
  const rowHeight = 74
  const colors = ['#94A3B8', '#2563EB', '#0F766E']
  const bars = rows.map((row, index) => {
    const y = top + index * rowHeight
    const barWidth = Math.max(2, Math.round(row.accuracy * chartWidth))
    return `
      <text x="${left - 12}" y="${y + 24}" text-anchor="end" font-size="17" fill="#334155">${row.method}</text>
      <rect x="${left}" y="${y}" width="${chartWidth}" height="32" rx="7" fill="#E2E8F0"/>
      <rect x="${left}" y="${y}" width="${barWidth}" height="32" rx="7" fill="${colors[index] ?? '#2563EB'}"/>
      <text x="${Math.min(left + barWidth + 10, width - 52)}" y="${y + 23}" font-size="16" font-weight="700" fill="#0F172A">${(row.accuracy * 100).toFixed(2)}%</text>
    `
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#FFFFFF"/>
    <text x="40" y="34" font-size="24" font-weight="700" fill="#0F172A">OpenEdu Intent Recognition Comparison</text>
    ${bars}
    <text x="${left}" y="${height - 35}" font-size="14" fill="#64748B">Accuracy on the versioned engineering regression dataset (not an independent holdout set)</text>
  </svg>`
}

const checks = [
  ['RBAC and enrollment state rules', 'scripts/test-domain-rules.mjs'],
  ['Chatbot intent contract', 'scripts/test-chatbot-intents.mjs'],
  ['Multilingual content localization', 'scripts/test-content-localization.mjs'],
  ['Education API retry and telemetry', 'scripts/test-education-data-integration.mjs'],
  ['Student and administrator business workflow', 'scripts/test-business-workflow.mjs'],
].map(([name, script]) => ({
  name,
  category: script.includes('business') ? 'End-to-end workflow' : 'Automated contract',
  ...run(process.execPath, [script]),
}))

const evaluationRun = run(process.execPath, ['scripts/evaluate-chatbot.mjs', '--write'])
checks.push({
  name: 'Intent evaluation thresholds',
  category: 'Experiment',
  ...evaluationRun,
})

if (!fs.existsSync(evaluationPath)) {
  throw new Error(`Evaluation report was not produced: ${evaluationPath}`)
}

const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'))
const evaluation = JSON.parse(fs.readFileSync(evaluationPath, 'utf8'))
const classifierModule = await import(pathToFileURL(path.join(backendDir, 'dist', 'controllers', 'enhancedChatbotController.js')).href)
const directCases = Object.entries(dataset.intents).flatMap(([expectedIntent, cases]) =>
  cases.map((item) => ({ ...item, expectedIntent })),
)

const observations = directCases.flatMap((item) => {
  const baselinePrediction = keywordBaseline(item.text)
  const enhancedPrediction = classifierModule.detectAssistantIntent(item.text)
  return [
    {
      caseId: item.id,
      language: item.language,
      tags: item.tags.join('|'),
      expectedIntent: item.expectedIntent,
      method: 'keyword-baseline',
      predictedIntent: baselinePrediction,
      correct: baselinePrediction === item.expectedIntent,
      datasetRole: 'engineering-regression',
    },
    {
      caseId: item.id,
      language: item.language,
      tags: item.tags.join('|'),
      expectedIntent: item.expectedIntent,
      method: 'openedu-intent-classifier',
      predictedIntent: enhancedPrediction,
      correct: enhancedPrediction === item.expectedIntent,
      datasetRole: 'engineering-regression',
    },
  ]
})

const contextObservations = dataset.contextCases.map((item) => {
  const prediction = classifierModule.resolveAssistantIntent(item.message, item.history)
  return {
    caseId: item.id,
    language: 'context',
    tags: 'multi-turn',
    expectedIntent: item.expectedIntent,
    method: 'openedu-context-resolver',
    predictedIntent: prediction,
    correct: prediction === item.expectedIntent,
    datasetRole: 'engineering-regression',
  }
})
const allObservations = [...observations, ...contextObservations]

const modelComparison = [
  {
    method: 'Keyword baseline',
    cases: evaluation.baseline.caseCount,
    accuracy: evaluation.baseline.accuracy,
    macroPrecision: evaluation.baseline.macroPrecision,
    macroRecall: evaluation.baseline.macroRecall,
    macroF1: evaluation.baseline.macroF1,
    averageLatencyMs: evaluation.baseline.latencyMs.average,
    p95LatencyMs: evaluation.baseline.latencyMs.p95,
    datasetRole: 'engineering-regression',
  },
  {
    method: 'OpenEdu classifier',
    cases: evaluation.enhanced.caseCount,
    accuracy: evaluation.enhanced.accuracy,
    macroPrecision: evaluation.enhanced.macroPrecision,
    macroRecall: evaluation.enhanced.macroRecall,
    macroF1: evaluation.enhanced.macroF1,
    averageLatencyMs: evaluation.enhanced.latencyMs.average,
    p95LatencyMs: evaluation.enhanced.latencyMs.p95,
    datasetRole: 'engineering-regression',
  },
  {
    method: 'Context resolver',
    cases: evaluation.contextual.caseCount,
    accuracy: evaluation.contextual.accuracy,
    macroPrecision: evaluation.contextual.macroPrecision,
    macroRecall: evaluation.contextual.macroRecall,
    macroF1: evaluation.contextual.macroF1,
    averageLatencyMs: evaluation.contextual.latencyMs.average,
    p95LatencyMs: evaluation.contextual.latencyMs.p95,
    datasetRole: 'engineering-regression',
  },
]

const perIntent = []
for (const [method, result] of [
  ['Keyword baseline', evaluation.baseline],
  ['OpenEdu classifier', evaluation.enhanced],
  ['Context resolver', evaluation.contextual],
]) {
  for (const [intent, metrics] of Object.entries(result.perIntent)) {
    perIntent.push({ method, intent, ...metrics })
  }
}

const languages = [...new Set(directCases.map((item) => item.language))]
const languageBreakdown = []
for (const language of languages) {
  for (const method of ['keyword-baseline', 'openedu-intent-classifier']) {
    const subset = observations.filter((row) => row.language === language && row.method === method)
    languageBreakdown.push({
      language,
      method,
      cases: subset.length,
      correct: subset.filter((row) => row.correct).length,
      accuracy: accuracy(subset),
    })
  }
}

const confusionRows = []
for (const [expected, predictedCounts] of Object.entries(evaluation.enhanced.confusion)) {
  for (const [predicted, count] of Object.entries(predictedCounts)) {
    confusionRows.push({ method: 'OpenEdu classifier', expectedIntent: expected, predictedIntent: predicted, count })
  }
}

const validationRows = checks.map((check) => ({
  validation: check.name,
  category: check.category,
  status: check.passed ? 'PASS' : 'FAIL',
  durationMs: check.durationMs,
  command: check.command,
  evidence: check.output.split(/\r?\n/).filter(Boolean).slice(-2).join(' | '),
}))

const gitCommit = run('git', ['rev-parse', 'HEAD'], projectDir)
const gitStatus = run('git', ['status', '--short'], projectDir)
const environment = {
  generatedAt: generatedAt.toISOString(),
  runId,
  nodeVersion: process.version,
  platform: `${process.platform}-${process.arch}`,
  gitCommit: gitCommit.passed ? gitCommit.output.trim() : 'unavailable',
  workingTreeDirty: Boolean(gitStatus.output.trim()),
  aiGenerationKeyRequired: false,
  datasetRole: 'versioned engineering regression benchmark',
}

writeText('experiment-observations.csv', toCsv(
  ['caseId', 'language', 'tags', 'expectedIntent', 'method', 'predictedIntent', 'correct', 'datasetRole'],
  allObservations,
))
writeText('model-comparison.csv', toCsv(
  ['method', 'cases', 'accuracy', 'macroPrecision', 'macroRecall', 'macroF1', 'averageLatencyMs', 'p95LatencyMs', 'datasetRole'],
  modelComparison,
))
writeText('per-intent-metrics.csv', toCsv(
  ['method', 'intent', 'support', 'precision', 'recall', 'f1'],
  perIntent,
))
writeText('language-breakdown.csv', toCsv(
  ['language', 'method', 'cases', 'correct', 'accuracy'],
  languageBreakdown,
))
writeText('confusion-matrix-long.csv', toCsv(
  ['method', 'expectedIntent', 'predictedIntent', 'count'],
  confusionRows,
))
writeText('business-validation.csv', toCsv(
  ['validation', 'category', 'status', 'durationMs', 'command', 'evidence'],
  validationRows,
))
writeText('model-comparison.svg', barSvg(modelComparison))

const summary = {
  schemaVersion: '1.0.0',
  environment,
  dataset: evaluation.dataset,
  researchClaims: {
    intentRecognition: {
      baselineAccuracy: evaluation.baseline.accuracy,
      enhancedAccuracy: evaluation.enhanced.accuracy,
      enhancedMacroF1: evaluation.enhanced.macroF1,
    },
    contextResolution: {
      cases: evaluation.contextual.caseCount,
      accuracy: evaluation.contextual.accuracy,
    },
    workflowValidation: {
      passed: checks.filter((check) => check.passed).length,
      total: checks.length,
      passRate: round(checks.filter((check) => check.passed).length / checks.length),
    },
  },
  limitations: [
    'The current intent dataset participated in engineering iteration and is not an independent thesis holdout set.',
    'A separately collected, frozen, human-labelled holdout set is still required for final generalisation claims.',
    'Generative AI is intentionally disabled; the evaluated core is the explainable hybrid intent, retrieval, context, and workflow system.',
  ],
}
writeText('experiment-summary.json', `${JSON.stringify(summary, null, 2)}\n`)

const defenseMarkdown = `# OpenEdu 论文实验与答辩证据包

生成时间：${environment.generatedAt}

## 可直接陈述的结果

- 工程回归数据集共 ${evaluation.dataset.totalCases} 条，其中单轮 ${evaluation.dataset.directCases} 条、多轮上下文 ${evaluation.dataset.contextualCases} 条。
- 关键词基线 Accuracy 为 ${(evaluation.baseline.accuracy * 100).toFixed(2)}%，Macro-F1 为 ${(evaluation.baseline.macroF1 * 100).toFixed(2)}%。
- OpenEdu 意图分类器 Accuracy 为 ${(evaluation.enhanced.accuracy * 100).toFixed(2)}%，Macro-F1 为 ${(evaluation.enhanced.macroF1 * 100).toFixed(2)}%。
- 上下文解析器在 ${evaluation.contextual.caseCount} 条工程回归样例上的 Accuracy 为 ${(evaluation.contextual.accuracy * 100).toFixed(2)}%。
- 自动化验证通过 ${checks.filter((check) => check.passed).length}/${checks.length} 项。

## 证据文件

| 证据 | 用途 |
|---|---|
| experiment-observations.csv | 每个样例、方法、预测与正确性，支持复核和重新统计 |
| model-comparison.csv | 论文主结果表 |
| per-intent-metrics.csv | 各意图 Precision、Recall、F1 |
| language-breakdown.csv | 中文、英文、俄文分组表现 |
| confusion-matrix-long.csv | 混淆矩阵原始长表 |
| business-validation.csv | 权限、状态机、API 和端到端流程验证 |
| model-comparison.svg | 可直接放入答辩的对比图 |
| experiment-summary.json | 机器可读汇总与研究限制 |
| evidence-manifest.json | 文件哈希，证明证据包完整性 |

## 学术边界

当前数据集是参与过规则迭代的版本化工程回归集，因此不能被描述为独立泛化测试。论文最终结论还需要冻结代码后，使用未参与开发的人工标注留出集进行一次性评测。当前证据能够支持“系统实现正确、工程改进有效、业务流程可重复验证”，但不能单独支持对未知真实用户问题的最终泛化结论。

## 答辩建议

先展示 model-comparison.svg，再展示 language-breakdown.csv 和 business-validation.csv。被问到 100% 准确率时，应主动说明这是工程回归结果，并展示上述学术边界，而不是把它表述为真实场景最终准确率。
`
writeText('DEFENSE_EVIDENCE.md', defenseMarkdown)

const reportHtml = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenEdu 实验与答辩证据</title>
<style>
body{font-family:Inter,"Microsoft YaHei",sans-serif;margin:0;background:#f1f5f9;color:#0f172a}
main{max-width:1100px;margin:0 auto;padding:36px 24px 60px}.hero{background:linear-gradient(135deg,#1e3a8a,#0f766e);color:white;padding:32px;border-radius:22px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}.card,section{background:white;border-radius:16px;padding:20px;box-shadow:0 8px 30px #0f172a0d}
.kpi{font-size:32px;font-weight:800;margin:8px 0}.muted{color:#64748b}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid #e2e8f0}
.pass{color:#047857;font-weight:700}.fail{color:#be123c;font-weight:700}.warning{background:#fffbeb;border-left:5px solid #f59e0b}
@media(max-width:760px){.grid{grid-template-columns:1fr}}
</style></head><body><main>
<div class="hero"><p>OpenEdu · Reproducible Evidence</p><h1>论文实验与答辩证据报告</h1><p>运行编号 ${runId}</p></div>
<div class="grid">
<div class="card"><span class="muted">数据集</span><div class="kpi">${evaluation.dataset.totalCases}</div><span>工程回归样例</span></div>
<div class="card"><span class="muted">OpenEdu Accuracy</span><div class="kpi">${(evaluation.enhanced.accuracy * 100).toFixed(2)}%</div><span>版本化回归集</span></div>
<div class="card"><span class="muted">验证通过</span><div class="kpi">${checks.filter((check) => check.passed).length}/${checks.length}</div><span>自动化证据项</span></div>
</div>
<section><h2>模型对比</h2><img src="model-comparison.svg" alt="模型准确率对比" style="max-width:100%"></section>
<section><h2>业务与工程验证</h2><table><thead><tr><th>验证项</th><th>分类</th><th>状态</th><th>耗时/ms</th></tr></thead><tbody>
${validationRows.map((row) => `<tr><td>${row.validation}</td><td>${row.category}</td><td class="${row.status === 'PASS' ? 'pass' : 'fail'}">${row.status}</td><td>${row.durationMs}</td></tr>`).join('')}
</tbody></table></section>
<section class="warning"><h2>论文使用边界</h2><p>当前数据集参与过工程迭代，只能作为版本化回归证据。最终论文仍需使用冻结代码后的独立人工标注留出集。</p></section>
</main></body></html>`
writeText('index.html', reportHtml)

const generatedFiles = fs.readdirSync(outputDir)
  .filter((name) => name !== 'evidence-manifest.json')
  .sort()
const manifest = {
  schemaVersion: '1.0.0',
  generatedAt: environment.generatedAt,
  runId,
  files: generatedFiles.map((name) => {
    const bytes = fs.readFileSync(path.join(outputDir, name))
    return {
      name,
      bytes: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    }
  }),
}
writeText('evidence-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`thesis evidence: ${path.relative(projectDir, outputDir)}`)
console.log(`checks: ${checks.filter((check) => check.passed).length}/${checks.length} passed`)
console.log(`files: ${manifest.files.length + 1}`)

if (checks.some((check) => !check.passed)) {
  process.exitCode = 1
}
