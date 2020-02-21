import ajax from './ajax';

const BASE = 'https://rtc-turn4-hsb.easemob.com';
// const BASE = ''

export const req_login = params => ajax('http://a1.easemob.com/easemob-demo/chatdemoui/token', params, 'POST')