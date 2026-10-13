import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  detectAssistantIntent,
  resolveAssistantIntent,
} from '../dist/controllers/enhancedChatbotController.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const backendDir = path.resolve(scriptDir, '..')
const datasetPath = path.join(backendDir, 'evaluation', 'intent-evaluation.v1.json')
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'))
const intents = Object.keys(dataset.intents)

const directCases = intents.flatMap((intent) =>
  dataset.intents[intent].map((item) => ({
    ...item,
    expectedIntent: intent,
  })),
)

function keywordBaseline(text) {
  if (/课表|timetable/i.test(text)) return 'TIMETABLE'
  if (/成绩|grade/i.test(text)) return 'GRADES'
  if (/推荐课程|recommend course/i.test(text)) return 'COURSE_DISCOVERY'
  if (/学习计划|study plan/i.test(text)) return 'STUDY_PLAN'
  if (/政策|policy/i.test(text)) return 'SCHOOL_POLICY'
  if (/翻译|translate/i.test(text)) return 'TRANSLATE'
  return 'GENERAL'
}

function percentile(values, ratio) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)
  return sorted[index]
}

function round(value) {
  return Number(value.toFixed(4))
}

function evaluate(name, cases, predict) {
  const confusion = Object.fromEntries(
    intents.map((expected) => [
      expected,
      Object.fromEntries(intents.map((predicted) => [predicted, 0])),
    ]),
  )
  const failures = []
  const latencies = []
  let correct = 0

  for (const item of cases) {
    const startedAt = performance.now()
    const predicted = predict(item)
    latencies.push(performance.now() - startedAt)
    confusion[item.expectedIntent][predicted] += 1
    if (predicted === item.expectedIntent) {
      correct += 1
    } else {
      failures.push({
        id: item.id,
        text: item.text ?? item.message,
        expected: item.expectedIntent,
        predicted,
      })
    }
  }

  const perIntent = {}
  for (const intent of intents) {
    const tp = confusion[intent][intent]
    const fp = intents.reduce((sum, expected) => (
      expected === intent ? sum : sum + confusion[expected][intent]
    ), 0)
    const fn = intents.reduce((sum, predicted) => (
      predicted === intent ? sum : sum + confusion[intent][predicted]
    ), 0)
    const precision = tp + fp ? tp / (tp + fp) : 0
    const recall = tp + fn ? tp / (tp + fn) : 0
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
    perIntent[intent] = {
      support: cases.filter((item) => item.expectedIntent === intent).length,
      precision: round(precision),
      recall: round(recall),
      f1: round(f1),
    }
  }

  const macro = (metric) =>
    intents.reduce((sum, intent) => sum + perIntent[intent][metric], 0) / intents.length

  return {
    name,
    caseCount: cases.length,
    accuracy: round(correct / cases.length),
    macroPrecision: round(macro('precision')),
    macroRecall: round(macro('recall')),
    macroF1: round(macro('f1')),
    latencyMs: {
      average: round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length),
      p95: round(percentile(latencies, 0.95)),
    },
    perIntent,
    confusion,
    failures,
  }
}

const baseline = evaluate(
  'keyword-baseline',
  directCases,
  (item) => keywordBaseline(item.text),
)
const enhanced = evaluate(
  'openedu-intent-classifier',
  directCases,
  (item) => detectAssistantIntent(item.text),
)
const contextual = evaluate(
  'openedu-context-resolver',
  dataset.contextCases,
  (item) => resolveAssistantIntent(item.message, item.history),
)

const report = {
  dataset: {
    version: dataset.version,
    description: dataset.description,
    directCases: directCases.length,
    contextualCases: dataset.contextCases.length,
    totalCases: directCases.length + dataset.contextCases.length,
    languages: dataset.languages,
  },
  generatedAt: new Date().toISOString(),
  baseline,
  enhanced,
  contextual,
}

console.log(`dataset: ${report.dataset.totalCases} cases (${directCases.length} direct + ${dataset.contextCases.length} contextual)`)
console.log(`baseline: accuracy=${baseline.accuracy} macroF1=${baseline.macroF1}`)
console.log(`enhanced: accuracy=${enhanced.accuracy} macroF1=${enhanced.macroF1}`)
console.log(`context: accuracy=${contextual.accuracy} macroF1=${contextual.macroF1}`)

if (process.argv.includes('--write')) {
  const resultDir = path.join(backendDir, 'evaluation', 'results')
  fs.mkdirSync(resultDir, { recursive: true })
  const resultPath = path.join(resultDir, 'intent-evaluation-v1.json')
  fs.writeFileSync(resultPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(`report: ${path.relative(backendDir, resultPath)}`)
}

if (enhanced.accuracy < 0.85 || enhanced.macroF1 < 0.85 || contextual.accuracy < 0.85) {
  console.error('evaluation threshold failed: enhanced and contextual accuracy must be at least 0.85')
  process.exitCode = 1
}
