// page init
jQuery(function(){
    initInfiniteScroll();
  	initSortSelect();
});

jQuery(window).load(function() {
  	initFixStructure();
});

function initFixStructure() {
    jQuery('form.variants .selector-wrapper').each(function() {
        var label = jQuery(this).find('label').text();
      	if(!label) label = jQuery(this).parent().find('label').text();
        var select = jQuery(this).find('select');
        if(select) {
            select.attr('title', label);
            label = label.replace(/[^a-zA-Z0-9\s]/g,"");
            label = label.toLowerCase();
            label = label.replace(/\s/g,'-');
            select.addClass(label);
            select.parent().addClass(label+'-variants');
        }
    });
}

/*============================*/
/* Update main product image. */
/*============================*/
var switchImage = function(newImageSrc, newImage, mainImageDomEl) {
  // newImageSrc is the path of the new image in the same size as originalImage is sized.
  // newImage is Shopify's object representation of the new image, with various attributes, such as scr, id, position.
  // mainImageDomEl is the passed domElement, which has not yet been manipulated. Let's manipulate it now.
  jQuery(mainImageDomEl).attr('src', newImageSrc);
  jQuery(mainImageDomEl).parents('a').attr('href', newImageSrc);
};

function initSortSelect(){
	var ajaxLoadingArray = [
		{
			holder: '.ajax-holder',
			items: '.ajax-item',
			nextPage: 'a.ajax-next'
		}
	];
	
	jQuery('#collection_tags').each(function(){
		var select = jQuery(this);
		var currentValue = false;
		select.on('change', function(){
			currentValue = this.value;
			refreshAjaxBox();
		});
		jQuery.each(ajaxLoadingArray, function(num, obj){
			jQuery(obj.holder).each(function(){
				var set = jQuery(this);
				var api = set.data('InfiniteLoad');
				if(api){
					api.options.onAfterDraw = function(){
						refreshAjaxBox();
					};
				}
			});
		});
		function refreshAjaxBox(){
			jQuery.each(ajaxLoadingArray, function(num, obj){
				jQuery(obj.holder).each(function(){
					var set = jQuery(this);
					var api = set.data('InfiniteLoad');
					if(api && currentValue){
						var filteringBoxes = api.holder.children();
						if(currentValue != 'all'){
							var boxes = jQuery.grep(api.holder.children(), function(el, n){
								if(jQuery(el).data('product-info').tag && jQuery(el).data('product-info').tag.indexOf(currentValue) != -1){
									return true;
								}
								else {
									return false;
								}
							});
							api.holder.children().addClass('filtering-hidden');
							jQuery(boxes).removeClass('filtering-hidden');
							api.checkPosition();
						}
						else {
							api.holder.children().removeClass('filtering-hidden');
						}
					}
				});
			});
          	if(window.picturefill) window.picturefill();
		};
		refreshAjaxBox(true);
	});
}

function initInfiniteScroll(){
	var ajaxLoadingArray = [
		{
			holder: '.ajax-holder',
			items: '.ajax-item',
			nextPage: 'a.ajax-next'
		}
	];
	for(var i = 0; i < ajaxLoadingArray.length; i++){
		jQuery(ajaxLoadingArray[i].holder).each(function(){
			var set = jQuery(this);
			var nextLink = set.next(ajaxLoadingArray[i].nextPage);
			set.infiniteLoad({
				items: ajaxLoadingArray[i].items,
				domHelperOptions: {
					holderClass: ajaxLoadingArray[i].holder,
					itemsClass: ajaxLoadingArray[i].items,
					nextPageClass: ajaxLoadingArray[i].nextPage
				},
				loadMoreLink: nextLink
			});
			nextLink.on('click touchstart', function(e){ e.preventDefault(); })
		});
	};
};

;(function($){
	function InfiniteLoad(options){
		this.options = jQuery.extend({
			holder: null,
			items: '.items',
			domHelperOptions: false,
			nameSpase: '.InfiniteLoad',
			loadMoreLink: false,
			loadingClass: 'loading-state',
			fullLoadClass: 'full-load'
		}, options);
		this.init();
	};
	InfiniteLoad.prototype = {
		init: function(){
			if(this.options.holder){
				this.findElements();
				this.attachEvents();
			}
		},
		findElements: function(){
			this.holder = jQuery(this.options.holder);
			this.win = jQuery(window);
			if(this.options.loadMoreLink.length){
				this.nextUrl = this.options.loadMoreLink.attr('href')
			}
		},
		attachEvents: function(){
			var self = this;
			jQuery(window).on('scroll'  + this.options.nameSpase + ' resize'  + this.options.nameSpase + ' orientationchange' + this.options.nameSpase + ' load' + this.options.nameSpase, function(){
				self.checkPosition();
			});
		},
		checkPosition: function(){
			var self = this;
			if(this.nextUrl){
				var bottomOffset = this.holder.offset().top + this.holder.outerHeight();
				if(!this.loading && (this.win.scrollTop() + this.win.height() >= bottomOffset || !this.checkSumm())){
					this.loadMore(self.nextUrl).done(function(txt){
						self.drawItems(txt);
					});
					bottomOffset = this.holder.offset().top + this.holder.outerHeight();
				}
			}
		},
		checkSumm: function(){
			var summ = 0;
			this.holder.find(this.options.items).each(function(){
				summ += jQuery(this).outerWidth(true)
			});
			return this.holder.width() < summ;
		},
		drawItems: function(htmlCode){
			var self = this;
			var indexesList = DOMHelper.findBlockCode(htmlCode, this.options.domHelperOptions.holderClass);
			var listHTML = htmlCode.substring(indexesList.start, indexesList.end);
			this.holder.append(jQuery(listHTML).find(this.options.items));
			this.options.loadMoreLink.removeClass(this.options.loadingClass + '-link');
			this.holder.removeClass(this.options.loadingClass);
			/* go to next page */
			var indexesLink = DOMHelper.findBlockCode(htmlCode, this.options.domHelperOptions.nextPageClass);
			if(indexesLink){
				var linkHTML = htmlCode.substring(indexesLink.start, indexesLink.end);
				this.nextUrl = jQuery(linkHTML).attr('href');
				// setTimeout(function(){
					self.loading = false;
					self.checkPosition();
				// }, 1000);
			}
			else {
				this.options.loadMoreLink.addClass(this.options.fullLoadClass + '-link');
				this.holder.addClass(this.options.fullLoadClass);
			}
          	if(window.picturefill) window.picturefill();
			this.makeCallback('onAfterDraw', this);
		},
		loadMore: function(url){
			var d = jQuery.Deferred();
			var self = this;
			if(url){
				this.loading = true;
				this.options.loadMoreLink.addClass(this.options.loadingClass + '-link');
				this.holder.addClass(this.options.loadingClass);
				jQuery.ajax({
					url: url,
					type: 'get',
					data:'ajax=1',
					success: function(txt){
						d.resolve(txt);
					},
					error: function(){
						d.fail();
					}
				})
			}
			return d;
		},
		makeCallback: function(name) {
			if(typeof this.options[name] === 'function') {
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				this.options[name].apply(this, args);
			}
		}
	};
	
	jQuery.fn.infiniteLoad = function(opt){
		return this.each(function(){
			if(!jQuery(this).data('InfiniteLoad')) jQuery(this).data('InfiniteLoad', new InfiniteLoad(jQuery.extend(opt,{holder:this})));
		});
	};
}(window.jQuery));

/*
 * DOMHelper Class
 */
DOMHelper = {
	// find block start and end indexes
	findBlockCode: function(sourceHTML, blockSelector) {
		// find start tag position
		var tagStartPos = this.findTagBySelector(sourceHTML, blockSelector);
		if(typeof tagStartPos === 'number') {
			// find tag body (end index)
			var tagEndPos = this.findTagBody(sourceHTML, tagStartPos);
			if(typeof tagEndPos === 'number') {
				return {start: tagStartPos, end: tagEndPos};
			}
		}
	},

	// try select header block
	replaceInCode: function(sourceHTML, replaceHTML, blockSelector, callback) {
		// find start tag position
		var tagIndexes = this.findBlockCode(sourceHTML, blockSelector);
		var resultHTML = '', replacedHTML = '';

		if(tagIndexes) {
			replacedHTML = sourceHTML.substring(tagIndexes.start, tagIndexes.end);
			resultHTML = sourceHTML.substr(0,tagIndexes.start) + replaceHTML + sourceHTML.substr(tagIndexes.end);
			// replacing done callback
			if(typeof callback === 'function') {
				callback(resultHTML, replacedHTML);
			}
		} else {
			// nothing found callback
			if(typeof callback === 'function') {
				callback(false);
			}
		}
	},

	// search tag by selector
	findTagBySelector: function(sourceHTML, blockSelector) {
		// parse selector data
		var matchData = blockSelector.match(/(?:(.*)(#|\.)(.*))|(?:(.*))/);
		var tag = matchData[4] || matchData[1];
		var attr = matchData[2];
		var value = matchData[3];
		if(attr) {
			attr = (attr === '.' ? 'class' : 'id');
		}

		// search html code for matching selector
		var searchReg;
		switch(attr) {
			case undefined: searchReg = new RegExp('<'+tag); break;
			case 'id': searchReg = new RegExp('<'+(tag || '')+'.* id="'+value+'".*>'); break;
			case 'class': searchReg = new RegExp('<'+(tag || '')+'.* class=".*'+value+'.*".*>'); break;
		}

		// get first matched element
		var searchData = searchReg.exec(sourceHTML);
		if(searchData) {
			return searchData.index;
		}
	},

	// find tag body
	findTagBody: function(sourceHTML, startIndex) {
		// check for single tag
		var singleTagEnd = sourceHTML.indexOf('/>', startIndex);
		if(singleTagEnd != -1 && singleTagEnd < sourceHTML.indexOf('>', startIndex)) {
			return singleTagEnd + '/>'.length;
		}

		// otherwise check for matching tags
		var codePart = sourceHTML.substr(startIndex);
		var tagData = codePart.match(/<(\w*)( |>)/);
		if(tagData) {
			var tagName = tagData[1], openedCount = 0, closedCount = 0, curPosition = 0;
			var tagStartStr = '<'+tagName, tagEndStr = '/'+tagName+'>';
			var tmpPos1, tmpPos2;

			// skip initial tag
			do {
				tmpPos1 = codePart.indexOf(tagStartStr, curPosition);
				tmpPos2 = codePart.indexOf(tagEndStr, curPosition);

				// check if opening tag exists before closing tag
				if(tmpPos1 != -1 && tmpPos1 < tmpPos2) {
					openedCount++;
					curPosition = tmpPos1 + tagStartStr.length;
				}

				// check for closing tag
				if((tmpPos1 != -1 && tmpPos2 != -1 && tmpPos2 < tmpPos1) || (tmpPos1 < 0 && tmpPos2 != -1))  {
					closedCount++;
					curPosition = tmpPos2 + tagEndStr.length;
				}
			} while(openedCount != closedCount);
			return startIndex + curPosition;
		}
	},

	// text specific functions
	indent: function(code, size) {
		// indent code using tabs
		var codeData = code.split('\n');
		var indentText = '', rebuiltCode = '', indentSize = size || 1;
		indentText = (new Array(indentSize + 1)).join('\t');
		for(i = 0; i < codeData.length; i++) {
			rebuiltCode += indentText + codeData[i] + (i < codeData.length - 1 ? '\n' : '');
		}
		return rebuiltCode;
	},
	unindent: function(code) {
		// remove unneeded lines and unindent code
		var trimmedCode = code.replace(/(^[\s]*[\n])|([\s\n]+$)/gi, '');
		var minIndentSize = /(^\t+)/gi.exec(trimmedCode);
		if(minIndentSize) {
			minIndentSize = minIndentSize[0].length;
			return trimmedCode.replace(new RegExp('(^|[\\n])([\\t]{' + minIndentSize + '})', 'gi'), '$1');
		}
		return code;
	},
	fixCodeIndent: function(code) {
		// fix first XML line indentation and unindent code if possible
		var codeStrings = code.split(code.indexOf('\n') != -1 ? '\n' : '\r'); // handle different OS \r\n
		var lastLine = codeStrings[codeStrings.length - 1];
		var minIndentSize = /(^\t+)/gi.exec(lastLine);
		if(codeStrings.length > 1 && minIndentSize) {
			codeStrings[0] = minIndentSize[0] + codeStrings[0];
			return this.unindent(codeStrings.join('\n'));
		}
		return code;
	}
};