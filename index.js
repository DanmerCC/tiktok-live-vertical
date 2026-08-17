import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';

const USERNAME = process.env.TIKTOK_USERNAME ?? 'demuestrenlopues';
const SIGN_API_KEY = process.env.TIKTOK_SIGN_API_KEY ?? '';

const connection = new TikTokLiveConnection(USERNAME, {
  enableExtendedGiftInfo: false,
  ...(SIGN_API_KEY ? { signApiKey: SIGN_API_KEY } : {}),
});

connection.on(ControlEvent.CONNECTED, (state) => {
  console.log(`Conectado al live de ${USERNAME} (roomId: ${state.roomId})`);
});

connection.on(WebcastEvent.CHAT, (data) => {
  const nickname = data.user?.nickname ?? data.user?.uniqueId ?? 'desconocido';
  console.log(`[CHAT] ${nickname}: ${data.comment}`);
});

connection.on(WebcastEvent.GIFT, (data) => {
  const nickname = data.user?.nickname ?? data.user?.uniqueId ?? 'desconocido';
  const giftName = data.giftDetails?.giftName ?? data.extendedGiftInfo?.name ?? `giftId ${data.giftId}`;
  const giftType = data.giftDetails?.giftType;
  if (giftType === 1 && !data.repeatEnd) return;
  console.log(`[GIFT] ${nickname} envio "${giftName}" x${data.repeatCount}`);
});

connection.on(WebcastEvent.MEMBER, (data) => {
  const nickname = data.user?.nickname ?? data.user?.uniqueId ?? 'desconocido';
  console.log(`[JOIN] ${nickname} se unio al live (viewers: ${data.memberCount})`);
});

connection.on(WebcastEvent.LIKE, (data) => {
  const nickname = data.user?.nickname ?? data.user?.uniqueId ?? 'desconocido';
  console.log(`[LIKE] ${nickname} dio like (total: ${data.totalLikeCount})`);
});

connection.on(WebcastEvent.SOCIAL, (data) => {
  const nickname = data.user?.nickname ?? data.user?.uniqueId ?? 'desconocido';
  const accion = data.action === 'follow' ? 'siguio al streamer' : `compartio el live (${data.action})`;
  console.log(`[SOCIAL] ${nickname} ${accion}`);
});

connection.on(WebcastEvent.ROOM_USER, (data) => {
  const viewers = data.total ?? data.viewerCount;
  console.log(`[VIEWERS] ${viewers} espectadores`);
});

connection.on(WebcastEvent.STREAM_END, () => {
  console.log('El live ha terminado.');
  connection.disconnect();
  process.exit(0);
});

connection.on(ControlEvent.DISCONNECTED, ({ code, reason }) => {
  console.log(`Desconectado (code: ${code})${reason ? ` - ${reason}` : ''}`);
  process.exit(0);
});

connection.on(ControlEvent.ERROR, ({ info, exception }) => {
  console.error(`[ERROR] ${info}${exception ? `: ${exception.message ?? exception}` : ''}`);
});

async function main() {
  try {
    await connection.connect();
  } catch (err) {
    console.error(`No se pudo conectar al live de ${USERNAME}:`, err.message ?? err);
    process.exit(1);
  }
}

main();

process.on('SIGINT', async () => {
  await connection.disconnect();
  process.exit(0);
});