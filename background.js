// Background service worker: builds a combined Japan Post tracking URL and opens it
import { buildJapanPostUrl } from "./shared/japanpost.js";
import { isTargetUrl } from "./shared/utils.js";
import { TRACKING_NUMBER, BADGE } from "./shared/constants.js";

async function getNumbersFromPage(tabId) {
  try {
    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const DIGIT_MIN = 11;
        const DIGIT_MAX = 13;
        const re = new RegExp(
          `(?<!\\d)(\\d{${DIGIT_MIN},${DIGIT_MAX}})(?!\\d)`,
          "g"
        );
        const seenNumbers = new Set();
        const foundNumbers = [];

        // 1) まず拡張が生成したリンクから収集（data-upfc-post-tracking="1"）
        document
          .querySelectorAll('a[data-upfc-post-tracking="1"]')
          .forEach((anchor) => {
            const text = (anchor.textContent || "").trim();
            if (text && /^\d{11,13}$/.test(text) && !seenNumbers.has(text)) {
              seenNumbers.add(text);
              foundNumbers.push(text);
            }
          });

        // 2) 見つからない/不足する場合、テキストノードを走査
        if (foundNumbers.length < 10) {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
          );
          let node;
          while ((node = walker.nextNode())) {
            const parentElement = node.parentNode;
            if (
              !parentElement ||
              ["A", "SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(
                parentElement.tagName
              ) ||
              parentElement.isContentEditable
            )
              continue;
            const text = node.nodeValue || "";
            let match;
            re.lastIndex = 0;
            while ((match = re.exec(text))) {
              const digits = match[1];
              if (!seenNumbers.has(digits)) {
                seenNumbers.add(digits);
                foundNumbers.push(digits);
                if (foundNumbers.length >= TRACKING_NUMBER.MAX_BATCH_SIZE) break;
              }
            }
            if (foundNumbers.length >= 10) break;
          }
        }
        return foundNumbers;
      },
    });
    return result || [];
  } catch (e) {
    console.error("[UPFC] executeScript failed:", e);
    return [];
  }
}

async function openCombinedTracking(tab) {
  try {
    const trackingNumbers = await getNumbersFromPage(tab.id);
    console.log("[UPFC] numbers found:", trackingNumbers.length, trackingNumbers);
    if (!trackingNumbers.length) {
      await chrome.action.setBadgeText({ text: "0", tabId: tab.id });
      await chrome.action.setBadgeBackgroundColor({ color: BADGE.COLOR_INACTIVE });
      setTimeout(
        () => chrome.action.setBadgeText({ text: "", tabId: tab.id }),
        BADGE.TIMEOUT_MS
      );
      return;
    }
    const url = buildJapanPostUrl(trackingNumbers);
    console.log("[UPFC] opening URL:", url);
    await chrome.tabs.create({ url });
  } catch (e) {
    console.error("[UPFC] Failed to open combined tracking:", e);
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  // Only act on target domain
  if (!isTargetUrl(tab.url)) {
    console.log("[UPFC] click ignored: URL not matched", tab.url);
    return;
  }
  console.log("[UPFC] action clicked on", tab.url);
  openCombinedTracking(tab);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openCombinedTracking",
    title: "日本郵便 一括追跡を開く (このページ)",
    contexts: ["action"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openCombinedTracking" && tab?.id) {
    if (!isTargetUrl(tab.url)) return;
    openCombinedTracking(tab);
  }
});
