import path from 'node:path';
import { fileURLToPath } from 'node:url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  experiments: {
    topLevelAwait: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript'
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    historyApiFallback: true,
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        timeout: 30000, // 30 seconds timeout
        onError: (err, req, res) => {
          console.error('Proxy error:', err);
          res.writeHead(500, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
        }
      }
    }
  }
};
