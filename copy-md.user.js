// ==UserScript==
// @name         Copy as Markdown (Link + Full Parser)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Ctrl+右鍵 → 彈出選單，支援 Copy as Markdown Link / Copy as Markdown (完整內容解析)
// @match        *://*/*
// @grant        GM_setClipboard
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @license MIT
// ==/UserScript==

(function($) {
    'use strict';

    let lastSelection = "";
    let lastLink = null;

    // === 建立自訂選單 ===
    const menu = $('<div id="mdCopyMenu"></div>').css({
        position: 'absolute',
        padding: '5px',
        background: '#333',
        color: '#fff',
        borderRadius: '5px',
        fontSize: '14px',
        display: 'none',
        zIndex: 99999
    });

    // 選項: Copy as MDLink
    const btnLink = $('<div>Copy as MDLink</div>').css({cursor: 'pointer', padding: '3px'}).on('click', function() {
        let url, text;

        if (lastLink) {
            url = lastLink.href;
            text = lastLink.innerText.trim() || url;
        } else if (lastSelection) {
            url = location.href;
            text = lastSelection;
        } else {
            url = location.href;
            text = document.title;
        }

        let md = `[${text}](${url})`;
        GM_setClipboard(md);
        console.log("✅ 已複製 MDLink:\n" + md);
        menu.hide();
    });

    // 選項: Copy as Markdown (parser)
    const btnMD = $('<div>Copy as Markdown</div>').css({cursor: 'pointer', padding: '3px'}).on('click', function() {
        let selection = window.getSelection();
        if (!selection.rangeCount) return;

        let container = document.createElement("div");
        container.appendChild(selection.getRangeAt(0).cloneContents());
        let html = container.innerHTML;

        let md = html2md(html);
        GM_setClipboard(md, { type: "text", mimetype: "text/plain" });
        console.log("✅ 已複製 Markdown:\n\n" + md);
        menu.hide();
    });

    menu.append(btnLink).append(btnMD);
    $('body').append(menu);

    // === 事件: Ctrl+右鍵 ===
    $(document).on('contextmenu', function(e) {
        if (!e.ctrlKey) return; // 沒有 Ctrl → 保留原生右鍵選單

        lastSelection = window.getSelection().toString().trim();
        lastLink = e.target.closest('a');

        menu.css({top: e.pageY + 'px', left: e.pageX + 'px', display: 'block'});
        e.preventDefault();
    });

    // 點擊其他地方隱藏
    $(document).on('click', function() {
        menu.hide();
    });

    // === HTML → Markdown Parser ===
    function html2md(html) {
        let $dom = $("<div>").html(html);
        return parseNode($dom).trim();
    }

    function parseNode($node) {
        let md = "";

        $node.contents().each(function() {
            if (this.nodeType === 3) {
                md += this.nodeValue;
            } else if (this.nodeType === 1) {
                let $el = $(this);
                let tag = this.tagName.toLowerCase();

                if ($el.hasClass("code-toolbar") || tag === "button") return;

                switch(tag) {
                    case "blockquote":
                        md += "> " + parseNode($el).trim().replace(/\n/g, "\n> ") + "\n\n";
                        break;
                    case "pre":
                        let $code = $el.find("code").first();
                        let lang = detectLang($code);
                        let codeText = $code.text();

                        // 去除共同縮排
                        let lines = codeText.split("\n");
                        let minIndent = Math.min(...lines.filter(l => l.trim().length > 0).map(l => l.match(/^\s*/)[0].length));
                        if (isFinite(minIndent) && minIndent > 0) lines = lines.map(l => l.slice(minIndent));

                        md += "\n```" + lang + "\n" + lines.join("\n").trimEnd() + "\n```\n\n";
                        break;
                    case "a":
                        let href = $el.attr("href") || "";
                        md += `[${parseNode($el)}](${href})`;
                        break;
                    case "p": md += parseNode($el) + "\n\n"; break;
                    case "br": md += "\n"; break;
                    case "h1": md += "# " + parseNode($el) + "\n\n"; break;
                    case "h2": md += "## " + parseNode($el) + "\n\n"; break;
                    case "h3": md += "### " + parseNode($el) + "\n\n"; break;
                    case "ul":
                        $el.children("li").each(function() {
                            md += "- " + parseNode($(this)) + "\n";
                        });
                        md += "\n"; break;
                    case "ol":
                        $el.children("li").each(function(i) {
                            md += (i+1) + ". " + parseNode($(this)) + "\n";
                        });
                        md += "\n"; break;
                    default:
                        md += parseNode($el);
                }
            }
        });

        return md;
    }

    function detectLang($code) {
        if (!$code || !$code.attr("class")) return "";
        let cls = $code.attr("class");
        if (/html/i.test(cls)) return "html";
        if (/js|javascript/i.test(cls)) return "js";
        if (/css/i.test(cls)) return "css";
        if (/python/i.test(cls)) return "python";
        return "";
    }

})(jQuery);
