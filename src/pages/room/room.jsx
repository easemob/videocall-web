import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'
import { createBrowserHistory } from 'history'; 


import { 
    Layout,
    Button,
    Icon
} from 'antd';
import './room.less';

import {connect} from 'react-redux';
import {login,create, join} from '../../redux/actions';

import emedia from 'easemob-emedia';

const { Header, Footer, Sider, Content } = Layout;


class AnchorList extends Component {

    fill_stream_to_video() {

        
        this.props.anchor_list.map(item => {
            let { id } = item.stream;
            let el = this.refs[`list-video-${id}`];
            
            let stream = item.stream;
            let member = item.member;

            emedia.mgr.subscribe(member, stream, true, true, el)
        })
    }
    
    componentDidUpdate() {
        this.fill_stream_to_video()
    }
    render() {

        let { anchor_list } = this.props;
        return (
            <Sider 
                width="300" 
                className="anchor-list"
                // defaultCollapsed={true}
                // collapsedWidth='0'
            >
                <div className="total">主播6 观众234</div>
                <div className="item-wrap">
                    { anchor_list.map(item => {
                        let icon_mic_status = <Icon type="audio" />

                        let { id } = item.stream;
                        let { name, role } = item.member;

                        
                        return (
                            <div 
                                key={id} 
                                className="item"
                                onDoubleClick={() => this.props.toggle_main(id)}>
                                {/* {action_buttons} */}
                                <span className="name">{ name + (role == 7 ? '(管理员)' : '') }</span>
                                <video ref={`list-video-${id}`} autoPlay></video>
                                {/* {icon_mic_status} */}
                            </div>
                        )
                    }) }
                </div>
            </Sider>
        )
    }
}



class Room extends Component {
    constructor(props) {
        super(props);
        this.state = {
            anchor_list: [],
            main: null
            // anchor_list: [{ 
            //     member:{name:'qx.su'},
            //     stream:{id:'1'}
            //  }]
        };
        this.toggle_main = this.toggle_main.bind(this)
    }

    // temp

    join_handle(name, role){
        if(!name || !role) {
            return
        }
        

        const login = async () => {
            let params = {
                grant_type: "password",
                username: name,
                password: 'ssgsqx133856',
                timestamp: new Date().getTime()
            }
    
            await this.props.login(params);

            create();

        };
        const create = async () => {
            let params = {
                roomName:'room-2',
                password:'1',
                memName: this.props.user.name,
                token: this.props.user.token
            }
    
            await this.props.create(params);
            join();
        };
        const join = async () => {
            let {
                confrId, 
                password
            } = this.props.room;
    
            let { name,token } = this.props.user
            if(
                !confrId || 
                !password ||
                !name ||
                !token
            ) {
                return
            }
    
            let params = {
                name,
                token,
                confrId,
                password,
                role
            }

            this.props.join(emedia,params);
            
        };


        login();

    }
    // temp fun

    main_bind_stream() {

        let { main } = this.state;

        if(
            !main ||
            Object.keys(main).length == 0
        ) {
            return
        }

        let videoTag = this.refs['main-video'];

        emedia.mgr.streamBindVideo(main.stream, videoTag);
    }
    init_emedia_callback() {
        emedia.config({
            restPrefix: "https://rtc-turn4-hsb.easemob.com"
        });
        let _this = this;
        emedia.mgr.onStreamAdded = function (member, stream) {
            console.log('onStreamAdded >>>', member, stream);

            if(stream.located()){// 自己publish的流
                _this.setState({
                    main: {
                        member,
                        stream
                    }
                }, _this.main_bind_stream)

            } else {
                let { anchor_list } = _this.state;
                anchor_list.push({stream,member});
                _this.setState({ anchor_list })
            }
        };
        emedia.mgr.onStreamRemoved = function (member, stream) {
            console.log('onStreamRemoved',member,stream);
        };
        emedia.mgr.onMemberJoined = function (member) {
            console.log('onMemberJoined',member);
            
        };

        emedia.mgr.onMemberLeave = function (member, reason) {
            console.log('onMemberLeave', member, reason);

            function get_failed_reason(failed) {
                let reasons = {
                    '-9527' : "失败,网络原因",
                    '-500' : "Ticket失效",
                    '-502' : "Ticket过期",
                    '-504' : "链接已失效",
                    '-508' : "会议无效",
                    '-510' : "服务端限制"
                }

                return reasons[failed]
            }

            let reason_text = '正常挂断';


            let reasons = {
                0: '正常挂断', 
                1: "没响应",
                2: "服务器拒绝",
                3: "对方忙",
                4: "网络原因",
                5: "不支持",
                10: "其他设备登录",
                11: "会议关闭"
            }

            if(reason){
                reason_text = reasons[reason];
            }

            if(reason == 4 && failed){
                reason_text = get_failed_reason(failed);
            }
        };
    }

    toggle_main(id) {
        if(!id) {
            return
        }
        // 此方法就是将一个数组的项 与一个对象替换
        let anchor_list = this.state.anchor_list;
        let main = this.state.main;

        anchor_list.map((item, index) => { // 在数组中删除点击的项
            let stream_id = item.stream.id;

            if( id == stream_id){

                if(main && Object.keys(main).length > 0){ //main存在，就替换被删除的项
                    main = anchor_list.splice(index,1,main)[0]
                }else {
                    main = anchor_list.splice(index,1)[0]
                }
                return
            }
        })


        this.setState({
            anchor_list, 
            main
        }, this.main_bind_stream)
    }
    componentDidMount() {

        this.init_emedia_callback();
        window.onbeforeunload=function(e){     
            var e = window.event||e;  
            emedia.mgr.exitConference();
        } 
    }


    leave() {

        let is_confirm = confirm('确定退出会议吗？');

        if(is_confirm){
            emedia.mgr.exitConference();
            // createBrowserHistory().push('/join');
        }
        
    }
    async publish() {

        try {
            const stream = emedia.mgr.publish({ audio: true, video: true });
            console.log('publish stream', stream);
            
        } catch (error) {
            console.log('publish error',error);
        }
    }

    render() {

        console.log('room render props', this.props);
        
        let action_buttons = (
            <div className="talker-action action">
                <Button type="primary" size="small">摄像头</Button>
                <Button type="primary" size="small">麦克风</Button>
                <Button type="primary" size="small">下麦</Button>
            </div>
        );

        let { main } = this.state;
        let name = '', role = 1;
        if( main && main.member ){
            name = main.member.name;
            role = main.member.role;
        }
        return (
            <Layout className="meeting">
                <Header>
                    <span className="logo">logo</span>
                    <div className="info">
                        <span>network</span>
                        <span>name</span>
                        <span>admin</span>
                        <Button type="primary" onClick={() => this.leave()}>离开</Button>
                    </div>
                </Header>
                <Layout>
                    <Content>
                        {action_buttons}
                        <span className="name">{ name + (role == 7 ? '(管理员)' : '') }</span>
                        <video className="main" ref="main-video"></video>
                    </Content>
                    <AnchorList anchor_list={this.state.anchor_list} toggle_main={this.toggle_main}/>
                </Layout>
                <Footer>
                    <div style={{textAlign:'center',margin:'20px 0'}}>
                        <Button 
                            type="primary" 
                            onClick={() => this.publish()}
                            style={{width:'200px'}}>推流</Button>
                    </div>

                    <div style={{textAlign:'center'}}>

                        <Button type="primary" onClick={() => this.join_handle('qx.su',3)} style={{margin:'0 8px'}}>qx.su 主播</Button>
                        <Button type="primary" onClick={() => this.join_handle('qx.su',1)}>qx.su 观众</Button>

                        <Button 
                            type="primary" 
                            onClick={() => this.join_handle('qx.su.2',3)} 
                            style={{margin:'0 8px 0 30px',background:'#00ba6e'}}>qx.su.2 主播</Button>
                        <Button 
                            type="primary" 
                            onClick={() => this.join_handle('qx.su.2',1)} 
                            style={{background:'#00ba6e'}}>qx.su.2 观众</Button>

                        <Button 
                            type="primary" 
                            onClick={() => this.join_handle('qx.su.3',3)} 
                            style={{margin:'0 8px 0 30px',background:'#159cd5'}}>qx.su.3 主播</Button>
                        <Button 
                            type="primary" 
                            onClick={() => this.join_handle('qx.su.3',1)} 
                            style={{background:'#159cd5'}}>qx.su.3 观众</Button>
                    </div>

                </Footer>
            </Layout>
        )
    }
}

export default connect(
    state => ({
        user:state.user,
        room: state.room,
        user_room: state.user_room
    }),
    {login, create, join}
)(Room);