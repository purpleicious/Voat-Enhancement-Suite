module.exports = function(grunt) {
	grunt.util.linefeed = '\n';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			options: {
				process: Object.create(null, {
					data: {	
						// load package.json so that templates
						// can be automatically parsed
					}
				})
			},
			metablock: {
				src: 'src/metablock.js',
				dest: 'builds/<%= pkg.name %>.meta.js'
			},
			userscript: {
				src: ['src/metablock.js', 'src/core/*.js', 'src/modules/*.js', 'src/ves.js'],
				dest: 'builds/<%= pkg.name %>.user.js'
			}
		},
		clean: ['builds'],
		watch: {
			options: {
				interrupt: true
			},
			all: {
				files: ['Gruntfile.js', 'package.json', 'src/*', 'src/**/*'],
				tasks: ['clean', 'build']
			}
		}
	});
	// grunt.loadNpmTasks() for every plugin automatically
	require('load-grunt-tasks')(grunt);

	// default grunt action
	grunt.registerTask('default', ['build']);

	grunt.registerTask('build', ['clean', 'concat']);

};