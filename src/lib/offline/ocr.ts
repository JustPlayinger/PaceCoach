/**
 * 浏览器端 OCR（离线 APK 识图兜底）
 *
 * 用 tesseract.js（纯 JS/WASM），worker/core/语言包全部本地化（public/），
 * 完全离线可用。若识别失败，调用方会降级为手动填写。
 */
import { createWorker } from 'tesseract.js'

let workerPromise: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null

async function getWorker(): Promise<Awaited<ReturnType<typeof createWorker>>> {
  if (!workerPromise) {
    workerPromise = createWorker(['chi_sim', 'eng'], 1, {
      langPath: '/ocr-lang',
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/tesseract-core-simd.wasm.js',
      logger: () => {},
    }).catch((e) => {
      workerPromise = null
      throw e
    })
  }
  return workerPromise
}

export interface OcrResult {
  text: string
  ok: boolean
}

export async function ocrImageBrowser(imageDataUrl: string): Promise<OcrResult> {
  try {
    const worker = await getWorker()
    const ret = await worker.recognize(imageDataUrl)
    return { text: ret.data.text || '', ok: true }
  } catch (e) {
    console.warn('[offline-ocr] OCR 失败:', (e as Error).message)
    return { text: '', ok: false }
  }
}

/** base64（无前缀）转 data URL */
export function toDataUrl(base64: string, mime = 'image/jpeg'): string {
  return `data:${mime};base64,${base64}`
}