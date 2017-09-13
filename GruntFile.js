module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cdnContainerUrl: 'https://az578655.vo.msecnd.net/tracker',
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
        }
    });
    grunt.registerTask('publish', ['azure-cdn-deploy']);
    grunt.registerTask('publish:version', ['azure-cdn-deploy:versionSpecific']);
};
