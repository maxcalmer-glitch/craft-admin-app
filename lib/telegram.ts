const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7977206369:AAEPOmqrXxQ8aZkuSi9_AcYNNei520u_j4A'
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function sendTelegramMessage(chatId: string, text: string, parseMode: string = 'HTML'): Promise<{ ok: boolean; description?: string }> {
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode })
  })
  return res.json()
}

export async function sendTelegramPhoto(chatId: string, photoUrl: string, caption?: string): Promise<{ ok: boolean; description?: string }> {
  const res = await fetch(`${API_BASE}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' })
  })
  return res.json()
}
