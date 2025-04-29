/**
 * XSS防御演示脚本
 */

document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const userInput = document.getElementById("userInput");
  const showUnsafeBtn = document.getElementById("showUnsafe");
  const showSafeBtn = document.getElementById("showSafe");
  const unsafeOutput = document.getElementById("unsafeOutput");
  const safeOutput = document.getElementById("safeOutput");

  const richText = document.getElementById("richText");
  const showSafeHtmlBtn = document.getElementById("showSafeHtml");
  const safeHtmlOutput = document.getElementById("safeHtmlOutput");

  // 为按钮添加事件监听器
  showUnsafeBtn.addEventListener("click", () => {
    displayUnsafeContent(userInput.value);
  });

  showSafeBtn.addEventListener("click", () => {
    displaySafeContent(userInput.value);
  });

  showSafeHtmlBtn.addEventListener("click", () => {
    displaySanitizedHTML(richText.value);
  });

  // 不安全的实现（容易遭受XSS攻击）
  function displayUnsafeContent(content) {
    unsafeOutput.innerHTML = content;
  }

  // 安全的实现（防御XSS攻击）
  function displaySafeContent(content) {
    // 方法一：使用textContent（最安全，但不允许任何HTML标签）
    safeOutput.textContent = content;

    // 方法二：使用HTML转义函数
    // safeOutput.innerHTML = escapeHTML(content);
  }

  // 显示经过白名单过滤的HTML
  function displaySanitizedHTML(html) {
    safeHtmlOutput.innerHTML = sanitizeHTML(html);
  }

  // HTML转义函数
  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 安全的HTML白名单过滤函数
  function sanitizeHTML(html) {
    // 创建一个临时元素
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // 移除所有脚本元素
    const scripts = temp.querySelectorAll("script");
    scripts.forEach((script) => script.remove());

    // 移除所有危险元素
    const dangerousTags = temp.querySelectorAll(
      "iframe, object, embed, form, input, button, textarea, select, option"
    );
    dangerousTags.forEach((tag) => tag.remove());

    // 移除所有事件处理属性
    const allElements = temp.getElementsByTagName("*");
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      // 移除所有以'on'开头的属性（如onclick, onmouseover等）
      const attributes = element.attributes;
      for (let j = attributes.length - 1; j >= 0; j--) {
        const attrName = attributes[j].name;
        if (
          attrName.startsWith("on") ||
          (attrName === "href" && attributes[j].value.startsWith("javascript:"))
        ) {
          element.removeAttribute(attrName);
        }
      }
    }

    // 只允许安全的标签和属性（白名单方法）
    const safeTagsWithAttrs = {
      a: ["href", "target", "rel"],
      b: [],
      i: [],
      strong: [],
      em: [],
      u: [],
      p: [],
      br: [],
      div: [],
      span: ["style"],
      ul: [],
      ol: [],
      li: [],
      h1: [],
      h2: [],
      h3: [],
      h4: [],
    };

    // 此处可以添加更严格的过滤规则
    // 如果需要更复杂的过滤逻辑，建议使用专门的库如DOMPurify

    return temp.innerHTML;
  }

  // 更完善的方法是使用DOMPurify等库
  // 如果在实际项目中，推荐使用以下方式：
  /*
    import DOMPurify from 'dompurify';
    
    function sanitizeWithDOMPurify(html) {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'a', 'p', 'br'],
            ALLOWED_ATTR: ['href', 'target', 'rel']
        });
    }
    */
});
