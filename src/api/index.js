import ajax from './ajax';

const BASE = process.env.REACT_APP_IM_HOST;
// const BASE = ''

export const req_register = params => ajax(
    BASE + '/easemob-demo/chatdemoui/users', 
    params, 
    'POST'
);
export const req_login = params => ajax(
    BASE + '/easemob-demo/chatdemoui/token', 
    params, 
    'POST'
);

export const req_create = params => ajax(
    BASE + '/easemob-demo/chatdemoui/conferences/room', 
    params, 
    'POST'
);