//namespace root;
var jsui = window.jsui || {};

(function () {
    "use strict";

    jsui.Generic = jsui.Generic || {};

    jsui.Generic.TabControl = function (container, options) {
        var tabControl,
            tabPageHeaderDiv,
			activeTabIndex,
			tabs = [];
			
		
		function init() {
			tabControl = $('<div class="TabControl"><div class="TabHeaderContainer"><div></div><br clear="all" /></div></div>');
			tabPageHeaderDiv = tabControl.children('div.TabHeaderContainer').children('div').eq(0);

			if (options.full === true) {
				tabControl.addClass('full');
			}

			container.append(tabControl);
		}
		
		
		function noBorder(header, enable) {
			if (enable === true)
				header.append('<div class="NoBorder"></div>');
			else
				header.children('div').remove();
        }

		
		function showByIndex(tabIndex) {
			if (activeTabIndex !== undefined) {
				tabs[activeTabIndex].page.css('display', 'none');
				tabs[activeTabIndex].header.removeClass('Selected');
				noBorder(tabs[activeTabIndex].header, false);
			}

			activeTabIndex = tabIndex;
			tabs[activeTabIndex].page.css('display', 'table-row');
			tabs[activeTabIndex].header.addClass('Selected');
			noBorder(tabs[activeTabIndex].header, true);
			tabs[activeTabIndex].body.trigger('afterActivate');
		}

		function showByTitle(title) {
			var i;
			for (i = 0; i < tabs.length; i++) {
				if (tabs[i].title === title) {
					showByIndex(i);
					return;
				}
			}
		}
		
        this.addTab = function (title, properties) {
            properties = properties || {};
            properties.isEnabled = properties.hasOwnProperty('isEnabled') ? properties.isEnabled : true;

            var ie8fix = '';
            if (window.XDomainRequest) {
                ie8fix = ' style="height: 500px;"';
            }

            var tabPage = $('<div class="TabPage" style="display: none"><div class="HeightContainer"' + ie8fix + '><div class="TabBody"></div></div></div>'),
                tabPageBody = tabPage.find('div.TabBody').eq(0),
                tabPageHeader = $('<div class="TabHeader' + (properties.isEnabled ? ' Clickable' : '') + '">' + title + '</div>');
				
				
            tabPage.isEnabled = properties.isEnabled;
            tabPageHeader[0].tabPage = tabPage;
            tabPage.header = tabPageHeader;
            tabPageBody.header = tabPageHeader;

			tabPageBody.title = function (val) {
				if (val) {
					this.header.text(val);
				} else {
					return this.header.text();
				}
			};

			if (properties.hasOwnProperty('afterActivate')) {
				tabPageBody.on('afterActivate', properties.afterActivate);
			}



			tabPageHeaderDiv.append(tabPageHeader);
			tabControl.append(tabPage);
            tabs.push({ header: tabPageHeader, page: tabPage, body: tabPageBody, title: title });
			
			if (properties.isEnabled) {
				tabPageHeader.click((function(index) {
					return function() {
						if (index !== activeTabIndex) {
							showByIndex(index);
						}
					}
				})(tabs.length-1));
			} else {
				tabPageHeader.addClass('Disabled');
			}
			
			if (activeTabIndex === undefined) {
				if (tabs[tabs.length-1].page.isEnabled) {
					showByIndex(tabs.length-1);
				}
			}
			
            return tabPageBody;
        };

        this.css = function (name, val) {
            return tabControl.css(name, val);
        };
		
		this.previous = function() {
			var i = activeTabIndex-1;
			if (i < 0) {
				i = tabs.length-1;
			}
			for (; i >= 0; i--) {
				if (tabs[i].page.isEnabled) {
					showByIndex(i);
					return;
				}
			}			
		};

		this.next = function() {
			var i = activeTabIndex+1;
			if (i > (tabs.length-1)) {
				i = 0;
			}
			for (; i < tabs.length; i++) {
				if (tabs[i].page.isEnabled) {
					showByIndex(i);
					return;
				}
			}			
		};
		
		this.showByIndex = showByIndex;
		this.showByTitle = showByTitle;

		init();
    };
})();