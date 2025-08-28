// Background service worker: builds a combined Japan Post tracking URL and opens it
import { buildJapanPostUrl } from "./shared/japanpost.js";

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
        const seen = new Set();
        const out = [];

        // 1) まず拡張が生成したリンクから収集（data-upfc-post-tracking="1"）
        document
          .querySelectorAll('a[data-upfc-post-tracking="1"]')
          .forEach((a) => {
            const t = (a.textContent || "").trim();
            if (t && /^\d{11,13}$/.test(t) && !seen.has(t)) {
              seen.add(t);
              out.push(t);
            }
          });

        // 2) 見つからない/不足する場合、テキストノードを走査
        if (out.length < 10) {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
          );
          let node;
          while ((node = walker.nextNode())) {
            const p = node.parentNode;
            if (
              !p ||
              ["A", "SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(
                p.tagName
              ) ||
              p.isContentEditable
            )
              continue;
            const text = node.nodeValue || "";
            let m;
            re.lastIndex = 0;
            while ((m = re.exec(text))) {
              const digits = m[1];
              if (!seen.has(digits)) {
                seen.add(digits);
                out.push(digits);
                if (out.length >= 10) break;
              }
            }
            if (out.length >= 10) break;
          }
        }
        return out;
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
    const nums = await getNumbersFromPage(tab.id);
    console.log("[UPFC] numbers found:", nums.length, nums);
    if (!nums.length) {
      await chrome.action.setBadgeText({ text: "0", tabId: tab.id });
      await chrome.action.setBadgeBackgroundColor({ color: "#777" });
      setTimeout(
        () => chrome.action.setBadgeText({ text: "", tabId: tab.id }),
        2500
      );
      return;
    }
    const url = buildJapanPostUrl(nums);
    console.log("[UPFC] opening URL:", url);
    await chrome.tabs.create({ url });
  } catch (e) {
    console.error("[UPFC] Failed to open combined tracking:", e);
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  // Only act on target domain
  if (
    !/^(https:\/\/www\.upfc\.jp\/helloproject\/mypage|https:\/\/www\.upfc\.jp\/m-line\/mypage)/.test(
      tab.url || ""
    )
  ) {
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
    if (
      !/^(https:\/\/www\.upfc\.jp\/helloproject\/mypage|https:\/\/www\.upfc\.jp\/m-line\/mypage)/.test(
        tab.url || ""
      )
    )
      return;
    openCombinedTracking(tab);
  }
});
