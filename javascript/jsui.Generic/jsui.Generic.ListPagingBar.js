var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.ListPagingBar = function (container, maxRowsPerPage, options) {
        var self = this,
            useAllSpace = options.useAllSpace || false,
            inputPageNr,
            inputRowsPerPage,
            imgEerstePagina,
            imgVorigePagina,
            imgVolgendePagina,
            imgLaatstePagina,
            spanTotalPages,
            spanTotalRows,

            start = 0,
            rowsPerPage = maxRowsPerPage,
            totalRows,

            //functions
            setPageNr,
            setRowsPerPage,

            getStart,
            setStart,
            getRowsPerPage,

            isLastPage,
            isFirstPage,

            previousPage,
            nextPage,

            update,
            init;

        getStart = function () {
            return start;
        };

        setStart = function (value) {
            start = value;
        };

        getRowsPerPage = function () {
            return rowsPerPage;
        };
        
        isLastPage = function () {
            return (start + rowsPerPage >= totalRows);
        };

        isFirstPage = function () {
            return (start === 0);
        };

        update = function (newTotalRows) {
            var laatsteRijNr;

            if (newTotalRows < Math.min(start + rowsPerPage, totalRows)) {
                start = 0;
                setPageNr(1);
            }

            totalRows = newTotalRows;

            if (newTotalRows) {
                laatsteRijNr = Math.min(start + rowsPerPage, totalRows);
                spanTotalRows.text((start + 1) + '-' + laatsteRijNr + ' (' + (laatsteRijNr - start) + ') van ' + totalRows);
            } else {
                spanTotalRows.text('geen gegevens');
            }
            spanTotalPages.text(Math.ceil(totalRows / rowsPerPage));

            if (start === 0) {
                imgEerstePagina.attr("disabled", "disabled");
                imgEerstePagina.attr("src", "/img/jsui.Generic/List/page-first-disabled.gif");
                imgVorigePagina.attr("disabled", "disabled");
                imgVorigePagina.attr("src", "/img/jsui.Generic/List/page-prev-disabled.gif");
            } else {
                imgEerstePagina.removeAttr("disabled");
                imgEerstePagina.attr("src", "/img/jsui.Generic/List/page-first.gif");
                imgVorigePagina.removeAttr("disabled");
                imgVorigePagina.attr("src", "/img/jsui.Generic/List/page-prev.gif");
            }

            if (isLastPage()) {
                imgVolgendePagina.attr("disabled", "disabled");
                imgVolgendePagina.attr("src", "/img/jsui.Generic/List/page-next-disabled.gif");
                imgLaatstePagina.attr("disabled", "disabled");
                imgLaatstePagina.attr("src", "/img/jsui.Generic/List/page-last-disabled.gif");
            } else {
                imgVolgendePagina.removeAttr("disabled");
                imgVolgendePagina.attr("src", "/img/jsui.Generic/List/page-next.gif");
                imgLaatstePagina.removeAttr("disabled");
                imgLaatstePagina.attr("src", "/img/jsui.Generic/List/page-last.gif");
            }

            inputPageNr.val(start / rowsPerPage + 1);
            if (!useAllSpace) {
                inputRowsPerPage.val(rowsPerPage);
            }
        };

        setPageNr = function (pageNrStr) {
            var pageNr;

            if (!pageNrStr) {
                return;
            }

            if (typeof pageNrStr === "string") {
                if (!/^\d+$/.exec(pageNrStr)) {
                    window.alert(pageNrStr + " is geen geldige invoer.\nVoer een geheel getal groter dan 0 in.");
                    inputPageNr.val(start * rowsPerPage + 1);
                    return;
                }
                pageNr = parseInt(pageNrStr, 10);
            } else if (typeof pageNrStr === "number") {
                pageNr = pageNrStr;
            } else {
                return;
            }

            if (pageNr < 1) {
                pageNr = 1;
            }

            start = (pageNr - 1) * rowsPerPage;

            if (start >= totalRows) {
                start = totalRows - 1;
            }

            $(self).trigger('pagingChanged', [start, rowsPerPage]);
        };

        setRowsPerPage = function (newRowsPerPage, silent) {
            var rowsPerPageStr = newRowsPerPage.toString(),
                OK,
                tmp;

            if (rowsPerPage === newRowsPerPage) {
                return;
            }

            rowsPerPageStr = rowsPerPageStr || maxRowsPerPage;
            OK = /^\d{1,4}$/.exec(rowsPerPageStr);
            if (OK) {
                tmp = parseInt(rowsPerPageStr, 10);
            }
            if (!OK || tmp <= 0 || tmp > 1000) {
                window.alert(rowsPerPageStr + " is geen geldige invoer\nVoer een geheel getal in tussen 1 en 1000.");
                if (!useAllSpace) {
                    inputRowsPerPage.val(rowsPerPage);
                }
                return;
            }

            rowsPerPage = tmp;

            //now we need to make sure there is a valid page displayed. So if you have 2 pages with each 10 items
            //you need to show either 0-9 or 10-19, but tot 5-15 orso
            start = Math.floor(start / rowsPerPage) * rowsPerPage;

            if (silent !== true) {
                $(self).trigger('pagingChanged', [start, rowsPerPage]);
            } else {
                update(totalRows);
            }
        };

        previousPage = function () {
            var deferred = $.Deferred();
            if (start !== 0) {
                start = Math.max(0, start - rowsPerPage);
                $(self).trigger('pagingChanged', [start, rowsPerPage, deferred]);
            } else {
                deferred.resolve();
            }
            return deferred.promise();
        };

        nextPage = function () {
            var deferred = $.Deferred();
            if (!isLastPage()) {
                start = start + rowsPerPage;
                $(self).trigger('pagingChanged', [start, rowsPerPage, deferred]);
            } else {
                deferred.resolve();
            }
            return deferred.promise();
        };

        init = function () {
            var dom = $('<span>' +
                    '<input type="image" src="/img/jsui.Generic/List/page-first.gif" title="eerste">' +
                    '<input type="image" src="/img/jsui.Generic/List/page-prev.gif" title="vorige">' +
                    ' Pagina <input type="text" title="Pagina" /> van <span></span> ' +
                    '<input type="image" src="/img/jsui.Generic/List/page-next.gif" title="volgende">' +
                    '<input type="image" src="/img/jsui.Generic/List/page-last.gif" title="laatste">' +
                    (!useAllSpace ? ' Rijen per pagina <input type="text" title="getal tussen 1 en 1000" />' : '') +
                    '<span style="float: right; margin: 6px 50px 6px 6px;"></span>' +
                    '</span>');

            imgEerstePagina = dom.find('input').eq(0);
            imgVorigePagina = dom.find('input').eq(1);
            inputPageNr = dom.find('input').eq(2);
            spanTotalPages = dom.find('span').eq(0);
            imgVolgendePagina = dom.find('input').eq(3);
            imgLaatstePagina = dom.find('input').eq(4);
            if (!useAllSpace) {
                inputRowsPerPage = dom.find('input').eq(5);
            }
            spanTotalRows = dom.find('span').eq(1);

            imgEerstePagina.click(function () {
                start = 0;
                $(self).trigger('pagingChanged', [start, rowsPerPage]);
            });
            imgVorigePagina.click(previousPage);
            imgVolgendePagina.click(nextPage);
            imgLaatstePagina.click(function () {
                start = Math.floor((totalRows - 1) / rowsPerPage) * rowsPerPage;
                $(self).trigger('pagingChanged', [start, rowsPerPage]);
            });
            $(container).append(dom);

            inputPageNr.on("change", function () {
                setPageNr(this.value);
            });
            inputPageNr.keypress(function (event) {
                if (event.which === 13) {
                    event.preventDefault();
                    setPageNr(this.value);
                }
            });

            if (!useAllSpace) {
                inputRowsPerPage.on("change", function (event) {
                    setRowsPerPage(inputRowsPerPage.val());
                });
                inputRowsPerPage.keypress(function (event) {
                    if (event.which === 13) {
                        event.preventDefault();
                        setRowsPerPage(inputRowsPerPage.val());
                    }
                });
            }

            update(0);
        };

        this.getStart = getStart;
        this.setStart = setStart;
        this.getRowsPerPage = getRowsPerPage;
        this.setRowsPerPage = setRowsPerPage;
        this.update = update;
        this.isLastPage = isLastPage;
        this.isFirstPage = isFirstPage;
        this.nextPage = nextPage;
        this.previousPage = previousPage;

        init();
    };

}(jQuery));
