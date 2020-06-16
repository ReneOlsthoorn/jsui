/*jslint browser: true, plusplus: true, regexp: true */

//namespace root;
var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Selector = function (container, title, searchUri, nameUri, options) {
        var self = this,
            timer = null,
            lastZoekvraag = '',
            popup,

            inputDelay,
            limit,
            seperator,
            useSl,
            prefix,
            inputWidth,
            resultNewline,
            selectSingleItem,
            hasImageUrl,
            removePlusImage,
            retrievedData = [], // Dit is een schaduw lijst van de items die doorlopen worden. Items die niet meer in de lijst staan worden verwijderd.
            extraNrItems = 50,  // aantal items dat extra wordt geladen
            eindeNietInZicht = false, // Moeten we een poging wagen om extraNrItems te verhogen en opnieuw te laden?

            selectionCounter = -1,

            divSelectie,
            inputZoekveld,
            divZoekResultaat,       //jquery dom
            blanket,                //jquery dom

            init,                   //function
            clear,                  //function
            removeZoekResultaten,   //function
            addList,                //function
            createPopup,            //function
            contains,               //function
            add,                    //function
            repositionSelectieVlak, //function
            remove,                 //function
            zoek,                   //function
            getItems,               //function
            getValue,               //function
            removeItemFromList,     //function
            loadData,               //function
            recompleteList,         //function
            keyDownImpl,            //function
            keyDown;                //function

        inputDelay = (options && options.inputDelay) || 300;
        limit = (options && options.limit) || 20;
        seperator = (options && options.seperator) || '';
        useSl = (options && options.useSl === true) || false;
        prefix = options && options.hasOwnProperty('prefix') ? options.prefix : 'Zoek:&nbsp;';
        inputWidth = options && options.hasOwnProperty('inputWidth') ? options.inputWidth : null;
        resultNewline = options && options.hasOwnProperty('resultNewline') ? options.resultNewline : false;
        selectSingleItem = options && options.hasOwnProperty('selectSingleItem') ? options.selectSingleItem : false;
        hasImageUrl = (options && options.hasOwnProperty('imageUrl'));
        removePlusImage = (options && (options.hasOwnProperty('removePlusImage') || hasImageUrl));

        init = function () {
            var dom, domStr;            
            domStr = '<div><div></div>' + prefix + '<input type="text"' + (inputWidth ? ' style="width: ' + inputWidth + '"' : '') + ' />';
            if (!selectSingleItem) {
            	domStr += '<br clear="all" />';
            }
            domStr += '</div>'
            dom = $(domStr);

            blanket = $('<div style="z-index: 99; position: absolute;top: 0;left: 0;width: 100%;height: 100%;"></div>');

            divSelectie = dom.find('div')[0];
            inputZoekveld = dom.find('input')[0];

            divZoekResultaat = $('<div style="z-index: 100; position: absolute;background-color: White;border: 1px solid #9CBAEF;" />');

            $(container).css('position', 'relative');
            $(container).append(dom);

            $(inputZoekveld).keyup(zoek);
            $(inputZoekveld).keydown(keyDown);
        };


        addList = function (container, data, isPopup, limit) {
            var i,
                item,
                html,
                clickFunc,
                aantalToegevoegd = 0;

            clickFunc = function () {
                add(this.item);
                if (isPopup) {
                    popup.close();
                }
                if (selectSingleItem) {
                	removeZoekResultaten();
                	$(inputZoekveld).hide();
                }
            };

            if (data.length > 0) {

                if (limit > 1000) {
                    alert('Er zijn meer dan 1000 resultaten. De eerste 1000 gaan getoond worden. Mocht uw resultaat er niet tussen zitten, verfijn dan uw zoekopdracht.');
                    limit = 1000;
                }

                for (i = 0; i < data.length; i++) {
                    if (aantalToegevoegd == limit) { break;}

                    item = data[i];

                    if (contains(item)) {
                        if (retrievedData.indexOf(item) !== -1) {
                            retrievedData.splice(retrievedData.indexOf(item), 1);
                        }
                        continue;
                    }
                    
                    var imageUrl = "";
                    if (item.image_id && hasImageUrl) {
                        imageUrl = '<img src="' + options.imageUrl + item.image_id.replace(/:/g,"_") + '.jpg" style="max-width: 60px; max-height: 60px; float: right; display:inline-block; vertical-align:middle" />';
                    }

                    var theHtml = '<div class="selectionLine" style="vertical-align: middle; height: ' + (hasImageUrl ? '60' : '17') + 'px;' + (hasImageUrl ? ' border-bottom: 1px solid #DDDDDD;' : '') + ' cursor: pointer; ">'
                    + (removePlusImage ? '' : '<span style="vertical-align: middle"><img style="vertical-align: middle; cursor: pointer" src="/img/jsui.Generic/LUID/icon_add.gif"></span>')
                    + '<p style="display:inline-block; vertical-align:middle; padding-top: ' + (hasImageUrl ? '20' : '0') + 'px; padding-left: 2px">' + (useSl ? '' : item.codeHighlight + ': ') + item.nmHighlight
                    + (hasImageUrl ? ('<br/>' + item.regel2) : '') + '</p>'
                	+ imageUrl
                    + '</div>'
                    html = $(theHtml);
                    html[0].item = item;
                    html.click(clickFunc);
                    $(container).append(html);
                    aantalToegevoegd++;
                }
                if ((aantalToegevoegd < limit) && eindeNietInZicht) {
                    divZoekResultaat.empty();
                    extraNrItems = extraNrItems + 10;
                    loadData(true);
                } else if (aantalToegevoegd == 0) {
                    $(container).append('Geen resultaten.');
                }
            } else {
                $(container).append('Geen resultaten.');
            }
        };


        loadData = function (geenKeyDown) {
            doRequest(searchUri + encodeURIComponent(inputZoekveld.value) + '&limit=' + (limit + extraNrItems + 1), function (response) {
                var html;
                retrievedData = [];
                eindeNietInZicht = (response.length == (limit + extraNrItems + 1));
                divZoekResultaat.empty();
                retrievedData = response.slice(0);  // retrievedData moet een nieuwe collectie worden, want we verwijderen items eruit terwijl we door de collectie lopen.
                addList(divZoekResultaat[0], response, false, limit);

                if (retrievedData.length > limit) {
                    divZoekResultaat.append('Er zijn meer resultaten dan worden weergegeven.<br />Specificeer uw zoekvraag, of bekijk de <a href="javascript:void(0)">hele lijst</a>.');
                    divZoekResultaat.find('a').click(function () {
                        createPopup(inputZoekveld.value);
                        removeZoekResultaten();
                        return false;
                    });
                }
                html = $('<div class="closeIcon">');
                html.click(removeZoekResultaten);
                divZoekResultaat.append(html);
                //if (geenKeyDown === undefined) {
                //    keyDownImpl();
                //}
            });
        };


        createPopup = function (q) {
            var popupDiv,
                width,
                height;

            width = 600;
            height = $(document.body).height() - 100;

            popup = new jsui.Generic.Popup(width, height, title);
            popupDiv = popup.getPopupDiv();

            doRequest(searchUri + q + '&limit=1001', function (response) {
                retrievedData = [];
                var div = $('<div style="overflow: auto; height: ' + height + 'px">');
                retrievedData = response.slice(0);  // retrievedData moet een nieuwe collectie worden, want we verwijderen items eruit terwijl we door de collectie lopen.
                eindeNietInZicht = false; // Als we 1000 items laden, dan gaan we niet extra items onderin de lijst toevoegen bij het verwijderen.
                addList(div[0], response, true);
                $(popupDiv).append(div);
            });
        };


        contains = function (item) {
            return $(divSelectie).find('span').filter(function () {
                if (item.sl === undefined && this.item.sl === undefined) {
                    return false;
                }
                return this.item.sl === item.sl;
            }).length > 0;
        };


        removeItemFromList = function (item) {
            if (retrievedData.indexOf(item) !== -1) {
                retrievedData.splice(retrievedData.indexOf(item), 1);
            }
        };


        recompleteList = function () {
            divZoekResultaat.empty();

            if ((retrievedData.length == limit) && eindeNietInZicht) {
                extraNrItems = extraNrItems + 10;
                loadData(true);
                return;
            }

            addList(divZoekResultaat[0], retrievedData.slice(0), false, limit);

            if (retrievedData.length > limit) {
                divZoekResultaat.append('Er zijn meer resultaten dan worden weergegeven.<br />Specificeer uw zoekvraag, of bekijk de <a href="javascript:void(0)">hele lijst</a>.');
                divZoekResultaat.find('a').click(function () {
                    createPopup(inputZoekveld.value);
                    removeZoekResultaten();
                    return false;
                });
            }
            var html = $('<div class="closeIcon">');
            html.click(removeZoekResultaten);
            divZoekResultaat.append(html);
        };


        add = function (item) {
            var span;

            if (item && !contains(item)) {
                if (item.nm) {
                    span = $('<span' + (resultNewline ? ' style="display: block"' : '') + ' title="' + item.nm + '" class="deleteButton">' + (useSl ? item.nm : item.code) + '</span>');
                    span.eq(0).click(function () {
                        remove(this.item);
                    });
                    span[0].item = item;
                } else {
                    span = $('<span' + (resultNewline ? ' style="display: block"' : '') + ' class="deleteButton">' + (useSl ? item.nm : item.code) + '</span>');
                    span.eq(0).click(function () {
                        remove(this.item);
                    });
                    span[0].item = item;

                    $.ajax({
                        url: nameUri + (useSl ? item.sl : encodeURIComponent(item.code))
                    }).done(function (response) {
                        if (response.length === 1) {
                            span.attr('title', response[0].nm);
                            span[0].item = response[0];
                        }
                    }).fail(function (response) {
                        remove(item);
                    });
                }
                $(divSelectie).append(span);
                $(divSelectie).append(seperator);
                removeItemFromList(item);
                recompleteList();
                repositionSelectieVlak();
            }
            $(self).trigger('sizeChanged');
            $(self).trigger('dataChanged');
        };

        repositionSelectieVlak = function () {
        	var offset = $(inputZoekveld).offset();
            offset.top = offset.top + $(inputZoekveld).height() + 1;
            divZoekResultaat.offset(offset);
        };

        remove = function (item) {
            $(divSelectie).find('span').filter(function () {
                return (this.item.sl === item.sl);
            }).remove();
            if (selectSingleItem) {
            	$(inputZoekveld).show();
            } else {
            	repositionSelectieVlak();
        	}
            $(self).trigger('sizeChanged');
            $(self).trigger('dataChanged');
        };

        clear = function () {
            $(divSelectie).empty();
            $(inputZoekveld).show();
            removeZoekResultaten();
            $(self).trigger('sizeChanged');
            $(self).trigger('dataChanged');
        };

        removeZoekResultaten = function () {
            lastZoekvraag = '';
            inputZoekveld.value = '';
            divZoekResultaat.remove();
            blanket.remove();
            selectionCounter = -1;
        };

        keyDownImpl = function () {
            if (divZoekResultaat) {
                var selLines = $(divZoekResultaat).find('.selectionLine');
                if ((selectionCounter + 1) < selLines.length) {
                    selectionCounter += 1;
                }
                selLines.eq(selectionCounter).addClass('selectionLineActive');
                if (selectionCounter !== 0) {
                    selLines.eq(selectionCounter - 1).removeClass('selectionLineActive');
                }
            }
        };

        keyDown = function (event) {
            if (event.which === 13) {
                event.preventDefault();
                if (divZoekResultaat) {
                    var selIndex = selectionCounter;
                    if (selIndex === -1) {
                        selIndex = 0;
                    }
                    var selLines = divZoekResultaat.find('.selectionLine');
                    selLines.eq(selIndex).find('img').eq(0).click();
                    removeZoekResultaten();
                }
                return;
            }
            if (event.which === 40) {
                // down
                event.preventDefault();
                keyDownImpl();
            }
            if (event.which === 38) {
                // up
                event.preventDefault();
                if (divZoekResultaat) {
                    if (selectionCounter < 0) {
                        return;
                    }
                    if ((selectionCounter - 1) > -1) {
                        selectionCounter -= 1;
                    }
                    var selLines = divZoekResultaat.find('.selectionLine');
                    selLines.eq(selectionCounter).addClass('selectionLineActive');
                    if ((selectionCounter + 1) < selLines.length) {
                        selLines.eq(selectionCounter + 1).removeClass('selectionLineActive');
                    }
                }
            }
        };

        zoek = function () {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }

            timer = setTimeout(function () {
                timer = null;

                if (inputZoekveld.value !== lastZoekvraag) {
                    if (inputZoekveld.value) {
                        $(document.body).append(blanket);
                        $(document.body).append(divZoekResultaat);

                        divZoekResultaat.empty();
                        selectionCounter = -1;
                        divZoekResultaat.append('<img src="/img/jsui.Generic/LUID/loading.gif" alt="loading...">');

                        blanket.click(removeZoekResultaten);
                        repositionSelectieVlak();

                        lastZoekvraag = inputZoekveld.value;
                        loadData();
                    } else {
                        removeZoekResultaten();
                        lastZoekvraag = '';
                    }
                }
            }, inputDelay);
        };

        getItems = function () {
            var items = [];
            $(divSelectie).find('span').each(function () {
                items.push(this.item);
            });

            return items;
        };

        getValue = function () {
            var items = [];
            $(divSelectie).find('span').each(function () {
                items.push(useSl ? this.item.sl : this.item.code);
            });

            return items.join(',');
        };

        //assign public methods to this
        this.add = add;
        this.remove = remove;
        this.clearSearchResults = removeZoekResultaten;
        this.clear = clear;
        this.getItems = getItems;
        this.getValue = getValue;

        init();
    };
}(jQuery));
