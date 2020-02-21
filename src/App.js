import React, {Component} from 'react'
import {
  BrowserRouter as Router, 
  Route, 
  Switch
} from 'react-router-dom'

import './App.css'

import Login from './pages/login/login'
import Join from './pages/join/join'
import Meeting from './pages/meeting/meeting'

/*
应用的根组件
 */
export default class App extends Component {


  render () {
    return (
      <Router>
        <Switch> {/*只匹配其中一个*/}
          <Route path='/login' component={Login}></Route>
          <Route path='/join' component={Join}></Route>
          <Route path='/' component={Meeting}></Route>
        </Switch>
      </Router>
    )
  }
}