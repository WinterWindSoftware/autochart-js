const secrets = require('./s3.secret');
const accountConfig = require('../account-config');

const prefixSuffix = process.env.DEPLOY_ENV === 'production' ? '' : '-test';

module.exports = {
    s3: {
        accessKeyId: secrets.accessKeyId,
        secretAccessKey: secrets.secretAccessKey,
        region: 'eu-west-1'
            // any other options are passed to new AWS.S3()
            // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    },
    bucket: {
        name: 'cdn.autochart.io',
        prefix: `tracker${prefixSuffix}`,
        cacheSeconds: 30 // TODO: change this to 1 hour (60 * 60)
    }
};
