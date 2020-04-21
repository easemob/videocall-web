import ajax from './ajax';
import { appkey } from '../config';


const BASE = process.env.REACT_APP_IM_HOST;

let org_name = appkey.split('#')[0];
let app_name = appkey.split('#')[1];

let register_url = `${BASE}/${org_name}/${app_name}/users`;
let login_url = `${BASE}/${org_name}/${app_name}/token`;

export const req_register = params => ajax(
    register_url, 
    params, 
    'POST'
);
export const req_login = params => ajax(
    login_url, 
    params, 
    'POST'
);
