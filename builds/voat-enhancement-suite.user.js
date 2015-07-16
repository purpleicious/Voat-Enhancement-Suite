// ==UserScript==
// @name        Voat Enhancement Suite
// @version     0.0.4a
// @description A suite of tools to enhance Voat.
// @namespace   http://tjg.io/Voat-Enhancement-Suite
// @author      @travis <travisjgrammer@gmail.com>
// @license     GPL; https://github.com/travis-g/Voat-Enhancement-Suite/blob/master/LICENSE
// @match       *://voat.co/*
// @match       *://*.voat.co/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_openInTab
// @run-at      document-start
// @require     http://code.jquery.com/jquery-1.11.3.min.js
// @updateURL   voat-enhancement-suite.meta.js
// @downloadURL voat-enhancement-suite.user.js
// ==/UserScript==

/*
*	Voat Enhancement Suite - Version 0.0.4a - 2015-07-15
*
*	Licensed under GNU General Public License.
*	https://github.com/travis-g/Voat-Enhancement-Suite/blob/master/LICENSE
*
*	Voat Enhancement Suite Copyright © 2015-2015 @travis <travisjgrammer@gmail.com>
*	https://github.com/travis-g/Voat-Enhancement-Suite/
*	Reddit Enhancement Suite Copyright © 2010-2015 honestbleeps <steve@honestbleeps.com>
*	https://github.com/honestbleeps/Reddit-Enhancement-Suite/
*
*	This program is free software: you can redistribute it and/or modify
*	it under the terms of the GNU General Public License as published by
*	the Free Software Foundation, either version 3 of the License, or
*	(at your option) any later version.
*
*	This program is distributed in the hope that it will be useful,
*	but WITHOUT ANY WARRANTY; without even the implied warranty of
*	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*	GNU General Public License for more details.
*
*	You should have received a copy of the GNU General Public License
*	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var G = { // globals
	v: '0.0.4a',
	namespace: 'VES.',
	name: 'Voat Enhancement Suite',
	abbr: 'VES'
};


// shortening
var doc = document,
	cli = console;

// isolate VES's jQuery instance from Voat's
this.$ = this.jQuery = jQuery.noConflict(true);


// test for unsafeWindow, signaling Grease/Tampermonkey
if (typeof(unsafeWindow) !== 'undefined') {
	localStorage = unsafeWindow.localStorage;
}


/*
	global utils
*/

// create JSON data from key/val pair
item = function(key, val) {
	var item = {};
	item[key] = val;
	return item;
};

// wait until test can be done and then perform a callback
asap = function(test, callback) {
	if (test()) {
		return callback();
	} else {
		// if you can't do test, wait and try again
		return setTimeout(asap, 25, test, callback);
	}
};


// DOM utilities

// create a new element with a list of properties
//@TODO replace this with regular jQuery
el = function(tag, props) {
	var el = doc.createElement(tag);
	// if a JSON of properties is passed in, apply them
	if (props) {
		$.extend(el, props);
	}
	return el;
};
// alias for getElementById()
id = function(id) {
	return doc.getElementById(id);
};

fragment = function() {
	return doc.createDocumentFragment();
};
nodes = function(nodes) {
	// if just one node return it
	if (!(nodes instanceof Array)) {
		return nodes;
	}
	// if theres a bunch, create a new section of document,
	// then add all of the nodes as sibilings
	var frag = fragment();
	for (var i = 0, len = nodes.length; i < len; i++) {
		var node = nodes[i];
		frag.appendChild(node);
	}
	return frag;
};

add = function(parent, el) {
	return $(parent).append(nodes(el));
};
prepend = function(parent, el) {
	return $(parent).insertBefore(nodes(el), parent.firstChild);
};
after = function(root, el) {
	return root.parentNode.insertBefore(nodes(el), root.nextSibiling);
};
before = function(root, el) {
	return root.parentNode.insertBefore(nodes(el), root);
};

// create a custom event
event = function(event, detail, root) {
	// OR function(event, detail), if root is document
	if (root === null) {
		root = doc;
	}
	if ((detail !== null) && typeof cloneInto === 'function') {
		detail = cloneInto(detail, doc.defaultView);
	}
	return root.dispatchEvent(new CustomEvent(event, {
		bubbles: true,
		detail: detail
	}));
};

// limit the rate the a function can fire at, so
// browser performance is maintained
debounce = function(wait, func) {
	var args = null;
	var lastCall = 0;
	var timeout = null;
	var that = null;
	var exec = function() {
		lastCall = Date.now();
		return func.apply(that, args);
	};
	return function() {
		args = arguments;
		that = this;
		// if enough time has passed exec the function
		if (lastCall < Date.now() - wait) {
			return exec();
		}
		clearTimeout(timeout);
		timeout = setTimeout(exec, wait);
		return timeout;
	};
};


// sanitize HTML
escape = (function() {
	var str = {
		'&': '&amp;',
		'"': '&quot;',
		"'": '&#039;',
		'<': '&lt;',
		'>': '&gt;'
	};
	var regex = /[&"'<>]/g;
	var fn = function(x) {
		return str[x];
	};
	return function(text) {
		return String.prototype.replace.call(text, regex, fn);
	};
})();

// don't kill everything if a JSON parse fails
JSON.safeParse = function(data, storageSource, silent) {
	try {
		return JSON.parse(data);
	} catch (e) {
		if (silent) return {};
		if (storageSource) {
			cli.error('Error caught: JSON parse fail on \'' + data + '\' from ' + storageSource);
			//cli.error('Storing and deleting corrupt data.');
			set(storageSource + '.error', data);
		} else {
			cli.error('Error caught: JSON parse failed on: ' + data);
		}
		return {};
	}
};


// keycodes
var KEY = {
	BACKSPACE: 8,
	TAB: 9,
	ENTER: 13,
	ESCAPE: 27,
	SPACE: 32,
	PAGE_UP: 33,
	PAGE_DOWN: 34,
	END: 35,
	HOME: 36,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	NUMPAD_ENTER: 108,
	COMMA: 188
};

var Utils = {};

var Modules = [];

// GreaseMonkey API compatibility for non-GM browsers (Chrome, Safari, Firefox)
// @copyright       2009, 2010 James Campos
// @modified        2010 Steve Sobel - added some missing gm_* functions
// @modified        2015 Travis Grammer - interact with storage via JSON
// @license         cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
if ((typeof GM_deleteValue == 'undefined') || (typeof GM_addStyle == 'undefined')) {
	var GM_getValue = function(name, defaultValue) {
		var value = localStorage[name];
		// do not use '===' (ignore JSHint)
		return value == null ? defaultValue : JSON.parse(value);
	};

	var GM_setValue = function(name, value) {
		localStorage[name] = JSON.stringify(value);
	};

	var GM_deleteValue = function(name) {
		localStorage.removeItem(name);
	};

	var GM_addStyle = function(css) {
		var style = document.createElement('style');
		style.textContent = css;
		var head = document.getElementsByTagName('head')[0];
		if (head) {
			head.appendChild(style);
		}
	};

	var GM_log = function(message) {
		console.log(message);
	};

	var GM_openInTab = function(url) {
		window.open(url);
	};

	// GM_listValues
	// GM_xmlhttpRequest
}

// get values from storage and perform a callback with them
get = function(key, val, callback) {
// OR function(key, callback), if val isn't specified
// OR function(key, val), if val isn't a function
// OR function(key)
	var data; // the data that's found

	// if val is specified use it as a fallback/default
	if ((typeof callback === 'function') || (typeof val !== 'function')) {
		data = GM_getValue(key, val);
	} else {
		callback = val;
		data = GM_getValue(key);
	}

	if (data) {
		// if something was found parse it
		//data = safeJSON(data);
	}
	// perform the specified callback
	if (callback) return callback(data);
	return data;
};

// set values to GM/localStorage
set = (function() {
	var set = function(key, val) {
		//val = JSON.stringify(val);
		return GM_setValue(key, val);
	};
	// this is the actual definition of set():
	return function(keys, val) {
		if (typeof keys === 'string') {
			// set the value if there's only one key
			set(keys, val);
			return;
		}
		// if it's a JSON, iterate & set each key
		for (var key in keys) {
			val = keys[key];
			set(key, val);
		}
	};
})();

// remove data from GM/localStorage
_delete = function(keys) {
	if (!(keys instanceof Array)) { // we'll want an array
		keys = [keys];
	}
	// delete each key:
	for (var i = 0, len = keys.length; i < len; i++) {
		var key = keys[i];
		// purge the key's data
		localStorage.removeItem(key);
		GM_deleteValue(key);
	}
};

function testLocalStorage() {
	var accessible = true;

	try {
		localStorage.setItem('VES.test', 'test');
		GM_setValue('VES.test', 'test');
		localStorage.removeItem('VES.test');
		GM_deleteValue('VES.test');
	} catch (e) {
		accessible = false;
	}

	if (!(accessible)) {
		cli.err('localStorage is unavailable. Are you in a private session?');
		cli.warn('VES will run using sessionStorage (no changes will persist).');
		localStorage = sessionStorage || unsafeWindow.sessionStorage;
	}
}

// register the OS, browser, and so on.
var System = {
	init: function() {
		this.browser = this.searchString(this.dataBrowser) || "unknown browser";
		this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "unknown version";
		this.OS = this.searchString(this.dataOS) || "unknown OS";
	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++) {
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{
			string: navigator.userAgent,
			subString: "Chrome",
			identity: "Chrome"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari",
			versionSearch: "Version"
		},
		{
			prop: window.opera,
			identity: "Opera",
			versionSearch: "Version"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			   string: navigator.userAgent,
			   subString: "iPhone",
			   identity: "iPhone/iPod"
		},
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]
};
System.init();

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

var SettingsConsole = '';
var OptionsPanels = [];
Options = {
	defaultPrefs: {
		'debug': true,
		'hideChildComments': true,
		'singleClick': true,
		'userTags': false,
		'voatingBooth': false,
		'voatingNeverEnds': false,
	},
	resetModulePrefs: function() {
		this.setModulePrefs(this.defaultPrefs);
		return this.defaultPrefs;
	},
	getAllModulePrefs: function(force) {
		/*	getAllModulePrefs should only be run compeletely once, and then
			it should return a cache of preferences (unless forced).	*/
		var storedPrefs;

		// don't repeat if we've done this already
		if ((!force) && (typeof(this.getAllModulePrefsCached) != 'undefined')) {
			return this.getAllModulePrefsCached;
		}

		// add our settings to the defaults, in case something new has been added
		get('modulePrefs', function(items) {
			$.extend(Options.defaultPrefs, items);
		});
		// cache our hybrid settings
		storedPrefs = Options.defaultPrefs;
		// save our settings to storage
		this.setModulePrefs(storedPrefs);

		// create an array to return all prefs
		var prefs = {};
		for (var module in Modules) {
			if (storedPrefs[module]) {
				// the module preferences had been cached, so look there
				prefs[module] = storedPrefs[module];
			} else if (!Modules[module].disabledByDefault && (storedPrefs[module] === null || module.alwaysEnabled)) {
				// the module's prefs weren't cached and it should be enabled
				prefs[module] = true;
			} else {
				prefs[module] = false;
			}
		}

		// cache the prefs so we won't have to pull them all again
		this.getAllModulePrefsCached = prefs;
		return prefs;
	},
	getModulePrefs: function(module) {
		if (module) {
			var prefs = this.getAllModulePrefs();
			return prefs[module];
		} else {
			alert('no module name specified for getModulePrefs');
		}
	},
	setModulePrefs: function(prefs) {
		if (prefs !== null) {
			set('modulePrefs', prefs);
			return prefs;
		} else {
			cli.error('setModulePrefs: no prefs specified');
		}
	},
	setOption: function(module, optionName, optionValue) {
		if (/_[\d]+$/.test(optionName)) {
			optionName = optionName.replace(/_[\d]+$/, '');
		}
		var thisOptions = this.getOptions(module);
		if (!thisOptions[optionName]) {
			console.warn('Could not find option', module, optionName);
			return false;
		}

		var saveOptionValue;
		if (optionValue === '') {
			saveOptionValue = '';
		} else if ((isNaN(optionValue)) || (typeof optionValue === 'boolean') || (typeof optionValue === 'object')) {
			saveOptionValue = optionValue;
		} else if (optionValue.indexOf('.') !== -1) {
			saveOptionValue = parseFloat(optionValue);
		} else {
			saveOptionValue = parseInt(optionValue, 10);
		}
		thisOptions[optionName].value = saveOptionValue;
		// save it to the object and to VESStorage
		Options.saveModuleOptions(module, thisOptions);
		return true;
	},
	saveModuleOptions: function(module, newOptions) {
		function minify(obj) {
			var min = {};
			if (obj) {
				for (var key in obj) {
					if ('value' in obj[key]) {
						min[key] = {value: obj[key].value};
					}
				}
			}
			return min;
		}
		if (newOptions) {
			Modules[module].options = newOptions;
		}
		set('options.' + module, minify(Modules[module].options));
	},
	enableModule: function(id, toState) {
		var module = Modules[id];
		if (!module) {
			cli.warn('module not found', id);
			return;
		}
		if (module.alwaysOn && !toState) {
			return;
		}

		var prefs = this.getAllModulePrefs(true);
		prefs[id] = !! toState;
		this.setModulePrefs(prefs);
		if (typeof module.onToggle === 'function') {
			Modules[id].onToggle(toState);
		}
	},
	getOptionsFirstRun: [],
	getOptions: function(module) {
		//cli.log('Running getOptions(' + module + ')');
		if (this.getOptionsFirstRun[module]) {
			// we've gotten the module's options before
			return Modules[module].options;
		}
		var thisOptions = get('options.' + module);
		if ((thisOptions) && (thisOptions !== 'undefined') && (thisOptions !== null)) {
			// merge options (in case new ones were added via code)
			var storedOptions = thisOptions;
			var moduleOptions = Modules[module].options;

			// TODO replace this section with extend()?
			var newOption = false; // track if there's a new option
			for (var attrname in moduleOptions) {
				moduleOptions[attrname].default = moduleOptions[attrname].value;
				if (typeof storedOptions[attrname] === 'undefined') {
					newOption = true; // a new option was found
				} else {
					moduleOptions[attrname].value = storedOptions[attrname].value;
				}
			}
			// this modifies the module's options in memory
			Modules[module].options = moduleOptions;
			if (newOption) {
				Options.saveModuleOptions(module);
			}
		} else {
			// there wasn't anything in storage about the module, so set defaults
			Options.saveModuleOptions(module);
		}
		// mark that we've run the module
		this.getOptionsFirstRun[module] = true;
		return Modules[module].options;
	},

	container: SettingsConsole,

	// the two settings panels
	ModulesPanel: el('div', { id: 'VESPanelModulesPane'}),
	OptionsPanel: el('div', { id: 'VESPanelOptions'}),

	create: function() {
		cli.log('create options dialog...');
		SettingsConsole = el('div', {
			id: 'VESSettingsConsole'
		});
		SettingsHeader = el('div', {
			id: 'VESSettingsHeader'
		});
		SettingsTitleBar = el('div', {
			id: 'VESSettingsTitleBar',
			innerHTML: 'Voat Enhancement Suite'
		});
		add(SettingsHeader, SettingsTitleBar);
		/*var menuItems = new Array('Enable Modules', 'Module Options');
		Menu = el('ul', { id: 'Menu' });
		for (var item in menuItems) {
			var thisMenuItem = el('li', {
				innerHTML: menuItems[item],
				id: menuItems[item] + ' Menu'
			});
			thisMenuItem.addEventListener('click', function(e) {
				e.preventDefault();
				Options.menuClick(this);
			}, true);
			add(Menu, thisMenuItem);
		}
		add(OptionsHeader, Menu);*/
		add(SettingsConsole, SettingsHeader);

		SettingsContent = el('div', { id: 'VESSettingsContent' });
		add(SettingsConsole, SettingsContent);

		this.drawModulesPanel();
		this.drawOptionsPanel();

		OptionsPanels = SettingsContent.querySelectorAll('div');
		$(doc.body).append(SettingsConsole);
	},
	drawModulesPanel: function() {
		cli.log('drawing modules panel');
		ModulesPanel = this.ModulesPanel;
		var prefs = this.getAllModulePrefs();
		var html = '';
		for (i in Modules) {
			(prefs[i]) ? checked = 'CHECKED' : checked = '';
			if (typeof Modules[i] !== 'undefined') {
				desc = Modules[i].description;
				html += '<p class="moduleListing"><label for="'+i+'">' + Modules[i].moduleName + ':</label> <input type="checkbox" name="'+i+'" '+checked+' value="true"> <span class="moduleDescription">'+desc+'</span></p>';
			}
		}
		ModulesPanel.innerHTML = html;
		var ModulesPanelButtons = el('span', { id: 'ModulesPanelButtons' });

		// create the save preferences button
		var saveButton = el('input', {
			id: 'savePrefs',
			type: 'button',
			name: 'savePrefs',
			value: 'save'
		});
		saveButton.addEventListener('click', function(e) {
			e.preventDefault();
			cli.log('Saving module prefs');
			// get the new enabled/disabled status of modules
			var checkboxes = $('input[type=checkbox]', Options.ModulesPanel);
			var prefs = {};
			for (i = 0, len = checkboxes.length; i < len; i++) {
				var name = checkboxes[i].getAttribute('name');
				var checked = checkboxes[i].checked;
				prefs[name] = checked;
			}
			// apply the new statuses
			Options.setModulePrefs(prefs);
			Options.close();
		}, true);
		add(ModulesPanelButtons, saveButton);

		// create the reset preferences button
		var resetButton = el('input', {
			id: 'resetPrefs',
			type: 'button',
			name: 'resetPrefs',
			value: 'Reset to default'
		});
		resetButton.addEventListener('click', function(e) {
			e.preventDefault();
			Options.resetModulePrefs();
		}, true);
		add(ModulesPanelButtons, resetButton);

		add(ModulesPanel, ModulesPanelButtons);
		var clearfix = el('p', {
			className: 'clear',
			style: 'display: block'
		});
		add(ModulesPanel, clearfix);
		add(SettingsContent, ModulesPanel);
	},
	drawOptionsPanel: function() {
		cli.log('drawing options panel');
		OptionsPanel = el('div', {
			id: 'VESPanelOptions',
		});
		optionsPanelLabel = el('label', {
			'for': 'OptionsPanelSelector',
			innerHTML: 'Configure module:'
		});
		add(OptionsPanel, optionsPanelLabel);
		this.optionsPanelSelector = el('select', { id: 'OptionsPanelSelector' });
		option = el('option', {
			value: '',
			innerHTML: 'Select Module'
		});
		add(this.optionsPanelSelector, option);

		// create entries for each module
		for (i in Modules) {
			option = el('option', {
				value: Modules[i].module,
				innerHTML: Modules[i].moduleName
			});
			add(this.optionsPanelSelector, option);
		}

		this.optionsPanelSelector.addEventListener('change', function(e) {
			module = this.options[this.selectedIndex].value;
			if (module !== '') {
				Options.drawConfigOptions(module);
			}
		}, true);

		add(OptionsPanel, this.optionsPanelSelector);
		PanelOptions = el('div', { id: 'VESPanelOptions' });
		add(OptionsPanel, PanelOptions);
		add(SettingsContent, OptionsPanel);
	},
	drawOptionInput: function(moduleID, optionName, optionObject, isTable) {
		switch(optionObject.type) {
			case 'text':
				// text...
				var ele = doc.createElement('input');
				ele.setAttribute('id', optionName);
				ele.setAttribute('type','text');
				ele.setAttribute('moduleID',moduleID);
				ele.setAttribute('value',optionObject.value);
				break;
			case 'password':
				// password...
				var ele = doc.createElement('input');
				ele.setAttribute('id', optionName);
				ele.setAttribute('type','password');
				ele.setAttribute('moduleID',moduleID);
				ele.setAttribute('value',optionObject.value);
				break;
			case 'boolean':
				// checkbox
				var ele = doc.createElement('input');
				ele.setAttribute('id', optionName);
				ele.setAttribute('type','checkbox');
				ele.setAttribute('moduleID',moduleID);
				ele.setAttribute('value',optionObject.value);
				if (optionObject.value) {
					ele.setAttribute('checked',true);
				}
				break;
			case 'enum':
				// radio buttons
				if (typeof(optionObject.values) == 'undefined') {
					alert('misconfigured enum option in module: ' + moduleID);
				} else {
				var ele = doc.createElement('div');
				ele.setAttribute('id', optionName);
					ele.setAttribute('class','enum');
					for (var j=0;j<optionObject.values.length;j++) {
						//var thisValue = optionObject.values[j].value;
						var subEle = doc.createElement('input');
						subEle.setAttribute('id', optionName+'-'+j);
						subEle.setAttribute('type','radio');
						subEle.setAttribute('name',optionName);
						subEle.setAttribute('moduleID',moduleID);
						subEle.setAttribute('value',optionObject.values[j].value);
						if (optionObject.value == optionObject.values[j].value) {
							subEle.setAttribute('checked','checked');
						}
						var subEleText = document.createTextNode(optionObject.values[j].name + ' ');
						ele.appendChild(subEle);
						ele.appendChild(subEleText);
					}
				}
				break;
			case 'keycode':
				// keycode - shows a key value, but stores a keycode and possibly shift/alt/ctrl combo.
				var ele = doc.createElement('input');
				ele.setAttribute('id', optionName);
				ele.setAttribute('type','text');
				ele.setAttribute('class','keycode');
				ele.setAttribute('moduleID',moduleID);
				ele.setAttribute('value',optionObject.value);
				break;
			default:
				console.log('misconfigured option in module: ' + moduleID);
				break;
		}
		if (isTable) {
			ele.setAttribute('tableOption','true');
		}
		return ele;
	},
	drawConfigOptions: function(module) {
		cli.log('drawing config options for ' + module);
		var options = Options.getOptions(module);
		var count = 0;
		$.extend(OptionsPanel, {
			style: 'display: block',
			innerHTML: ''
		});
		for (i in options) {
			if (!(options[i].noconfig)) {
				count++;
				var optionContainer = el('div', { className: 'optionContainer' });
				var label = el('label', {
					'for': i,
					innerHTML: i
				});
				add(optionContainer, label);
				optionDescription = el('div', {
					className: 'optionDescription',
					innerHTML: options[i].description
				});

				// for table options
				if (options[i].type === 'table') {
					if (typeof options[i].fields === 'undefined') {
						cli.log('Misconfigured table option in ' + module);
					} else {
						var fields = [];
						var table = el('table', { className: 'optionsTable' });
						table.setAttribute('module', module);
						table.setAttribute('optionName', i);
						// create the table head
						var head = el('thead');
						add(table, head);
						var header = el('tr');
						// get/add all the field names
						for (var j = 0; j < options[i].fields.length; j++) {
							fields[j] = options[i].fields[j].name;
							var headCell = el('th', { innerHTML: options[i].fields[j].name });
							add(header, headCell);
						}
						add(head, header); // add the header elements to the head
						add(table, head); // add the table head to the table

						// create the table body
						var body = el('tbody', { id: 'tbody_'+i });
						for (var j = 0; j < options[i].value.length; j++) {
							var row = el('tr');
							for (var k = 0; k < options[i].fields.length; k++) {
								// create the table cell's data
								opt = options[i].fields[k];
								opt.value = options[i].value[j][k];
								var optionName = opt.name + '_' + j;
								// get the HTML for the cell
								var html = this.drawOptionInput(module, optionName, opt, true);

								var cell = el('td');
								add(cell, html); // add the HTML to the cell
								add(row, cell); // add the cell to the row
							}
							add(body, row); // add the row to the table body
						}
						add(table, body); // add the table body to the table
						var ele = table;
						cli.log(table);
					}
					add(optionContainer, optionDescription);
					add(optionContainer, ele);

					// "add row" button
					var button = el('input', {
						type: 'button',
						value: 'Add Row',
					});
					button.setAttribute('optionName', i);
					button.setAttribute('module', module);
					button.addEventListener('click', function() {
						var optionName = this.getAttribute('optionName');
						cli.log(optionName);
						var body = id('tbody_' + optionName); // get the option table body
						var row = el('tr');
						for (var i = 0, len = Modules[module].options[optionName].fields.length; i < len; i++) {
							var cell = el('td');
							var opt = Modules[module].options[optionName].fields[i];
							opt.value = '';
							var input = Options.drawOptionInput(module, optionName, opt, true);
							add(cell, input); // add the input area to the cell
							add(row, cell); // add the cell to the row
						}
						add(body, row); // add the row to the table
					}, true);
					add(optionContainer, button);
				} else {
					var ele = this.drawOptionInput(module, i, options[i]);
					cli.log('drawn element to be added: ' + $(ele));
					add(optionContainer, ele);
					add(optionContainer, optionDescription);
				}
				add(OptionsPanel, optionContainer); // add the options to the panel
			}
		}

		// TODO keycode processing

		var saveButton = el('input', {
			id: 'optionsSave',
			type: 'button',
			value: 'save'
		});
		saveButton.addEventListener('click', function(e) {
			e.preventDefault();
			cli.log('Saving module config');
			var optionsDiv = id('OptionsPanel');
			var inputs = $('input', optionsDiv); // get all the inputs
			for (var i = 0, len = inputs.length; i < len; i++) {
				cli.log(inputs[i]);
				if ((inputs[i].getAttribute('type') != 'button') && (inputs[i].getAttribute('displayonly') != 'true') && (inputs[i].getAttribute('tableOption') != 'true')) {
					if (inputs[i].getAttribute('type') === 'radio') {
						var optionName = inputs[i].getAttribute('name');
					} else {
						var optionName = inputs[i].getAttribute('id');
					}
					var module = inputs[i].getAttribute('moduleID');
					cli.log(module);
					if (inputs[i].getAttribute('type') === 'checkbox') {
						(inputs[i].checked) ? value = true : value = false;
					} else if (inputs[i].getAttribute('type') === 'radio') {
						if (inputs[i].checked) {
							var value = inputs[i].value;
						}
					} else {
						// check for keycode
						if ($(inputs[i]).hasClass('keycode')) {
							var tmp = inputs[i].value.split(',');
							// convert the internal values of this array into their respective types (int, bool, bool, bool)
							var value = Array(parseInt(tmp[0]), (tmp[1] == 'true'), (tmp[2] == 'true'), (tmp[3] == 'true'), (tmp[4] == 'true'));
						} else {
							var value = inputs[i].value;
						}
					}
					if (typeof value != 'undefined') {
						cli.log('Setting options for ' + module);
						Options.setOption(module, optionName, value);
					}
				}
			}
			// check for tables
			var tables = $('.optionsTable', optionsDiv);
			if (typeof tables !== 'undefined') {
				for (i = 0, len = tables.length; i < len; i++) {
					var module = tables[i].getAttribute('module');
					var optionName = tables[i].getAttribute('optionName');
					cli.log(optionName);
					var body = $('tbody', tables[i]);
					var rows = $('tr', body);
					cli.log(rows.length);
					if (typeof rows !== 'undefined') {
						var optMatrix = [];
						for (j = 0; j < rows.length; j++) {
							var row = [];
							var inputs = $('input', rows[j]);
							var blank = true;
							for (var k = 0; k < inputs.length; k++) {
								var module = inputs[k].getAttribute('module');
								if (inputs[k].getAttribute('type') === 'checkbox') {
									(inputs[k].checked) ? value = true : value = false;
								} else if (inputs[k].getAttribute('type') === 'radio') {
									if (inputs[k].checked) {
										var value = inputs[k].value;
									}
								} else {
									// check for keycode
									if ($(inputs[k]).hasClass('keycode')) {
										var tmp = inputs[k].value.split(',');
										// convert the internal values of this array into their respective types (int, bool, bool, bool)
										var value = Array(parseInt(tmp[0]), (tmp[1] == 'true'), (tmp[2] == 'true'), (tmp[3] == 'true'), (tmp[4] == 'true'));
									} else {
										var value = inputs[k].value;
									}
								}
								if (value != '') {
									blank = false;
								}
								row[k] = value;
							}
							if ((!blank) && (row !== null)) {
								optMatrix[j] = row;
							}
						}
						if (optMatrix === null) {
							optMatrix = [];
						}
						if (typeof value !== 'undefined') {
							cli.log(optMatrix);
							Options.setOption(module, optionName, optMatrix);
						}
					}
				}
			}

			// show status on save
			var status = id('optionsSaveStatus');
			$.extend(status, {
				innerHTML: 'Saved.',
				style: 'display: block; opacity: 1'
			});
			//Utils.fadeOut(status, 0.1);
		}, true);
		add(OptionsPanel, saveButton);
		// save indicator
		var saveStatus = el('div', {
			id: 'optionsSaveStatus',
			className: 'saveStatus'
		});
		add(OptionsPanel, saveStatus);
		if (count === 0) {
			OptionsPanel.innerHTML = 'There are no configurable options for this module.';
		}
	},
	addOptionsLink: function() {

		var menu = $('#header-account > .logged-in');
		if (menu) {
			var prefsLink = $('#manage', menu);
			var separator = el('span', {
				className: 'separator',
				innerHTML: '|'
			});
			var OptionsEntry = el('span', {
				className: 'user'
			});
			this.OptionsLink = el('a', {
				title: 'Voat Enhancement Suite',
				id: 'VESOptionsLink',
				href: 'javascript:void(0)',
				innerHTML: 'VES'
			});
			this.OptionsLink.addEventListener('click', function(e) {
				e.preventDefault();
				Options.open();
			}, true);
			$(OptionsEntry).append(this.OptionsLink);
			prefsLink.parent().after(OptionsEntry);
			prefsLink.parent().after(separator);
		}
		Options.create();
	},
	open: function() {
		cli.log('openning options menu');
		// trigger Voat's builtin #modal-background
		// show SettingsConsole
		SettingsConsole.setAttribute('style', 'display: block');
		// Options.menuClick(MenuItems[0]);
	},
	close: function() {
		cli.log('closing options menu');
		// hide Voat's modal again
		SettingsConsole.setAttribute('style', 'display: none');
	},
	menuClick: function(item) {
		menu = item.id;
		cli.log(menu + ' was clicked');
		$.each(MenuItems, function(index, item) {
			$(item).removeClass('open');
		});
		$(menu).addClass('open');

		$.each(OptionsPanels, function(index, item) {
			$(item).removeClass('open');
		});
		switch(menu) {
			case 'Enable Modules Menu':
				$(Options.ModulesPanel).addClass('open');
				break;
			case 'Module Options Menu':
				$(Options.OptionsPanel).addClass('open');
				break;
			default:
				cli.log('Unrecognized menu item:' + menu);
				break;
		}
	}
};

Modules.debug = {
	module: 'debug',
	moduleName: 'VES Debugger',
	description: 'VES analytics for debugging.',
	options: {
		printSystemInfos: {
			type: 'boolean',
			value: true,
			description: 'Print system information (OS & browser) to the console. Helps when submitting bug reports.'
		},
		printStorage: {
			type: 'boolean',
			value: false,
			description: 'Print the contents of storage to the console on every page load.'
		},
	},
	alwaysEnabled: true,
	isEnabled: function() {
		// technically cheating
		return true;
	},
	isMatchURL: function() {
		return Utils.isMatchURL(this.module);
	},
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			cli.log('VES loaded: ' + Date());

			this.printSystemInfos();
			this.printStorage();

			// add a link to VES in the footer
			var separator = el('span', {
				className: 'separator',
			});
			var link = el('a', {
				href: 'http://github.com/travis-g/Voat-Enhancement-Suite',
				innerHTML: 'VES'
			});

			asap((function() {
				return doc.body;
			}), function() {
				var footer = $('.footer-container > .footer > div', doc);
				add(footer, separator);
				add(footer, link);
			});
		}
	},
	printSystemInfos: function() {
		if (this.options.printSystemInfos) {
			cli.log('System Information:');
			var json = {
				'OS': System.OS,
				'Browser': System.browser + ' ' + System.version
			};
			cli.log(json);
		}
	},
	printStorage: function() { // this should probably go in Utils
		if (this.options.printSystemInfos) {
			cli.log('HTML5 storage data...');
			for (var key in localStorage) {
				if (typeof localStorage[key] !== 'function') {
					cli.log(key + ':', localStorage[key]);
				}
			}
		}
	}
};
Modules.hideChildComments = {
	module: 'hideChildComments',
	moduleName: 'Hide All Child Comments',
	description: 'Allows you to hide all child comments for easier reading.',
	options: {
		automatic: {
			type: 'boolean',
			value: false,
			description: 'Automatically hide all child comments on page load?'
		}
	},
	include: [
		'comments'
	],
	isEnabled: function() {
		return Options.getModulePrefs(this.module);
	},
	isMatchURL: function() {
		return Utils.isMatchURL(this.module);
	},
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			// begin creating the OP's 'hide child comments' button
			var toggleButton = el('li');
			this.toggleAllLink = el('a', {
				textContent: 'hide all child comments',
				href: '#',
				title: 'Show only replies to original poster.',
			});
			this.toggleAllLink.setAttribute('action', 'hide');
			this.toggleAllLink.addEventListener('click', function(e) {
				e.preventDefault();
				Modules.hideChildComments.toggleComments(this.getAttribute('action'));
				if (this.getAttribute('action') == 'hide') {
					this.setAttribute('action', 'show');
					this.setAttribute('title', 'Show all comments.');
					this.textContent = 'show all child comments';
				} else {
					this.setAttribute('action', 'hide');
					this.setAttribute('title', 'Show only replies to original poster.');
					this.textContent = 'hide all child comments';
				}
			}, true);
			add(toggleButton, this.toggleAllLink);
			var commentMenu = doc.querySelector('ul.buttons');
			if (commentMenu) {
				// add the post's toggle
				commentMenu.appendChild(toggleButton);
				// get the comments of every top-level comment
				// there's no parent element that groups every root comment's comments, so we'll need to get them all
				var rootComments = doc.querySelectorAll('div.commentarea > div.sitetable > div.thread');
				// for every root comment add a hide child elements link
				for (var i = 0, len = rootComments.length; i < len; i++) {
					toggleButton = el('li');
					var toggleLink = el('a', {
						textContent: 'hide child comments',
						href: '#',
						className: 'toggleChildren'
					});
					toggleLink.setAttribute('action', 'hide');
					toggleLink.addEventListener('click', function(e) {
						e.preventDefault();
						Modules.hideChildComments.toggleComments(this.getAttribute('action'), this);
					}, true);
					add(toggleButton, toggleLink);
					//console.log('toggleButton: ' + typeof(toggleButton));
					// get the first (if any) comment of the root
					var childComment = rootComments[i].querySelector('.child');
					if (childComment !== null) { // only add the link if they're comments
						var rootMenu = rootComments[i].querySelector('ul.buttons');
						if (rootMenu) rootMenu.appendChild(toggleButton);
					}
				}
				if (this.options.automatic.value) {
					// don't auto-hide in comment permalinks
					// url: /comments/12345/123456
					var linkRE = /\/comments\/(?:\w+)\/(?:\w+)/;
					if (! location.pathname.match(linkRE)) {
						Utils.click(this.toggleAllLink);
					}
				}
			}
		}
	},
	toggleComments: function(action, obj) {
		var commentContainers;
		if (obj) { // toggle a single comment tree
			commentContainers = $(obj).closest('.thread');
		} else { // toggle all comments
			cli.log('Hiding all child comments...');
			commentContainers = doc.querySelectorAll('div.commentarea > div.sitetable > div.thread');
		}
		for (var i = 0, len = commentContainers.length; i < len; i++) {
			// get the children under comment i
			var thisChildren = commentContainers[i].querySelectorAll('div.child');
			var numChildren = thisChildren.length;
			// cli.log('hiding ' + numChildren + ' children');
			// get the root comment's "hide your kids" link
			var thisToggleLink = commentContainers[i].querySelector('a.toggleChildren');
			if (thisToggleLink !== null) {
				// for each child in thisChildren either hide it or show it
				for (var x = 0, y = thisChildren.length; x < y; x++) {
					if (action === 'hide') {
						// Voat's already got a .hidden class, use that
						$(thisChildren[x]).addClass('hidden');
						thisToggleLink.innerHTML = 'show child comments';
						thisToggleLink.setAttribute('action', 'show');
					} else {
						$(thisChildren[x]).removeClass('hidden');
						thisToggleLink.innerHTML = 'hide child comments';
						thisToggleLink.setAttribute('action', 'hide');
					}
				}
			}
		}
	}
};

Modules.singleClick = {
	module: 'singleClick',
	moduleName: 'Single Click',
	description: 'Adds an extra link that opens both the link and the comments page in new tabs.',
	options: {
		openOrder: {
			type: 'enum',
			values: [
				{ name: 'open comments then link', value: 'commentsfirst' },
				{ name: 'open link then comments', value: 'linkfirst' }
			],
			value: 'commentsfirst',
			description: 'What order to open the link/comments in.'
		},
		hideLEC: {
			type: 'boolean',
			value: false,
			description: 'Hide the singleClick link where the link is the same as the comments page'
		}
	},
	isEnabled: function() {
		return Options.getModulePrefs(this.module);
	},
	include: [
		'all',
	],
	exclude: [
		'comments',
	],
	isMatchURL: function() {
		return Utils.isMatchURL(this.module);
	},
	beforeLoad: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			if (Utils.isDarkMode()) {
				Utils.addCSS('.VESSingleClick { color: #bcbcbc; font-weight: bold; }');
				Utils.addCSS('.VESSingleClick:hover { text-decoration: underline; cursor: pointer; }');
			} else {
				Utils.addCSS('.VESSingleClick { color: #6a6a6a; font-weight: bold; }');
				Utils.addCSS('.VESSingleClick:hover { text-decoration: underline; cursor: pointer; }');
			}
		}
	},
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			this.applyLinks();
			// watch for changes to .sitetable, then reapply
			//Utils.watchForElement('sitetable', Modules.singleClick.applyLinks);
			doc.body.addEventListener('DOMNodeInserted', function(e) {
				if ((e.target.tagName == 'div') && (e.target.getAttribute('class') == 'sitetable')) {
					Modules.singleClick.applyLinks(e.target);
				}
			}, true);
		}
	},
	applyLinks: function(ele) {
		ele = ele || doc;
		var entries = $('.sitetable>.submission .entry', ele); // beware of .alert-featuredsub!
		for (var i = 0, len = entries.length; i < len; i++) {
			if ((typeof entries[i] !== 'undefined') && (!$(entries[i]).hasClass('lcTagged'))) {
				$(entries[i]).addClass('lcTagged');
				this.titleLA = entries[i].querySelector('A.title');
				if (this.titleLA !== null) {
					var thisLink = $(this.titleLA).attr('href');
					// check if it's a relative path (no http://)
					if (!(thisLink.match(/^http/i))) {
						thisLink = 'https://' + doc.domain + thisLink;
					}
					//console.log("thisLink -- " + thisLink);
					var thisComments = (thisComments = entries[i].querySelector('.comments')) && thisComments.href;
					//console.log("thisComments -- " + thisComments);
					var thisUL = $('ul.flat-list', entries[i]);
					var singleClickLI = el('li');
					var singleClickLink = el('a', {
						className: 'VESSingleClick'
					});
					singleClickLink.setAttribute('thisLink',thisLink);
					singleClickLink.setAttribute('thisComments',thisComments);
					if (thisLink != thisComments) {
						singleClickLink.innerHTML = 'l+c';
					} else if (!(this.options.hideLEC.value)) {
						singleClickLink.innerHTML = 'l=c';
					}
					add(singleClickLI, singleClickLink);
					add(thisUL, singleClickLI);
					singleClickLink.addEventListener('click', function(e) {
						e.preventDefault();
						if(e.button != 2) {
							// check if it's a relative link (no http://voat.co) because chrome barfs on these when creating a new tab...
							var thisLink = this.getAttribute('thisLink');
							if (Modules.singleClick.options.openOrder.value == 'commentsfirst') {
								if (this.getAttribute('thisLink') != this.getAttribute('thisComments')) {
									// console.log('open comments');
									window.open(this.getAttribute('thisComments'));
								}
								window.open(this.getAttribute('thisLink'));
							} else { // Modules.singleClick.options.openOrder.value == 'linkfirst'
								window.open(this.getAttribute('thisLink'));
								if (this.getAttribute('thisLink') != this.getAttribute('thisComments')) {
									// console.log('open comments');
									window.open(this.getAttribute('thisComments'));
								}
							}
						}
					}, true);
				}
			}
		}
	}
};

Modules.userTags = {
	module: 'userTags',
	moduleName: 'User Tags',
	category: 'Users',
	description: 'Tag Voat users in posts and comments.',
	options: {
		hardIgnore: {
			type: 'boolean',
			value: false,
			description: 'When on, the ignored user\'s entire post is hidden, not just the title.'
		}
	},
	isEnabled: function() {
		return Options.getModulePrefs(this.module);
	},
	isMatchURL: function() {
		return Utils.isMatchURL(this.module);
	},
	include: [
		'all',
	],
	//exclude: [],
	beforeLoad: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			// load CSS
		}
	},
	usernameSelector: 'p.tagline a.author, .sidecontentbox a.author, div.md a[href^="/u/"], div.md a[href^="/user/"]',
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {

			this.tags = null;
			if (typeof tags !== 'undefined') {
				this.tags = JSON.safeParse(tags, 'userTags.tags', true);
			}
			this.applyTags();
		}
	},
	applyTags: function(ele) {
		ele = ele || doc;
	},
	applyTag: function(authorObj) {
		var userObject = [],
			thisTag = null,
			thisColor = null,
			thisIgnore = null,
			thisAuthor, thisPost, thisComment;

		if ((authorObj) && (!($(authorObj).hasClass('userTagged'))) && (typeof authorObj !== 'undefined') && (authorObj !== null)) {
			if (authorObj.getAttribute('data-username')) {
				thisAuthor = authorObj.getAttribute('data-username');
			}
			noTag = false;
			if ((thisAuthor) && (thisAuthor.substr(0, 3) === '/u/')) {
				noTag = true;
				thisAuthor = thisAuthor.substr(3);
			}
			thisAuthor = thisAuthor.toLowerCase();
			if (!noTag) {
				$(authorObj).addClass('userTagged');
				if (typeof userObject[thisAuthor] === 'undefined') {
					if (this.tags && this.tags[thisAuthor]) {
						if (typeof this.tags[thisAuthor].tag !== 'undefined') {
							thisTag = this.tags[thisAuthor].tag;
						}
						if (typeof this.tags[thisAuthor].color !== 'undefined') {
							thisColor = this.tags[thisAuthor].color;
						}
						if (typeof this.tags[thisAuthor].ignore !== 'undefined') {
							thisIgnore = this.tags[thisAuthor].ignore;
						}
					}
					userObject[thisAuthor] = {
						tag: thisTag,
						color: thisColor,
						ignore: thisIgnore,
					};
				}
				var tag = el('span', {
					className: 'VESUserTag',
					alt: thisAuthor,
					textContent: '+'
				});
				after(authorObj, tag);
			}
		}
	},
	createTagDialog: function() {

	},
	closeTagDialog: function() {

	},
	saveUserTag: function() {

	},
	ignoreComment:function() {

	},
	ignoreUser: function() {

	},
};

Modules.voatingBooth = {
	module: 'voatingBooth',
	moduleName: 'Voating Booth',
	description: 'UI enhancements for Voat.',
	options: {
		fullVoat: {
			type: 'boolean',
			value: false,
			description: 'Make Voat use the full screen width?'
		},
		pinHeader: {
			type: 'enum',
			values: [{
				name: 'None',
				value: 'none'
			}, {
				name: 'Subverse Bar only',
				value: 'sub'
			}, {
				name: 'Full Header',
				value: 'header'
			}],
			value: 'none',
			description: 'Pin header elements to the page top, even when scrolling.'
		}
	},
	include: [
		'all'
	],
	isEnabled: function() {
		return Options.getModulePrefs(this.module);
	},
	isMatchURL: function() {
		return Utils.isMatchURL(this.module);
	},
	beforeLoad: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			if (this.options.fullVoat.value) {
				var css = '#header-container { padding-left: 10px; padding-right: 10px }';
				css += '#header-banner { max-width: initial }';
				css += 'body > #container { margin-left: 10px; margin-right: 10px; max-width: initial }';
				Utils.addCSS(css);
			}
			switch (this.options.pinHeader.value) {
				case 'header':
					$(doc.body).addClass('pinHeader-header');
					break;
				case 'sub':
					$(doc.body).addClass('pinHeader-sub');
					break;
				default:
					break;
			}
		}
	},
	go: function() {
		if ((this.isEnabled()) && this.isMatchURL()) {
			switch (this.options.pinHeader.value) {
				case 'header':
					this.pinHeader();
					break;
				case 'sub':
					this.pinSubverseBar();
					break;
				default:
					break;
			}
		}
	},
	pinHeader: function() {
		var header = id('header');
		if (header === null) {
			return;
		}

		var spacer = el('div');
		spacer.id = 'VESPinnedHeaderSpacer';

		var css = '#sr-header-area { left: 0; right: 0 }';
		spacer.style.height = $('#header').outerHeight() + 'px';

		before(header.nextSibling, spacer);

		css += 'body > #container { margin-top: 10px }';
		css += '#header { position: fixed }';
		css += '#header { left: 0; right: 0 }';
		css += '#sr-more-link: { position: fixed }';
		Utils.addCSS(css);
		cli.log(css);
		cli.log(Utils.css);
	},
	pinSubverseBar: function() {
		// Make the subverse bar at the top of the page a fixed element

		var sb = id('sr-header-area');
		if (sb === null) {
			return;
		}
		var header = id('header');

		// add a dummy <div> inside the header to replace the subreddit bar (for spacing)
		var spacer = el('div', {
			style: {
				paddingTop: window.getComputedStyle(sb, null).paddingTop,
				paddingBottom: window.getComputedStyle(sb, null).paddingBottom,
				height: window.getComputedStyle(sb, null).height
			}
		});

		//window.setTimeout(function(){
		// add the spacer; take the subreddit bar out of the header and put it above
		header.insertBefore(spacer, sb);
		doc.body.insertBefore(sb, header);

		var css = '#header-bottom-left { margin-top: 19px; }';
		css += 'div#sr-header-area {position: fixed; z-index: 10000 !important; left: 0; right: 0; }';
		//this.pinCommonElements(sm);
		css += '#sr-more-link: {position: fixed;}';
		Utils.addCSS(css);
	},
};

Modules.voatingNeverEnds = {
	module: 'voatingNeverEnds',
	moduleName: 'voatingNeverEnds',
	description: 'Autoload next pages of link lists on scroll.',
	options: {
		fadeDupes: {
			type: 'enum',
			value: 'fade',
			values: [
				{ name: 'Fade', value: 'fade' },
				{ name: 'Hide', value: 'hide' },
				{ name: 'Do nothing', value: 'none' },
			],
			description: 'Fade or hide duplicate posts.'
		},
	},
	isEnabled: function() {
		return Options.getModulePrefs(this.module);
	},
	include: [
		'subverse', 'linklist'
	],
	isMatchURL: function() {
		return Utils.isMatchURL(this.module);
	},
	beforeLoad: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			Utils.addCSS('.VNEdupe {}');
			switch (this.options.fadeDupes.value) {
				case 'fade':
					Utils.addCSS('.VNEdupe {opacity: 0.3}');
					break;
				case 'hide':
					Utils.addCSS('.VNEdupe {display: none}');
					break;
			}
		}
	},
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			// load the hashes from memory
			Modules.voatingNeverEnds.dupeHash = Modules.voatingNeverEnds.dupeHash || {};

			// since every comments link is unique to its post, cache them
			var entries = $('a.comments', doc.body);
			for (var i = entries.length - 1; i > -1; i--) {
				Modules.voatingNeverEnds.dupeHash[entries[i].href] = 1;
			}

			var st = $('.sitetable');
			this.sitetable = st[0];

			// get the navigation links
			var link = $('.pagination-container .btn-whoaverse-paging a[rel=next]');

			if (link.length > 0) {
				this.nextURL = $(link).attr('href');
				var nextPos = Utils.getXYpos(link);
				this.nextPageScrollY = nextPos.y;
				$(link).remove();
				
				this.attachLoader();
				var currPageRegex = /\?page=([0-9]+)/i;
				var backPage = currPageRegex.exec(location.href);
				if (backPage) {
					this.currPage = backPage[1];
					this.loadPage(true);
				}
				this.currPage = this.currPage || 1;

				window.addEventListener('scroll', function(e) {
					if ((Utils.elementInViewport(Modules.voatingNeverEnds.loader)) && (Modules.voatingNeverEnds.fromBackButton != true)) {
						Modules.voatingNeverEnds.loadPage();
					}
				}, false);
			}
		}
	},
	attachLoader: function() {
		this.loader = el('p', {
			innerHTML: 'Voating Never Ends',
			id: 'progressIndicator',
			className: 'voatingNeverEnds btn-whoaverse btn-block'
		});
		add(this.sitetable, this.loader);
	},
	dupeCheck: function(html) {
		// get all the submissions
		var submissions = html.querySelectorAll('div.link');
		for (var i = submissions.length - 1; i > -1; i--) {
			var sub = submissions[i];
			// get the sub's comments URL
			var thisCommentsLink = $('a.comments', sub).href;
			if (Modules.voatingNeverEnds.dupeHash[thisCommentsLink]) {
				// if we've seen the link before, mark it as a dupe
				addClass(sub, 'VNEdupe');
			} else {
				Modules.voatingNeverEnds.dupeHash[thisCommentsLink] = 1;
			}
		}
		return html;
	},
	// use jQuery's $.get() function to pull the next page from Voat's servers
	loadPage: function(fromBackButton) {
		// if (fromBackButton) {

		// } else {
			this.fromBackButton = false;
		// }
		this.go();
		cli.log('triggered loadPage for '+this.nextURL);
		if (this.isLoading !== true) {
			this.loader.innerHTML = 'Sit tight...';
			this.isLoading = true;
			cli.log(this.nextURL);
			// $.get(url[, data][, success][, dataType])
			$.get(this.nextURL, null, null, 'html').done(function(response) {
				if (!(Modules.voatingNeverEnds.fromBackButton)) {
					Modules.voatingNeverEnds.currPage++;
					set('voatingNeverEnds.lastPage', Modules.voatingNeverEnds.nextPage);
					location.hash = '?page='+Modules.voatingNeverEnds.currPage;
				}
				if (typeof Modules.voatingNeverEnds.loader.parentNode != 'undefined') {
					Modules.voatingNeverEnds.loader.parentNode.removeChild(Modules.voatingNeverEnds.loader);
				}
				// just get the HTML
				// 
				var response = response;
				var temp = el('div', {
					// rip any JavaScript
					innerHTML: response.replace(/<script(.|\s)*?\/script>/g, '')
				});

				var html = $('.sitetable', temp);
				var st = $('.sitetable', temp); // should be an array

				// run any modules on .sitetable before adding

				var links = temp.querySelectorAll('.pagination-container .btn-whoaverse-paging a');
				var next = links[links.length - 1];
				$(Modules.voatingNeverEnds.sitetable).append(html);
				Modules.voatingNeverEnds.isLoading = false;
				if (next) {
					Modules.voatingNeverEnds.nextPage = next.href;
					Modules.voatingNeverEnds.attachLoader();
				}
				if (fromBackButton) {
					// @TODO
				}
			}).fail(function(error) {
				cli.log(error);
				Modules.voatingNeverEnds.VNEFail(error);
			}); // $.get()
		} else {
			//cli.log('load new page ignored, isLoading = true');
		}
	},
	VNEFail: function() {
		// @TODO
	}
};
(function() {

	// see if we can access anything
	testLocalStorage();

	var VES = { // for the extension itself
		init: function() {
			this.loadOptions();

			// start loading the modules once <head> can be found
			asap((function() {
				return doc.head;
			}), this.loadModules);

			asap((function() {
				return doc.body;
			}), Options.addOptionsLink);
		},
		loadOptions: function() {
			var module;
			for (module in Modules) {
				if (typeof Modules[module] === 'object') {
					//cli.log('Running loadOptions('+module+')');
					Options.getOptions(module);
				}
			}
		},
		loadModules: function() {
			var module;
			// if there's preloading needed, do it
			for (module in Modules) {
				if (typeof Modules[module] === 'object') {
					if (typeof Modules[module].beforeLoad === 'function') {
						Modules[module].beforeLoad();
					}
				}
			}
			// run the modules' .go() function ASAP
			// often, the document body is not available yet, so wait
			asap((function() {
				return doc.body;
			}), function() {
				for (module in Modules) {
					if (typeof Modules[module] === 'object') {
						try {
							Modules[module].go();
						} catch (e) { // if one module breaks don't kill everything
							cli.log('\"' + Modules[module].moduleName + '\" initialization crashed!');
							cli.log(e.name + ': ' + e.message);
						}
					}
				}
			});
			// inject the CSS from all the modules
			Utils.applyCSS(Utils.css, 'VESStyles');
		},
		updated: function() {
			return get('previousversion', function(items) {
				if (items) {
					v = items.previousversion;
					if (v === G.v) {
						// we're running the same version as last run,
						// don't do anything
						return;
					}
					if (v) {
						alert('VES has been updated to version ' + G.v + '.');
						//@TODO point users to changelog, if desired
					}
				}
				return set('previousversion', G.v);
			})
		}
	};
	VES.init();

}).call(this);
