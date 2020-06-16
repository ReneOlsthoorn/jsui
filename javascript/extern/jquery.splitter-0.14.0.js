/*! 
* JQuery Spliter Plugin 
* Copyright (C) 2010-2013 Jakub Jankiewicz <http://jcubic.pl> 
* 
* This program is free software: you can redistribute it and/or modify 
* it under the terms of the GNU Lesser General Public License as published by 
* the Free Software Foundation, either version 3 of the License, or 
* (at your option) any later version. 
* 
* This program is distributed in the hope that it will be useful, 
* but WITHOUT ANY WARRANTY; without even the implied warranty of 
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the 
* GNU Lesser General Public License for more details. 
* 
* You should have received a copy of the GNU Lesser General Public License 
* along with this program.  If not, see <http://www.gnu.org/licenses/>. 
*/
(function ($, undefined) {
    var count = 0;
    var splitter_id = null;
    var splitters = [];
    var current_splitter = null;
    $.fn.split = function (options) {
        function get_position(pos) {
            if (typeof pos === "number") {
                return pos;
            } else {
                if (typeof pos === "string") {
                    var match = pos.match(/^([0-9\.]+)(px|%)$/);
                    if (match) {
                        if (match[2] === "px") {
                            return +match[1];
                        } else {
                            if (settings.orientation == "vertical") {
                                return Math.max(self.width(), 100) * +match[1] / 100;
                            } else if (settings.orientation == "horizontal") {
                                return Math.max(self.height(), 100) * +match[1] / 100;
                            }
                        }
                    }
                }
            }
        }
        var data = this.data("splitter");
        if (data) {
            return data;
        }
        var panel_1;
        var panel_2;
        var panel_3 = null;
        var settings = $.extend({
            limit: 100,
            orientation: "horizontal",
            position: "50%",
            onDragStart: $.noop,
            onDragEnd: $.noop,
            onDrag: $.noop
        }, options || {});
        this.settings = settings;
        var cls;
        var children = this.children();
        if (settings.orientation == "vertical") {
            panel_1 = children.first().addClass("left_panel");
            panel_2 = panel_1.next().addClass("right_panel");
            /* Hack: hebben we een derde element, dan zien we die als een alternatief voor de rechterkant. */
            if (panel_2.next().length > 0) {
                panel_3 = panel_2.next().addClass("right_panel");
            }
            cls = "vsplitter";
        } else {
            if (settings.orientation == "horizontal") {
                panel_1 = children.first().addClass("top_panel");
                panel_2 = panel_1.next().addClass("bottom_panel");
                cls = "hsplitter";
            }
        }
        var width = this.width();
        var height = this.height();
        var id = count++;
        this.addClass("splitter_panel");
        var splitter = $("<div/>").addClass(cls).mouseenter(function () {
            splitter_id = id;
        }).mouseleave(function () {
            splitter_id = null;
        }).insertAfter(panel_1);

        var self = $.extend(this, {
            refresh: function () {
                var new_width = this.width();
                var new_height = this.height();
                if (width != new_width || height != new_height) {
                    width = this.width();
                    height = this.height();
                    self.position(self.position());
                }
            },
            position: function () {
                if (settings.orientation == "vertical") {
                    return function (n, silent) {
                        if (n === undefined) {
                            return Math.round(100 / Math.max(self.width(), 100) * panel_1.width(), 2) + '%';
                        } else {
                            var width1,
                                pos = get_position(n),
                                sw = splitter.width(),
                                totalWidth = Math.max(self.width(), 100);

                            if (pos >= totalWidth) {
                                width1 = 100;
                                splitter.css('display', 'none');
                            } else if (pos <= 0) {
                                width1 = 0;
                                splitter.css('display', 'none');
                            } else {
                                width1 = 100 / (totalWidth - sw) * (pos - sw);
                                splitter.css('display', 'block');
                            }

                            pw = panel_1.width(width1 + '%').outerWidth();
                            if ($(panel_2).css('display') !== 'none') {
                                panel_2.width((100 - width1) + '%');
                            }
                            if (panel_3 != null) {
                                if ($(panel_3).css('display') !== 'none') {
                                    panel_3.width((100 - width1) + '%');
                                }
                            }
                            splitter.css("left", width1 + '%');
                            splitter.css("margin-left", -2 + 'px');
                        }
                        if (!silent) {
                            self.find(".splitter_panel").trigger("splitter.resize");
                        }
                        return self;
                    };
                } else {
                    if (settings.orientation == "horizontal") {
                        return function (n, silent) {
                            if (n === undefined) {
                                return Math.round(100 / Math.max(self.height(), 100) * panel_1.height(), 2) + '%';
                            } else {
                                var height1,
                                    pos = get_position(n),
                                    sw = splitter.height(),
                                    totalHeight = Math.max(self.height(), 100);

                                if (pos >= totalHeight) {
                                    height1 = 100;
                                    splitter.css('display', 'none');
                                } else if (pos <= 0) {
                                    height1 = 0;
                                    splitter.css('display', 'none');
                                } else {
                                    height1 = 100 / (totalHeight - sw) * (pos - sw);
                                    splitter.css('display', 'block');
                                }

                                panel_1.height(height1 + '%');
                                panel_2.height((100 - height1) + '%');
                                splitter.css("top", height1 + '%');
                                splitter.css("margin-top", -2 + 'px');
                            }
                            if (!silent) {
                                self.find(".splitter_panel").trigger("splitter.resize");
                            }
                            return self;
                        };
                    } else {
                        return $.noop;
                    }
                }
            }(),
            orientation: settings.orientation,
            limit: settings.limit,
            isActive: function () {
                return splitter_id === id;
            },
            destroy: function () {
                self.removeClass("splitter_panel");
                splitter.unbind("mouseenter");
                splitter.unbind("mouseleave");
                if (settings.orientation == "vertical") {
                    panel_1.removeClass("left_panel");
                    panel_2.removeClass("right_panel");
                } else {
                    if (settings.orientation == "horizontal") {
                        panel_1.removeClass("top_panel");
                        panel_2.removeClass("bottom_panel");
                    }
                }
                self.unbind("splitter.resize");
                self.find(".splitter_panel").trigger("splitter.resize");
                splitters[id] = null;
                splitter.remove();
                var not_null = false;
                var i = splitters.length;
                for (; i--;) {
                    if (splitters[i] !== null) {
                        not_null = true;
                        break;
                    }
                }
                $(document.documentElement).unbind(".splitter");
                self.data("splitter", null);
                splitters = [];
                count = 0;
            }
        });
        self.bind("splitter.resize", function (e) {
            var pos = self.position();
            if (self.orientation == "vertical" && pos > self.width()) {
                pos = self.width() - self.limit - 1;
            } else if (self.orientation == "horizontal" && pos > self.height()) {
                pos = self.height() - self.limit - 1;
            }
            if (pos < self.limit) {
                pos = self.limit + 1;
            }
            self.position(pos, true);
        });
        var pos;
        if (settings.orientation == "vertical") {
            if (pos > width - settings.limit) {
                pos = width - settings.limit;
            } else {
                pos = get_position(settings.position);
            }
        } else {
            if (settings.orientation == "horizontal") {
                if (pos > height - settings.limit) {
                    pos = height - settings.limit;
                } else {
                    pos = get_position(settings.position);
                }
            }
        }
        if (pos < settings.limit) {
            pos = settings.limit;
        }
        self.position(pos, true);
        if (splitters.length == 0) {
            $(document.documentElement).bind("mousedown.splitter", function (e) {
                if (splitter_id !== null && e.which == 1) {
                    current_splitter = splitters[splitter_id];
                    $('<div class="splitterMask"></div>').css("cursor", splitter.css("cursor")).insertAfter(current_splitter);
                    current_splitter.settings.onDragStart(e);
                    return false;
                }
            }).bind("mouseup.splitter", function (e) {
                if (current_splitter) {
                    $(".splitterMask").remove();
                    current_splitter.settings.onDragEnd(e);
                    current_splitter = null;
                }
            }).bind("mousemove.splitter", function (e) {
                if (current_splitter !== null) {
                    var limit = current_splitter.limit;
                    var offset = current_splitter.offset();
                    if (current_splitter.orientation == "vertical") {
                        var x = e.pageX - offset.left;
                        if (x <= current_splitter.limit) {
                            x = current_splitter.limit + 1;
                        } else {
                            if (x >= current_splitter.width() - limit) {
                                x = current_splitter.width() - limit - 1;
                            }
                        }
                        if (x > current_splitter.limit && x < current_splitter.width() - limit) {
                            current_splitter.position(x, true);
                            current_splitter.find(".splitter_panel").trigger("splitter.resize");
                            e.preventDefault();
                        }
                    } else {
                        if (current_splitter.orientation == "horizontal") {
                            var y = e.pageY - offset.top;
                            if (y <= current_splitter.limit) {
                                y = current_splitter.limit + 1;
                            } else {
                                if (y >= current_splitter.height() - limit) {
                                    y = current_splitter.height() - limit - 1;
                                }
                            }
                            if (y > current_splitter.limit && y < current_splitter.height() - limit) {
                                current_splitter.position(y, true);
                                current_splitter.find(".splitter_panel").trigger("splitter.resize");
                                e.preventDefault();
                            }
                        }
                    }
                    current_splitter.settings.onDrag(e);
                }
            });
        }
        splitters.push(self);
        self.data("splitter", self);
        return self;
    };
})(jQuery);
