import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'
import {
  Form,
  Icon,
  Input,
  Button,
} from 'antd'

import './login.css';

import {connect} from 'react-redux'
import {login} from '../../redux/actions'

const Item = Form.Item // 不能写在import之前

class Login extends Component {

    constructor(props) {
        super(props)
    
        this.state = {
            loading: false
        }
    }

    login = (event) => {
        this.setState({ loading: true })
        // 阻止事件的默认行为
        event.preventDefault()
    
        // 对所有表单字段进行检验
        let _this = this;
        this.props.form.validateFields(async (err, values) => {
          // 检验成功
          if (!err) {
            // 请求登陆
            const {username, password} = values
    
            let params = {
                grant_type: "password",
                username,
                password,
                timestamp: new Date().getTime()
            }

            await _this.props.login(params);
            _this.setState({ loading: false })
            
          } else {
            console.log('检验失败!')
          }
        });
    }

    render() {

        // 如果用户已经登陆, 自动跳转到管理界面
        const user = this.props.user;

        if(user && user.name) {
            return <Redirect to='/join'/>
        }

        const { getFieldDecorator } = this.props.form;

        return (
            <div className="login-wrap">
    
                <Form onSubmit={this.login} className="login-form">
                    <Item>
                    {getFieldDecorator('username', {
                        rules: [{ required: true, message: '请输入用户名' }],
                    })(
                        <Input
                        prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        placeholder="用户名"
                        />,
                    )}
                    </Item>
                    <Item>
                    {getFieldDecorator('password', {
                        rules: [{ required: true, message: '请输入密码' }],
                    })(
                        <Input
                        prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        type="password"
                        placeholder="密码"
                        />,
                    )}
                    </Item>
    
                    <Button 
                        type="primary"  
                        htmlType="submit" 
                        loading={this.state.loading} 
                    >
                        登录
                    </Button>
                </Form>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return { user: state.user }
}

const mapDispatchToProps = dispatch => {
    return {
        login: params => dispatch(login(params))
    }
}
const WrapLogin = Form.create()(Login)
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WrapLogin);



