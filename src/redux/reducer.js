/*
用来根据老的state和指定的action生成并返回新的state的函数
 */
import {combineReducers} from 'redux'

/*
用来管理头部标题的reducer函数
 */
// import storageUtils from "../utils/storageUtils"
import {
  RECEIVE_USER,
  RECEIVE_ROOM,
  RECEIVE_USER_ROOM,
  SHOW_ERROR_MSG,
} from './action-types'

/*
用来管理当前登陆用户的reducer函数
 */
// const initUser = storageUtils.getUser()
const initUser = {};

function user(state = initUser, action) {
  
  switch (action.type) {
    case RECEIVE_USER:
      return action.user
    case SHOW_ERROR_MSG:
      const errorMsg = action.errorMsg
      // state.errorMsg = errorMsg  // 不要直接修改原本状态数据
      return {...state, errorMsg}
    default:
      return state
  }
}

const initRoom = { };

function room(state = initRoom, action) {

  switch (action.type) {
    case RECEIVE_ROOM:
      return action.room
    case SHOW_ERROR_MSG:
      const errorMsg = action.errorMsg
      return {...state, errorMsg}
    default:
      return state  
  }
}

function user_room(state = {}, action) {

  switch (action.type) {
    case RECEIVE_USER_ROOM:
      return action.user_room
    case SHOW_ERROR_MSG:
      const errorMsg = action.errorMsg
      return {...state, errorMsg}
    default:
      return state  
  }
}

/*
向外默认暴露的是合并产生的总的reducer函数
管理的总的state的结构:
  {
    headTitle: '首页',
    user: {}
  }
 */
export default combineReducers({
  user,
  room,
  user_room
})