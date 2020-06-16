var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.ListSettingsDialog = function (container, layoutDef) {
        var self = this,
            domPopup,

            //functions
            close,
            outsideAreaClick,
            show;

        close = function () {
            domPopup.remove();
        };

        show = function () {
            var i,
                column,
                cookie,
                html,
                dom,
                domTable,
                domCheckboxArray,
                domCheckbox,
                domTr,
                popupBreedte,
                popupHeight,
                nieuweWaarde,
                oudeWaarde,
                tableParent;

            popupBreedte = 250;
            popupHeight = 242;
            domPopup = $('<div class="popupPositioned"><div class="titleBar">Lijst voorkeursinstellingen</div></div>');
            domPopup.width(popupBreedte);
            domPopup.height(popupHeight);
            domPopup.css('left', ($(container).width() - (popupBreedte + 6)));
            domPopup.css('bottom', 30);

            html = '<div class="settingsDiv"><p>Zichtbare kolommen:</p><div><table></table></div><br />' +
                   '<button style="float: right; margin-right: 15px">OK</button>' +
                   '<button>Reset layout</button>' +
                   '</div>';
            dom = $(html);
            domPopup.append(dom);
            $(container).append(domPopup);
            tableParent = dom.find('div');

            dom.find('button').eq(1).click(function () {
                close();
                $(self).trigger('reset');
            });

            //opslaan
            dom.find('button').eq(0).click(function () {
                for (i = 0; i < layoutDef.columns.length; i++) {
                    column = layoutDef.columns[i];
                    domCheckbox = domCheckboxArray[i];


                    if (domCheckbox !== undefined) {
                        oudeWaarde = column.hidden;
                        nieuweWaarde = !domCheckbox.prop('checked');
                        column.hidden = nieuweWaarde;
                        if (nieuweWaarde !== oudeWaarde) {
                            cookie = jsui.Generic.Cookie(layoutDef.key);
                            if (cookie === undefined) {
                                cookie = {};
                            }
                            cookie[column.dataIndex] = { hidden: nieuweWaarde, width: column.width };
                            jsui.Generic.Cookie(layoutDef.key, cookie, { expires: 30 });
                        }
                    }
                }
                close();
                $(self).trigger('changed');
            });

            domTable = dom.find('table').eq(0);
            domCheckboxArray = [];

            for (i = 0; i < layoutDef.columns.length; i++) {
                column = layoutDef.columns[i];

                domTr = $('<tr><td><label><input  style="vertical-align: text-bottom;" type="checkbox">&nbsp;' + column.header + '</label></td></tr>');
                domCheckbox = domTr.find('input[type="checkbox"]');
                domCheckboxArray.push(domCheckbox);

                if (!column.hideable) {
                    domCheckbox.attr("disabled", "disabled");
                }

                if (column.hidden) {
                    domCheckbox.prop('checked', false);
                } else {
                    domCheckbox.prop('checked', true);
                }
                domTable.append(domTr);
            }

            domPopup.height(popupHeight - (170 - tableParent.height()));

            $(document).on("click", outsideAreaClick);
        };

        outsideAreaClick = function (event) {
            if ($(event.target).closest('.popupPositioned').length === 0) {
                close();
                $(document).off("click", outsideAreaClick);
            }
        };

        //publics
        this.show = show;
    };

}(jQuery));
