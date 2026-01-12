'use server'

export async function logToServer(message: string, data?: any) {
  console.log(`[CLIENT LOG] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}
