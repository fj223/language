import { readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
const localesRoot = new URL('../src/locales/', import.meta.url)
const localeNames = ['zh', 'en', 'ru']

function loadLocale(name) {
  const source = readFileSync(new URL(`${name}.ts`, localesRoot), 'utf8')
  const expression = source.replace(/^\s*export\s+default\s+/, '').trim()
  return Function(`"use strict"; return (${expression});`)()
}

function flatten(value, prefix = '', result = new Set()) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, path, result)
    else result.add(path)
  }
  return result
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) walk(path, files)
    else if (['.vue', '.ts'].includes(extname(entry.name))) files.push(path)
  }
  return files
}

const locales = Object.fromEntries(localeNames.map((name) => [name, flatten(loadLocale(name))]))
const reference = locales.zh
const errors = []

for (const name of localeNames.slice(1)) {
  const missing = [...reference].filter((key) => !locales[name].has(key))
  const extra = [...locales[name]].filter((key) => !reference.has(key))
  if (missing.length) errors.push(`${name}: missing keys\n  ${missing.join('\n  ')}`)
  if (extra.length) errors.push(`${name}: extra keys\n  ${extra.join('\n  ')}`)
}

const usedKeys = new Map()
const keyPattern = /(?:\$t|\bt)\(\s*['"]([^'"]+)['"]/g
for (const file of walk(sourceRoot)) {
  if (file.includes(`${join('src', 'locales')}`)) continue
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(keyPattern)) {
    const key = match[1]
    if (!usedKeys.has(key)) usedKeys.set(key, relative(sourceRoot, file))
  }
}

for (const [key, file] of usedKeys) {
  for (const name of localeNames) {
    if (!locales[name].has(key)) errors.push(`${name}: key "${key}" used by ${file} is missing`)
  }
}

if (errors.length) {
  console.error(`i18n validation failed:\n${errors.join('\n')}`)
  process.exit(1)
}

console.log(`i18n validation passed: ${reference.size} keys aligned across zh/en/ru; ${usedKeys.size} literal keys checked`)
