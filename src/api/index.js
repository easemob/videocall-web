import ajax from './ajax';

const BASE = 'https://rtc-turn4-hsb.easemob.com';
// const BASE = ''

export const req_register = params => ajax(
    'https://a1-hsb.easemob.com/easemob-demo/chatdemoui/users', 
    params, 
    'POST'
);
export const req_login = params => ajax(
    'https://a1-hsb.easemob.com/easemob-demo/chatdemoui/token', 
    params, 
    'POST'
);

export const req_create = params => ajax(
    'http://a1-hsb.easemob.com/easemob-demo/chatdemoui/conferences/room', 
    params, 
    'POST'
);