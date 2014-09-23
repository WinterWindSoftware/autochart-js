module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cdnContainerUrl: 'https://az578655.vo.msecnd.net/tracker',
        banner: '/* <%= pkg.name %> (v<%= pkg.version %>) -- ' + '<%= pkg.description %> */',

        browserify: {
            dist: {
                files: {
                    'dist/autochart.track.js': ['src/Tracker.js']
                }
            }
        },

        uglify: {
            options: {
                beautify: {
                    /*jshint camelcase:false */
                    ascii_only: true
                }
            },
            dist: {
                files: [{
                    'dist/autochart.track.min.js': 'dist/autochart.track.js'
                }]
            },
            loader: {
                options: {
                    preserveComments: 'some'
                },
                files: {
                    'dist/autochart.loader.js': 'src/Loader.js'
                }
            }
        },

        //Stamp version number and CDN path inside loader
        replace: {
            loader: {
                options: {
                    patterns: [{
                        match: 'AUTOCHART_SDK_VERSION',
                        replacement: '<%= pkg.version %>'
                    }, {
                        match: 'AUTOCHART_CDN_URL',
                        replacement: '<%=cdnContainerUrl%>'
                    }]
                },
                files: [{
                    expand: false,
                    flatten: false,
                    src: 'dist/autochart.loader.js',
                    dest: './'
                }]
            }
        },
        usebanner: {
            dist: {
                options: {
                    position: 'top',
                    banner: '<%= banner %>'
                },
                files: {
                    src: ['dist/autochart.track.*']
                }
            }
        },

        watch: {
            javascript: {
                files: 'src/**/*.js',
                tasks: ['browserify', 'uglify']
            }
        },

        azureblob: {
            options: {
                containerName: 'tracker',
                containerDelete: false,
                metadata: {
                    cacheControl: 'public, max-age=5259000'
                }, // max-age 2 months for all entries
                gzip: true,
                //copySimulation: true // set true: dry-run for what copy would look like in output
            },
            scripts: {
                files: [{
                    expand: true,
                    cwd: 'dist',
                    src: '*.js',
                    dest: '<%= pkg.version %>/'
                },{
                    expand: true,
                    cwd: 'dist',
                    src: '*.js',
                    dest: 'latest/'
                }]
            }
        },

        connect: {
            server: {
                options: {
                    base: '.',
                    port: 9999
                }
            }
        },
        mocha: {
            local: {
                options: {
                    urls: ['http://localhost:9999/test/index.html'],
                    run: true
                }
            },
            cdn: {
                options: {
                    urls: ['http://localhost:9999/test/cdn-test.html'],
                    run: true
                }
            }
        },
        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: ['pkg'],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: false,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
            }
        },
        jshint: {
            options: {
                jshintrc: true
            },
            files: ['*.js', 'src/*.js', 'test/*.js']
        },

        //Keep Bower.json metadata in sync with package.json
        /*jshint camelcase:false */
        update_json: {
            bower: {
                src: './package.json',
                dest: './bower.json',
                fields: [
                    'name',
                    'description',
                    'repository',
                    'keywords',
                    'license']
            }
        },
        // jsdox: {
        //     generate: {
        //         options: {
        //             contentsEnabled: true,
        //             contentsTitle: 'Example Documentation',
        //             contentsFile: 'readme.md',
        //             pathFilter: /^example/,
        //             templateDir: 'path/to/my/mustache'
        //         },

        //         src: ['path/to/code'],
        //         dest: 'path/to/output'
        //     },

        //     // [optional additional 'generation'
        //     // task like generate above, can be targed with jsdox: generate - other - docs],

        //     publish: {
        //         enabled: true,
        //         path: '<%= jsdox.generate.dest %>',
        //         message: 'Markdown Auto-Generated for version <%= pkg.version %>',
        //         remoteName: 'upstream',
        //         remoteBranch: 'master'
        //     }
        // }
    });

    grunt.registerTask('build', ['jshint', 'browserify', 'uglify:dist', 'uglify:loader']);
    grunt.registerTask('test', ['build', 'connect', 'mocha:local']);
    grunt.registerTask('dist', ['build', 'bump', 'update_json', 'replace', 'usebanner', 'azureblob']);
    grunt.registerTask('testcdn', ['connect', 'mocha:cdn']);
    grunt.registerTask('connectstay', ['connect:server:keepalive']);
    grunt.registerTask('default', ['build']);
};
