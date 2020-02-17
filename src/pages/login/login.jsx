import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'
import {
  Form,
  Icon,
  Input,
  Button,
} from 'antd'

import './login.css';

import emedia from 'easemob-emedia';
import {connect} from 'react-redux'
import {login} from '../../redux/actions'

const Item = Form.Item // 不能写在import之前



class Login extends React.Component {
    
    create = () => {
        
    }

     join_anchor = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
          if (!err) {
            console.log('Received values of form: ', values);
          }
        });
    }
     join_audience = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
          if (!err) {
            console.log('Received values of form: ', values);
          }
        });
    };

    render() {
        const { getFieldDecorator } = this.props.form;

        return (
            <div className="login-wrap">
    
                <Form className="login-form">
                    <Item>
                    {getFieldDecorator('username', {
                        rules: [{ required: true, message: '请输入房间名称' }],
                    })(
                        <Input
                        prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        placeholder="房间名称"
                        />,
                    )}
                    </Item>
                    <Item>
                    {getFieldDecorator('password', {
                        rules: [{ required: true, message: '请输入房间密码' }],
                    })(
                        <Input
                        prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                        type="password"
                        placeholder="房间密码"
                        />,
                    )}
                    </Item>
    
                    <Button 
                        style={{ marginBottom:'15px' }}
                        type="primary"  
                        onClick={this.join_anchor}
                    >
                        以主播身份进入
                    </Button>
                    <Button type="primary" onClick={this.join_audience}>
                        以观众身份进入
                    </Button>
                </Form>
            </div>
        );
    }
}

const WrapLogin = Form.create()(Login)
export default WrapLogin;



