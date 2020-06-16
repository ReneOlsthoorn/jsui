"use strict";

var jsui = window.jsui || {};
jsui.Generic = jsui.Generic || {};

jsui.Generic.GenericSelector = (function () {
    
    function Main(container, options) {
		var self = this,
			resContainer,
			selector,
			currentRequest,
			divResults, // results below the search input
			selectedData = {},
			sortedSelectedData = [],
			showSelectionsOnly = false;
		
		
		function itemKey(itemData) {
			return itemData.id;
		}
		
		/**
		 * Draws the selector
		 * @param {Object} data - data to fill the selector with
		 */		
		function drawSelector(data, metadata) {
			var tempData = [],
				parent = resContainer.parent();

			resContainer.hide();
			resContainer.empty();
			
			let totalWidth = metadata.totalWidth+35;
			if (totalWidth < 335) {
				totalWidth = 335;
			}
			resContainer.css({width: (totalWidth+"px")});
			drawSelectorContentTop(resContainer);

			for (let i = 0; i < data.length && i < options.limit; i++) {
				data[i].metadata = metadata;
				resContainer.append(drawSelectorContentItem(data[i]));
			}
			if (metadata.hasMoreResults) {
				resContainer.append('<span class="subtitle">Er zijn nog meer resultaten.<br />Verfijn uw zoekopdracht door meer gegevens in te voeren.</span>');
			}
			selector.setData(data);

			resContainer.show();
			selector.focus();
        }
		
	
		/**
		 * drawSelectorContentTop - draws the top (bar with buttons) of the selector
		 * @parm {Object} resContainer - the selector popup
		 */
        function  drawSelectorContentTop(resContainer) {
			if (options.hasHeader) {
				var top = $('<span class="selectorContentTop">'
					+ '<span class="fa fa-check-square-o"></span>'
					+ '<span class="fa fa-trash"></span>'
					+ '</span>');
				resContainer.append(top);
			}
		}
		
		
		function drawSelectorContentItem(itemData) {
			let metadata = itemData.metadata;
			let checkbox = '';
			let itemClass = getClassSelectorItem(itemData);
			if (itemClass) {
				checkbox = '<span class="' + itemClass + '"></span>'; //  style="font-size: 12px"
			} else {
				//checkbox = '<span class="fa fa-square-o added"></span>';
				//checkbox = '<span style="display: inline-block; width: 17px"></span>';
			}

			let itemDom = $('<div class="result">'
					+ checkbox
					+ '</div>');
			
			for (let i = 0; i < metadata.nrColumns; i++) {
				let element = $("<span>"+ itemData["col"+i] +"</span>");
				element.css({"display": "inline-block", "width": (metadata["colWidth"+i]) });
				itemDom.append(element);
			}			

			itemDom.data('item', itemData);
			itemDom.click(function () {
				$(self).trigger('click', [ $(this).data('item'), $(this) ]);
				selector.focus();
			});

			return itemDom;
		}
		
		
		/**
		 * getClassSelectorItem - bepaal de look en feel van de selector item (locatie)
		 * @param {Object} locatie - locatie object
		 * @return a class based on locatie.geverifieerd and selected Locaties
		 */
		function getClassSelectorItem(itemData) {
			var classNm = null;
			if (selectedData[itemKey(itemData)]) {
				classNm = 'fa fa-check-square added';
				//classNm = 'fa fa-check-square-o added';
			}
			return classNm;
		}
		
		
        function toggleSelectedItem(itemData) {
			if (selectedData[itemKey(itemData)]) {
				delete selectedData[itemKey(itemData)];
			} else {
				if (options.singleItem) {
					selectedData = { };
				}
				
				selectedData[itemKey(itemData)] = itemData;
			}
			//hasSelections = !jQuery.isEmptyObject(selectedLocaties);
			$(self).trigger('selectedItemsChanged');
		}
		
		
		function sortSelectedData() {
			let result = [];
			$.each(selectedData, function (key, data) {
				result.push(data);
			});
			return result;
		}
		
		
		/**
		 * Draws the results below the input of the selector
		 */
        function drawResults() {
			divResults.empty();

			sortedSelectedData = sortSelectedData();
			
			if (!options.singleItem) {
				$.each(sortedSelectedData, function (index, itemData) {
					let itemDom = $('<div class="result"><span title="' + itemData.resultdisplay + '">' + itemData.resultdisplay + '</span><span class="closer">&nbsp;</span></div>');
					itemDom.find('.closer').data('item', itemData);
					divResults.append(itemDom);
					//<img style="margin-top: 3px; position: absolute" src="/img/jsui.Generic/GUI/icon_remove_nonactive.png" />
				});

				divResults.find('.closer').on('click', function () {
					let itemData = $(this).data('item');
					delete selectedData[itemKey(itemData)];
					drawResults();
					selector.focus();
					$(self).trigger('selectedItemsChanged');
				});
			}
		}
		
		
		function getSelectedData() {
			return sortSelectedData();
		}
		
		function setSelectedData(newSelectedData) {
			selectedData = newSelectedData;
			sortedSelectedData = sortSelectedData();
			drawResults();
			if (options.singleItem) {					
				selector.setZoekveld('');
				$.each(sortedSelectedData, function (index, itemData) {
					selector.setZoekveld(itemData.resultdisplay);
				});
			} 				
		}
		
        function init() {
			options = options || {};
			options.placeholders = 'Typ om te zoeken...';
			options.popupStyle = 'left:0em;';
			options.hasHeader = false;
			options.limit = 9999;

			selector = new jsui.Generic.Selector(container, options);
			
			//gekozen items tonen onder de input
			container.append('<div class="jsui_Generic_TextSelector_Results"></div>');
			divResults = container.find('.jsui_Generic_TextSelector_Results');
			
			$(selector).on('searchInSingleItemMode', function () {
				// we need to clear the selection when the search method is called in singleItem mode.
				selectedData = {};
			});

			$(selector).on('beforeClear', function () {
				sortedSelectedData = sortSelectedData();
				
				if (currentRequest)
					currentRequest.abort();				
				
				if (options.singleItem) {
					if (sortSelectedData.length === 0 && (selector.getZoekveld().length > 0)) {
						let getData = selector.getData();
						if (getData === null) {
						} else if (getData.length === 1) {
							if (getData[0].id === selector.getZoekveld()) {
								selectedData[itemKey(getData[0])] = getData[0];
								sortedSelectedData = sortSelectedData();
							}
						}
					}
				} 								
			});			
			
			$(selector).on('afterClear', function () {
				sortedSelectedData = sortSelectedData();
				
				if (options.singleItem) {
					selector.setZoekveld('');
					$.each(sortedSelectedData, function (index, itemData) {
						selector.setZoekveld(itemData.resultdisplay);
					});
				} 								
			});			
			
			$(selector).on('click', function (e, data, item) {
				$(self).trigger('click', [data, item]);
			});
			
			$(selector).on('search', function (e, zoektekst, resCont) {
				resContainer = resCont;
				
				if (currentRequest)
					currentRequest.abort();
				
				let theSearchFunction = undefined;
				if (options.searchFunction) {
					theSearchFunction = options.searchFunction;
				} else if (options.searchUri) {
					theSearchFunction = function(deZoekTekst) {
						return $.ajax({ // crossDomain: true, xhrFields: { withCredentials: true },
							url: options.searchUri + deZoekTekst
						});
					}
				}
				currentRequest = theSearchFunction(zoektekst).done(function (response) {

					resContainer.empty();

					if (!response) {
						resContainer.text('Er ging iets mis bij het zoeken.');
					} else if (response.list.length === 0) {
						resContainer.text('Er zijn geen resultaten gevonden.');
					} else {
						drawSelector(response.list, response.metadata);
					}
				}).fail(function (xhr) {
					//check if there are responseheaders. If not, user aborted and we show no error
					if (xhr.getAllResponseHeaders())
						resContainer.text('Er ging iets mis bij het zoeken.');
				}).always(function () {
					currentRequest = null;
				});
			});

            $(self).on('click', function (e, data, item) {
				var itemData = item.data('item');
				toggleSelectedItem(itemData);
				item.replaceWith(drawSelectorContentItem(itemData));
            });
			
			$(self).on('selectedItemsChanged', function () {
				drawResults();
				if (options.closeAfterSelect || options.singleItem) {
					selector.clear();
				}
				//$(container).trigger('selectedItemsChanged');
			});	
        }
        
		this.getSelectedData = getSelectedData;
		this.setSelectedData = setSelectedData;
		
        init();		
    };
	
	return Main;
})();
