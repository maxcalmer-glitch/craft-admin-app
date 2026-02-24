const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function sendTelegramMessage(chatId: string, text: string, parseMode: string = 'HTML'): Promise<{ ok: boolean; description?: string }> {
  const body: any = { chat_id: chatId, text, parse_mode: parseMode }
  
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const result = await res.json()
  
  // If HTML parsing failed, retry without parse_mode
  if (!result.ok && parseMode === 'HTML' && result.description?.includes('parse')) {
    const retryRes = await fetch(`${API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    })
    return retryRes.json()
  }
  return result
}

export async function sendTelegramPhoto(chatId: string, photoUrl: string, caption?: string, parseMode?: string): Promise<{ ok: boolean; description?: string }> {
  const body: any = { chat_id: chatId, photo: photoUrl }
  if (caption) body.caption = caption
  if (parseMode) body.parse_mode = parseMode
  
  const res = await fetch(`${API_BASE}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const result = await res.json()
  
  // If HTML caption parsing failed, retry without parse_mode
  if (!result.ok && parseMode === 'HTML' && result.description?.includes('parse')) {
    const retryBody: any = { chat_id: chatId, photo: photoUrl }
    if (caption) retryBody.caption = caption
    const retryRes = await fetch(`${API_BASE}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(retryBody)
    })
    return retryRes.json()
  }
  return result
}

export async function sendTelegramVideo(chatId: string, videoUrl: string, caption?: string, parseMode?: string): Promise<{ ok: boolean; description?: string }> {
  const body: any = { chat_id: chatId, video: videoUrl }
  if (caption) body.caption = caption
  if (parseMode) body.parse_mode = parseMode
  
  const res = await fetch(`${API_BASE}/sendVideo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const result = await res.json()
  
  // If HTML caption parsing failed, retry without parse_mode
  if (!result.ok && parseMode === 'HTML' && result.description?.includes('parse')) {
    const retryBody: any = { chat_id: chatId, video: videoUrl }
    if (caption) retryBody.caption = caption
    const retryRes = await fetch(`${API_BASE}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(retryBody)
    })
    return retryRes.json()
  }
  return result
}
