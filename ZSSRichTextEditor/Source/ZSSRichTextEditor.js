/*!
 *
 * ZSSRichTextEditor v0.5.2
 * http://www.zedsaid.com
 *
 * Copyright 2014 Zed Said Studio LLC
 *
 */

var zss_editor = {};

// If we are using iOS or desktop
zss_editor.isUsingiOS = true;

// If the user is draging
zss_editor.isDragging = false;

// The current selection
zss_editor.currentSelection = null;

// The current editing image
zss_editor.currentEditingImage = null;

// The current editing link
zss_editor.currentEditingLink = null;

zss_editor.contentHeight = 0;

zss_editor.caretYPosition = 0;

// The objects that are enabled
zss_editor.enabledItems = {};

// Sets to true when extra footer gap shows and requires to hide
zss_editor.updateScrollOffset = false;

zss_editor.clearsFormatOnPaste = false;

function editor() {
    return document.getElementById('zss_editor_content');
}

function editorLog(message) {}

/**
 * The initializer function that must be called onLoad
 */
zss_editor.init = function() {

    editor().addEventListener('input', zss_editor.onInput, false);
    editor().addEventListener('focus', zss_editor.onFocus, false);
    editor().addEventListener('paste', zss_editor.onPaste, false);

    $('#zss_editor_content').on('touchend', function(e) {
        zss_editor.enabledEditingItems(e);
        var clicked = $(e.target);
        if (!clicked.hasClass('zs_active')) {
            $('img').removeClass('zs_active');
        }
    });

    $(document).on('selectionchange', function(e) {
        zss_editor.calculateEditorHeightWithCaretPosition();
        zss_editor.setScrollPosition();
        zss_editor.enabledEditingItems(e);
    });

    $(window).on('scroll', function(e) {
        zss_editor.updateOffset();
    });

    // Make sure that when we tap anywhere in the document we focus on the editor
    $(window).on('touchmove', function(e) {
        zss_editor.isDragging = true;
        zss_editor.updateScrollOffset = true;
        zss_editor.setScrollPosition();
        zss_editor.enabledEditingItems(e);
    });
    $(window).on('touchstart', function(e) {
        zss_editor.isDragging = false;
    });
    $(window).on('touchend', function(e) {
        if (zss_editor.isDragging) {
            zss_editor.isDragging = false;
        }
    });

    // Observe resizing.
    window.addEventListener('resize', resizeThrottler, false);
    var resizeTimeout;

    function resizeThrottler() {
        // ignore resize events as long as an actualResizeHandler execution is in the queue
        if (!resizeTimeout) {
            resizeTimeout = setTimeout(function() {
                resizeTimeout = null;
                zss_editor.notifyContentHeightChangeIfNeeded();
            }, 66);
        }
    }
}

zss_editor.updateOffset = function() {

    if (!zss_editor.updateScrollOffset)
        return;

    var offsetY = window.document.body.scrollTop;

    var maxOffsetY = zss_editor.getContentHeight();

    if (maxOffsetY < 0) {
        maxOffsetY = 0;
    }

    if (offsetY > maxOffsetY) {
        window.scrollTo(0, maxOffsetY);
    }

    zss_editor.setScrollPosition();
}

zss_editor.onInput = function(msg) {
    zss_editor.notifyContentHeightChangeIfNeeded();
    onInput(msg);
}

zss_editor.onFocus = function(msg) {
    onFocus(msg);
}

zss_editor.onPaste = function(event) {
    if (zss_editor.clearsFormatOnPaste) {
        event.preventDefault();
        var text = event.clipboardData.getData('text/plain').replace(/[\n\r]/g, '<br>');
        document.execCommand('insertHTML', false, text);
    }
}

zss_editor.notifyContentHeightChangeIfNeeded = function() {
    var h = Math.ceil(document.body.getBoundingClientRect().bottom);
    if (h != zss_editor.contentHeight) {
        onContentHeightChange(h);
        zss_editor.contentHeight = h;
    }
}

zss_editor.getContentHeight = function() {
    var body = document.body;
    var html = document.documentElement;
    return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight,
        html.scrollHeight, html.offsetHeight);
}

zss_editor.setScrollPosition = function() {
    var position = window.pageYOffset;
    window.location = 'scroll://' + position;
}

zss_editor.setPlaceholder = function(placeholder) {

    var editor = $('#zss_editor_content');

    //set placeHolder
    editor.attr("placeholder", placeholder);

    //set focus
    editor.focusout(function() {
        var element = $(this);
        if (!element.text().trim().length) {
            element.empty();
        }
    });

    zss_editor.notifyContentHeightChangeIfNeeded();
}

zss_editor.setFooterHeight = function(footerHeight) {
    var footer = $('#zss_editor_footer');
    footer.height(footerHeight + 'px');
}

zss_editor.getCaretYPosition = function() {
    var sel = window.getSelection();
    if (sel.rangeCount > 0) {
        var range = sel.getRangeAt(0);
        var div = document.createElement('div');
        range.collapse(false);
        range.insertNode(div);
        var topPosition = div.offsetTop;
        div.parentNode.removeChild(div);
        return topPosition;
    } else {
        return 0;
    }
}

zss_editor.isCaretYPositionAvaialable = function() {
    return window.getSelection().rangeCount > 0;
}

zss_editor.calculateEditorHeightWithCaretPosition = function() {
    if (zss_editor.isCaretYPositionAvaialable()) {
        var y = zss_editor.getCaretYPosition();
        if (y == zss_editor.caretYPosition) {
            return;
        }
        zss_editor.caretYPosition = y;

        onCaretYPositionChange(y, zss_editor.getLineHeight());
    }
}

zss_editor.getLineHeight = function() {
    var lineHeight = window.getComputedStyle(window.document.body).getPropertyValue(
        'line-height');
    return parseInt(lineHeight, 10);
}

zss_editor.backuprange = function() {
    var selection = window.getSelection();
    if (selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        zss_editor.currentSelection = {
            "startContainer": range.startContainer,
            "startOffset": range.startOffset,
            "endContainer": range.endContainer,
            "endOffset": range.endOffset
        };
    }
}

zss_editor.restorerange = function() {
    var selection = window.getSelection();
    selection.removeAllRanges();
    var range = document.createRange();
    range.setStart(zss_editor.currentSelection.startContainer, zss_editor.currentSelection
        .startOffset);
    range.setEnd(zss_editor.currentSelection.endContainer, zss_editor.currentSelection
        .endOffset);
    selection.addRange(range);
}

zss_editor.getSelectedNode = function() {
    var node, selection;
    if (window.getSelection) {
        selection = getSelection();
        node = selection.anchorNode;
    }
    if (!node && document.selection) {
        selection = document.selection
        var range = selection.getRangeAt ? selection.getRangeAt(0) : selection.createRange();
        node = range.commonAncestorContainer ? range.commonAncestorContainer :
            range.parentElement ? range.parentElement() : range.item(0);
    }
    if (node) {
        return (node.nodeName == "#text" ? node.parentNode : node);
    }
};

zss_editor.setBold = function() {
    document.execCommand('bold', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setItalic = function() {
    document.execCommand('italic', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setSubscript = function() {
    document.execCommand('subscript', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setSuperscript = function() {
    document.execCommand('superscript', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setStrikeThrough = function() {
    document.execCommand('strikeThrough', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setUnderline = function() {
    document.execCommand('underline', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setBlockquote = function() {
    document.execCommand('formatBlock', false, '<blockquote>');
    zss_editor.enabledEditingItems();
}

zss_editor.removeFormating = function() {
    document.execCommand('removeFormat', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setHorizontalRule = function() {
    document.execCommand('insertHorizontalRule', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setHeading = function(heading) {
    var current_selection = $(zss_editor.getSelectedNode());
    var t = current_selection.prop("tagName").toLowerCase();
    var is_heading = (t == 'h1' || t == 'h2' || t == 'h3' || t == 'h4' || t ==
        'h5' || t == 'h6');
    if (is_heading && heading == t) {
        var c = current_selection.html();
        current_selection.replaceWith(c);
    } else {
        document.execCommand('formatBlock', false, '<' + heading + '>');
    }

    zss_editor.enabledEditingItems();
}

zss_editor.setParagraph = function() {
    var current_selection = $(zss_editor.getSelectedNode());
    var t = current_selection.prop("tagName").toLowerCase();
    var is_paragraph = (t == 'p');
    if (is_paragraph) {
        var c = current_selection.html();
        current_selection.replaceWith(c);
    } else {
        document.execCommand('formatBlock', false, '<p>');
    }

    zss_editor.enabledEditingItems();
}

zss_editor.undo = function() {
    document.execCommand('undo', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.redo = function() {
    document.execCommand('redo', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setOrderedList = function() {
    document.execCommand('insertOrderedList', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setUnorderedList = function() {
    document.execCommand('insertUnorderedList', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setJustifyCenter = function() {
    document.execCommand('justifyCenter', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setJustifyFull = function() {
    document.execCommand('justifyFull', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setJustifyLeft = function() {
    document.execCommand('justifyLeft', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setJustifyRight = function() {
    document.execCommand('justifyRight', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setIndent = function() {
    document.execCommand('indent', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setOutdent = function() {
    document.execCommand('outdent', false, null);
    zss_editor.enabledEditingItems();
}

zss_editor.setFontFamily = function(fontFamily) {

    zss_editor.restorerange();
    document.execCommand("styleWithCSS", null, true);
    document.execCommand("fontName", false, fontFamily);
    document.execCommand("styleWithCSS", null, false);
    zss_editor.enabledEditingItems();
}

zss_editor.setTextColor = function(color) {

    zss_editor.restorerange();
    document.execCommand("styleWithCSS", null, true);
    document.execCommand('foreColor', false, color);
    document.execCommand("styleWithCSS", null, false);
    zss_editor.enabledEditingItems();
    // document.execCommand("removeFormat", false, "foreColor"); // Removes just foreColor
}

zss_editor.setBackgroundColor = function(color) {
    zss_editor.restorerange();
    document.execCommand("styleWithCSS", null, true);
    document.execCommand('hiliteColor', false, color);
    document.execCommand("styleWithCSS", null, false);
    zss_editor.enabledEditingItems();
}

// Needs addClass method

zss_editor.insertLink = function(url, title) {

    zss_editor.restorerange();
    var sel = document.getSelection();
    if (sel.toString().length != 0) {
        if (sel.rangeCount) {

            var el = document.createElement("a");
            el.setAttribute("href", url);
            el.setAttribute("title", title);

            var range = sel.getRangeAt(0).cloneRange();
            range.surroundContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    } else {
        document.execCommand("insertHTML", false, "<a href='" + url + "'>" +
            title + "</a>");
    }

    zss_editor.enabledEditingItems();
}

zss_editor.updateLink = function(url, title) {

        zss_editor.restorerange();

        if (zss_editor.currentEditingLink) {
            var c = zss_editor.currentEditingLink;
            c.attr('href', url);
            c.attr('title', title);
        }
        zss_editor.enabledEditingItems();

    } //end

zss_editor.updateImage = function(url, alt) {

        zss_editor.restorerange();

        if (zss_editor.currentEditingImage) {
            var c = zss_editor.currentEditingImage;
            c.attr('src', url);
            c.attr('alt', alt);
        }
        zss_editor.enabledEditingItems();

    } //end

zss_editor.updateImageBase64String = function(imageBase64String, alt) {

        zss_editor.restorerange();

        if (zss_editor.currentEditingImage) {
            var c = zss_editor.currentEditingImage;
            var src = 'data:image/jpeg;base64,' + imageBase64String;
            c.attr('src', src);
            c.attr('alt', alt);
        }
        zss_editor.enabledEditingItems();

    } //end


zss_editor.unlink = function() {

    if (zss_editor.currentEditingLink) {
        var c = zss_editor.currentEditingLink;
        c.contents().unwrap();
    }
    zss_editor.enabledEditingItems();
}

zss_editor.quickLink = function() {

    var sel = document.getSelection();
    var link_url = "";
    var test = new String(sel);
    var mailregexp = new RegExp("^(.+)(\@)(.+)$", "gi");
    if (test.search(mailregexp) == -1) {
        checkhttplink = new RegExp("^http\:\/\/", "gi");
        if (test.search(checkhttplink) == -1) {
            checkanchorlink = new RegExp("^\#", "gi");
            if (test.search(checkanchorlink) == -1) {
                link_url = "http://" + sel;
            } else {
                link_url = sel;
            }
        } else {
            link_url = sel;
        }
    } else {
        checkmaillink = new RegExp("^mailto\:", "gi");
        if (test.search(checkmaillink) == -1) {
            link_url = "mailto:" + sel;
        } else {
            link_url = sel;
        }
    }

    var html_code = '<a href="' + link_url + '">' + sel + '</a>';
    zss_editor.insertHTML(html_code);
}

zss_editor.prepareInsert = function() {
    zss_editor.backuprange();
}

zss_editor.insertImage = function(url, alt) {
    zss_editor.restorerange();
    var html = '<img src="' + url + '" alt="' + alt + '" />';
    zss_editor.insertHTML(html);
    zss_editor.enabledEditingItems();
}

zss_editor.insertImageBase64String = function(imageBase64String, alt) {
    zss_editor.restorerange();
    var html = '<img src="data:image/jpeg;base64,' + imageBase64String +
        '" alt="' + alt + '" />';
    zss_editor.insertHTML(html);
    zss_editor.enabledEditingItems();
}

zss_editor.setHTML = function(html) {
    var editor = $('#zss_editor_content');
    editor.html(html);
    zss_editor.notifyContentHeightChangeIfNeeded();
}

zss_editor.insertHTML = function(html) {
    document.execCommand('insertHTML', false, html);
    zss_editor.enabledEditingItems();
}

zss_editor.getHTML = function() {

    // Images
    var img = $('img');
    if (img.length != 0) {
        $('img').removeClass('zs_active');
        $('img').each(function(index, e) {
            var image = $(this);
            var zs_class = image.attr('class');
            if (typeof(zs_class) != "undefined") {
                if (zs_class == '') {
                    image.removeAttr('class');
                }
            }
        });
    }

    // Blockquote
    var bq = $('blockquote');
    if (bq.length != 0) {
        bq.each(function() {
            var b = $(this);
            if (b.css('border').indexOf('none') != -1) {
                b.css({
                    'border': ''
                });
            }
            if (b.css('padding').indexOf('0px') != -1) {
                b.css({
                    'padding': ''
                });
            }
        });
    }

    // Get the contents
    var h = document.getElementById("zss_editor_content").innerHTML;

    return h;
}

zss_editor.getText = function() {
    return $('#zss_editor_content').text();
}

zss_editor.isCommandEnabled = function(commandName) {
    return document.queryCommandState(commandName);
}

zss_editor.enabledEditingItems = function(e) {

    console.log('enabledEditingItems');
    var items = [];
    if (zss_editor.isCommandEnabled('bold')) {
        items.push('bold');
    }
    if (zss_editor.isCommandEnabled('italic')) {
        items.push('italic');
    }
    if (zss_editor.isCommandEnabled('subscript')) {
        items.push('subscript');
    }
    if (zss_editor.isCommandEnabled('superscript')) {
        items.push('superscript');
    }
    if (zss_editor.isCommandEnabled('strikeThrough')) {
        items.push('strikeThrough');
    }
    if (zss_editor.isCommandEnabled('underline')) {
        items.push('underline');
    }
    if (zss_editor.isCommandEnabled('insertOrderedList')) {
        items.push('orderedList');
    }
    if (zss_editor.isCommandEnabled('insertUnorderedList')) {
        items.push('unorderedList');
    }
    if (zss_editor.isCommandEnabled('justifyCenter')) {
        items.push('justifyCenter');
    }
    if (zss_editor.isCommandEnabled('justifyFull')) {
        items.push('justifyFull');
    }
    if (zss_editor.isCommandEnabled('justifyLeft')) {
        items.push('justifyLeft');
    }
    if (zss_editor.isCommandEnabled('justifyRight')) {
        items.push('justifyRight');
    }
    if (zss_editor.isCommandEnabled('insertHorizontalRule')) {
        items.push('horizontalRule');
    }
    var formatBlock = document.queryCommandValue('formatBlock');
    if (formatBlock.length > 0) {
        items.push(formatBlock);
    }
    // Images
    $('img').bind('touchstart', function(e) {
        $('img').removeClass('zs_active');
        if (zss_editor.isContentEditable()) {
            $(this).addClass('zs_active');
        }
    });

    // Use jQuery to figure out those that are not supported
    if (typeof(e) != "undefined") {

        // The target element
        var s = zss_editor.getSelectedNode();
        var t = $(s);
        var nodeName = e.target.nodeName.toLowerCase();

        // Background Color
        var bgColor = t.css('backgroundColor');
        if (typeof(bgColor) != "undefined" && bgColor.length != 0 && bgColor !=
            'rgba(0, 0, 0, 0)' && bgColor != 'rgb(0, 0, 0)' && bgColor !=
            'transparent') {
            items.push('backgroundColor');
        }
        // Text Color
        var textColor = t.css('color');
        if (typeof(textColor) != "undefined" && textColor.length != 0 &&
            textColor != 'rgba(0, 0, 0, 0)' && textColor != 'rgb(0, 0, 0)' &&
            textColor != 'transparent') {
            items.push('textColor');
        }

        //Fonts
        var font = t.css('font-family');
        if (typeof(font) != "undefined" && font.length != 0 && font !=
            'Arial, Helvetica, sans-serif') {
            items.push('fonts');
        }

        // Link
        if (nodeName == 'a') {
            zss_editor.currentEditingLink = t;
            var title = t.attr('title');
            items.push('link:' + t.attr('href'));
            if (t.attr('title') !== undefined) {
                items.push('link-title:' + t.attr('title'));
            }

        } else {
            zss_editor.currentEditingLink = null;
        }
        // Blockquote
        if (nodeName == 'blockquote') {
            items.push('indent');
        }
        // Image
        if (nodeName == 'img') {
            zss_editor.currentEditingImage = t;
            items.push('image:' + t.attr('src'));
            if (t.attr('alt') !== undefined) {
                items.push('image-alt:' + t.attr('alt'));
            }
        } else {
            zss_editor.currentEditingImage = null;
        }
    }

    if (items.length > 0) {
        if (zss_editor.isUsingiOS) {
            //window.location = "zss-callback/"+items.join(',');
            window.location = "callback://0/" + items.join(',');
        } else {
            console.log("callback://" + items.join(','));
        }
    } else {
        if (zss_editor.isUsingiOS) {
            window.location = "zss-callback/";
        } else {
            console.log("callback://");
        }
    }
}

zss_editor.focusEditor = function() {
    editorLog("FOCUS");
    if (!zss_editor.isContentEditable()) {
        return;
    }
    var range = document.createRange();
    range.selectNodeContents(editor());
    range.collapse(false);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    editor().focus();
};

zss_editor.blurEditor = function() {
    editor().blur();
}

zss_editor.setCustomCSS = function(customCSS) {
    document.getElementsByTagName('style')[0].innerHTML = customCSS;
}

zss_editor.setContentEditable = function(editable) {
    editor().contentEditable = editable;
}

zss_editor.isContentEditable = function() {
    return editor().contentEditable == 'true';
}
