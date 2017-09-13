/* eslint no-console:"off" */
const s3 = require('s3'); // eslint-disable-line import/no-extraneous-dependencies
const config = require('./s3-config');
const pkg = require('../package.json');
const version = pkg.version;
const DIST_DIR = './dist';

function main() {
    return uploadContent().then(() => {
        console.log('FINISHED!');
    }).catch((err) => {
        console.error('Error performing upload', err);
        process.exit(1);
    });
}

const client = s3.createClient({
    maxAsyncS3: 20, // this is the default
    s3RetryCount: 3, // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: config.s3
});

function uploadContent() {
    // Upload same file to 2 different keys
    return Promise.all([
        uploadFile('autochart.track.min.js'),
        uploadFile('autochart.track.min.js', `autochart.track.min.v${version}.js`)
    ]);
}

function uploadFile(sourceFilename, targetFilename) {
    const params = {
        localFile: `${DIST_DIR}/${sourceFilename}`,
        s3Params: {
            Bucket: config.bucket.name,
            Key: `${config.bucket.prefix}${targetFilename || sourceFilename}`,
            CacheControl: `max-age=${config.bucket.cacheSeconds}`
                // other options supported by putObject, except Body and ContentLength.
                // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
        }
    };
    console.log(`Uploading key "${params.s3Params.Key}" with CacheControl: ${params.s3Params.CacheControl}`);
    return new Promise((resolve, reject) => {
        const uploader = client.uploadFile(params);
        uploader.on('error', (err) => {
            console.error('unable to sync:', err.stack);
            return reject(err);
        });
        uploader.on('progress', () => {
            console.log('progress', uploader.progressAmount, uploader.progressTotal);
        });
        uploader.on('end', () => {
            console.log('done uploading');
            return resolve(params.s3Params.Key);
        });
    });
}

main();
