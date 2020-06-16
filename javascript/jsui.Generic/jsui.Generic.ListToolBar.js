var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.ListToolBar = function (container, layoutDef) {
        var self = this,
            domRoot,
            domUpdateButton,
            domDeleteButton,

            //functions
            addItemButtons,
            removeItemButtons,
            append,
            init,
            addAlwaysVisibleItems;

        addAlwaysVisibleItems = function () {
            var domNewItem;

            if (layoutDef.canInsert) {
                domNewItem = $('<button style="margin-right: 6px;"><span class="toolbar_nieuw iconLeft">Nieuw item</span></button>');
                domRoot.append(domNewItem);

                domNewItem.click(function () {
                    $(self).trigger('newButtonClick');
                });
            }

            if (layoutDef.canUpdate) {
                domUpdateButton = $('<button disabled="disabled" style="margin-right: 6px; margin-top: 2px;"><span disabled="disabled" class="toolbar_aanpassen iconLeft">Aanpassen</span></button>');
                domRoot.append(domUpdateButton);
            }

            if (layoutDef.canDelete) {
                domDeleteButton = $('<button disabled="disabled" style="margin-right: 6px;"><span disabled="disabled" class="toolbar_verwijderen iconLeft">Verwijderen</span></button>');
                domRoot.append(domDeleteButton);
            }

            if (layoutDef.customToolbarElements && typeof layoutDef.customToolbarElements === 'function') {
                domRoot.append(layoutDef.customToolbarElements());
            }
        };

        addItemButtons = function (item) {
            if (layoutDef.canUpdate) {
                domUpdateButton.off("click");
                domUpdateButton.removeAttr("disabled");
                domUpdateButton.find('span:first').removeAttr("disabled");
                domUpdateButton.on("click", function () {
                    $(self).trigger('editButtonClick', [item]);
                });
            }
            if (layoutDef.canDelete) {
                domDeleteButton.off("click");
                domDeleteButton.removeAttr("disabled");
                domDeleteButton.find('span:first').removeAttr("disabled");
                domDeleteButton.on("click", function () {
                    $(self).trigger('deleteButtonClick', [item]);
                });
            }
            if (layoutDef.customItemToolbarElements && typeof layoutDef.customItemToolbarElements === 'function') {
                domRoot.append(layoutDef.customItemToolbarElements(item));
            }
        };

        removeItemButtons = function () {
            if (domUpdateButton) {
                domUpdateButton.attr("disabled", "disabled");
                domUpdateButton.find('span:first').attr("disabled", "disabled");
            }
            if (domDeleteButton) {
                domDeleteButton.attr("disabled", "disabled");
                domDeleteButton.find('span:first').attr("disabled", "disabled");
            }
        };

        append = function (domElement) {
            domRoot.append(domElement);
        };

        init = function () {
            domRoot = $('<span></span>');
            container.append(domRoot);
            addAlwaysVisibleItems();
        };

        this.addItemButtons = addItemButtons;
        this.removeItemButtons = removeItemButtons;
        this.append = append;

        init();
    };

}(jQuery));
