// Linkify 11-13 digit numbers to Japan Post tracking links on UPFC mypage
// Constraints:
// - Only pages under https://www.upfc.jp/helloproject/mypage
// - Turn plain 11-13 digit sequences into anchor tags
// - Do not alter content inside <a>, <script>, <style>, <textarea>, <input>, or contentEditable areas
// - ページ読み込み時に一度だけ走査（動的変化は監視しない）

(function () {
  const DIGIT_MIN = 11;
  const DIGIT_MAX = 13;
  const digitRegex = new RegExp(
    `(?<!\\d)(\\d{${DIGIT_MIN},${DIGIT_MAX}})(?!\\d)`,
    "g"
  );

  let buildTrackingUrl = null; // will be set after dynamic import

  async function ensureBuilder() {
    if (buildTrackingUrl) return buildTrackingUrl;
    const module = await import(chrome.runtime.getURL("shared/japanpost.js"));
    buildTrackingUrl = (number) => module.buildJapanPostUrl([String(number)]);
    return buildTrackingUrl;
  }

  function shouldSkipNode(node) {
    if (!node) return true;
    if (node.nodeType !== Node.TEXT_NODE) return true;
    const parentElement = node.parentNode;
    if (!parentElement) return true;
    const tagName = parentElement.tagName;
    if (!tagName) return true;
    const forbiddenTags = new Set(["A", "SCRIPT", "STYLE", "TEXTAREA"]);
    if (forbiddenTags.has(tagName)) return true;
    if (tagName === "INPUT") return true;
    // Avoid contentEditable areas
    if (parentElement.isContentEditable) return true;
    return false;
  }

  function linkifyTextNode(textNode) {
    const text = textNode.nodeValue;
    if (!text) return;
    if (!digitRegex.test(text)) {
      // Reset lastIndex for next use since regex is global
      digitRegex.lastIndex = 0;
      return;
    }
    digitRegex.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    while ((match = digitRegex.exec(text)) !== null) {
      const [fullMatch, digits] = match;
      const startIndex = match.index;
      const endIndex = startIndex + fullMatch.length;
      if (startIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, startIndex)));
      }
      const anchor = document.createElement("a");
      anchor.href = buildTrackingUrl(digits);
      anchor.textContent = digits;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.dataset.upfcPostTracking = "1";
      fragment.appendChild(anchor);
      lastIndex = endIndex;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    if (fragment.childNodes.length) {
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  }

  function walkAndLinkify(rootElement) {
    const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldSkipNode(node)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);
    textNodes.forEach(linkifyTextNode);
  }

  async function init() {
    await ensureBuilder();
    walkAndLinkify(document.body);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        void init();
      },
      { once: true }
    );
  } else {
    void init();
  }
})();
