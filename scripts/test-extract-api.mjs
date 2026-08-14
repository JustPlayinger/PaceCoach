// /api/extract 端到端测试（走 DsBridge 网关路径）
// 用法: bun scripts/test-extract-api.mjs <image-path>
import fs from 'node:fs'
import path from 'node:path'

const imagePath = process.argv[2] || path.join(process.cwd(), 'upload', 'pasted_image_1785058405814.jpg')
const mime = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
const base64 = fs.readFileSync(imagePath).toString('base64')

console.log('image:', imagePath)
const t0 = Date.now()
const res = await fetch('http://127.0.0.1:3000/api/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
  signal: AbortSignal.timeout(180000),
})
console.log('status:', res.status, 'elapsed:', Date.now() - t0, 'ms')
const data = await res.json()
if (data.error) {
  console.error('ERROR:', data.error)
  process.exit(1)
}
const d = data.data
console.log('--- EXTRACTED ---')
console.log(JSON.stringify(
  {
    distance: d.distance, duration: d.duration, avgPace: d.avgPace, avgPaceSec: d.avgPaceSec,
    avgHr: d.avgHr, maxHr: d.maxHr, elevation: d.elevation, descent: d.descent,
    cadence: d.cadence, strideLength: d.strideLength, steps: d.steps, calories: d.calories,
    avgSpeed: d.avgSpeed, weather: d.weather, temperature: d.temperature,
    appSource: d.appSource, notes: d.notes, curveAnalysis: d.curveAnalysis?.slice(0, 100),
    paceCurveLen: d.paceCurve?.length, hrCurveLen: d.hrCurve?.length,
  }, null, 2))
process.exit(0)
