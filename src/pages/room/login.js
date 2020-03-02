
import { req_register, req_login } from '../../api';

function Login() {
    this.user = {};
    this.get_uuid = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    this.register = async () => {

        let params = {
            username : this.get_uuid().split('-').join(''),
            password: '123456'
        }
    
        const result = await req_register(params);

        if(
            result.entities &&
            result.entities[0] &&
            result.entities[0].activated
        ){
            let user = {
                name: params.username,
                password:params.password
            }
            this.user = user;
            window.sessionStorage.setItem('easemob-user', JSON.stringify( this.user ))
        }
    }
    this.login = async () => {
        let params = {
            grant_type: "password",
            username: this.user.name,
            password: this.user.password,
            timestamp: new Date().getTime()
        }
        const user_info = await req_login(params);

        if(!user_info.access_token){
            return 
        };

        let user = {
            name: user_info.user && 'easemob-demo#chatdemoui_' + user_info.user.username,
            token: user_info.access_token,
            uuid: user_info.user && user_info.user.uuid
        }

        return user;
    }
    this.init = async () => {
        this.user = JSON.parse(window.sessionStorage.getItem('easemob-user'));

        if(
            !this.user ||
            !this.user.name || 
            !this.user.password
        ) {
            await this.register();
            const user = await this.login()
            return user;
        } else {
            const user = await this.login()
            return user;
        }


    }

    
}

export default new Login().init;