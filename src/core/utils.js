// function aliases
var __slice = [].slice,
	__indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
	__hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	__bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };


// make some sorta-jQuery functions, http://api.jquery.com/
var $, $$;
// {{{
	// querySelector on root (or document.body)
	$ = function(selector, root) {
		if (root === null) {
			root = doc.body;
		}
		return root.querySelector(selector);
	};
	// querySelectorAll on root (or document.body)
	$$ = function(selector, root) {
		if (root === null) {
			root = doc.body;
		}
		return __slice.call(root.querySelectorAll(selector));
	};

	$.extend = function(obj, prop) {
		for (var key in prop) {
			var value = prop[key];
			if (prop.hasOwnProperty(key)) {
				obj[key] = value;
			}
		}
	};

	// alias for getElementById(id)
	$.id = function(id) {
		return doc.getElementById(id);
	};

	// once page is loaded execute a function
	$.ready = function(func) {
		// if the document is ready queue the task
		if (doc.readyState !== 'loading') {
			$.taskQueue(func);
			return;
		}
		// create a callback to unbind the event from the document and
		// execute the function
		var callback = function() {
			$.off(doc, 'DOMContentLoaded', callback);
			return func();
		};
		// set an event to execute the callback function once the page is loaded
		return $.on(doc, 'DOMContentLoaded', callback);
	};

	// add a list of properties to an object
	$.extend = function(obj, props) {
		for (var key in props) {
			val = props[key];
			obj[key] = val;
		}
	};

	// wait until test can be done and then perform a callback
	$.asap = function(test, callback) {
		// if test CAN be done perform the callback
		if (test()) {
			return callback();
		} else {
			// if you can't do test, wait and try again
			return setTimeout($.asap, 25, test, callback);
		}
	};

	// create a <style> element with given CSS and an id,
	// and append it to <head> as soon as possible.
	$.addStyle = function(css, id) {
		var style = $.el('style', {
			id: id,
			textContent: css
		});
		$.asap((function() {
			return doc.head;
		}), function() {
			return $.add(doc.head, style);
		});
		return style;
	};

	// add a class or list of classes to an element
	$.addClass = function(/*element, class1, class2...*/) {
		var el = arguments[0], classnames = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
		for (var i = 0, len = classnames.length; i < len; i++) {
			var classname = classnames[i];
			el.classList.add(classname);
		}
	};

	// remove a class or list of classes from an element
	$.rmClass = function(/*element, class1, class2...*/) {
		var el = arguments[0], classnames = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
		for (var i = 0, len = classnames.length; i < len; i++) {
			var classname = classnames[i];
			el.classList.remove(classname);
		}
	};

	// toggle a class on an element
	$.toggleClass = function(el, classname) {
		return el.classList.toggle(classname);
	};

	// return true if an element has a given class
	$.hasClass = function(el, classname) {
		return __indexOf.call(el.classList, classname) >= 0;
	};

	// remove a single element
	$.rm = function(el) {
		return el.remove();
	};

	// remove everything inside a root element
	$.rmAll = function(root) {
		root.textContent = null;
		return root.textContent;
	};

	// make a new piece of document to be added
	$.fragment = function() {
		return doc.createDocumentFragment();
	};
	$.nodes = function(nodes) {
		// if just one node return it
		if (!(nodes instanceof Array)) {
			return nodes;
		}
		// if theres a bunch, create a new section of document,
		// then add all of the nodes as sibilings
		var frag = $.fragment();
		for (var i = 0, len = nodes.length; i < len; i++) {
			var node = nodes[i];
			frag.appendChild(node);
		}
		return frag;
	};
	// add an element after its parent's existing children
	$.add = function(parent, el) {
		return parent.appendChild($.nodes(el));
	};
	// add an element to a parent as a firstChild
	$.prepend = function(parent, el) {
		return parent.insertBefore($.nodes(el), parent.firstChild);
	};
	// add an element after another
	$.after = function(root, el) {
		return root.parentNode.insertBefore($.nodes(el), root.nextSibiling);
	};
	// insert an element before another
	$.before = function(root, el) {
		return root.parentNode.insertBefore($.nodes(el), root);
	};

	// create an element and set it's properties using JSON data
	$.el = function(tag, props) {
		var el = doc.createElement(tag);
		// if a JSON of properties is passed in, apply them
		if (props) {
			$.extend(el, props);
		}
		return el;
	};

	// add an event and a handler to an element
	$.on = function(el, events, handler) {
		var ref = events.split(' ');
		for (var i = 0, len = ref.length; i < len; i++) {
			var event = ref[i];
			el.addEventListener(event, handler, false);
		}
	};

	// remove an event and handler from an element
	$.off = function(el, events, handler) {
		var ref = events.split(' ');
		for (var i = 0, len = ref.length; i < len; i++) {
			var event = ref[i];
			el.removeEventListener(event, handler, false);
		}
	};

	// $.one

	// create a custom event type
	$.event = function(event, detail, root) {
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

	$.open = GM_openInTab;

	// limit the rate the a function can fire at, so
	// browser performance is maintained
	$.debounce = function(wait, func) {
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

	// create a queue of tasks to execute when possible
	$.taskQueue = (function() {
		var queue = [];
		// function to execute the next task in queue
		var execTask = function() {
			var task = queue.shift(); // pop the next task!
			//  task = [function, arg1, arg2, ...]

			// read the task's base function
			var func = task[0];
			// get the task's function args (everything starting at task[1])
			var args = Array.prototype.slice.call(task, 1);

			// do the task
			return func.apply(func, args);
		};

		// window.MessageChannel is for intra- and inter-window communication.
		// http://www.w3.org/TR/webmessaging/
		if (window.MessageChannel) { // check if MessageChannels are supported
			// create a new message channel
			var taskChannel = new MessageChannel();
			// execute the task when port1 receives a message
			taskChannel.port1.onmessage = execTask;
			return function() {
				// push the function into the queue
				queue.push(arguments);
				// send a message to port1 to trigger the function
				return taskChannel.port2.postMessage(null);
			};
		} else {
			return function() {
				// if MessageChannels aren't supported then add the function
				// to the queue and exec
				queue.push(arguments);
				return setTimeout(execTask, 0);
			};
		}
	})();

	// create a JSON from key/val pair
	$.item = function(key, val) {
		var item = {};
		item[key] = val;
		return item;
	};

	$.syncing = {}; // list of functions to keep values synchronized

	// create a callback to keep a value updated
	$.sync = function(key, callback) {
		key = info.namespace + key;
		$.syncing[key] = callback;
		// back up the previous key value from localStorage
		Storage[key] = localStorage.getItem(key);
		return Storage[key];
	};

	// create an event to synchronize settings changes
	(function() {
		var onChange = function(key) {
			var callback;
			// check if there's a method to sync the key
			if (!(callback = $.syncing[key])) {
				return; // no method
			}
			// get the new value, and if it's the same don't bother with changes
			var newValue = GM_getValue(key);
			if (newValue === Storage[key]) {
				return;
			}
			// if we didn't delete the value record the change
			if (newValue !== null) {
				Storage[key] = newValue;
				return callback(JSON.parse(newValue), key);
			} else {
				delete Storage[key];
				return callback(void 0, key);
			}
		};
		$.on(window, 'storage', function(arg) {
			var key = arg.key;
			return onChange(key);
		});
		return $.forceSync = function(key) {
			return onChange(info.namespace + key);
		};
	})();

	// stop syncing a value
	$.desync = function(key) {
		return delete $.syncing[info.namespace + key];
	};

	// remove data from localStorage
	$["delete"] = function(keys) {
		if (!(keys instanceof Array)) { // we'll want an array
			keys = [keys];
		}
		// delete each key:
		for (var i = 0, len = keys.length; i < len; i++) {
			var key = keys[i];
			key = info.namespace + key; // key names are prefixed with 'VES.'
			// purge the key's data
			localStorage.removeItem(key);
			GM_deleteValue(key);
		}
	};

	// get values out of localStorage, and perform an
	// action using them with the callback. 'items' (whatever matches 'key')
	// can be used as the argument in the callback.
	$.get = function(key, val, callback) {
	//   OR function(key, callback), if val isn't specified
		var items;
		// if val is specified then we're looking for the specific instance of
		// 'key' with value 'val'
		if (typeof callback === 'function') {
			items = $.item(key, val);
		} else { // if val isn't specified get every entry with the key
			items = key;
			callback = val;
		}
		// add a task to the queue with the callback we want to perform
		return $.taskQueue(function() {
			for (key in items) {
				val = localStorage.getItem(info.namespace + key);
				if (val) {
					items[key] = JSON.parse(val);
				}
			}
			return callback(items);
		});
	};

	// set values to localStorage.
	$.set = (function() {
		var set = function(key, val) {
			key = info.namespace + key;
			val = JSON.stringify(val);
			if (key in $.syncing) {
				localStorage.setItem(key, val);
			}
			return GM_setValue(key, val);
		};
		return function(keys, val) {
			if (typeof keys === 'string') {
				set(keys, val);
				return;
			}
			for (var key in keys) {
				val = keys[key];
				set(key, val);
			}
		};
	})();

	// delete ALL everything associated with VES from storage
	$.clear = function(callback) {
		// TODO
		return typeof callback === "function" ? callback() : void 0;
	};

	// remove a single value val from an array
	$.remove = function(array, val) {
		var i = array.indexOf(val);
		// if the value isn't found return false
		if (i === -1) return false;

		// remove the value (which was found at array[i])
		array.splice(i, 1); // array.splice(indexToRemove, removeHowMany)
		return true;
	};
// }}}


// common utils/functions for modules
Utils = {
	css: '',
	addCSS: function(css) {
		this.css += css;
	},
	regexes: {
		all: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\//i,
		inbox: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/messaging\/([\w\.\+]+)\//i,
		comments: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)\/comments\/([\w\.\+]+)/i,
		//commentPermalink:
		profile: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/user\/([\w\.\+]+)/i,
		//prefs:
		//search:
		submit: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/(?:[\-\w\.]+\/)?submit/i,
		subverse: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)/i,
		//subversePostListing:
	},
	isVoat: function() {
		var currURL = location.href;
		return Utils.regexes.all.test(currURL);
	},
	isMatchURL: function(moduleID) {
		if (!Utils.isVoat()) {
			return false;
		}
		var module = Modules[moduleID];
		if (!module) {
			console.warn("isMatchURL could not find module", moduleID);
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
		if (typeof this.curSub === 'undefined') {
			var match = location.href.match(Utils.regexes.subverse);
			if (match !== null) {
				this.curSub = match[1];
				if (check) return (match[1].toLowerCase() === check.toLowerCase());
				return match[1];
			} else {
				if (check) return false;
				return null;
			}
		} else {
			if (check) return (this.curSub.toLowerCase() === check.toLowerCase());
			return this.curSub;
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
		// search the VES stylesheet link URL for 'Dark'
		this.isDarkModeCached = document.getElementsByTagName('link')[1].href.indexOf('Dark') > -1;
		return this.isDarkModeCached;
	},
};
