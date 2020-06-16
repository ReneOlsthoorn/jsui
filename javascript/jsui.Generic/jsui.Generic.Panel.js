var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.Panel = function (div, titlehtml, canFold, isFullHeight) {
        var self = this,
            panel = $(div),
            title,          //jquery DOM
            closedTitle,    //jquery DOM
            afterTitle,     //jquery DOM
            titleDiv,       //jquery DOM

            //functions
            togglePanel,
            openPanel,
            closePanel,
            setTitle,
            setAfterTitle,
            setClosedTitle,
            drawTitle,
            init,
            getStatus,
            getContentDiv;

        canFold = canFold !== false;
        title = $('<span>' + titlehtml + '</span>');
        closedTitle = $('<span>' + titlehtml + '</span>');
        afterTitle = $('<span></span>');

        init = function () {
            var panelContent;

            panelContent = $(div).children().detach();
            panel.addClass('GUIpanel');
            if (isFullHeight) {
                panel.addClass('full');
            }
            panel.append('<div class="title"> </div><div class="content"></div>');
            panel.find('div.content').eq(0).append(panelContent);

            titleDiv = panel.find('div.title').eq(0);
            titleDiv.prepend(title);
            titleDiv.append(afterTitle);

            if (canFold) {
                panel.find('div.title').after('<div class="showhidebutton"></div>');
                panel.find('div.title').click(togglePanel);
                panel.find('div.showhidebutton').click(togglePanel);
                panel.find('div.title').addClass('closeable');
            }
        };

        getContentDiv = function () {
            return panel.find('div.content')[0];
        };

        togglePanel = function () {
            if (!panel.hasClass('collapsed')) {
                closePanel();
            } else {
                openPanel();
            }
        };

        openPanel = function () {
            panel.removeClass('collapsed');
            drawTitle();
            $(self).trigger('afterOpenClose');
        };

        closePanel = function () {
            panel.addClass('collapsed');
            drawTitle();
            $(self).trigger('afterOpenClose');
        };

        getStatus = function () {
            return panel.hasClass('collapsed') ? 'closed' : 'open';
        };

        setClosedTitle = function (value) {
            closedTitle.html(value);
        };

        setTitle = function (value) {
            title.html(value);
        };

        setAfterTitle = function (value) {
            afterTitle.html(value);
        };

        drawTitle = function () {
            if (getStatus() === 'closed') {
                titleDiv.find('span').first().detach();
                titleDiv.prepend(closedTitle);
            } else {
                titleDiv.find('span').first().detach();
                titleDiv.prepend(title);
            }
        };

        //public methods
        this.toggle = togglePanel;
        this.open = openPanel;
        this.close = closePanel;
        this.setTitle = setTitle;
        this.setAfterTitle = setAfterTitle;
        this.setClosedTitle = setClosedTitle;
        this.getContentDiv = getContentDiv;
        this.css = function (key, val) {
            panel.css(key, val);
        };        
        this.getStatus = getStatus;
        this.getDomElement = function () {
            return panel[0];
        }

        init();
    };
}(jQuery));
