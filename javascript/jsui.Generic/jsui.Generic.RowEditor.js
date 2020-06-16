/*jslint browser: true, plusplus: true */

var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.RowEditor = function (layoutDef, item) {
        var self = this,
            item = item || {},
            popup,
            blanket,
            inputs = {},

            hide = function () {
                popup.remove();
                popup = undefined;

                blanket.remove();
                blanket = undefined;
            },
            show = function (isNew) {
                var i,
                    input,
                    column,
                    dom,
                    row,
                    td,
                    popupBreedte = 800,
                    popupHoogte = 30,
                    maxTableHeight = 402,
                    tableDiv,
                    editDiv,
                    title,
                    bbar,
                    getItem = function () {
                        var i,
                            column;

                        for (i = 0; i < layoutDef.columns.length; i++) {
                            column = layoutDef.columns[i];

                            if (inputs[column.dataIndex]) {
                                item[column.dataIndex] = inputs[column.dataIndex].val();
                            }
                        }
                        return item;
                    };

                for (i = 0; i < layoutDef.columns.length; i++) {
                    column = layoutDef.columns[i];
                    if (column.dataType === 'longstring') {
                        popupHoogte += 110;
                    } else {
                        popupHoogte += 30;
                    }
                }
                if (popupHoogte > maxTableHeight) {
                    popupHoogte = maxTableHeight;
                }
                popupHoogte += 90;

                blanket = $('<div id="blanket"></div>');
                title = isNew ? 'Toevoegen ' + layoutDef.title : 'Wijzig ' + layoutDef.title;
                popup = $('<div class="popupPositioned"><div class="titleBar" >' + title + '</div></div>');
                popup.width(popupBreedte);
                popup.height(popupHoogte);
                popup.css('left', (($(document).width() / 2) - (popupBreedte / 2)));
                popup.css('top', (($(document).height() / 2) - (popupHoogte / 2)));

                editDiv = $('<div class="editDiv"></div>');
                tableDiv = $('<div class="editTableDiv"></div>');
                editDiv.append(tableDiv);

                dom = $('<table><th>Kolom</th><th>Waarde</th></table>');
                for (i = 0; i < layoutDef.columns.length; i++) {
                    column = layoutDef.columns[i];

                    row = $('<tr class="datarow"><td>' + column.header + '</td><td></td></tr>');
                    td = row.find('td').eq(1);
                    dom.append(row);

                    if (column.editable && (isNew || !column.isPrimaryKey)) {
                        if (column.editRenderer) {
                            if (typeof column.editRenderer === 'function') {
                                inputs[column.dataIndex] = column.editRenderer(item[column.dataIndex], i, item, td);
                            } else if (typeof column.editRenderer === 'object') {
                                inputs[column.dataIndex] = defaultRenderer(item[column.dataIndex], i, item, td, column.editRenderer);
                            } else {
                                td.append('Invalid editRenderer');
                            }
                        } else if (column.dataType === 'longstring') {
                            input = $('<textarea style="width: 650px; height: 100px;">' + (item[column.dataIndex] || '') + '</textarea>');
                            inputs[column.dataIndex] = input;
                            td.append(input);
                        } else {
                            input = $('<input type="text" value="' + (item[column.dataIndex] || '') + '" style="' + (column.hasOwnProperty("width") ? 'width: ' + column.width + 'px;' : '') + '" />');
                            inputs[column.dataIndex] = input;
                            td.append(input);

                            td.append('<span class="errorMsg"></span>');
                            if (column.validator) {
                                td.find('input')[0].validator = column.validator;
                                td.find('input').eq(0).keyup(function (e) {
                                    if (e.keyCode == 9) {
                                        return;
                                    }
                                    var errorMsg = this.validator($(this).val());
                                    if (!errorMsg) {
                                        $(this).removeClass('error');
                                        $(this).parent().find('span.errorMsg').text('');
                                    } else {
                                        $(this).addClass('error');
                                        $(this).parent().find('span.errorMsg').text(errorMsg);
                                    };
                                });
                            }
                        }
                    } else {
                        td.text(item[column.dataIndex] || '');
                        if (column.listRenderer) {
                            if (typeof column.listRenderer === 'function') {
                                td.text(column.listRenderer(item[column.dataIndex], i, item));
                            }
                        }
                        
                    }
                }
                tableDiv.append(dom);

                bbar = $('<div class="bbar"><button>Opslaan</button><button>Annuleren</button></div>');
                editDiv.append(bbar);

                //Opslaan
                bbar.children('button').eq(0).click(function () {
                    if (!validateInputs()) {
                        return;
                    }

                    $(self).trigger('Save', getItem())
                });

                //Annuleren
                bbar.children('button:last-child').click(function () {
                    hide();
                });

                editDiv.find('input:enabled').eq(0).focus();

                popup.on('keydown', function (e) {
                    if (e.keyCode === 27) { // ESC
                        hide();
                    }
                });

                popup.append(editDiv);

                document.body.appendChild(blanket[0]);
                document.body.appendChild(popup[0]);
            },
            validateInputs = function () {
                var i,
                    column,
                    validateInput = function (column) {
                        var dom = inputs[column.dataIndex],
                            errorMsg = "";

                        if (column.hasOwnProperty("validator")) {
                            errorMsg = column.validator(dom.val());
                        }
                        if (errorMsg !== "") {
                            dom.addClass('error');
                            dom.focus();
                            dom.parent().find('span.errorMsg').text(errorMsg);
                            return false;
                        }
                        dom.removeClass('error');
                        dom.parent().find('span.errorMsg').text("");
                        return true;
                    };

                for (i = 0; i < layoutDef.columns.length; i++) {
                    column = layoutDef.columns[i];
                    if (column.hasOwnProperty('validator') && !validateInput(column)) {
                        return false;
                    }
                }
                return true;
            },
            defaultRenderer = function (value, pos, record, container, options) {
                var i,
                    obj,
                    result = $('<span><select></select></span>'),
                    sel = result.find('select');

                if (options.hasOwnProperty("emptyKey") && options.hasOwnProperty("emptyVal")) {
                    sel.append('<option value=' + options.emptyKey + '>' + options.emptyVal + '</option>');
                }

                if (options.url) {
                    $.ajax({
                        url: options.url
                    }).then(function (response) {
                        for (i = 0 ; i < response.data.length; i++) {
                            obj = response.data[i];
                            sel.append('<option value=' + obj[options.listKey] + '>' + obj[options.listVal] + '</option>');
                        }

                        if (record[options.returnKey]) {
                            sel.val(record[options.returnKey]);
                        }

                        record[options.returnKey] = sel.val();
                        if (options.returnVal) {
                            record[options.returnVal] = sel.text();
                        }

                        sel.change(function () {
                            record[options.returnKey] = $(this).find('option:selected').val();
                            value = record[options.returnKey];
                            if (options.returnVal) {
                                record[options.returnVal] = $(this).find('option:selected').text();
                            }
                            if (options.change) {
                                options.change(value, pos, record);
                            }
                        });
                    });
                } else if (options.optionList) {
                    for (i = 0; i < options.optionList.length; i++) {
                        obj = options.optionList[i];
                        sel.append('<option value="' + obj[0] + '">' + obj[1] + '</option>');
                    }

                    if (value)
                        sel.val(value);
                    else {
                        sel.val(sel.find("option:first").val());
                        record[options.returnKey] = sel.val();
                    }
                    sel.change(function () {
                        record[options.returnKey] = $(this).find('option:selected').val();
                        value = record[options.returnKey];
                        if (options.change) {
                            options.change(value, pos, record);
                        }
                    });
                }

                container.append(result);
                return sel;
            };

        //publics
        this.show = show;
        this.hide = hide;
    };
}(jQuery));
