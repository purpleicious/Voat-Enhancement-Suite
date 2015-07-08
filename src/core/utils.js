/*
	common utils/functions for modules
*/

Utils = {
	css: '',
	addCSS: function(css) {
		this.css += css;
	},
	// create and add VES's CSS to <head>
	applyCSS: function(css, id) {
		var style = el('style', {
			id: id,
			textContent: css
		});
		asap((function() {
			return doc.head;
		}), function() {
			return add(doc.head, style);
		});
		return style;
	},

	regexes: {
		all: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\//i,
		inbox: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/messaging\/([\w\.\+]+)\//i,
		comments: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)\/comments\/([\w\.\+]+)/i,
		commentPermalink: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)\/comments\/([0-9]+)\/([0-9]+)/i,
		profile: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/user\/([\w\.\+]+)/i,
		prefs: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/account\/manage/i,
		//search:
		submit: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/(?:[\-\w\.]+\/)?submit/i,
		subverse: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)/i,
		subversePostListing: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)(?:\/(new|rising|controversial|top))?\/?(?:\?.*)?$/i,
		subverseSettings:  /^https?:\/\/(?:[\-\w\.]+\.)?voat.co\/(?:v\/[\-\w\.]+\/)?about\/edit/i,
		api: /^https?:\/\/(?:[\-\w\.]+\.)?voat.co\/api\//i
	},
	isVoat: function() {
		var currURL = location.href;
		return Utils.regexes.all.test(currURL);
	},
	isMatchURL: function(module) {
		if (!Utils.isVoat()) {
			return false;
		}
		var module = Modules[module];
		if (!module) {
			console.warn("isMatchURL could not find module", module);
			return false;
		}

		var exclude = module.exclude,
			include = module.include;
		return Utils.matchesPageLocation(include, exclude);
	},
	matchesPageLocation: function(includes, excludes) {
		includes = typeof includes === 'undefined' ? [] : [].concat(includes);
		excludes = typeof excludes === 'undefined' ? [] : [].concat(excludes);

		var excludesPageType = excludes.length && (Utils.isPageType.apply(Utils, excludes) || Utils.matchesPageRegex.apply(Utils, excludes));
		if (!excludesPageType) {
			var includesPageType = !includes.length || Utils.isPageType.apply(Utils, includes) || Utils.matchesPageRegex.apply(Utils, includes);
			return includesPageType;
		}
	},
	//pageTypeSaved,
	pageType: function() {
		if (typeof this.pageTypeSaved === 'undefined') {
			var pageType = '';
			var currURL = location.href;
			if (Utils.regexes.profile.test(currURL)) {
				pageType = 'profile';
			} else if (Utils.regexes.comments.test(currURL)) {
				pageType = 'comments';
			} else if (Utils.regexes.inbox.test(currURL)) {
				pageType = 'inbox';
			} else if (Utils.regexes.submit.test(currURL)) {
				pageType = 'submit';
			} else if (Utils.regexes.subverse.test(currURL)) {
				pageType = 'subverse';
			} else if (Utils.regexes.prefs.test(currURL)) {
				pageType = 'prefs';
			} else if (Utils.regexes.api.test(currURL)) {
				pageType = 'api';
			} else {
				pageType = 'linklist';
			}
			this.pageTypeSaved = pageType;
		}
		return this.pageTypeSaved;
	},
	isPageType: function(/*type1, type2*/) {
		var thisPage = Utils.pageType();
		return Array.prototype.slice.call(arguments).some(function(e) {
			return (e === 'all') || (e === thisPage);
		});
	},
	matchesPageRegex: function(/*type1, type2, type3*/) {
		var href = document.location.href;
		return Array.prototype.slice.call(arguments).some(function(e) {
			return e.text && e.test(href);
		});
	},
	getURLParams: function() {
		var result = {}, queryString = location.search.substring(1),
			re = /([^&=]+)=([^&]*)/g, m = re.exec(queryString);
		while (m) {
			result[decodeURLComponent(m[1])] = decodeURLComponent(m[2]);
		}
		return result;
	},
	currentSubverse: function(check) {
		if (typeof this.currSub === 'undefined') {
			var match = location.href.match(Utils.regexes.subverse);
			if (match !== null) {
				this.currSub = match[1];
				if (check) return (match[1].toLowerCase() === check.toLowerCase());
				return match[1];
			} else {
				if (check) return false;
				return null;
			}
		} else {
			if (check) return (this.currSub.toLowerCase() === check.toLowerCase());
			return this.currSub;
		}
	},
	sortType: function() { // hot, new, top
		if (typeof this.sortTypeCached === 'undefined') {
			// TODO
		}
		return this.sortTypeCached;
	},
	subverseForElement: function(element) {
		var submission = $(element).closest('.submission');
		if (!submission.length) return;

		var subverseElement = submission.find('.subverse');

		if (!subverseElement.length) {
			subverseElement = submission.find('.tagline a').filter(function() {
				return Utils.regexes.subverse.test(this.href);
			});
		}

		if (subverseElement.length) {
			subverseElement = $('.sitetable .link .subverse');
		}

		if (subverseElement.length) {
			return subverseElement[0].href.match(Utils.regexes.subverse)[1];
		}
	},
	getXYpos: function (obj) {
		var topValue= 0,leftValue= 0;
		while(obj){
			leftValue+= obj.offsetLeft;
			topValue+= obj.offsetTop;
			obj= obj.offsetParent;
		}
		finalvalue = { 'x': leftValue, 'y': topValue };
		return finalvalue;
	},
	getHeaderOffset: function() {
		if (typeof(this.headerOffset) == 'undefined') {
			this.headerOffset = 0;
			switch (Modules.voatingBooth.options.pinHeader.value) {
				case 'none':
					break;
				case 'sub':
					this.theHeader = document.querySelector('#sr-header-area');
					break;
				case 'header':
					this.theHeader = document.querySelector('#header');
					break;
			}
			if (this.theHeader) {
				this.headerOffset = this.theHeader.offsetHeight + 6;
			}
		}
		return this.headerOffset;
	},
	elementInViewport: function (obj) {
		// check the headerOffset - if we've pinned the subverse bar, we need to add some pixels so the "visible" stuff is lower down the page.
		var headerOffset = this.getHeaderOffset();
		var top = obj.offsetTop - headerOffset;
		var left = obj.offsetLeft;
		var width = obj.offsetWidth;
		var height = obj.offsetHeight;
		while(obj.offsetParent) {
			obj = obj.offsetParent;
			top += obj.offsetTop;
			left += obj.offsetLeft;
		}
		return (
			top >= window.pageYOffset &&
			left >= window.pageXOffset &&
			(top + height) <= (window.pageYOffset + window.innerHeight - headerOffset) &&
			(left + width) <= (window.pageXOffset + window.innerWidth)
		);
	},
	stripHTML: function(str) {
		var regex = /<\/?[^>]+>/gi;
		str = str.replace(regex, '');
		return str;
	},
	sanitizeHTML: function(htmlStr) {
		return window.Pasteurizer.safeParseHTML(htmlStr).wrapAll('<div></div>').parent().html();
	},
	firstValid: function() {
		for (var i = 0, len = arguments.length; i < len; i++) {
			var argument = arguments[i];

			if (argument === void 0) continue;
			if (argument === null) continue;
			if (typeof argument === 'number' && isNaN(argument)) continue;

			return argument;
		}
	},
	click: function(obj, btn) {
		var evt = document.createEvent('MouseEvents');
		btn = btn || 0;
		evt.initMouseEvent('click', true, true, window.wrappedJSObject, 0, 1, 1, 1, 1, false, false, false, false, button, null);
		obj.dispatchEvent(evt);
	},
	mousedown: function(obj, btn) {
		var evt = document.createEvent('MouseEvents');
		btn = btn || 0;
		evt.initMouseEvent('mousedown', true, true, window.wrappedJSObject, 0, 1, 1, 1, 1, false, false, false, false, button, null);
		obj.dispatchEvent(evt);
	},
	elementUnderMouse: function(obj) {
		// TODO
	},
	isDarkMode: function() {
		// check if isDarkMode has been run already
		if (typeof(this.isDarkModeCached) != 'undefined') return this.isDarkModeCached;

		this.isDarkModeCached = $('body').hasClass('dark');
		return this.isDarkModeCached;
	},
};
