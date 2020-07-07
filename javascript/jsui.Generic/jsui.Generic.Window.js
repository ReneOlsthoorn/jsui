"use strict";

var jsui = window.jsui || {};
jsui.Generic = jsui.Generic || {};

jsui.Generic.Window = (function () {
	/*
	Voorbeeld gebruik van de Window:
	var settings = {
		title : "Test regel",
		container: $(document.body), //default
		width: 500,
		height: 600,
		alignX: "right",
		alignY: "center"
	};
	settings.allowUserClose = function() {
		return false;
	};
	var theWindow = new jsui.Generic.Window(settings);			
	$(theWindow).on("userclosed", function() {
		alert("userclosed");
	});
	var content = theWindow.getContentElement();
	content.append('Logo configuratie:<br/>');
	content.append('<input id="logoPlaatsen" type=checkbox checked=checked>Logo plaatsen');
	content.append('<br/><br/>Uitlijning:<br/>');
	content.append('<input id="logoLinks" type=radio name=uitlijning>Links uitlijnen<br/>');
	content.append('<input type=radio name=uitlijning checked=checked>Rechts uitlijnen');	
	theWindow.show();		
	*/	
	
    function MoveableWindow(settings) {
		var div,
			titlebar,
			title,
			closeIcon,
			content,
			movedElement = null,
			initialDragOffsetX,
			initialDragOffsetY,
			windowWidth,
			windowHeight,
			containerWidth,
			containerHeight,
			blanket,
			container,
			containerSize,
			self = this;
		
		function init() {
			container = settings.container;
			if (!container) {
				container = $(document.body);
			}
			
			if (settings.blanket) {
				blanket = $('<div id="blanket"></div>');
				$(document.body).append(blanket);
			}
			
			div = $('<div class="MoveableWindow"></div>');
			titlebar = $('<div class="MoveableWindowTitleBar"></div>');
			title = $('<span style="display: inline-block; margin-top: 4px;"></span>');
			title.html(settings.title);
			titlebar.append(title);
			
			closeIcon = $('<div class="MoveableWindowClose"></div>');
			titlebar.append(closeIcon);
			closeIcon.on("click", userClose);
			
			titlebar.on("mousedown", mouseDown);
			div.append(titlebar);
			
			content = $('<div class="MoveableWindowContent"></div>');
			div.append(content);
			container.append(div);
			
			if (settings.containerSize) {
				containerSize = settings.containerSize();
			} else {
				containerSize = { };
				containerSize.containerMinX = container.offset().left;
				containerSize.containerMaxX = containerSize.containerMinX + container.width();
				containerSize.containerMinY = container.offset().top;
				containerSize.containerMaxY = containerSize.containerMinY + $(document).height();
			}
			
			containerWidth = containerSize.containerMaxX - containerSize.containerMinX;
			containerHeight = containerSize.containerMaxY - containerSize.containerMinY;
			
			windowWidth = settings.width;
			div.css({ "width": (windowWidth+"px") });
			
			windowHeight = settings.height;
			div.css({ "height": (windowHeight+"px") });
			
			let centerContainerWidth = containerWidth / 2;
			let centerWindowWidth = windowWidth / 2;
			let centerContainerHeight = containerHeight / 2;
			let centerWindowHeight = windowHeight / 2;
			
			if (settings.alignX) {
				parseAlignX(settings.alignX);
				/*
				if (settings.alignX.startsWith("right")) {
					let lastPart = settings.alignX.substr(5);
					if (lastPart.startsWith("+") || lastPart.startsWith("-")) {
						let offsetX = parseInt(lastPart, 10);
						div.css({ "left": (containerSize.containerMinX + containerWidth - windowWidth + offsetX - 3 + "px") });
					} else {
						div.css({ "left": (containerSize.containerMinX + containerWidth - windowWidth - 3 + "px") });
					}
				}
				//if (settings.alignX === "right") {
				//	div.css({ "left": (containerSize.containerMinX + containerWidth - windowWidth - 3 + "px") });
				//}
				if (settings.alignX === "center") {
					div.css({ "left": (containerSize.containerMinX + centerContainerWidth - centerWindowWidth + "px") });
				}
				if (settings.alignX === "left") {
					div.css({ "left": (containerSize.containerMinX + "px") });
				}
				*/
			}
			
			if (settings.alignY) {
				if (settings.alignY === "bottom") {
					div.css({ "top": (containerSize.containerMinY + containerHeight - windowHeight - 3 + "px") });
				}
				if (settings.alignY === "center") {
					div.css({ "top": (containerSize.containerMinY + centerContainerHeight - centerWindowHeight + "px") });
                }
                if (settings.alignY.startsWith("top")) {
                    let lastPart = settings.alignY.substr(3);
                    if (lastPart.startsWith("+") || lastPart.startsWith("-")) {
                        let offsetY = parseInt(lastPart, 10);
                        div.css({ "top": (containerSize.containerMinY + 1 + offsetY + "px") });
                    } else {
                        div.css({ "top": (containerSize.containerMinY + 1 + "px") });
                    }
                }

				//if (settings.alignY === "top") {
				//	div.css({ "top": (containerSize.containerMinY + 1 + "px") });
				//}
			}			
						
			if (settings.top) {
				div.css({ "top": (settings.top + "px") });
			}
		}

		function parseAlignX(theAlignX) {
			let centerContainerWidth = containerWidth / 2;
			let centerWindowWidth = windowWidth / 2;
			let centerContainerHeight = containerHeight / 2;
			let centerWindowHeight = windowHeight / 2;

			if (theAlignX.startsWith("right")) {
				let lastPart = theAlignX.substr(5);
				if (lastPart.startsWith("+") || lastPart.startsWith("-")) {
					let offsetX = parseInt(lastPart, 10);
					div.css({ "left": (containerSize.containerMinX + containerWidth - windowWidth + offsetX - 3 + "px") });
				} else {
					div.css({ "left": (containerSize.containerMinX + containerWidth - windowWidth - 3 + "px") });
				}
			}
			//if (settings.alignX === "right") {
			//	div.css({ "left": (containerSize.containerMinX + containerWidth - windowWidth - 3 + "px") });
			//}
			if (theAlignX === "center") {
				div.css({ "left": (containerSize.containerMinX + centerContainerWidth - centerWindowWidth + "px") });
			}
			if (theAlignX === "left") {
				div.css({ "left": (containerSize.containerMinX + "px") });
			}
        }

		function setTitle(newTitle) {
			title.html(newTitle);
		}

		function activateBlanket(theBlanketZIndex) {
			if (!theBlanketZIndex) {
				blanket = $('<div id="blanket"></div>');
			} else {
				blanket = $('<div id="blanket" style="z-index: ' + theBlanketZIndex + '"></div>');
            }
			$(document.body).append(blanket);
		}

		function deactivateBlanket() {
			if (blanket) {
				blanket.remove();
				blanket = null;
			}
        }
		
		function userClose() {
			if (settings.hasOwnProperty("allowUserClose")) {
				let closeAllowed = settings.allowUserClose();
				if (!closeAllowed) {
					return;
				}
			}
			
			self.close();
			$(self).trigger("userclosed");
		}
		
		function close() {
			deactivateBlanket();		
			div.remove();
			$(self).trigger("closed");	
		}
		
		function show() {
			div.show();
        }

        function hide() {
            div.hide();
        }
		
		function getContentElement()
		{
			return content;
		}

		function getDOMElement()
		{
			return div;
		}
		
		function dragInit(elem, event) {
			movedElement = elem.parent();
			let offset = movedElement.offset();
			
			initialDragOffsetX = event.pageX - offset.left;
			initialDragOffsetY = event.pageY - offset.top;
			
			$(document).on("mouseup", mouseUp);
			$(document).on("mousemove", mouseMove);
		}
		
		function mouseDown(event) {
			dragInit($(this), event);
			return false;
		}

		function mouseUp() {
			$(document).off("mouseup", mouseUp);
			$(document).off("mousemove", mouseMove);
			movedElement = null;
		}
		
		function mouseMove(event) {
			let newX = event.pageX;
			let newY = event.pageY;
			
			if (movedElement !== null) {
				let newLeft = newX - initialDragOffsetX;
				let newTop = newY - initialDragOffsetY;
				
				if (newLeft < containerSize.containerMinX) {
					newLeft = containerSize.containerMinX;
				}
				if ((newLeft + movedElement.width() + 3) > containerSize.containerMaxX ) {
					newLeft = containerSize.containerMaxX - movedElement.width() - 3;
				}
				if ((newTop + movedElement.height() + 3) > containerSize.containerMaxY ) {
					newTop = containerSize.containerMaxY - movedElement.height() - 3;
				}
				if ((newTop - 1) < containerSize.containerMinY ) {
					newTop = containerSize.containerMinY;
				}				
				
				movedElement.css({ "left" : (newLeft + 'px') });
				movedElement.css({ "top" : (newTop + 'px') });				
			}
		}
		
		this.show = show;
		this.hide = hide;
		this.getDOMElement = getDOMElement;
		this.getContentElement = getContentElement;
		this.close = close;
		this.userClose = userClose;
		this.getBlanket = function() { return blanket; }
		this.getMoveableWindow = self.getDOMElement;
		this.setTitle = setTitle;
		this.activateBlanket = activateBlanket;
		this.deactivateBlanket = deactivateBlanket;
		this.parseAlignX = parseAlignX;
		
		init();
    }
	
	return MoveableWindow;
})();
