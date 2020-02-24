import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'
import {
  Form,
  Icon,
  Input,
  Button,
} from 'antd'

import './join.css';

import {connect} from 'react-redux';

import {create} from '../../redux/actions';

const Item = Form.Item // 不能写在import之前

class Join extends Component {

    constructor(props) {
        super(props)
    
        this.state = {
            roomName:'',
            password:'',
            memName: this.props.user.name,
            token: this.props.user.token
        }
    }
    
    async create() {

        let {
            roomName,
            password,
            memName,
            token
        } = this.state;

        if(
            !roomName ||
            !password ||
            !memName ||
            !token
        ) {
            return
        }

        let params = {
            roomName,
            password,
            memName,
            token
        }
        this.props.create(params)
    }

    join_anchor = e => {
        e.preventDefault();
        var _this = this;
        this.props.form.validateFields((err, values) => {

            _this.setState({
                roomName: values.roomName,
                password: values.password
            },() => {
                if (!err) {
                    _this.create()
                }

            })
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

        const { ticket, confrId } = this.props.room;

        if( ticket && confrId ) {
            return <Redirect to='/room'/>
        }
        
        const { getFieldDecorator } = this.props.form;

        return (
            <div className="login-wrap">
    
                <Form className="login-form">
                    <Item>
                    {getFieldDecorator('roomName', {
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

const mapStateToProps = state => {

    return { 
        user: state.user,
        room: state.room
    }
}

const mapDispatchToProps = dispatch => {
    return {
        create: params => dispatch(create(params))
    }
}
const WrapJoin = Form.create()(Join)
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WrapJoin);



