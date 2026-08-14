/** 离线 API 请求类型 */
export interface ApiRequest {
  method: string
  pathname: string
  query: URLSearchParams
  body: Record<string, unknown> | null
  params: Record<string, string>
}

export type Handler = (req: ApiRequest) => Promise<Response> | Response