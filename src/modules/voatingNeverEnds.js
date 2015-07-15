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