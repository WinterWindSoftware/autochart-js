import path from 'path';

export default {
    entry: './index.js',
    output: {
        filename: 'autochart-tracker.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        port: 8080
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['es2015']
                }
            }
        }]
    }
};
