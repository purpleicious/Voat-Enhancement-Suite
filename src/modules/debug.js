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
