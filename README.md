
`启动步骤`

1. git clone http://xxxxxx

2. npm install

3. npm start 

4. npm run build:test 测试环境

5. npm run build:prod 生产环境

6. HTTPS=true npm start 使用 HTTPS 环境（共享桌面必须） 

`使用技术栈`

1. create-react-app + antd + axios

2. 拓展 webpack_config  --> customize-cra react-app-rewired 

3. add config-overrides.js ---> antd按需加载、使用less、配置antd 主题

4. 打包设置环境变量  dotenv-cli 包 + .env.test(测试环境变量)/.env.production(生产环境变量)


`环境相关`
1. npm start    会使用 .env.development 文件 可自由配置 相应环境（开发、测试、生产）

2. npm run build:test 会使用 .env.test 文件内的环境变量 生成测试环境的包

3. npm run build:prod 会使用 .env.production 文件内的环境变量 生成生产环境的包


`常见问题`
1. npm start --->  TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received type undefined

    检查 react-script 是否 >= 3.4.0
 