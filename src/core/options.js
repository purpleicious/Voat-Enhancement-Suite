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
			var optionsDiv = id('VESPanelOptions');
			var inputs = $('input', optionsDiv); // get all the inputs
			for (var i = 0, len = inputs.length; i < len; i++) {
				cli.log(inputs[i]);
				if ((inputs[i].getAttribute('type') != 'button') && (inputs[i].getAttribute('displayonly') != 'true') && (inputs[i].getAttribute('tableOption') != 'true')) {
					if (inputs[i].getAttribute('type') === 'radio') {
						var optionName = inputs[i].getAttribute('name');
					} else {
						var optionName = inputs[i].getAttribute('id');
					}
					var module = inputs[i].getAttribute('moduleid');
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
					if (typeof value !== 'undefined') {
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
								var module = inputs[k].getAttribute('moduleid');
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
