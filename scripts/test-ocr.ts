// 内置 OCR 兜底路径测试（tesseract.js + 模板解析）
// 用法: bun scripts/test-ocr.ts <image-path>
import fs from 'node:fs'
import path from 'node:path'
import { ocrImage } from '../src/lib/ocr/ocr'
import { parseFieldsFromText, detectAppSource } from '../src/lib/ocr/parse'

const imagePath = process.argv[2] || path.join(process.cwd(), 'upload', 'pasted_image_1785058405814.jpg')
const buf = fs.readFileSync(imagePath)

console.log('image:', imagePath, 'bytes:', buf.length)
console.log('OCR start...')
const t0 = Date.now()
const { text, lines } = await ocrImage(buf)
console.log('OCR done in', Date.now() - t0, 'ms; lines:', lines.length)
console.log('--- OCR TEXT (first 2500) ---')
console.log(text.slice(0, 2500))
console.log('--- PARSED FIELDS ---')
console.log(JSON.stringify(parseFieldsFromText(text), null, 2))
console.log('appSource:', detectAppSource(text))
process.exit(0)
