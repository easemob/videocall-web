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


class TalkerList extends Component {

    constructor(props){
        super(props);
        
    }
    fill_stream_to_video() {

        
        this.props.talker_list.map(item => {
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

    // get_action_buttons(stream) {

    //     let { user_room } = this.props
    //     if(
    //         !user_room || 
    //         !stream ||
    //         !stream.owner
    //     ) {
    //         return ''
    //     }

    //     if( user_room.joinId != stream.owner.id) {
    //         return ''
    //     }

    //     return (
    //         <div className="talker-action action">
    //             <Button type="primary" size="small">摄像头</Button>
    //             <Button type="primary" size="small">麦克风</Button>
    //             <Button type="primary" size="small">下麦</Button>
    //         </div>
    //     );
    // }
    render() {

        let { talker_list } = this.props;


        return (
            <Sider 
                width="300" 
                className="talker-list"
                // defaultCollapsed={true}
                // collapsedWidth='0'
            >
                <div className="total">主播6 观众234</div>
                <div className="item-wrap">
                    { talker_list.map(item => {
                        let icon_mic_status = <Icon type="audio" />

                        let { id } = item.stream;
                        let { name, role } = item.member;

                        
                        return (
                            <div 
                                key={id} 
                                className="item"
                                onDoubleClick={() => this.props.toggle_main(id)}
                            >

                                {this.props.get_action_buttons(item.stream)}
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
            talker_list: [],
            main: null,
            user_room: this.props.user_room,
            own_stream:null,
            // talker_list: [{ 
            //     member:{name:'qx.su'},
            //     stream:{id:'1'}
            //  }]

            aoff: false,
            voff: false,
        };
        this.toggle_main = this.toggle_main.bind(this);
        this.get_action_buttons = this.get_action_buttons.bind(this);

        this.toggle_own_video = this.toggle_own_video.bind(this);
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

            if(stream) {
                this.setState({ own_stream: stream})
            }
            console.log('publish stream', stream);
            
        } catch (error) {
            console.log('publish error',error);
        }
    }

    // 取消推流（下麦）
    unpublish() {

    }
    toggle_main(id) {
        if(!id) {
            return
        }
        // 此方法就是将一个数组的项 与一个对象替换
        let talker_list = this.state.talker_list;
        let main = this.state.main;

        talker_list.map((item, index) => { // 在数组中删除点击的项
            let stream_id = item.stream.id;

            if( id == stream_id){

                if(main && Object.keys(main).length > 0){ //main存在，就替换被删除的项
                    main = talker_list.splice(index,1,main)[0]
                }else {
                    main = talker_list.splice(index,1)[0]
                }
                return
            }
        })


        this.setState({
            talker_list, 
            main
        }, this.main_bind_stream)
    }

    // toggle 代指关闭或开启

    // 关闭或开启自己的
    async toggle_own_video(stream) {

        if(!stream || Object.keys(stream).length == 0) {
            return
        }

        let { voff } = this.state
        if(voff){
            await emedia.mgr.resumeVideo(stream);
            voff = !voff
            this.setState({ voff })
        }else {
            await emedia.mgr.pauseVideo(stream);
            voff = !voff
            this.setState({ voff })
        }
    }
    async toggle_own_audio(stream) {
        if(!stream || Object.keys(stream).length == 0) {
            return
        }

        let { aoff } = this.state
        if(aoff){
            await emedia.mgr.resumeAudio(stream);
            aoff = !aoff
            this.setState({ aoff })
        }else {
            await emedia.mgr.pauseAudio(stream);
            aoff = !aoff
            this.setState({ aoff })
        }
    }
    
    // 管理关闭别人的（只有管理员能操作）
    close_talker_camera() {}
    close_talker_mic() {}
    


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

        let _this = this;
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

            await this.props.join(emedia,params);

            let { user_room } = this.props;
            _this.setState({ user_room })
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

            let { main } = _this.state;
            if(stream.located() && !main){// 自己publish的流
                _this.setState({
                    main: {
                        member,
                        stream
                    }
                }, _this.main_bind_stream)

            } else {
                let { talker_list } = _this.state;
                talker_list.push({stream,member});
                _this.setState({ talker_list })
            }
        };
        emedia.mgr.onStreamRemoved = function (member, stream) {
            console.log('onStreamRemoved',member,stream);

            let { talker_list } = _this.state;

            talker_list.map((item, index) => {
                if(
                    item.stream && 
                    item.stream.id == stream.id 
                ) {
                    talker_list.splice(index, 1)
                }
            });

            _this.setState({ talker_list })
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

    componentDidMount() {

        this.init_emedia_callback();
        window.onbeforeunload=function(e){     
            var e = window.event||e;  
            emedia.mgr.exitConference();
        } 
    }



    get_action_buttons(stream) {

        /**
         * 以下将判断 各种角色关系、较为复杂
         * 1.main 只要是自己的图像就有 <摄像头、麦克风、下麦> 操作
         *   a.通过判断 stream.owner.id == joinId 
         * 2.如果自己是管理员,可控制别人的音视频切换
         *      a.通过判断 user_room.role == 7 //7.admin、 3.talker、1.andience
         */ 


        let { user_room } = this.state
        if(
            !user_room || 
            !stream ||
            !stream.owner
        ) {
            return ''
        }

        

        if( user_room.joinId != stream.owner.id) { //不是自己推的流

            if (user_room.role && user_room.role == 7) { //自己是主播
                return (
                    <div className="talker-action action">
                        <Button type="primary" size="small">摄像头</Button>
                        <Button type="primary" size="small">麦克风</Button>
                    </div>
                );
            } else {
                return ''
            }

        } else { //是自己推的流
            return (
                <div className="talker-action action">
                    <Button 
                        type="primary" size="small"
                        onClick={() => this.toggle_own_video(stream)}>摄像头</Button>
                    <Button 
                        type="primary" size="small"
                        onClick={() => this.toggle_own_audio(stream)}>麦克风</Button>
                    <Button 
                        type="primary" size="small">下麦</Button>
                </div>
            );
        }

        
        
    }
    render() {

        console.log('room render props', this.props);
        
        let { main } = this.state;

        let name = '', role = 1;
        if( main && main.member ){ //赋值显示
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
                        {this.get_action_buttons(main && main.stream)}
                        <span className="name">{ name + (role == 7 ? '(管理员)' : '') }</span>
                        <video className="main" ref="main-video"></video>
                    </Content>
                    <TalkerList 
                        { ...this.state } 
                        toggle_main={this.toggle_main}
                        get_action_buttons={this.get_action_buttons}
                    />
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