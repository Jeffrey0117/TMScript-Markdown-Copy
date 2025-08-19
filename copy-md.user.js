// ==UserScript==
// @name         Copy Selected Text as Markdown Link
// @name:zh-TW   複製選取文字為 Markdown 連結
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Hold ctrl + right-click to copy selected text / link / title + URL as Markdown format
// @description:zh-TW 按住 Ctrl + 右鍵即可複製選取文字／連結／標題與網址為 Markdown 格式
// @match        *://*/*
// @grant        GM_setClipboard
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @license MIT
// ==/UserScript==
 
 
(function($) {
    'use strict';
 
    let lastSelection = "";
    let lastLink = null;
 
    // Create custom context menu
    const menu = $('<div id="mdCopyMenu">Copy as Markdown</div>').css({
        position: 'absolute',
        padding: '5px 10px',
        background: '#333',
        color: '#fff',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'none',
        zIndex: 99999
    });
 
    $('body').append(menu);
 
    // Context menu event
    $(document).on('contextmenu', function(e) {
        if (!e.ctrlKey) {
            return; // If ctrl is not pressed → keep the native context menu
        }
 
        // Capture selected text
        lastSelection = window.getSelection().toString().trim();
 
        // Check if target is inside <a>
        lastLink = e.target.closest('a');
 
        // Show custom menu
        menu.css({
            top: e.pageY + 'px',
            left: e.pageX + 'px',
            display: 'block'
        });
 
        e.preventDefault(); // Prevent native context menu (only when ctrl+right-click)
    });
 
    // Hide menu when clicking elsewhere
    $(document).on('click', function() {
        menu.hide();
    });
 
    // Handle "Copy as Markdown" click
    menu.on('click', function() {
        let url, text;
 
        if (lastLink) {
            // Case: right-click on <a>
            url = lastLink.href;
            text = lastLink.innerText.trim() || url;
        } else if (lastSelection) {
            // Case: selected text exists
            url = location.href;
            text = lastSelection;
        } else {
            // Default: use page title
            url = location.href;
            text = document.title;
        }
 
        let md = `[${text}](${url})`;
        GM_setClipboard(md);
 
        console.log('Copied: ' + md);
        menu.hide();
    });
 
})(jQuery);