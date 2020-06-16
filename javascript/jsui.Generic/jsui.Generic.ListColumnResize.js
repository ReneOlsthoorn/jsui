var jsui = window.jsui || {};

(function ($) {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.ListColumnResize = function (layoutDef) {
        var table,
            gripContainer,
            thElements,
            grips,
            isNew = true,
            dragGrip,        //current dragged grip.
            setTable,        //function
            createGrips,     //function
            syncGrips,       //function
            onGripMouseDown, //function
            onGripDragMove,  //function
            setWidth,        //function
            onGripDragEnd;   //function

        setTable = function (newTable) {
            table = newTable;
            thElements = table.find('th');
            if (isNew) {
                isNew = false;
                gripContainer = $('<div class="grips"></div>');
                table.before(gripContainer);
                createGrips();
            }
        };

        createGrips = function () {
            var thLength,
                grip;

            grips = [];
            thLength = thElements.length;
            thElements.each(function (i) {
                grip = $('<div class="grip"></div>');
                grip.data('columnResize', {
                    gripIndex: i
                });
                gripContainer.append(grip);
                grip.append('<div class="resizer"></div>');

                if (i === (thLength - 1)) {
                    grip.addClass("LastGrip");
                }
                grip.bind('touchstart mousedown', onGripMouseDown); // bind the mousedown event to start dragging
                grips.push(grip);
            });
            syncGrips();
        };

        syncGrips = function () {
            var th,
                grip;

            thElements.each(function (i) {
                th = $(this);
                grip = grips[i];
                grip.css({
                    left: th.offset().left - table.offset().left + th.outerWidth(false) + "px",
                    height: th.outerHeight(false)
                }); // grip can also be the height of the table: table.outerHeight(false)
            });
        };

        onGripMouseDown = function (event) {
            var grip,
                gripData,
                originalEventTouch,
                xPosition,
                leftPosition;
            grip = $(this);
            gripData = grip.data('columnResize');
            originalEventTouch = event.originalEvent.touches;  // touch or mouse event?
            xPosition = originalEventTouch
                ? originalEventTouch[0].pageX
                : event.pageX;
            leftPosition = grip.position().left;
            $(document).bind('touchmove.resizer mousemove.resizer', onGripDragMove);
            $(document).bind('touchend.resizer mouseup.resizer', onGripDragEnd);
            dragGrip = grip;
            gripData.gripOriginalXPosition = xPosition;
            gripData.gripOriginalLeftPosition = leftPosition;
            gripData.gripOriginalColumnWidth = thElements.eq(gripData.gripIndex).width();
            return false; // prevent text selection while dragging
        };

        onGripDragMove = function (event) {
            var dragGripData,
                originalEventTouch,
                xPosition,
                x,
                minimumWidth,
                max,
                min,
                increment;
            if (!dragGrip) {
                return;
            }
            dragGripData = dragGrip.data('columnResize');
            originalEventTouch = event.originalEvent.touches;  // touch or mouse event?
            xPosition = originalEventTouch
                ? originalEventTouch[0].pageX
                : event.pageX;
            x = xPosition - dragGripData.gripOriginalXPosition + dragGripData.gripOriginalLeftPosition;

            minimumWidth = 15;
            max = Infinity;
            min = dragGrip.gripIndex
                ? (grips[dragGripData.gripIndex - 1].position().left + minimumWidth)
                : minimumWidth; //+ addBorderWidth);
            x = Math.max(min, Math.min(max, x));
            dragGrip.x = x;
            dragGrip.css("left", x + "px");

            increment = x - dragGripData.gripOriginalLeftPosition;
            setWidth(dragGripData.gripIndex, (dragGripData.gripOriginalColumnWidth + increment));
            syncGrips();
            return false; // prevent text selection while dragging
        };

        setWidth = function (index, width) {
            thElements.eq(index).children('div').width(width + "px");
            table.find('tr').each(function () {
                $(this).children('td').eq(index).children('div').width(width + "px");
            });
        };

        onGripDragEnd = function () {
            var i,
                nonHiddenIndex = 0,
                column,
                theWidth,
                cookie,
                dragGripData;

            $(document).unbind('touchmove.resizer mousemove.resizer');
            $(document).unbind('touchend.resizer mouseup.resizer');

            cookie = jsui.Generic.Cookie(layoutDef.key);
            if (cookie === undefined) {
                cookie = {};
            }
            dragGripData = dragGrip.data('columnResize');

            for (i = 0; i < layoutDef.columns.length; i++) {
                column = layoutDef.columns[i];
                if (!column.hidden) {
                    if (nonHiddenIndex === dragGripData.gripIndex) {
                        theWidth = thElements.eq(nonHiddenIndex).children('div').eq(0).width();
                        cookie[column.dataIndex] = { hidden: false, width: theWidth };
                        column.width = theWidth;
                    }
                    nonHiddenIndex += 1;
                }
            }
            jsui.Generic.Cookie(layoutDef.key, cookie, { expires: 30 });
            dragGrip = undefined;
        };

        //public
        this.setTable = setTable;
        this.syncGrips = syncGrips;

    };
}(jQuery));
