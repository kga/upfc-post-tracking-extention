// Linkify 11-13 digit numbers to Japan Post tracking links on UPFC mypage
// Constraints:
// - Only pages under https://www.upfc.jp/helloproject/mypage
// - Turn plain 11-13 digit sequences into anchor tags
// - Do not alter content inside <a>, <script>, <style>, <textarea>, <input>, or contentEditable areas
// - ページ読み込み時に一度だけ走査（動的変化は監視しない）

(function () {
  const DIGIT_MIN = 11;
  const DIGIT_MAX = 13;
  const numberRe = new RegExp(
    `(?<!\\d)(\\d{${DIGIT_MIN},${DIGIT_MAX}})(?!\\d)`,
    "g"
  );

  let buildTrackingUrl = null; // will be set after dynamic import

  async function ensureBuilder() {
    if (buildTrackingUrl) return buildTrackingUrl;
    const mod = await import(chrome.runtime.getURL("shared/japanpost.js"));
    buildTrackingUrl = (num) => mod.buildJapanPostUrl([String(num)]);
    return buildTrackingUrl;
  }

  function shouldSkipNode(node) {
    if (!node) return true;
    if (node.nodeType !== Node.TEXT_NODE) return true;
    const parent = node.parentNode;
    if (!parent) return true;
    const tag = parent.tagName;
    if (!tag) return true;
    const forbidden = new Set(["A", "SCRIPT", "STYLE", "TEXTAREA"]);
    if (forbidden.has(tag)) return true;
    if (tag === "INPUT") return true;
    // Avoid contentEditable areas
    if (parent.isContentEditable) return true;
    return false;
  }

  function linkifyTextNode(textNode) {
    const text = textNode.nodeValue;
    if (!text) return;
    if (!numberRe.test(text)) {
      // Reset lastIndex for next use since regex is global
      numberRe.lastIndex = 0;
      return;
    }
    numberRe.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    while ((match = numberRe.exec(text)) !== null) {
      const [full, digits] = match;
      const start = match.index;
      const end = start + full.length;
      if (start > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
      }
      const a = document.createElement("a");
      a.href = buildTrackingUrl(digits);
      a.textContent = digits;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.dataset.upfcPostTracking = "1";
      frag.appendChild(a);
      lastIndex = end;
    }

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    if (frag.childNodes.length) {
      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  function walkAndLinkify(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldSkipNode(node)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(linkifyTextNode);
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
