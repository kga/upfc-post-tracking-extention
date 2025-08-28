// Shared utilities to build Japan Post tracking URLs

const JP_BASE = 'https://trackings.post.japanpost.jp/services/srv/search';

export function buildJapanPostUrl(numbers) {
  const nums = Array.from(new Set(numbers)).filter(Boolean).slice(0, 10);
  const params = new URLSearchParams({
    requestNo1: nums[0] || '',
    requestNo2: nums[1] || '',
    requestNo3: nums[2] || '',
    requestNo4: nums[3] || '',
    requestNo5: nums[4] || '',
    requestNo6: nums[5] || '',
    requestNo7: nums[6] || '',
    requestNo8: nums[7] || '',
    requestNo9: nums[8] || '',
    requestNo10: nums[9] || '',
    'search.x': '104',
    'search.y': '26',
    startingUrlPatten: '',
    locale: 'ja'
  });
  return `${JP_BASE}?${params.toString()}`;
}
