/*jslint browser: true, multivar: true, single: true, white: true, this: true, for: true */

//namespace root;
var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.Selector = function (container, options) {
        var self = this,
            //cancelBlur = false,
            data = null,
            selectedIndex = -1,
            timer,
            last,
            visible = false,
            zoekveld,
			dropdownAnchor,
            resContainer,
			
			scrollIntoViewIfNeeded = function(target) {
				var rect = target.getBoundingClientRect();
				if (rect.bottom > window.innerHeight) {
					target.scrollIntoView(false);
				}
				if (rect.top < 0) {
					target.scrollIntoView();
				}
			},
			
			notInView = function(element) {
				var rect = element.getBoundingClientRect();
				console.log(rect.bottom);
				if (rect.bottom > 250) {
					return true;
				}
				return false;
			},

            init = function () {
                options = options || {};
                options.class = options.class || "";
                options.style = options.style || "";
                options.popupStyle = options.popupStyle || "";
                options.accesskey = options.accesskey || "q";
                options.placeholders = options.placeholders || "Typ om te zoeken...";
                options.limit = options.limit || false;

                var html,
                    htmlAdv,
                    getPlaceholder = function () {

                        if (typeof options.placeholders === 'string') return options.placeholders;
                        if (Array.isArray(options.placeholders)) {
                            return options.placeholders[Math.floor((Math.random() * options.placeholders.length))];
                        }
                        return 'Typ om te zoeken...';
                    };

                html = $('<div class="jsui_Generic_TextSelector' + (options.class ? ' ' + options.class + '"' : '') + '"' + (options.style ? ' style="' + options.style + '"' : '') + '>'
                    + '<input spellcheck=false placeholder="' + getPlaceholder() + '" accesskey="' + (options && options.accesskey ? options.accesskey : 'q') + '" type="text"' + (options && options.width ? ' style="width: ' + options.width + '"' : '') + ' />'
					+ '<a class="icon-zoom-inplace icon-dropdown-false"></a>'
					+ '<div class="selectorContent" style="display:none;' + (options.popupStyle && ' ' + options.popupStyle) + '"></div>'
                    + '</div>');

				dropdownAnchor = html.find('a');
                resContainer = html.find('div');
                zoekveld = html.find('input');
                $(container).append(html);

                //events
                {
					dropdownAnchor.click(function() {
						if (!visible) {
							show();
						}
						resContainer.empty();
						selectedIndex = -1;
						resContainer.append('<img src="img/loading2.gif" alt="loading...">');
						$(self).trigger('search', ['', resContainer]);
					});
					
                    zoekveld.keyup(function (event) {
                        if (timer) {
                            clearTimeout(timer);
                            timer = null;
                        }
						
                        switch (event.which) {
                            case jsui.Util.specialKeys.ENTER:
                            case jsui.Util.specialKeys.NUMPAD_ENTER:
                            case jsui.Util.specialKeys.ESCAPE:
                            case jsui.Util.specialKeys.DOWN:						
                            case jsui.Util.specialKeys.UP:
								return;
						}

                        timer = setTimeout(function () {
                            timer = null;

                            if (zoekveld.val() !== last) {
                                search();
                            }
                        }, (options && options.inputDelay ? options.inputDelay : 400));
                    });

                    zoekveld.keydown(function (event) {
                        var old;

                        switch (event.which) {
                            case jsui.Util.specialKeys.ENTER:
                            case jsui.Util.specialKeys.NUMPAD_ENTER:
                                event.preventDefault();
                                if (data && selectedIndex >= 0) {
                                    $(self).trigger('click', [data[selectedIndex], resContainer.children('div').eq(selectedIndex)]);
                                }
                                break;
                            case jsui.Util.specialKeys.ESCAPE:
                                event.preventDefault();
                                self.clear();
                                break;
                            case jsui.Util.specialKeys.DOWN:
                                event.preventDefault();
                                if (data) {
                                    old = resContainer.children('div').eq(selectedIndex);
                                    if (old)
                                        old.removeClass('selected');
                                    selectedIndex++;
                                    if (selectedIndex >= data.length)
                                        selectedIndex = data.length - 1;
                                    if (selectedIndex >= options.limit)
                                        selectedIndex = options.limit - 1;
									let newSelectedItem = resContainer.children('div').eq(selectedIndex);
                                    newSelectedItem.addClass('selected');
									//notInView(newSelectedItem[0]);
									//if (notInView(newSelectedItem[0])) {
									newSelectedItem[0].scrollIntoView(false);
									//}
                                }
                                break;
                            case jsui.Util.specialKeys.UP:
                                event.preventDefault();
                                if (data) {
                                    old = resContainer.children('div').eq(selectedIndex);
                                    if (old)
                                        old.removeClass('selected');
                                    selectedIndex--;
                                    if (selectedIndex < 0)
                                        selectedIndex = 0;
									let newSelectedItem = resContainer.children('div').eq(selectedIndex);
                                    newSelectedItem.addClass('selected');
									newSelectedItem[0].scrollIntoView(true);
                                }
                                break;
                        }
                    });

                    zoekveld.blur(clear);

                    //prevent onblur in case of a click on the results
                    resContainer.mousedown(function (e) {
                        zoekveld.off('blur');
                        //after a while we add the handler again
                        setTimeout(function () {
							zoekveld.focus();
                            zoekveld.blur(clear);
                            zoekveld.focus();
                        }, 400);
                    });
                }
            },
            show = function () {				
                resContainer.show();
                visible = true;

				if (options.fixedSelector) {
					let pos = zoekveld.offset();
					resContainer.css({position: "fixed", top: (pos.top + zoekveld.outerHeight() + 'px'), left: (pos.left + 'px')});
				} else {
					resContainer.css('top', zoekveld.outerHeight() + 'px');
				}
            },
            search = function () {
				if (options.singleItem) {
					$(self).trigger('searchInSingleItemMode');
				}
                if (zoekveld.val()) {
                    if (!visible) {
                        show();
                    }

                    resContainer.empty();
                    selectedIndex = -1;
                    resContainer.append('<img src="img/loading2.gif" alt="loading...">');

                    last = zoekveld.val();

                    $(self).trigger('search', [last, resContainer]);
                } else {
                    self.clear();
                }
            },
            clear = function () {
				$(self).trigger('beforeClear');
                data = null;
                resContainer.empty();
                resContainer.hide();
				zoekveld.val('');
				last = '';
                visible = false;
				$(self).trigger('afterClear');
            };
		
			
		this.setZoekveld = function(val) {
			zoekveld.val(val);
		};
		this.getZoekveld = function() {
			return zoekveld.val();
		};

        this.init = init;
        this.clear = clear;
        this.focus = function () {
            zoekveld.focus();
        };
        this.setData = function (newData) {
            data = newData;
        };
		this.getData = function() {
			return data;
		};
        this.refresh = search;

        init();
    };
}(jQuery));