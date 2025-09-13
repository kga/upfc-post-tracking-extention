// Shared utilities to build Japan Post tracking URLs
import { TRACKING_NUMBER } from "./constants.js";

const JP_BASE = 'https://trackings.post.japanpost.jp/services/srv/search';

export function buildJapanPostUrl(numbers) {
  const uniqueNumbers = Array.from(new Set(numbers)).filter(Boolean).slice(0, TRACKING_NUMBER.MAX_BATCH_SIZE);
  const params = new URLSearchParams({
    requestNo1: uniqueNumbers[0] || '',
    requestNo2: uniqueNumbers[1] || '',
    requestNo3: uniqueNumbers[2] || '',
    requestNo4: uniqueNumbers[3] || '',
    requestNo5: uniqueNumbers[4] || '',
    requestNo6: uniqueNumbers[5] || '',
    requestNo7: uniqueNumbers[6] || '',
    requestNo8: uniqueNumbers[7] || '',
    requestNo9: uniqueNumbers[8] || '',
    requestNo10: uniqueNumbers[9] || '',
    'search.x': '104',
    'search.y': '26',
    startingUrlPatten: '',
    locale: 'ja'
  });
  return `${JP_BASE}?${params.toString()}`;
}
