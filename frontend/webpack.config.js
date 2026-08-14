const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";

// Rotas que pertencem aos backends. Em produção o nginx encaminha (ver nginx.conf);
// no dev-server o proxy abaixo faz o mesmo, para que a aplicação rode sempre em
// uma única origem (sem portas na URL e, portanto, sem CORS).
// changeOrigin fica false de propósito: os serviços montam URLs absolutas a partir
// do header Host (avatares e callback do Google), que precisa ser o host do browser.
const backendProxy = [
    { context: ["/auth"], target: "https://auth-service:3001" },
    { context: ["/match"], target: "https://match-service:3002" },
    { context: ["/users", "/players", "/uploads"], target: "https://user-service:3003" },
    { context: ["/games"], target: "https://game-service:3004" },
    { context: ["/ws"], target: "https://game-service:3004", ws: true },
].map(entry => ({ ...entry, secure: false, changeOrigin: false }));

module.exports = {
    entry: './src/app.ts', //path to the main .ts file
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: "bundle.js", //name for the js file that is created/compiled in memory
        clean: false,
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: {
        server: 'https',
        host: "0.0.0.0",
        port: 8080, //port that we're using for local host (localhost:8080)
        static: path.resolve(__dirname, "public"), //tells webpack to serve from the public folder
        hot: true,
        // Atrás de um proxy o header Host chega como o domínio público; sem isso
        // o dev-server responde "Invalid Host header".
        allowedHosts: "all",
        // O HMR usa /ws por padrão, que é a rota do game-service. Move para /hmr.
        webSocketServer: { type: "ws", options: { path: "/hmr" } },
        client: { webSocketURL: { pathname: "/hmr" } },
        devMiddleware: {
            publicPath: "/",
        },
        historyApiFallback: true,
        proxy: backendProxy,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: 'src/index.html',
        }),
    ],
    // inline-source-map embute todo o fonte no bundle: pesado demais para servir.
    devtool: isProduction ? false : 'inline-source-map',
    mode: isProduction ? "production" : "development",
};
