// DsBridge 网关端到端识图测试
// 用法: bun scripts/test-dsbridge.mjs <image-path>
import fs from 'node:fs'
import path from 'node:path'

const imagePath = process.argv[2] || path.join(process.cwd(), 'upload', 'pasted_image_1785058405814.jpg')
const mime = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
const base64 = fs.readFileSync(imagePath).toString('base64')

const url = process.env.DEEPSEEK_VISION_API_URL || 'http://127.0.0.1:8901/v1/chat/completions'
const apiKey = process.env.DEEPSEEK_API_KEY || 'test'

const prompt = `请识别这张跑步 App 截图中的训练数据，输出 JSON：包含 distance(km), duration(秒), avgPace, avgHr, maxHr, cadence, elevation, calories, appSource。只返回 JSON。`

console.log('image:', imagePath, 'size:', base64.length)

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: '你是一个专业的跑步训练数据分析助手。请用中文回答。' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 1500,
  }),
  signal: AbortSignal.timeout(120000),
})

console.log('status:', res.status)
const data = await res.json()
if (data.error) {
  console.error('ERROR:', JSON.stringify(data.error, null, 2))
  process.exit(1)
}
console.log('reply:\n', data.choices?.[0]?.message?.content)
