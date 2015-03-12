module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> (<%= pkg.homepage %>) */\n',
				mangle: false
			},
			main: {
				files: {
					'./dist/angular-task.min.js': ['./src/angular-task.js']
				}
			}
		},
		jshint: {
			files: ['src/*.js']
		},
		watch: {
			src: {
				files: 'src/*.js',
				tasks: ['uglify'],
				options: {
					livereload: true
				}
			},
		},
		connect: {
			example: {
				options: {
					port: 9002,
					open: {
						target: 'http://localhost:9002/example/index.html'
					}
				}
			}
		},
		shell: {
			deploy: {
				command: 'git subtree push --prefix example origin gh-pages'
			}
		},
		wiredep: {
			task: {
				src: [
					'example/*.html',
				]
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-wiredep');

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-shell');

	grunt.registerTask('build', ['uglify', 'wiredep']);
	grunt.registerTask('deploy', ['build', 'shell']);

	grunt.registerTask('start:example', ['connect', 'watch']);

	grunt.registerTask('default', ['build']);

};
