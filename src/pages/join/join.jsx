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

import {create,login} from '../../redux/actions';
import emedia from 'easemob-emedia';

const Item = Form.Item // 不能写在import之前

class Join extends Component {

    /*
    * 1.当我点击加入按钮时
    *   首先会创建 房间
    *   然后再加入房间
    * 2.当加入房间成功，跳转到 room 界面
    */ 
    constructor(props) {
        super(props)
    
        this.state = {
            roomName:'',
            password:'',
            memName: this.props.user.name,
            token: this.props.user.token,

            defaultRole:3
        }
    }
    
    async create() {

        let {
            roomName,
            password,
            memName,
            token,
            defaultRole
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
            token,
            defaultRole
        }
        await this.props.create(params);

        this.join()
    }

    componentDidMount() {
        emedia.config({
            restPrefix: "https://rtc-turn4-hsb.easemob.com"
        });
    }


    async join() {
        
        let {
            confrId, 
            password
        } = this.props.room;

        let { name,token } = this.props.user
        if(
            !confrId || 
            !password
        ) {
            return
        }

        emedia.mgr.setIdentity(name, token); // ???

        try {
            await emedia.mgr.joinUsePassword(confrId, password);
        } catch (error) {
            console.error('join_error', error)
        }
    }

    join_handle(defaultRole){
        var _this = this;
        this.props.form.validateFields((err, values) => {

            _this.setState({
                roomName: values.roomName,
                password: values.password,
                defaultRole
            },() => {
                if (!err) {
                    _this.create()
                }
            })
        });
    }
    
    render() {

        const { ticket, confrId } = this.props.room;

        if( ticket && confrId ) {
            // return <Redirect to='/room'/>
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
                        onClick={() => this.join_handle(3)}
                    >
                        以主播身份进入
                    </Button>
                    <Button 
                        style={{ marginBottom:'15px' }}
                        type="primary"  
                        onClick={() => this.join_handle(1)}
                    >
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
        create: params => dispatch(create(params)),
        login: params => dispatch(login(params)),
    }
}
const WrapJoin = Form.create()(Join)
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WrapJoin);



