module.exports = function(grunt) {
	// Unix-style newlines (Windows uses '\r\n')
	grunt.util.linefeed = '\n';

	grunt.initConfig({
		// get the package's info
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				// parse any templates Grunt finds
				process: Object.create(null, {
					// use the package info
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
				src: 'src/metablock.js',
				dest: 'builds/<%= pkg.name %>.meta.js',
			},
			userscript: {
				src: [
					'src/metablock.js',
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
		// delete the /builds folder before each run
		clean: ['builds'],
		watch: {
			options: {
				interrupt: true
			},
			all: {
				// files to watch
				files: ['Gruntfile.js', 'package.json', 'src/*', 'src/**/*'],
				// rebuild the files on every source/config file change
				tasks: ['build']
			}
		}
	});
	// run grunt.loadNpmTasks() for every plugin automatically
	require('load-grunt-tasks')(grunt);

	grunt.registerTask('default', ['build']);

	grunt.registerTask('build', ['clean', 'concat']);
};
