
var jsui = window.jsui || {};
jsui.Generic = jsui.Generic || {};

// Polyfill required for this component
if (!Element.prototype.scrollIntoViewIfNeeded) {
	Element.prototype.scrollIntoViewIfNeeded = function () {
		this.scrollIntoView(true);
	}
}

// IE11 heeft een bug dat een background-image niet gebruikt wordt als ie nog niet geladen is.
jsui.Generic.preLoadImagesTree = function (arrayOfImages) {
	$(arrayOfImages).each(function () {
		// $('<img/>')[0].src = this; //dit was niet genoeg voor IE11. Het element moet aan de body toegevoegd worden.
		$('<img />').attr('src', this).appendTo('body').css('display', 'none');
	});
}
jsui.Generic.preLoadImagesTree([]); //'./assets/css/img/treeStandard.png'

jsui.Generic.Tree = (function () {
	"use strict";
	
	function treeNode(tree, parentNode, data)
	{	
		var offsetElement,
			nodes,
			level,           		// integer: 0 - ...
			li,
			openCloseSpan,
			openCloseIconClass,
			checkboxSpan,
			checkboxClass,
			link,
			iconSpan,
			iconSpanIconClass,
			labelSpan,
			numberOfLeafs,
			maxInitialFolderNodes,
			overflowDiv,
			overflowAantal,
			overflowAantalSpan,
			self = this;
	
		function init() {
			nodes = [ ];
			if (!data.openCloseState) {
				data.openCloseState = tree.getInitialOpenCloseState() ? tree.getInitialOpenCloseState() : "opened";
			}
			if (!data.checkState) {
				data.checkState = data.checked ? "full" : "empty";
			}
			level = parentNode ? (parentNode.getLevel() + 1) : 0;
			maxInitialFolderNodes = data.hasOwnProperty("maxInitialFolderNodes") ? data.maxInitialFolderNodes : tree.getMaxInitialFolderNodes();
			createComponents();
		}

		function saveOpenCloseState() {
			data.storedOpenCloseState = data.openCloseState;
		}

		function restoreOpenCloseState() {
			data.openCloseState = data.storedOpenCloseState;
		}
		
		function removeCheckbox() {
			checkboxSpan.remove();
			checkboxSpan = undefined;
		}
		
		function bulkEnd() {
			let lenTmpNodes = nodes.length;
			if (maxInitialFolderNodes && lenTmpNodes > maxInitialFolderNodes && !overflowDiv) {
				overflowAantal = lenTmpNodes - maxInitialFolderNodes;
				let overflowDivParent = $('<div></div>');
				let displayText = "Toon overige " + overflowAantal.toString();
				let link = $('<a style="margin-left: 20px;"><span class="toonMeer">' + displayText + '</span></a>');
				overflowAantalSpan = link.find("span").eq(0);

				let nodeFunc = (function(node) {
					return function() { return node; }
				})(self);				
				
				let clickFunction = function(e) {
					nodeFunc().unpackOverflow();
				};
				
				link.click(clickFunction);
				overflowDivParent.append(link);
				overflowDiv = $('<div style="display:none"></div>');
				overflowDivParent.append(overflowDiv);
				
				for (let i = maxInitialFolderNodes; i < lenTmpNodes; i++) {
					overflowDiv.append(nodes[i].getDOMElement());
				}
				nodes[maxInitialFolderNodes-1].getDOMElement().after(overflowDivParent);
			}
		}
		
		function unpackOverflow() {
			let lenTmpNodes = nodes.length;
			if (maxInitialFolderNodes && lenTmpNodes > maxInitialFolderNodes && overflowDiv) {
				let lenTmpNodes = nodes.length;
				for (let i = maxInitialFolderNodes; i < lenTmpNodes; i++) {
					nodes[i-1].getDOMElement().after(nodes[i].getDOMElement());
				}
				overflowDiv.parent().remove();
				overflowDiv = undefined;
				maxInitialFolderNodes = undefined;  // anders worden de nodes niet goed getekend.
				refreshNodes();
			}
		}
		
		function createComponents() {
			li = $('<li/>', { "class": ("level" + level), "tabindex":  "0",  "hidefocus": "true", "style":"-moz-user-select: none; user-select: none; -webkit-user-select: none; -ms-user-select: none;" });
			
			openCloseIconClass = "center_docu";
			openCloseSpan = $('<span/>', { "class" : ("treenodebutton level" + level + " switch " + openCloseIconClass), "style": (tree.nodeUnderlined() ? "" : "cursor:default;") });
			openCloseSpan.click(switchClick);
			li.append(openCloseSpan);
			
			if (tree.hasCheckboxes()) {
				checkboxClass = determineCheckboxClass(data.checkState);
				checkboxSpan = $('<span/>', { "class" : ("treenodebutton chk " + checkboxClass) });
				li.append(checkboxSpan);
				checkboxSpan.click(checkboxClick);
			}
			
			//als je ook tooltips wilt: "title": data.label,
			link = $('<a/>', { "class": ("level"+level), "style": (tree.nodeUnderlined() ? "" : "text-decoration: none; cursor:default;") });
			
			if (tree.getDragAndDrop("drag"))
			{
				link.prop("draggable", "true");
				link.on("dragstart", function(jqEvent) {
					let node = $(jqEvent.target).parent().data("node");
					let ev = jqEvent.originalEvent;
					ev.dataTransfer.setData("object", node.getData().label);
					
					console.log("dragstart: " + node.getData().label);
				});
				link.on("dragend", function(jqEvent) {
					let ev = jqEvent.originalEvent;
					console.log("dragend");
					//console.log(JSON.stringify(ev));
					if (ev.dataTransfer.dropEffect !== 'none') {
						// drop is gelukt.
						let node = $(jqEvent.target).parent().data("node");
						node.remove();
					}
				});
			}

			if (tree.getDragAndDrop("drop"))
			{
				link.on("dragenter", function(jqEvent) {
					let ev = jqEvent.originalEvent;
					//console.log(JSON.stringify(ev));
					//ev.dataTransfer.setData("text", ev.target.id);
				});
				link.on("dragover", function(jqEvent) {
					let ev = jqEvent.originalEvent;
					//console.log(JSON.stringify(ev));
					//ev.dataTransfer.setData("text", ev.target.id);
					ev.preventDefault();
					return false;
				});
				link.on("dragleave", function(jqEvent) {
					let ev = jqEvent.originalEvent;
					//console.log(JSON.stringify(ev));
					//ev.dataTransfer.setData("text", ev.target.id);
				});
				link.on("drop", function(jqEvent) {
					let node = $(jqEvent.target).closest("li").data("node");
					let ev = jqEvent.originalEvent;
					//console.log(JSON.stringify(ev));
					let nodeStr = ev.dataTransfer.getData("object");
					node.getParentNode().addNode({ label: nodeStr });
					//let node = JSON.parse(nodeStr);
					console.log("drop: " + nodeStr);
					ev.preventDefault();
					return false;
				});
			}
			
			if (data.hasOwnProperty("url")) {
				link.prop("href", data.url);
			} else {
				link.click(linkClick);
			}
			iconSpanIconClass = "ico_open";
			iconSpan = $('<span/>', { "class" : ("treenodebutton " + iconSpanIconClass), "style": (tree.nodeUnderlined() ? "" : "cursor:default;") });
			link.append(iconSpan);
			labelSpan = $('<span>' + data.label + '</span>');
			link.append(labelSpan);
			
			if (tree.getShowNumberOfLeafs()) {
				numberOfLeafs = $('<span/>');
				link.append(numberOfLeafs);
			}
			
			li.append(link);
			if (tree.getOnCreate()) {
				tree.getOnCreate()(self);
			}
			li.data("node", self);
		}
		
		function determineCheckboxClass(state) {
			if (state === "full") {
				return "checkbox_true_full";
			} else if (state === "empty") {
				return "checkbox_false_full";
			} else {
				return "checkbox_true_part";
			}			
		}
		
		function setCheckState(check, direction) {
			// check = "full", "empty", "some"
			// direction = "down", "up"  undefined = this level
			var doDown = (direction === "down") || (direction === undefined);
			var doUp = (direction === "up") || (direction === undefined);
			
			var booleanCheck = undefined;
			if (check === "full") {
				booleanCheck = true;
			} else if (check === "empty") {
				booleanCheck = false;
			}
			
			data.checkState = check;
			if (doDown) {
				data.checked = booleanCheck;
			} else if (doUp) {
				//data.checkState berekenen
				var aantalEmpty = 0;
				var aantalFull = 0;
				var aantalSome = 0;
				data.checkState = "empty";
				if (isFolder()) {
					for (let i = 0; i < nodes.length; i++) {
						var tmpCheckState = nodes[i].getCheckState();
						if (tmpCheckState === "full") {
							aantalFull++;
						}
						if (tmpCheckState === "empty") {
							aantalEmpty++;
						}
						if (tmpCheckState === "some") {
							aantalSome++;
						}						
					}
				}
				if (aantalEmpty === 0 && aantalSome === 0) {
					data.checkState = "full";
					data.checked = true;
				} else if (aantalFull === 0 && aantalSome === 0) {
					data.checkState = "empty";
					data.checked = false;
				} else {
					data.checkState = "some";
					data.checked = false;
				}
			}
			
			if (checkboxSpan) {
				checkboxSpan.removeClass(checkboxClass);
				checkboxClass = determineCheckboxClass(data.checkState);
				checkboxSpan.addClass(checkboxClass);
			}
			
			if (tree.getOnCheck()) {
				tree.getOnCheck()(self);
			}
						
			if (doDown && isFolder()) {
				for (let i = 0; i < nodes.length; i++) {
					nodes[i].setCheckState(data.checkState, "down");
				}
			}
			if (doUp && (level > 0)) {
				parentNode.setCheckState(data.checkState, "up");
			}

			updateShowNumberOfLeafs();			
		}
		
		function checkboxClick() {
			if (tree.isReadOnly()) {
				return;
			}
			if (tree.getOnBeforeUserCheck()) {
				if (!tree.getOnBeforeUserCheck()(self)) {
					return;
				}
			}
			setCheckState( ((!self.getData().checked) ? "full" : "empty"), undefined);
		}
		
		function linkClick(e) {
			tree.setSelectedNode(self, true);
			e.stopPropagation();
			e.preventDefault();
			return false;
		}
		
		function switchClick() {
			if (data.openCloseState === "opened") {
				close();
			} else {
				open();
			}
		}
		
		function getVerticalPosition(node) {
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i] === node) {
					// Hier bepalen of we de laatste zijn. Dat kan niet zonder te kijken of alles wat na ons komt hidden is.
					
					let isLaatste = true;
					for (let j = i+1; j < nodes.length; j++) {
						if (!nodes[j].isHidden()) {
							isLaatste = false;
							break;
						}
					}
					
					if (i === 0) {
						if (isLaatste) {
							return "bottom";
						} else if (maxInitialFolderNodes && i === (maxInitialFolderNodes-1)) {
							return "bottom";
						} else {
							return "center";
						}
					} else if (isLaatste) {
						return "bottom";
					} else if (maxInitialFolderNodes && i === (maxInitialFolderNodes-1)) {
						return "bottom";						
					} else {
						return "center";
					}
				}
			}
		}
		
		function determineOpenCloseIconClass() {
			var pre = parentNode ? parentNode.getVerticalPosition(self) : tree.getVerticalPosition(self);
			if (nodes.length > 0) {
				return (data.openCloseState === "opened") ? (pre + "_open") : (pre + "_close");
			} else {
				return (pre + "_docu");
			}
		}

		function determineIconSpanClass() {
			let pre = "ico";
			let icon = "_docu";
			
			if (data.hasOwnProperty("icon")) {
				icon = "_" + data.icon;
			}
			
			if (nodes.length > 0) {
				return (data.openCloseState === "opened") ? (pre + "_open") : (pre + "_close");
			} else {
				return (pre + icon);
			}
		}
				
		function addNode(theData, bulk) {
			var node = new treeNode(tree, self, theData);
			if (nodes.length === 0) {
				offsetElement = $('<ul/>', { "class": ("level" + level), "style": "display:block" });
				li.append(offsetElement);
			}
			nodes.push(node);
			if (tree.getSortFunction()) {
				nodes.sort(tree.getSortFunction());
			}
			var indexNode = indexOfNode(node);
			if (indexNode === 0) {
				if (offsetElement) {
					offsetElement.prepend(node.getDOMElement());
				} else {
					li.prepend(node.getDOMElement());
				}
			} else {
				nodes[indexNode-1].getDOMElement().after(node.getDOMElement());
			}
			if (!bulk) {
				refreshNodes();  // een node toevoegen heeft gevolgen voor de voorgaande nodes (lijnen worden anders, bijvoorbeeld)
				refresh();
			}
			return node;
		}
		
		function remove() {
			li.remove();
			if (parentNode) {
				let indexNode = parentNode.indexOfNode(self);
				delete parentNode.getNodes()[indexNode];
			} else {
				let indexNode = tree.indexOfNode(self);
				delete tree.getNodes()[indexNode];
			}
		}
		
		function close() {
			if (offsetElement) {
				offsetElement.hide();
			}
			data.openCloseState = "closed";
			refresh();
		}
		
		function open() {
			if (offsetElement) {
				offsetElement.show();
			}	
			data.openCloseState = "opened";
			refresh();
		}
		
		function next(onlySiblings) {
			let parent = parentNode ? parentNode : tree;
			let siblings = parent.getNodes();
			let iAm = parent.indexOfNode(self);
			if (iAm + 1 < siblings.length) {
				tree.setSelectedNode(siblings[iAm + 1], true, true);
			} else {
				if (onlySiblings) {
					return;
				}
				if (parentNode) {
					parentNode.next();
				} else {
				    tree.selectFirstNode(true, true);
				}
			}
		}
		
		function stepOut() {
			let parent = parentNode ? parentNode : tree;
			tree.setSelectedNode(parent, true, true);
		}
		
		function nextUncle() {
			let parent = parentNode ? parentNode : tree;
			parent.next();
		}
		
		function stepIn() {
			tree.setSelectedNode(nodes[0], true, true);
		}
		
		function previous() {
			let parent = parentNode ? parentNode : tree;
			let sibblings = parent.getNodes();
			let iAm = parent.indexOfNode(self);
			if (iAm > 0) {
				tree.setSelectedNode(sibblings[iAm - 1], true, true);
			} else {
				tree.selectLastNode();
			}
		}
		
		function previousOpen() {
			var node;
			let parent = parentNode ? parentNode : tree;
			let sibblings = parent.getNodes();
			let iAm = parent.indexOfNode(self);
			if (iAm > 0) {
				node = sibblings[iAm - 1];
			} else {
				node = tree.getLastNode();
			}
			node.lastOpen();
		}
		
		function lastOpen() {
			if (isOpen()) {
				nodes[nodes.length - 1].lastOpen();
			} else {
				tree.setSelectedNode(self, true, true);
			}
		}
		
		function updateShowNumberOfLeafs() {
			if (tree.getShowNumberOfLeafs()) {			
				if (nodes.length === 0) {
					numberOfLeafs.html();
				} else {
					let tmp = " (";
					if (tree.hasCheckboxes()) {						
					    let aantal = 0;
						for (let i = 0; i < nodes.length; i++) {
							if (nodes[i].getCheckState() !== "empty") {
								aantal += 1;
							}
						}						
						tmp += aantal + "/";
					}
					tmp += nodes.length + ")";
					numberOfLeafs.html(tmp);
				}
			}			
		}
		
		function refresh() {
			openCloseSpan.removeClass(openCloseIconClass);
			openCloseIconClass = determineOpenCloseIconClass();
			openCloseSpan.addClass(openCloseIconClass);

			iconSpan.removeClass(iconSpanIconClass);
			iconSpanIconClass = determineIconSpanClass();
			iconSpan.addClass(iconSpanIconClass);
			
			if (offsetElement) {
				var verticalPositionParent = parentNode ? parentNode.getVerticalPosition(self) : tree.getVerticalPosition(self);
				if (verticalPositionParent !== "bottom") {
					offsetElement.addClass("line");
				} else {
					offsetElement.removeClass("line");
				}					
			}
			if (data.openCloseState === "closed") {
				if (offsetElement) {
					offsetElement.hide();
				}				
			}
			updateShowNumberOfLeafs();			
		}
				
		function refreshNodes() {
			for (let i = 0; i < nodes.length; i++) {
				nodes[i].refresh();
			}
		}
		
		function redraw() {
			if (isHidden()) {
				return;
			}
			refresh();
			for (let i = 0; i < nodes.length; i++) {
				nodes[i].redraw();
			}			
		}
		
		function findNodeOnLabel(label) {
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i].getData().label === label) {
					return nodes[i];
				} else {
					let childResult = nodes[i].findNodeOnLabel(label);
					if (childResult) {
						return childResult;
					}
				}			}
			return undefined;
		}
		
		function indexOfNode(node) {
			for (let i = nodes.length; i >= 0; i--) {
				if (nodes[i] === node) {
					return i;
				}
			}
			return undefined;
		}
		
		function inverseSelection() {
			if (isFolder()) {
				for (let i = 0; i < nodes.length; i++) {
					nodes[i].inverseSelection();
				}				
			} else {
				setCheckState( ((!self.getData().checked) ? "full" : "empty"), undefined);
			}
			return undefined;
		}

		function isFolder() {
			return (nodes.length > 0);
		}
		
		function isOpen() {
			return isFolder() && data.openCloseState === "opened";
		}
		
		function isRoot() {
			return parentNode == undefined;
		}
		
		function isFirst(node) {
			return parentNode.indexOfNode(node) === 0;
		}
		
		function isLast(node) {
			return parentNode.indexOfNode(node) === parentNode.getNodes().length - 1;
		}

		function setLabel(newLabel) {
			labelSpan.html(newLabel);
		}
		
		// mode = "highest" (the first full checked is return, the children below not)), "leafs" (only checked children which are no parent), "all" (default)
		function getCheckNodes(result, mode) {			
			if (mode === "highest") {
				if (data.checked) {
					result.push(self);
					return;
				} else {
					for (let i = 0; i < nodes.length; i++) {
						nodes[i].getCheckNodes(result, mode);
					}
				}
			} else if (mode === "leafs") {
				if (isFolder()) {
					for (let i = 0; i < nodes.length; i++) {
						nodes[i].getCheckNodes(result, mode);
					}
				} else {
					if (data.checked) {
						result.push(self);
						return;
					}
				}
			} else {
				if (data.checked) {
					result.push(self);
				}
				for (let i = 0; i < nodes.length; i++) {
					nodes[i].getCheckNodes(result, mode);
				}
			}
		}

		function loopNodes(callback) {
			let result = callback(self);
			if (result) { return true; }
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i].loopNodes(callback)) {
					return true;
				}
			}
		}

		function loopNodesUpwards(callback) {
			let result = callback(self);
			if (result) { return true; }
			if (parentNode) {
				if (parentNode.loopNodesUpwards(callback)) {
					return true;
				}
			}
		}		

		function toJSON() {
			return { data: data, nodes: nodes };
		}
		
		function fromJSON(json) {
			var node = addNode(json.data);
			for (let i = 0; i < json.nodes.length; i++) {
				node.fromJSON(json.nodes[i]);
			}
		}
		
		function isHidden() {
			return (li.parent().hasClass("searchHidden"));
		}		

		function show() {
			if (li.parent().hasClass("searchHidden")) {
				li.unwrap();
			}
		}

		function hide() {
			li.wrap('<div class="searchHidden"></div>');
		}

		function matchItem(zoektekst, item) {
            let patt = new RegExp(zoektekst, 'i');
            return patt.test(item);
		}

		function hasSearchTextInLeaf(text) {
			if (matchItem(text, data.label)) {
				if (text.length > 2) {
					open();
				}
				return true;
			}
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i].hasSearchTextInLeaf(text)) {
					if (text.length > 2) {
						open();
					}
					return true;
				}
			}	
			//close();
			return false;
		}
		
		/* Access for outside code */
		function getCheckState() { return data.checkState; }		
		function getDOMElement() { return li; }		
		function getLinkDOMElement() { return link;	}
		function getTree() { return tree; }
		function getParentNode() { return parentNode; }
		function getParentNodeOrTree() { return parentNode ? parentNode : tree; }
		function getData() { return data; }
		function getLevel() { return level;	}
		function getNodes() { return nodes; }

		self.getCheckState = getCheckState;
		self.getDOMElement = getDOMElement;
		self.getLinkDOMElement = getLinkDOMElement;
		self.getTree = getTree;
		self.getParentNode = getParentNode;
		self.getParentNodeOrTree = getParentNodeOrTree;
		self.getData = getData;
		self.getLevel = getLevel;
		self.getNodes = getNodes;
		self.isFolder = isFolder;
		self.isOpen = isOpen;
		self.isRoot = isRoot;
		self.isFirst = isFirst;
		self.isLast = isLast;
		self.removeCheckbox = removeCheckbox;
		self.findNodeOnLabel = findNodeOnLabel;
		self.refresh = refresh;
		self.refreshNodes = refreshNodes;
		self.open = open;
		self.close = close;
		self.next = next;
		self.stepIn = stepIn;
		self.nextUncle = nextUncle;
		self.stepOut = stepOut;
		self.previous = previous;
		self.lastOpen = lastOpen;
		self.previousOpen = previousOpen;
		self.addNode = addNode;
		self.getVerticalPosition = getVerticalPosition;
		self.setCheckState = setCheckState;
		self.getCheckNodes = getCheckNodes;
		self.toJSON = toJSON;
		self.fromJSON = fromJSON;
		self.inverseSelection = inverseSelection;
		self.loopNodes = loopNodes;
		self.redraw = redraw;
		self.indexOfNode = indexOfNode;
		self.setLabel = setLabel;
		self.bulkEnd = bulkEnd;
		self.remove = remove;
		self.show = show;
		self.hide = hide;
		self.hasSearchTextInLeaf = hasSearchTextInLeaf;
		self.unpackOverflow = unpackOverflow;
		self.isHidden = isHidden;
		self.saveOpenCloseState = saveOpenCloseState;
		self.restoreOpenCloseState = restoreOpenCloseState;
		self.loopNodesUpwards = loopNodesUpwards;
		
		init();
	}

	
	/*
	settings: {
		nodeUnderlined: false,
		initialOpenCloseState: "closed" or "opened",
		pathseparator: "/",
		sort: sorter (see comments below),
		checkboxes: false,
		onClick: onClickFunction,
	}
	
	pathseparator -> a label like "root/sub/node" will navigate to node with label "root", then navigate to node with label "sub" and there add node "node".	
	sort -> after each addNode, the nodes of the subtree will be sorted using the sort function.
			sorter sample:
				var sorter = function compareFunction(a,b) {
					if (a.getData().label < b.getData().label)
						return -1;
					if (a.getData().label > b.getData().label)
						return 1;
					return 0;
				}
	onClick -> function(node) -> gets called when the node is clicked and no "url" in on the node. Propagation will be stopped.
	
	
	node: {
		label: labelstring,
		checked: false,
		url: url,
		openCloseState: string: "opened" or "closed"
		checkState: string: "full", "empty", "some"		
	}
	
	
	Voorbeeld gebruik van de tree:
	var tree = new jsui.Generic.Tree({ checkboxes: false, initialOpenCloseState: "closed" });
	tree.addNode({ label: "label", url: ("http://www.google.nl" + "label") });
	div.append(tree.getDOMElement());
	tree.findNodeOnLabel("label").open();
	*/	
	
    function tree(settings) {
		var div,
		    divTree,
			nodes,
			selectedNode,
			timer,
			searchMode,
			self = this;
		
		function init() {
			nodes = [ ];
			div = $('<div class="treeContainer"></div>');
			divTree = $('<div class="tree"></div>');
			if (getSearchBar()) {
				let searchBar = $('<div class="searchBar"></div>');
				let label = $('<span style="margin-right: 5px;">Zoek</span>');
				let searchInput = $('<input style="margin-left: 0px; text-align: left; type="text" />');
				searchBar.append(label);
				searchBar.append(searchInput);
				div.append(searchBar);
				
				searchInput.on("input", function(ev) {
					if (timer) {
						clearTimeout(timer);
					}
					timer = setTimeout(function () {
						let newSearchText = prepareZoekTekst(searchInput.val());
						//if (newSearchText.length >= 2) {
							searchText(newSearchText);
						//}
						//$(self).trigger('searchTextChanged');
					}, 300);
				});
			}
			div.append(divTree);
			if (!!!settings.noKeyboardBind) {
				bindKeyboard(divTree);
			}
		}
		
        function prepareZoekTekst(zoektekst) {
            var result = zoektekst.replace(/[\.\+\^\$\[\]\\\(\)\{\}\|\-]/g, "\\$&"); //? en * weggelaten, want die vervangen we zelf
            result = result.replace(/\*/g, '.*?'); //wildcards * en ? vervangen.
            result = result.replace(/\?/g, '.');
            return result;
        }
		
		function isEmptyOrSpaces(str){
			return str === null || str.match(/^ *$/) !== null;
		}

        function matchItem(zoektekst, item) {
            let patt = new RegExp(zoektekst, 'i');
            return patt.test(item);
		}

		/* Save the OpenClose State of all the nodes. Typically when the searchMode is activated. */
		function saveOpenCloseState() {
			loopNodes(function(node) {
				node.saveOpenCloseState();
			});
		}

		/* Restore the OpenClose State of all the nodes. Typically when the searchMode is deactivated. */
		function restoreOpenCloseState() {
			loopNodes(function(node) {
				node.restoreOpenCloseState();
			});
		}
		
		function searchText(text) {
			let oldSearchMode = searchMode;
			searchMode = !isEmptyOrSpaces(text);
			let searchModeActivated = !oldSearchMode && searchMode;
			let searchModeDeactivated = oldSearchMode && !searchMode;
			/* In "search" mode, the opening and closing of nodes differ from normal mode */

			if (searchModeActivated) {
				saveOpenCloseState();
				if (getMaxInitialFolderNodes()) {
					loopNodes(function(node) {
						node.unpackOverflow();  // remove "show other" labels
					});
				}
			}
			
			for (let i = 0; i < nodes.length; i++) {
				if (searchMode && !nodes[i].hasSearchTextInLeaf(text)) {
					nodes[i].hide();
				} else {
					nodes[i].show();
					nodes[i].loopNodes(function(node) {
						node.show();
						if (searchMode && matchItem(text, node.getData().label)) {
							let regex = new RegExp(text, "gi");
							node.setLabel(node.getData().label.replace(regex, function(str) { return '<b>' + str + '</b>' }));
						} else {
							node.setLabel(node.getData().label);
							if (!node.hasSearchTextInLeaf(text)) {
								node.hide();
							}
						}
					});
				}
			}

			if (searchModeDeactivated) {
				restoreOpenCloseState();
			}

			redraw();
		}
		
		/* Settings gerelateerde functions */
		function getShowNumberOfLeafs() {
			return !!settings.showNumberOfLeafs;
		}
		function getInitialOpenCloseState() {
			return settings.initialOpenCloseState;
		}
		function getPathSeparator() {
			return settings.pathseparator;
		}
		function getOnClick() {
			return settings.onClick;
		}
		function getSearchBar() {
			return settings.searchBar;
		}
		function getDragAndDrop(request) {
			let setting = settings.dragAndDrop;
			if (!setting) {
				return false;
			}
			if (request === "drag" && (setting === "drag" || setting === "dragdrop")) {
				return true;
			}
			if (request === "drop" && (setting === "drop" || setting === "dragdrop")) {
				return true;
			}
			return false;
		}
		function getOnBeforeUserCheck() {
			return settings.onBeforeUserCheck;
		}
		function getOnCancelUserSelect() {
			return settings.onCancelUserSelect;
		}
		function getOnCheck() {
			return settings.onCheck;
		}	
		function getOnToJSON() {
			return settings.onToJSON;
		}
		function getOnCreate() {
			return settings.onCreate;
		}
		function getSortFunction() {
			return settings.sort;
		}
		function getMaxInitialFolderNodes() {
			return settings.maxInitialFolderNodes;
		}
		function hasCheckboxes() {
			return !!settings.checkboxes;
		}
		function isReadOnly() {
			return !!settings.readonly;
		}
		function nodeUnderlined() {
			if (settings.hasOwnProperty("nodeUnderlined")) {
				return !!settings.nodeUnderlined;
			}
			return true;
		}
		function getNodes() {
			return nodes;
		}
		
		function getDOMElement() {
			return div;
		}
		
		function getVerticalPosition(node) {
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i] === node) {
					
					let isLaatste = true;
					for (let j = i+1; j < nodes.length; j++) {
						if (!nodes[j].isHidden()) {
							isLaatste = false;
							break;
						}
					}					
					
					if (i === 0) {
						if (isLaatste) {
							return "bottom";
						}
						return "roots";
					} else if (isLaatste) {
						return "bottom";
					} else {
						return "center";
					}
				}
			}
			return "center";
		}
		
		function refreshNodes() {
			for (let i = 0; i < nodes.length; i++) {
				nodes[i].refresh();
			}
		}		
				
		function findNodeOnLabel(label) {
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i].getData().label === label) {
					return nodes[i];
				} else {
					let childResult = nodes[i].findNodeOnLabel(label);
					if (childResult) {
						return childResult;
					}
				}
			}
		}
		
		function selectAll() {
			for (let i = 0; i < nodes.length; i++) {
				nodes[i].setCheckState("full", "down");
			}
		}

		function deselectAll() {
			for (let i = 0; i < nodes.length; i++) {
				nodes[i].setCheckState("empty", "down");
			}
		}
		
		function inverseSelection() {
			for (let i = 0; i < nodes.length; i++) {
				nodes[i].inverseSelection();
			}
			refreshNodes();
		}
		
		function bulkEnd() {
			loopNodes(function(node) {
				node.bulkEnd();
				node.refresh();
			});
		}
		
		function addNode(data, bulk) {
			if (!!getPathSeparator() && (data.label.indexOf(getPathSeparator()) !== -1)) {
				var splitted = data.label.split(getPathSeparator());
				var loopNode = self;
				for (let k = 0; k < splitted.length; k++) {
					let tmp = loopNode.findNodeOnLabel(splitted[k]);
					if (tmp) {
						loopNode = tmp;
					} else {
						var newData = $.extend({}, data);
						newData.label = splitted[k];
						loopNode = loopNode.addNode(newData, bulk);
					}
				}
				return loopNode;
			} else {
				var node = new treeNode(self, undefined, data);
				nodes.push(node);
				if (getSortFunction()) {
					nodes.sort(getSortFunction());
				}
				var indexNode = indexOfNode(node);
				if (indexNode === 0) {
					if (nodes.length === 1) {
						divTree.append(node.getDOMElement());
					} else {
						nodes[indexNode].getDOMElement().before(node.getDOMElement());
					}
				} else {
					nodes[indexNode-1].getDOMElement().after(node.getDOMElement());
				}
				if (!bulk) {
					refreshNodes();
				}
				return node;
			}
		}
		
		function indexOfNode(node) {
			for (let i = nodes.length-1; i >= 0; i--) {
				if (nodes[i] === node) {
					return i;
				}
			}
		}

		function isFolder() {
			return (nodes.length > 0);
		}
		
		function isRoot() {
			return true;
		}
		
		function isFirst(node) {
			return indexOfNode(node) === 0;
		}
		
		function isLast(node) {
			return indexOfNode(node) === nodes.length - 1;
		}

		// mode = "highest" (the first full checked is return, the children below not)), "leafs" (only checked children which are no parent), "all" (default)
		function getCheckNodes(mode) {
			var result = [ ];
			for (let i = 0; i < nodes.length; i++) {
				nodes[i].getCheckNodes(result, mode);
			}
			return result;
		}
		
		function loopNodes(callback) {
			for (let i = 0; i < nodes.length; i++) {
				if (nodes[i].loopNodes(callback)) {
					return true;
				}
			}
		}
		
		function setSelectedNode(treeNode, triggerOnClick, scrollIntoView) {
			if (getOnCancelUserSelect()) {
				if (getOnCancelUserSelect()(treeNode)) {
					return;
				}
			}
			clearSelectedNode();
			
			// openklappen van een "Toon meer" blok.
			if (treeNode.getDOMElement().parent().prop("tagName") === "DIV") {
				if (!treeNode.getDOMElement().parent().is(':visible')) {
					treeNode.getDOMElement().parent().prev().click();
				}
			}

			// open this node and parentNodes in the storedOpenClose states.
			if (treeNode.getParentNode()) {
				treeNode.getParentNode().loopNodesUpwards(function(node) {
					node.getData().storedOpenCloseState = "opened";
				});
			}
			
			treeNode.getLinkDOMElement().addClass("curSelectedNode");
			if (scrollIntoView) {
			  treeNode.getDOMElement()[0].scrollIntoViewIfNeeded();  // see polyfill at the top of this file.
			}
			selectedNode = treeNode;
			if (triggerOnClick) {
				if (treeNode.getData().hasOwnProperty("onClick")) {
					treeNode.getData().onClick(treeNode);
				} else if (getOnClick()) {
					getOnClick()(treeNode);
				}
			}
		}
		
		// RENEO: wat mij betreft op de nominatie om geschrapt te worden. Want de keer dat ik 'm nodig had wilde ik de eerste niet-folder node selekteren. Dat kun je met loopNodes doen.
		function selectFirstNode(triggerOnClick, scrollIntoView) {
			if (nodes != undefined && nodes.length > 0) {
				setSelectedNode(nodes[0], triggerOnClick, scrollIntoView);
				return selectedNode;
			}
			return null;
		}
		
		// RENEO: wat mij betreft op de nominatie om geschrapt te worden. Zie selectFirstNode.
		function selectLastNode(triggerOnClick, scrollIntoView) {
			if (nodes != undefined && nodes.length > 0) {
				setSelectedNode(nodes[nodes.length - 1], triggerOnClick, scrollIntoView);
				return selectedNode;
			}
			return null;
		}
		
		function getLastNode() {
			if (nodes != undefined && nodes.length > 0) {
				return nodes[nodes.length - 1];
			}
			return null;
		}
		
		function clearSelectedNode() {
			if (selectedNode) {
				selectedNode.getLinkDOMElement().removeClass("curSelectedNode");
			}
			selectedNode = undefined;
		}
		
		function getAsJSON() {
			if (getOnToJSON()) {
				loopNodes(getOnToJSON());
			}
			return JSON.stringify({ nodes: nodes });
		}
		
		function fromJSON(json) {
			let node = addNode(json.data);
			for (let i = 0; i < json.nodes.length; i++) {
				node.fromJSON(json.nodes[i]);
			}
		}		
		
		function readFromJSON(str) {
			let input = str;
			try {
				if (typeof str === "string") {
					input = JSON.parse(str);
				}
				for (let i = 0; i < input.nodes.length; i++) {
					fromJSON(input.nodes[i]);
				}
			} catch (err) {
				// TODO: ergens een errorbox met deze melding!
			}
		
		}	

		function clear() {
			nodes = [ ];
			divTree.empty();
			redraw();
		}
		
		function redraw() {
			for (let i = 0; i < nodes.length; i++) {
				if (!nodes[i].isHidden()) {
					nodes[i].redraw();
				}
			}			
		}
		
		
		function bindKeyboard(theDiv) {
			$(theDiv).unbind("keydown");
            $(theDiv).keydown(function (e) {
            	
            	let kbValue = e.which;
            	let node = selectedNode;
            	if (node == undefined) {
            		node = selectFirstNode(true, true);
            	}
            	
            	// wat is de huidige status
    			let canStepIn    = node.isFolder() && node.isOpen();
    			let isFirstChild = !node.isRoot() && node.isFirst(node);
    			let isLastChild  = !node.isRoot() && node.isLast(node);
    			let canStepOut   = !node.isRoot();
            	
                switch (kbValue) {
                	case 32: // space
                		if (!isReadOnly()) {
                			node.inverseSelection();
						}
						e.stopPropagation();
						e.preventDefault();
                		break;
                    case 37: // cursor left
                    	if (node.isOpen()) {
                    		node.close();
                    	}else if (canStepOut) {
                    		node.stepOut();
						}
						e.stopPropagation();
						e.preventDefault();
                    	break;
                    case 38: // cursor up
                    	if (isFirstChild) {
                    		node.stepOut();
                    	} else {
                    		node.previousOpen()
						}
						e.stopPropagation();
						e.preventDefault();
                        break;
                    case 39: // cursor right
                    	if (canStepIn) {
                    		node.stepIn();
                    	} else if (node.isFolder()) {
                    		node.open();
						}
						e.stopPropagation();
						e.preventDefault();
                    	break;
                    case 40: // cursor down
                    	if (canStepIn) {
                    		node.stepIn();
                    	} else if (isLastChild) {
                    		node.nextUncle();
                    	} else { 
                    		node.next();
						}
						e.stopPropagation();
						e.preventDefault();
                        break;
                }
				
            });					
		}		
		
		self.getLastNode = getLastNode;
		self.indexOfNode = indexOfNode;
		self.getNodes = getNodes;
		self.isFolder = isFolder;
		self.isRoot = isRoot;
		self.isFirst = isFirst;
		self.isLast = isLast;
		self.getInitialOpenCloseState = getInitialOpenCloseState;
		self.getSortFunction = getSortFunction;
		self.findNodeOnLabel = findNodeOnLabel;
		self.getShowNumberOfLeafs = getShowNumberOfLeafs;
		self.getOnClick = getOnClick;
		self.getOnCheck = getOnCheck;
		self.getMaxInitialFolderNodes = getMaxInitialFolderNodes;
		self.getOnBeforeUserCheck = getOnBeforeUserCheck;
		self.hasCheckboxes = hasCheckboxes;
		self.isReadOnly = isReadOnly;
		self.getVerticalPosition = getVerticalPosition;
		self.getDOMElement = getDOMElement;
		self.addNode = addNode;
		self.getCheckNodes = getCheckNodes;
		self.nodeUnderlined = nodeUnderlined;
		self.setSelectedNode = setSelectedNode;
		self.selectFirstNode = selectFirstNode;
		self.selectLastNode = selectLastNode;
		self.clearSelectedNode = clearSelectedNode;
		self.getAsJSON = getAsJSON;
		self.getOnCreate = getOnCreate;
		self.readFromJSON = readFromJSON;
		self.selectAll = selectAll;
		self.deselectAll = deselectAll;
		self.inverseSelection = inverseSelection;
		self.clear = clear;
		self.loopNodes = loopNodes;
		self.redraw = redraw;
		self.refreshNodes = refreshNodes;
		self.bulkEnd = bulkEnd;
		self.getDragAndDrop = getDragAndDrop;
		self.getSearchBar = getSearchBar;
		
		init();
    }
	
	return tree;
})();

if (typeof exports !== 'undefined') {
  exports.Tree = jsui.Generic.Tree; // Deze regel is nodig om de code in Typescript te kunnen importeren.
}