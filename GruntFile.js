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
        'azure-cdn-deploy': {
            latest: {
                options: {
                  containerName: 'tracker', // container name in blob
                  serviceOptions: [], // custom arguments to azure.createBlobService
                  folder: 'vLatest', // path within container
                  zip: true, // gzip files if they become smaller after zipping, content-encoding header will change if file is zipped
                  deleteExistingBlobs: false, // true means recursively deleting anything under folder
                  concurrentUploadThreads: 10, // number of concurrent uploads, choose best for your network condition
                  metadata: {
                    cacheControl: 'public, max-age=3600', // cache in browser
                    cacheControlHeader: 'public, max-age=3600' // cache in azure CDN
                  },
                  testRun: false // test run - means no blobs will be actually deleted or uploaded, see log messages for details
                },
                src: [
                  '*.js'
                ],
                cwd: './dist'
            },
            versionSpecific: {
                options: {
                  containerName: 'tracker', // container name in blob
                  serviceOptions: [], // custom arguments to azure.createBlobService
                  folder: '<%= pkg.version %>', // path within container
                  zip: true, // gzip files if they become smaller after zipping, content-encoding header will change if file is zipped
                  deleteExistingBlobs: false, // true means recursively deleting anything under folder
                  concurrentUploadThreads: 10, // number of concurrent uploads, choose best for your network condition
                  metadata: {
                    cacheControl: 'public, max-age=86400', // cache in browser for 1 day
                    cacheControlHeader: 'public, max-age=86400' // cache in azure CDN for 1 day
                  },
                  testRun: false // test run - means no blobs will be actually deleted or uploaded, see log messages for details
                },
                src: [
                  '*.js'
                ],
                cwd: './dist'
            }
        },

        connect: {
            local: {
                options: {
                    base: '.',
                    port: 9999
                }
            },
            cdn: {
                options: {
                    base: '.',
                    port: 9998
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
                    urls: ['http://localhost:9998/test/cdn-test.html'],
                    run: true
                }
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
        }
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

    grunt.registerTask('build', ['browserify', 'uglify:dist', 'uglify:loader']);
    grunt.registerTask('testlocal', ['connect:local', 'mocha:local']);
    grunt.registerTask('testcdn', ['connect:cdn', 'mocha:cdn']);
    grunt.registerTask('test', ['build', 'testlocal']);
    grunt.registerTask('dist', ['update_json', 'replace', 'usebanner']);
    grunt.registerTask('publish', ['dist', 'azure-cdn-deploy', 'testcdn']);
    grunt.registerTask('connectstay', ['connect:local:keepalive']);
    grunt.registerTask('default', ['build']);
};