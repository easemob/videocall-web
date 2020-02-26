/*
包含n个action creator函数的模块
同步action: 对象 {type: 'xxx', data: 数据值}
异步action: 函数  dispatch => {}
 */
import {
    RECEIVE_USER,
    RECEIVE_ROOM,
    RECEIVE_USER_ROOM,
    SHOW_ERROR_MSG,
} from './action-types'

import {
  req_login, 
  req_create
} from '../api';

//   import storageUtils from "../utils/storageUtils";
  
  /*
  接收用户的同步action
   */
  export const receiveUser = (user) => ({type: RECEIVE_USER, user})
  export const receiveRoom = room => ({type: RECEIVE_ROOM, room})
  export const receive_user_room = user_room => ({type: RECEIVE_USER_ROOM, user_room})

  /*
  显示错误信息同步action
   */
  export const showErrorMsg = (errorMsg) => ({type: SHOW_ERROR_MSG, errorMsg})
  
  /*
  退出登陆的同步action
   */
//   export const logout = () =>  {
    // 删除local中的user
    // storageUtils.removeUser()
    // 返回action对象
    // return {type: RESET_USER}
//   }
  
  /*
  im登陆的异步action
   */

  export const login = (params) => {
    return async dispatch => {
      // 1. 执行异步ajax请求
      try {
        const user_info = await req_login(params);
        if(!user_info.access_token){
          return 
        };

        let user = {
          name: user_info.user && user_info.user.username,
          token: user_info.access_token,
          uuid: user_info.user && user_info.user.uuid
        }

        dispatch(receiveUser(user));
      } catch (error) {
        dispatch(showErrorMsg(error));
      }

    }
  }

  export const create = (params) => {
    return async dispatch => {
      try {
        const room = await req_create(params);
        if(!room.confrId){
          return
        };
        dispatch(receiveRoom(room))
      } catch (error) {
        dispatch(showErrorMsg(error))
      }

    }
  }

  export const join = (emedia,params) => {

    return async dispatch => {
      if(!emedia) {
        return
      }

      let {
        name,
        token,
        confrId,
        password,
        role
      } = params;

      try {
        
        emedia.mgr.setIdentity(name, token);
  
        let { ticket } = await emedia.mgr.reqTkt(params);
        let user_room = await emedia.mgr.joinConferenceWithTicket(confrId, ticket);
      
        dispatch(receive_user_room(user_room))
      } catch (error) {
        dispatch(showErrorMsg(error))
      }
    }
  }
  