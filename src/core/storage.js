// GreaseMonkey API compatibility for non-GM browsers (Chrome, Safari, Firefox)
// @copyright       2009, 2010 James Campos
// @modified        2010 Steve Sobel - added some missing gm_* functions
// @modified        2015 Travis Grammer - interact with storage via JSON
// @license         cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
if ((typeof GM_deleteValue == 'undefined') || (typeof GM_addStyle == 'undefined')) {
	var GM_getValue = function(name, defaultValue) {
		var value = localStorage[name];
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
		cli.error('Browser storage is unreachable. Are you in a private session?');
	}
}
