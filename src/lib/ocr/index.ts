/**
 * OCR 识图统一入口
 *
 * 供 src/lib/ai.ts 的 extractWithOcr 使用：
 * 图片 → tesseract.js OCR（文字+坐标）→ 模板/正则解析 → 返回字段
 */
import { ocrImage } from './ocr'
import { parseFieldsFromText, type OcrParsedFields } from './parse'
import { detectAppSource } from './templates'

export interface OcrExtractResult {
  fields: OcrParsedFields
  rawText: string
  appSource: string | null
  lineCount: number
}

export async function extractFromOcrImage(imageBuffer: Buffer): Promise<OcrExtractResult> {
  const { text, lines } = await ocrImage(imageBuffer)
  const appSource = detectAppSource(text)
  const fields = parseFieldsFromText(text)
  return { fields, rawText: text, appSource, lineCount: lines.length }
}

export { detectAppSource } from './templates'
export type { OcrLine, OcrResult } from './ocr'
export type { OcrParsedFields } from './parse'
