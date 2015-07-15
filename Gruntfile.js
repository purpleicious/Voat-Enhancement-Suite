module.exports = function(grunt) {
	'use strict';

	grunt.util.linefeed = '\n';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		clean: ['builds'],
		concat: {
			options: {
				process: Object.create(null, {
					// process Grunt templates using project.json
					data: {
						get: function() {
							var pkg = grunt.config('pkg');
							return pkg;
						},
						enumerable: true // required for Array.map()
					}
				})
			},
			metablock: {
				src: 'src/meta/metablock.js',
				dest: 'builds/<%= pkg.name %>.meta.js'
			},
			userscript: {
				src: [
					'src/meta/metablock.js',
					'src/meta/license.js',
					'src/globals.js',
					'src/core/storage.js',
					'src/core/system.js',
					'src/core/utils.js',
					'src/core/options.js',
					'src/modules/*.js',
					'src/core/init.js'
				],
				dest: 'builds/<%= pkg.name %>.user.js'
			}
		},
		copy: {
			options: {
				process: Object.create(null, {
					// process Grunt templates using project.json
					data: {
						get: function() {
							var pkg = grunt.config('pkg');
							return pkg;
						},
						enumerable: true // required for Array.map()
					}
				})
			},
			chrome: {
				//	@TODO copy script, icons, manifest into builds/Chrome
			}
		},
		compress: {
			chrome: {
				//	@TODO compress builds/Chrome to 'builds/<%= pkg.name %>.zip'
			}
		},
		watch: {
			options: {
				interrupt: true
			},
			all: {
				files: ['Gruntfile.js', 'package.json', 'src/*', 'src/**/*'],
				tasks: ['build']
			}
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			grunt: {
				src: ['Gruntfile.js']
			},
			all: {
				src: [
					// only check source files
					'src/**/*.js',
					'!src/vendor/*.js'
				]
			}
		}
	});

	require('load-grunt-tasks')(grunt);

	grunt.registerTask('default', ['build']);

	grunt.registerTask('build', ['clean', 'concat', 'copy', 'compress']);
	grunt.registerTask('jshint', ['jshint:all']);
};
