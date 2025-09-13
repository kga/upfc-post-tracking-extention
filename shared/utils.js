// Shared utility functions

export function isTargetUrl(url) {
  return /^(https:\/\/www\.upfc\.jp\/helloproject\/mypage|https:\/\/www\.upfc\.jp\/m-line\/mypage)/.test(url || "");
}