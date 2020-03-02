import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux'

import App from './App'

// 将App组件标签渲染到index页面的div上
ReactDOM.render((
    <App />
), document.getElementById('root'))

