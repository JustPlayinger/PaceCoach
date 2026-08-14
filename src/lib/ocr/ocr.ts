/**
 * 服务端 OCR 引擎（tesseract.js）
 *
 * 背景：DeepSeek API 无多模态能力。当本地 DsBridge 多模态网关不可达时，
 * 用 tesseract.js 在服务端对训练 App 截图做 OCR（中文 + 英文），
 * 得到带坐标的文字块，供模板/正则解析使用。
 */
import path from 'path'
import fs from 'fs'
import { createWorker } from 'tesseract.js'

let workerPromise: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null

/** 语言包目录：优先 public/ocr-lang（随 standalone 一起发布，离线可用） */
function getLangPath(): string {
  const candidates = [
    path.join(process.cwd(), 'public', 'ocr-lang'),
    path.join(process.cwd(), 'ocr-lang'),
  ]
  const found = candidates.find((c) => fs.existsSync(c))
  return found || candidates[0]
}

async function getWorker(): Promise<Awaited<ReturnType<typeof createWorker>>> {
  if (!workerPromise) {
    workerPromise = createWorker(['chi_sim', 'eng'], 1, {
      langPath: getLangPath(),
      logger: () => {},
    }).catch((err) => {
      workerPromise = null
      throw err
    })
  }
  return workerPromise
}

export interface OcrLine {
  text: string
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

export interface OcrResult {
  text: string
  lines: OcrLine[]
}

export async function ocrImage(imageBuffer: Buffer): Promise<OcrResult> {
  const worker = await getWorker()
  const ret = await worker.recognize(imageBuffer, {}, { blocks: true })

  const lines: OcrLine[] = []
  const blocks = (ret.data as any).blocks
  if (Array.isArray(blocks)) {
    for (const block of blocks) {
      // tesseract.js v7：block.paragraphs[].lines[].words[]
      const blockLines = block?.lines || []
      const paragraphs = block?.paragraphs || []
      const allLines = blockLines.length > 0 ? blockLines : paragraphs.flatMap((p: any) => p?.lines || [])
      for (const line of allLines) {
        const words = line?.words || []
        const text = words
          .map((w: any) => w?.text || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        const bbox = line?.bbox
        if (text && bbox) {
          lines.push({
            text,
            bbox: {
              x0: bbox.x0 ?? 0,
              y0: bbox.y0 ?? 0,
              x1: bbox.x1 ?? 0,
              y1: bbox.y1 ?? 0,
            },
          })
        }
      }
    }
  }

  // 按纵向坐标排序，保证阅读顺序
  lines.sort((a, b) => a.bbox.y0 - b.bbox.y0)
  return { text: ret.data.text || '', lines }
}
