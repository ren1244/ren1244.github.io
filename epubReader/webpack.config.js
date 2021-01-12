var path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        main: './src/main.js',
        style: './src/style.js',
        download: './src/download.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
};
