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
				cli.log(e);
				if ((e.target.tagName === 'DIV') && (e.target.className === 'sitetable')) {
					cli.log('content inserted into sitetable, running singleClick.applyLinks');
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
