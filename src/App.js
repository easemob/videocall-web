import React, {Component} from 'react'
import {
  HashRouter as Router, 
  Route, 
  Switch
} from 'react-router-dom'

import './App.css'

import Room from './pages/room/room'

/*
应用的根组件
 */
export default class App extends Component {


  render () {
    return (
      <Router>
        <Switch> {/*只匹配其中一个*/}
          <Route path='/room' component={Room}></Route>
          <Route path='/' component={Room}></Route>
        </Switch>
      </Router>
    )
  }
}