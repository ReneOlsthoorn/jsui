var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.ListSearchBar = function (container, layoutDef) {
        var self = this,
            inputZoekTekst,
            buttonZoekVolgende,
            newSearch = true,

            //functions
            init,
            prepareZoekTekst,
            matchItem,
            zoekVolgende,
            zoekLoop,
            preparedZoekTekst,
            resetSearch,
            setSearchValue,
            getSearchValue,
            timer;

        init = function () {
            var dom = $('<span id="zoekblok">Zoeken: <input type="text" class="small" title="Gebruik van * of ? wildcards toegestaan" style="width:150px" />&nbsp;' +
                    '<button style="margin-right: 6px; margin-top: 2px;"><span class="searchbar_zoek iconLeft">Zoek volgende</span></button></span>');
            inputZoekTekst = dom.find("input").eq(0);
            buttonZoekVolgende = dom.find("button").eq(0);

            $(container).append(dom);
            inputZoekTekst.keypress(function (event) {
                if (timer) {
                    clearTimeout(timer);
                }

                if (event.which === 13) {
                    event.preventDefault();
                    buttonZoekVolgende.focus();
                    buttonZoekVolgende.click();
                }
            });

            inputZoekTekst.keyup(function (event) {
                if (event.which !== 13) {
                    newSearch = true;
                    timer = setTimeout(function () {
                        $(self).trigger('textChanged');
                    }, 300);
                }
            });

            buttonZoekVolgende.click(zoekVolgende);
        };

        prepareZoekTekst = function (zoektekst) {
            var result = zoektekst.replace(/[\.\+\^\$\[\]\\\(\)\{\}\|\-]/g, "\\$&"); //? en * weggelaten, want die vervangen we zelf
            result = result.replace(/\*/g, '.*?'); //wildcards * en ? vervangen.
            result = result.replace(/\?/g, '.');
            return result;
        };

        matchItem = function (zoektekst, item) {
            var result = "",
                i,
                column,
                valueStr,
                patt = new RegExp(zoektekst, 'i');

            for (i = 0; i < layoutDef.columns.length; i++) {
                column = layoutDef.columns[i];
                if (column.hasOwnProperty("searchable")) {
                    if (column.searchable) {
                        valueStr = "";
                        if (item[column.dataIndex] !== undefined) {
                            valueStr = item[column.dataIndex].toString();
                        }
                        result += valueStr;
                    }
                }
            }

            return patt.test(result);
        };

        zoekVolgende = function () {
            var rowsPerPage,
                zoektekst;

            zoektekst = inputZoekTekst.val();
            if (!zoektekst) {
                alert('Eerst een zoektekst invullen.');
                return;
            }
            zoektekst = prepareZoekTekst(zoektekst);

            $(self).trigger('beforeSearch', [newSearch]);
            newSearch = false;
        };

        preparedZoekTekst = function () {
            var zoektekst = inputZoekTekst.val();
            if (zoektekst) {
                zoektekst = prepareZoekTekst(zoektekst);
            }
            return zoektekst;
        };

        resetSearch = function () {
            newSearch = true;
        };

        setSearchValue = function(tekst) {
        	inputZoekTekst.val(tekst);
        	$(self).trigger('textChanged');
        }

        getSearchValue = function() {
        	return inputZoekTekst.val();
        }        
        
        this.matchItem = matchItem;
        this.preparedZoekTekst = preparedZoekTekst;
        this.resetSearch = resetSearch;
        this.setSearchValue = setSearchValue;
        this.zoekVolgende = zoekVolgende;
        this.getSearchValue = getSearchValue;

        init();
    };

}(jQuery));
