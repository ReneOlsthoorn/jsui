var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.List = function (container, originalLayoutDef, options, mandatoryItemKey) {
        var self = this,
            isFullHeight = options.hasOwnProperty('isFullHeight') ? options.isFullHeight : false,
            hasToolbar = options.hasOwnProperty('hasToolbar') ? options.hasToolbar : false,
            hasSearch = originalLayoutDef.hasOwnProperty('canSearch') ? originalLayoutDef.canSearch : true,
            maxRowsPerPage = options.hasOwnProperty('maxRowsPerPage') ? options.maxRowsPerPage : 20,
            useAllSpace = options.hasOwnProperty('useAllSpace') ? options.useAllSpace : false,
            keepSelectionOnOutsideClick = options.keepSelectionOnOutsideClick || false,
            hasPaging = options.hasOwnProperty('hasPaging') ? options.hasPaging : true,
            verticalBorder = options.hasOwnProperty('verticalBorder') ? options.verticalBorder : false,

            totalCount = 0,
            searchStart,
            searchLimit = 1000,
            minRows = 5,

            response,
            pagingBar,
            searchBar,
            toolBar,
            tableDiv,
            sortArray = [],
            currentItems = [],
            columnResize,
            layoutDef,              // Deze layoutDef wordt gebruikt om aanpassingen in op te slaan.
            loading,
            isVisible = false,
            currentSelectedItem = null,
            selectFirstItemIfNothingSelected = false,

            //functions
            init,
            fill,
            search,
            triggerAfterDataChanged,
            afterDataChanged,

            getHeight,
            recalculateDimensions,
            fillHeight,
            getStart,
            getLimit,
            getSort,
            resetPaging,
            setSortArray,
            setVisible,
            getCurrentItems,
            getSelectedItems,
            selectItem,
            deselectItem,
            hasPagingBar,
            nextPage,
            previousPage,
            selectNextItem,
            selectPreviousItem,
            setMode_SelectFirstItemIfNothingSelected,

            matchItem,
            appendHeaderElements,
            getTds,
            loadingElement, //jquery dom element containing loading div/img/whatever
            getDataRow,
            showSettingsDialog,
            isSettingsDialogOpen,
            createLayoutDef,
            sortArrayGetElement,
            sortArrayRemoveElement,
            sortUpdateIcon,
            sortColumnRefreshIcons,
            addHeaderClick,
            selectDeselectItem,
            searchAndLoad;
        
        searchAndLoad = function (tekst) {
        	var oudeWaarde = searchBar.getSearchValue();
        	searchBar.setSearchValue(tekst);   
            var zoektekst = searchBar.preparedZoekTekst();
            var i = 0;
            for (i = 0; i < currentItems.length; i++) {
                if (zoektekst && searchBar.matchItem(zoektekst, currentItems[i])) {        
                	searchBar.setSearchValue(oudeWaarde);
                	selectItem(currentItems[i]);
                	return;
                }
            }
        	$(self).one('searchReturn', function() {
                var zoektekst = searchBar.preparedZoekTekst();
                var i = 0;
                for (i = 0; i < currentItems.length; i++) {
                    if (zoektekst && searchBar.matchItem(zoektekst, currentItems[i])) {        
                    	searchBar.setSearchValue(oudeWaarde);
                    	selectItem(currentItems[i]);
                    	break;
                    }
                }
        	});
        	searchBar.resetSearch();
        	searchBar.zoekVolgende();
        };

        getCurrentItems = function () {
            return currentItems;
        };

        getSelectedItems = function () {
            var i = 1, // element 0 is een header, dus beginnen we bij 1.
                trs = $(container).find('.genericlisttablediv tr'),
                result = [],
                tr;
            for (i = 1; i < trs.length; i++) {
                tr = $(trs[i]);
                if (tr.hasClass("selected")) {
                    result.push(currentItems[i - 1]);
                }
            }
            return result;
        };

        selectItem = function (item) {
            var i = 1, // element 0 is een header, dus beginnen we bij 1.
                trs = $(container).find('.genericlisttablediv tr'),
                tr;
            for (i = 1; i < trs.length; i++) {
                tr = $(trs[i]);
                if (currentItems[i - 1] === item) {
                    if (!tr.hasClass("selected")) {
                        tr.toggleClass("selected");
                        selectDeselectItem(trs[i], currentItems[i - 1]);
                    }
                }
            }
        };

        deselectItem = function (item) {
            var i = 1, // element 0 is een header, dus beginnen we bij 1.
                trs = $(container).find('.genericlisttablediv tr'),
                tr;
            for (i = 1; i < trs.length; i++) {
                tr = $(trs[i]);
                if (currentItems[i - 1] === item) {
                    if (tr.hasClass("selected")) {
                        tr.toggleClass("selected");
                        selectDeselectItem(trs[i], currentItems[i - 1]);
                    }
                }
            }
        };

        hasPagingBar = function () {
            return !!pagingBar;
        };

        nextPage = function () {
            var deferred = $.Deferred();
            if (hasPagingBar()) {
                $.when(pagingBar.nextPage()).then(function () {
                    deferred.resolve();
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise();
        };

        previousPage = function () {
            var deferred = $.Deferred();
            if (hasPagingBar()) {
                $.when(pagingBar.previousPage()).then(function () {
                    deferred.resolve();
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise();
        };

        getStart = function () {
            return pagingBar.getStart();
        };

        getLimit = function () {
            return pagingBar.getRowsPerPage();
        };

        getSort = function () {
            return sortArray;
        };

        resetPaging = function () {
            return pagingBar.setStart(0);
        };

        setSortArray = function (newSortArray) {
            if (newSortArray && (newSortArray.length > 0)) {
                sortArray = newSortArray;
            }
        };

        sortArrayGetElement = function (dataIndex) {
            var returnValue;
            $.each(sortArray, function (index, value) {
                if (value.sort === dataIndex) {
                    returnValue = { index: index, value: value };
                }
            });
            return returnValue;
        };

        sortArrayRemoveElement = function (dataIndex) {
            var newSortArray = [];
            var i = 0;
            for (i = 0; i < sortArray.length; i++) {
                if (sortArray[i].sort != dataIndex) {
                    newSortArray.unshift(sortArray[i]);
                }
            }
            sortArray = newSortArray;
        };

        sortUpdateIcon = function (th, dataIndex) {
            var element,
                dir,
                imageStr,
                imgStyle;
            element = sortArrayGetElement(dataIndex);
            dir = undefined;
            if (element) {
                dir = element.value.dir;
            }
            imageStr = '';
            $(th).find('img').remove();
            if (dir === undefined) {
                return;
            }
            dir = dir.toLowerCase();

            imgStyle = "";
            if (element.index === 0) {
                imgStyle = "opacity: 1.0; filter: alpha(opacity=100);";
            } else if (element.index === 1) {
                imgStyle = "opacity: 0.5; filter: alpha(opacity=50);";
            } else if (element.index === 2) {
                imgStyle = "opacity: 0.25; filter: alpha(opacity=25);";
            }

            imageStr = '<img style="' + imgStyle + '" ';
            if (dir === 'asc') {
                imageStr += 'src="data:image/gif;base64,R0lGODlhDQAFAIcAAGGQzUD/QOPu+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAMAAAEALAAAAAANAAUAAAgbAAMIDABgoEGDABIeRJhQ4cKGEA8KmEiRosGAADs="/>';
            } else if (dir === 'desc') {
                imageStr += 'src="data:image/gif;base64,R0lGODlhDQAFAIcAAGGQzUD/QOPu+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAMAAAEALAAAAAANAAUAAAgeAAUAGEgQgIAACBEKLHgwYcKFBh1KFNhQosOKEgMCADs="/>';
            }
            if ($(th).find('div').length > 0) {
                $(th).find('div').eq(0).append(imageStr);
            } else {
                $(th).append(imageStr);
            }
        };

        sortColumnRefreshIcons = function () {
            var oldTable,
                oldDomHeaderTr,
                domHeaderTr;
            oldTable = tableDiv.children('table');
            if (oldTable.length === 0) {
                return;
            }
            oldDomHeaderTr = oldTable.find('tr:first');
            domHeaderTr = $('<tr"></tr>');
            appendHeaderElements(domHeaderTr);
            oldDomHeaderTr.replaceWith(domHeaderTr);
        };

        addHeaderClick = function (element, dataIndex) {
            element.click(function () {
                var i = 0, columnFound = false;
                for (i = 0; i < layoutDef.columns.length; i++) {
                    if (layoutDef.columns[i].dataIndex === dataIndex) {
                        if (!layoutDef.columns[i].sortable) {
                            return;
                        }
                        columnFound = true;
                    }
                }
                if (!columnFound) {
                    return;
                }

                var e = sortArrayGetElement(dataIndex);
                if (e) {
                    sortArrayRemoveElement(dataIndex);
                    e = e.value;
                    if (e.dir === 'asc') {
                        e.dir = 'desc';
                    } else if (e.dir === 'desc') {
                        e.dir = 'asc';
                    }
                } else {
                    //Nog te doen: datetime velden willen we misschien eerst descending hebben.
                    e = { sort: dataIndex, dir: 'asc' };
                }
                sortArray.unshift(e);
                if (sortArray.length === 4) {
                    sortArray = sortArray.slice(0, 3);
                }
                sortColumnRefreshIcons();
                $(self).trigger('viewChanged', [getStart(), getLimit(), getSort()]);
            });
        };

        triggerAfterDataChanged = function () {
            $(self).trigger('afterDataChanged');
        };

        appendHeaderElements = function (container, linkClick) {
            var newElement,
                i,
                column,
                styleStr;

            for (i = 0; i < layoutDef.columns.length; i++) {
                newElement = undefined;
                column = layoutDef.columns[i];
                styleStr = '';

                if (!column.hidden) {
                    styleStr += "width: " + column.width + "px;";
                    newElement = $('<th style="position: sticky; top: 0px;"><div style="' + styleStr + '">' + column.header + '</div></th>');
                    if (linkClick) {
                        addHeaderClick(newElement, column.dataIndex);
                    }
                    sortUpdateIcon(newElement, column.dataIndex);
                    container.append(newElement);
                }
            }
        };

        getTds = function (item) {
            var result = [],
                td,
                i,
                column,
                styleStr;

            for (i = 0; i < layoutDef.columns.length; i++) {
                column = layoutDef.columns[i];

                if (!column.hidden) {
                    td = $('<td class="no_selection"></td>');
                    let activeDiv = $('<div style="width: ' + column.width + 'px;"></div>');
                    td.append(activeDiv);

                    if (column.listRenderer) {
                        activeDiv.append(column.listRenderer(item[column.dataIndex], i, item, response, activeDiv));
                    } else {
                        styleStr = '';
                        if (column.dataType === 'int') {
                            styleStr += 'text-align: right;';
                            activeDiv.css("text-align","right");
                        }
                        activeDiv.append('<span style="' + styleStr + '">' + (item[column.dataIndex] || '') + '</span>');
                    }

                    result.push(td);
                }
            }
            if (!verticalBorder) {
                for (i = 0; i < result.length; i++) {
                    result[i].css('border-right', '1px solid transparent');
                }
            }
            return result;
        };

        fill = function (items, newTotalCount, newResponse) {
            var i,
                zoektekst = '',
                newTable,
                oldTable,
                matched,
                domHeaderTr,
                datarow,
                height,
                scrollbarHeight;

            totalCount = newTotalCount;
            response = newResponse;

            pagingBar.update(totalCount);
            if (hasToolbar) {
                toolBar.removeItemButtons();
            }

            tableDiv.children('table').remove();

            if (items) {
                if (columnResize === undefined) {
                    columnResize = new jsui.Generic.ListColumnResize(layoutDef);
                }

                newTable = $('<table></table>');
                let theadElement = $('<thead></thead>');
                domHeaderTr = $('<tr></tr>');  //alternatief voor sticky:  domHeaderTr = $('<tr style="position: fixed"></tr>');
                theadElement.append(domHeaderTr);
                appendHeaderElements(domHeaderTr, true);
                newTable.append(theadElement);

                if (hasToolbar && hasSearch) {
                    zoektekst = searchBar.preparedZoekTekst();
                }

                tableDiv.append(newTable);

                for (i = 0; i < items.length; i++) {
                    matched = false;
                    if (hasToolbar && hasSearch && zoektekst) {
                        matched = searchBar.matchItem(zoektekst, items[i]);
                    }
                    datarow = getDataRow(items[i], matched);

                    //if (i === 0) {
                    //    datarow.children("td").css("padding-top", "22px");
                    //}

                    //check for height
                    height = getHeight();
                    //scrollbarHeight = tableDiv[0].scrollWidth > tableDiv[0].clientWidth ? 18 : 0;
                    newTable.append(datarow);
                    //if (newTable.height() + scrollbarHeight > height && i > minRows) {
                    //    datarow.remove();
                    //    pagingBar.setRowsPerPage(Math.max(minRows, i), true);
                    //    break;
                    //}
                }

                fillHeight();

                columnResize.setTable(newTable);
            }
            currentItems = items;
            triggerAfterDataChanged();
			//afterDataChanged();
        };

        this.updateDataRow = function (item) {
            let itemSeq = null;
            for (let i = 0; i < currentItems.length; i++) {
                if (currentItems[i].id === item.id) {
                    itemSeq = i;
                }
            }
            if (itemSeq === null) {
                return;
            }
            currentItems[itemSeq] = item;
            let dataRow = getDataRow(item, false);
            let oldRow = tableDiv.find("table tr.datarow").eq(itemSeq);

            if (oldRow.hasClass("selected")) {
                dataRow.toggleClass("selected");
            }

            oldRow.replaceWith(dataRow);
        };

        search = function (items, totalNrOfRows, newResponse) {
            var i,
                zoektekst,
                rowsPerPage = pagingBar.getRowsPerPage(),
                start,
                displayItems;

            response = newResponse;

            if (hasToolbar) {
                zoektekst = searchBar.preparedZoekTekst();

                for (i = 0; i < items.length; i++) {
                    if (zoektekst && searchBar.matchItem(zoektekst, items[i])) {
                        start = Math.floor((searchStart + i) / rowsPerPage) * rowsPerPage;
                        pagingBar.setStart(start);

                        displayItems = items.slice(start - searchStart, start - searchStart + rowsPerPage);
                        if (displayItems.length === rowsPerPage || (totalNrOfRows === items.length && items.length - start < rowsPerPage)) {
                            fill(displayItems, totalNrOfRows);
                        } else {
                            $(self).trigger('viewChanged', [start, getLimit(), getSort()]);
                        }
                        $(self).trigger('searchReturn');
                        return;
                    }
                }

                if (totalNrOfRows > searchStart + searchLimit) {
                    //get next batch
                    searchStart += searchLimit;
                    $(self).trigger('beforeSearch', [searchStart, searchLimit]);
                } else {
                    if (searchStart === 0) {
                        alert('We kunnen niets vinden dat voldoet aan de zoekopdracht');
                    } else {
                        alert('We kunnen niets meer vinden dat voldoet aan de zoekopdracht');
                    }

                    searchBar.resetSearch();
                }
            }
        };

        loading = function (html) {
            if (loadingElement) {
                loadingElement.remove();
            }
            if (html) {
                loadingElement = $('<div class="LoadingBox"></div>');
                loadingElement.append(html);
                $(container).append(loadingElement);
            }
        };

        selectDeselectItem = function (trElement, item) {
            var tr = $(trElement);
            if (tr.hasClass("selected")) {
                if (hasToolbar) {
                    toolBar.addItemButtons(item);
                }
                $(self).trigger('selectionChanged', [item]);
                currentSelectedItem = item;
            } else {
                if (hasToolbar) {
                    toolBar.removeItemButtons();
                }
                $(self).trigger('selectionChanged');
                currentSelectedItem = null;
            }
        };

        showSettingsDialog = function () {
            var newSettingsDialog = new jsui.Generic.ListSettingsDialog($(container), layoutDef);

            $(newSettingsDialog).bind('changed', function () {
                columnResize = undefined;
                $(self).trigger('viewChanged', [getStart(), getLimit(), getSort()]);
                recalculateDimensions();
            });

            $(newSettingsDialog).bind('reset', function () {
                jsui.Generic.Cookie(layoutDef.key, {}, { expires: -1 });
                sortArray = [];
                createLayoutDef();
                columnResize = undefined;
                $(self).trigger('viewChanged', [getStart(), getLimit(), getSort()]);
                recalculateDimensions();
            });

            newSettingsDialog.show();
        };

        isSettingsDialogOpen = function () {
            return ($(container).find('.popupPositioned').length > 0);
        };

        getDataRow = function (item, matched) {
            var tr;

            tr = $('<tr class="datarow">');
            tr.append(getTds(item));
            if (matched) {
                tr[0].className = 'matchedzoektekst';
            }

            tr.on("click", function () {
                if ($(this).hasClass("selected") && selectFirstItemIfNothingSelected) {
                    return;
                }
                $(this).siblings('tr').removeClass("selected");
                $(this).toggleClass("selected");
                selectDeselectItem(this, item);
            });

            tr.on("dblclick", function (e) {
                clearSelection();
                $(self).trigger('dblclick', [item]);
            });

            return tr;
        };

        var clearSelection = function () {
            if (document.selection && document.selection.empty) {
                document.selection.empty();
            } else if (window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
            }
        }

        createLayoutDef = function () {
            layoutDef = $.extend(true, {}, originalLayoutDef); //deepcopy of original
            var i,
                column,
                cookie = jsui.Generic.Cookie(layoutDef.key);

            layoutDef.canUpdate = layoutDef.hasOwnProperty('canUpdate') ? layoutDef.canUpdate : true;
            layoutDef.canDelete = layoutDef.hasOwnProperty('canDelete') ? layoutDef.canDelete : true;
            layoutDef.canInsert = layoutDef.hasOwnProperty('canInsert') ? layoutDef.canInsert : true;
            layoutDef.canSearch = hasSearch;

            for (i = 0; i < layoutDef.columns.length; i++) {
                column = layoutDef.columns[i];

                column.isPrimaryKey = column.hasOwnProperty('isPrimaryKey') ? column.isPrimaryKey : false;
                column.editable = column.hasOwnProperty('editable') ? column.editable : true;
                column.sortable = column.hasOwnProperty('sortable') ? column.sortable : true;
                column.hideable = column.hasOwnProperty('hideable') ? column.hideable : true;
                column.hidden = column.hasOwnProperty('hidden') ? column.hidden : false;
                column.searchable = column.hasOwnProperty('searchable') ? column.searchable : true;
                column.width = column.hasOwnProperty('width') ? column.width : 150;

                if (cookie !== undefined && cookie.hasOwnProperty(column.dataIndex)) {
                    column.hidden = cookie[column.dataIndex].hidden;
                    column.width = cookie[column.dataIndex].width;
                }
            }
            if (cookie !== undefined) {
                jsui.Generic.Cookie(layoutDef.key, cookie, { expires: 30 });
            }

            layoutDef.defaultSortArray = layoutDef.defaultSortArray || [];
            if (sortArray.length == 0 && layoutDef.defaultSortArray.length > 0) {
                sortArray = layoutDef.defaultSortArray;
            }
        };

        setVisible = function (value) {
            if (value) {
                isVisible = true;
                container.style.display = 'block';
            } else {
                isVisible = false;
                container.style.display = 'none';
            }
        };

        init = function () {
            var i,
                newTable,
                domHeaderTr,
                searchDiv,
                toolbarDiv,
                pagingDiv = $('<div class="pagingbar"></div>'),
                optionsButton = $('<button class="toolbar_settings"><div></div></button>');

            if (hasToolbar) {
                toolbarDiv = $('<div class="toolbar"></div>');
                if (hasSearch) {
                    searchDiv = $('<span></span>');
                }
            }

            tableDiv = $('<div class="genericlisttablediv"></div>');
            if (!hasToolbar) {
                tableDiv.css("top","0px");
            }
            if (!hasPaging) {
                tableDiv.css("bottom", "0px");
            }

            createLayoutDef();

            optionsButton.click(function (event) {
                if (!isSettingsDialogOpen()) {
                    showSettingsDialog();
                    event.stopPropagation();
                }
            });

            pagingBar = new jsui.Generic.ListPagingBar(pagingDiv, maxRowsPerPage, { useAllSpace: useAllSpace });
            $(pagingBar).bind('pagingChanged', function (obj, start, rowsPerPage, afterLoadedDeferred) {
                $(self).trigger('viewChanged', [getStart(), getLimit(), getSort(), afterLoadedDeferred]);
            });
            if (hasToolbar) {
                toolBar = new jsui.Generic.ListToolBar(toolbarDiv, layoutDef);

                $(toolBar).bind('newButtonClick', function () {
                    $(self).trigger('newButtonClick');
                });

                $(toolBar).bind('editButtonClick', function (e, item) {
                    $(self).trigger('editButtonClick', item);
                });

                $(toolBar).bind('deleteButtonClick', function (e, item) {
                    $(self).trigger('deleteButtonClick', item);
                });

                if (hasSearch) {
                    toolBar.append(searchDiv);
                    searchBar = new jsui.Generic.ListSearchBar(searchDiv, layoutDef);

                    $(searchBar).bind('textChanged', function () {
                        fill(currentItems, totalCount);
                    });

                    $(searchBar).bind('beforeSearch', function (e, newSearch) {
                        if (newSearch && getStart() !== 0) {
                            searchStart = 0;
                        } else {
                            searchStart = getStart() + getLimit();
                        }
                        $(self).trigger('beforeSearch', [searchStart, searchLimit]);
                    });
                }
            }


            newTable = $('<table></table>');
            domHeaderTr = $('<tr></tr>');
            appendHeaderElements(domHeaderTr, false);
            newTable.append(domHeaderTr);

            for (i = 0; i < pagingBar.getRowsPerPage() ; i++) {
                newTable.append('<tr></tr>');
            }
            tableDiv.append(newTable);

            $(container).addClass('pListContainer');
            if (isFullHeight) {
                $(container).addClass('full');
            }
            if (hasToolbar) {
                $(container).append(toolbarDiv);
            }
            $(container).append(tableDiv);
            if (hasPaging) {
                $(container).append(pagingDiv);
                $(container).append(optionsButton);
            }


            if (!keepSelectionOnOutsideClick) {
                $(document).on("click", function (event) {
                    if ($(event.target).closest('.genericlisttablediv').length === 0) {
                        $(container).find('.genericlisttablediv tr').removeClass("selected");
                        if (hasToolbar) {
                            toolBar.removeItemButtons();
                        }
                    }
                });
            }

            if (useAllSpace) {
                recalculateDimensions();

                $(window).resize(function () {
                    recalculateDimensions();
                });
            }

            $(self).bind('afterDataChanged', afterDataChanged);
        };


        selectNextItem = function () {
            var i = 0,
                selectedItems,
                item,
                currentItems,
                nextIsHit,
                deferred = $.Deferred();

            selectedItems = getSelectedItems();
            if (selectedItems.length !== 1) {
                deferred.resolve();
                return deferred.promise();
            }

            item = selectedItems[0];
            currentItems = getCurrentItems();

            nextIsHit = false;
            for (i = 0; i < currentItems.length; i++) {
                if (nextIsHit) {
                    nextIsHit = false;
                    deselectItem(item);
                    selectItem(currentItems[i]);
                    break;
                }
                if (currentItems[i] === item) {
                    nextIsHit = true;
                }
            }
            if (nextIsHit && pagingBar) {
                if (!pagingBar.isLastPage()) {
                    if (selectFirstItemIfNothingSelected) {
                        selectFirstItemIfNothingSelected = false;
                        $.when(nextPage()).then(function () {
                            // Alles is ingeladen, dus nu het eerste item selekteren.
                            currentItems = getCurrentItems();
                            selectItem(currentItems[0]);
                            selectFirstItemIfNothingSelected = true;
                            deferred.resolve();
                        });
                    } else {
                        $.when(nextPage()).then(function () {
                            deferred.resolve();
                        });
                    }
                } else {
                    deferred.resolve();
                }
            } else {
                deferred.resolve();
            }
            return deferred.promise();
        };


        selectPreviousItem = function () {
            var i = 0,
                listItems,
                item,
                currentItems,
                previous,
                deferred = $.Deferred();

            listItems = getSelectedItems();
            if (listItems.length !== 1) {
                deferred.resolve();
                return deferred.promise();
            }

            item = listItems[0];
            currentItems = getCurrentItems();

            previous = null;
            for (i = 0; i < currentItems.length; i++) {
                if (currentItems[i] === item) {
                    if (previous !== null) {
                        deselectItem(currentItems[i]);
                        selectItem(previous);
                        deferred.resolve();
                    } else {
                        if (pagingBar) {
                            if (!pagingBar.isFirstPage()) {
                                if (selectFirstItemIfNothingSelected) {
                                    selectFirstItemIfNothingSelected = false;
                                    $.when(previousPage()).then(function () {
                                        // Alles is ingeladen, dus nu het eerste item selekteren.
                                        currentItems = getCurrentItems();
                                        selectItem(currentItems[currentItems.length - 1]);
                                        selectFirstItemIfNothingSelected = true;
                                        deferred.resolve();
                                    });
                                } else {
                                    $.when(previousPage()).then(function () {
                                        deferred.resolve();
                                    });
                                }
                            } else {
                                deferred.resolve();
                            }
                        } else {
                            deferred.resolve();
                        }
                    }
                    break;
                }
                previous = currentItems[i];
            }
            return deferred.promise();
        };

        afterDataChanged = function () {
            var regelNogNietGevonden,
                listItems,
                currentItems,
                i;

            if (isVisible) {
                regelNogNietGevonden = true;
                listItems = getSelectedItems();
                if (listItems.length === 0) {
                    currentItems = getCurrentItems();
                    if (currentItems.length > 0) {
                        if (currentSelectedItem !== null) {
                            i = 0;
                            for (i = 0; i < currentItems.length; i++) {
                                if (mandatoryItemKey(currentItems[i]) === mandatoryItemKey(currentSelectedItem)) {
                                    selectItem(currentItems[i]);
                                    regelNogNietGevonden = false;
                                    break;
                                }
                            }
                        }
                        if (regelNogNietGevonden && selectFirstItemIfNothingSelected) {
                            selectItem(currentItems[0]);
                        }
                    }
                }
            }

            if (!hasPaging && verticalBorder) {
                $(container).find(".resizer").height($(container).find('.genericlisttablediv')[0].scrollHeight);
            }
        };

        setMode_SelectFirstItemIfNothingSelected = function (value) {
            selectFirstItemIfNothingSelected = value;
        };

        getHeight = function () {
            return $(container).find('.genericlisttablediv').height(); // divheight
        }

        recalculateDimensions = function () {
            var headerHeight = 24,
                scrollbarHeight = 18,
                rows = Math.max(minRows, Math.floor((getHeight() - headerHeight - scrollbarHeight) / 22));

            if (rows !== pagingBar.getRowsPerPage()) {
                pagingBar.setRowsPerPage(rows);
            } else {
                fillHeight();
            }

            if (columnResize) {
                columnResize.syncGrips();
            }
        };

        fillHeight = function () {
            //eerst resetten we alles naar 0
            $(tableDiv).find('td').css('height', '21px');

            //nu pakken we de overgebleven hoogte (witruimte onderaan) en gaan we die verdelen over de kolommen.
            var i,
                rows,
                firstCell,
                table = $(tableDiv).find('table'),
                scrollbarHeight = tableDiv[0].scrollWidth > tableDiv[0].clientWidth ? 18 : 0,
                remaining,
                laatstePagina = pagingBar.isLastPage();

            //make sure table is visible
            table.show();
            remaining = getHeight() - (table.height() + scrollbarHeight);

            rows = table.find('tr');
            if (rows.length > 1) {
                table.hide(); // prevent longrunning script IE8 failures.

                while (remaining >= 1 && !laatstePagina) {
                    for (i = 0; i < rows.length; i++) {
                        if (remaining >= 1) {
                            firstCell = rows.eq(i).find('td')[0];
                            if (firstCell) {
                                if (firstCell.style.height) {
                                    firstCell.style.height = parseInt(firstCell.style.height, 10) + 1 + 'px';
                                } else {
                                    firstCell.style.height = '22px';
                                }
                                remaining--;
                            }
                        }
                    }
                }
                table.show(); // was hidden to prevent longrunning script IE8 failures.
            }
        };

        this.loading = loading;
        this.fill = fill;
        this.search = search;

        this.recalculateDimensions = recalculateDimensions;
        this.getStart = getStart;
        this.getLimit = getLimit;
        this.getSort = getSort;
        this.resetPaging = resetPaging;
        this.setSortArray = setSortArray;
        this.setVisible = setVisible;
        this.getDataRow = getDataRow;

        this.getCurrentItems = getCurrentItems;
        this.getSelectedItems = getSelectedItems;
        this.selectItem = selectItem;
        this.deselectItem = deselectItem;
        this.nextPage = nextPage;
        this.previousPage = previousPage;
        this.selectNextItem = selectNextItem;
        this.selectPreviousItem = selectPreviousItem;
        this.setMode_SelectFirstItemIfNothingSelected = setMode_SelectFirstItemIfNothingSelected;

        this.triggerAfterDataChanged = triggerAfterDataChanged;
        this.searchAndLoad = searchAndLoad;

        init();
    };

}(jQuery));
