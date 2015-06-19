var info = {
	v: '<%= meta.version %>',
	namespace: 'VES.',
	name: '<%= meta.name %>',
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


// sanitize HTML
escape = (function() {
	var str = {
		'&': '&amp;',
		'"': '&quot;',
		"'": '&#039;',
		'<': '&lt;',
		'>': '&gt;'
	};
	var r = String.prototype.replace;
	var regex = /[&"'<>]/g;
	var fn = function(x) {
		return str[x];
	};
	return function(text) {
		return r.call(text, regex, fn);
	};
})();

// don't kill everything if a JSON parse fails
safeJSON = function(data, storageSource, silent) {
	try {
		return JSON.parse(data);
	} catch (e) {
		if (silent) return {};
		if (storageSource) {
			cli.error('Error caught: JSON parse fail on \'' + data + '\' from ' + storageSource);
			//cli.error('Storing and deleting corrupt data.');
			GM_setValue(storageSource + '.error', data);
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

var Modules = {};
