"use strict";

var jsui = window.jsui || {};
jsui.Generic = jsui.Generic || {};

jsui.Generic.Splitter = (function () {
	
    function SplitterClass(options) {
		var self = this,
			container = options.container,
            splitter,
            firstElement,
            secondElement,

            splitterDisplay,
            firstElementDisplay,
            secondElementDisplay;
		
		function init() {
			var pos;

			container.css('display', 'flex');
			firstElement = options.first;
			splitter = $('<div class="splitter"></div>');
			secondElement = options.second;

			container.append(firstElement);
			container.append(splitter);
			container.append(secondElement);

			if (options.orientation === 'horizontal') {
				container.css('flex-direction', 'column');
				splitter.css('cursor', 'row-resize');
				splitter.css('height', '4px');
			} else if (options.orientation === 'vertical') {
				container.css('flex-direction', 'row');
				splitter.css('cursor', 'col-resize');
				splitter.css('width', '4px');
			}
			setPercentage(options.percentage || 50);
			splitter.on('mousedown', mousedown);
        }

		function endDrag(evt) {
			window.removeEventListener('mousemove', drag, false);
			window.removeEventListener('mouseup', endDrag, false);

			$(self).trigger('changed', getPercentage());
		}
		
		function mousedown(evt) {
			window.addEventListener('mousemove', drag, false);
			window.addEventListener('mouseup', endDrag, false);
		}
		
		function drag(evt) {
			var total,
				pos,
				offset = container.offset();

			if (options.orientation === 'horizontal') {
				total = parseInt(getComputedStyle(container[0]).height, 10);
				pos = evt.clientY - offset.top;
			} else if (options.orientation === 'vertical') {
				total = parseInt(getComputedStyle(container[0]).width, 10);
				pos = evt.clientX - offset.left;
			}

			setPercentage(100 / total * pos);

			if (document.selection)
				document.selection.empty();
			else
				window.getSelection().removeAllRanges();
		}
		
		function getPercentage() {
			return firstElement.css('flex-grow');
		}
			
		function setPercentage(perc) {
			if (isNaN(perc))
				return;
			perc = Math.max(Math.min(Math.round(perc), 100), 1);

			firstElement.css('flex-grow', perc);
			secondElement.css('flex-grow', 100 - perc);
		}

		function showFirst() {
			splitter.css('display', splitterDisplay);
			firstElement.css('display', firstElementDisplay);
		}
		
		function showSecond() {
			splitter.css('display', splitterDisplay);
			secondElement.css('display', secondElementDisplay);
		}
			
		function hideFirst() {
			if (splitter.css('display') === 'none')
				showSecond();

			splitterDisplay = splitter.css('display');
			firstElementDisplay = firstElement.css('display');

			splitter.css('display', 'none');
			firstElement.css('display', 'none');
		}
			
		function hideSecond() {
			if (splitter.css('display') === 'none')
				showFirst();

			splitterDisplay = splitter.css('display');
			secondElementDisplay = secondElement.css('display');

			splitter.css('display', 'none');
			secondElement.css('display', 'none');
		}

        this.getFirst = function () {
            return firstElement;
        };
        this.getSecond = function () {
            return secondElement;
        };
        this.setPercentage = setPercentage;
        this.showFirst = showFirst;
        this.showSecond = showSecond;
        this.hideFirst = hideFirst;
        this.hideSecond = hideSecond;
		
		init();
	}
	
	return SplitterClass;
})();
