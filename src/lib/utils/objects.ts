// Clone an onbject deeply
export function cloneObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
// Clone an array deeply
export function cloneArray<T>(arr: T[]): T[] {
  return JSON.parse(JSON.stringify(arr))
}
export function isObject(objValue: unknown): boolean {
  return (
    objValue !== null && typeof objValue === 'object' && (objValue as Record<string, unknown>).constructor === Object
  )
}
