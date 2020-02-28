import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'
import { createBrowserHistory } from 'history'; 


import { 
    Layout,
    Button,
    Icon,
    Modal
} from 'antd';
import './room.less';

import {connect} from 'react-redux';
// import {login,create, join} from '../../redux/actions';

import emedia from 'easemob-emedia';

const { Header, Footer, Sider, Content } = Layout;

class Room extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stream_list: [null],
            user_room: this.props.user_room,
            aoff: false,
            voff: false,
        };

        this.toggle_main = this.toggle_main.bind(this);
        this._get_action_buttons = this._get_action_buttons.bind(this);
        this.toggle_own_video = this.toggle_own_video.bind(this);
    }

    componentDidMount() {

        // this.init_emedia_callback();
        window.onbeforeunload=function(e){     
            var e = window.event||e;  
            emedia.mgr.exitConference();
        } 

        let { role } = this.state.user_room;

        
        if(
            role == emedia.mgr.Role.ADMIN ||
            role == emedia.mgr.Role.TALKER
        ) { //自动推流
            console.log('this.publish()')
        }
    }

    leave() {

        let is_confirm = confirm('确定退出会议吗？');

        if(is_confirm){
            emedia.mgr.exitConference();
            createBrowserHistory().push('/#/join');
        }
        
    }
    publish() {
        emedia.mgr.publish({ audio: true, video: true });
    }

    // 取消推流（下麦）
    unpublish(stream) {
        if(!stream){
            return
        }
        emedia.mgr.unpublish(stream);
    }

    _on_stream_added(member, stream) {
        if(!member || !stream) {
            return
        }

        let { stream_list } = this.state

        if(stream.located() && !stream_list[0]){// 自己publish的流
           stream_list[0] = { stream, member };
        } else {
            stream_list.push({stream,member});
        }

        this.setState({ stream_list }, this._stream_bind_video)
    }
    _on_stream_removeed(stream) {
        if(!stream){
            return
        }

        let { stream_list } = this.state

        stream_list.map((item, index) => {
            if(
                item.stream && 
                item.stream.id == stream.id 
            ) {
                stream_list.splice(index, 1)
            }
        });

        this.setState({ stream_list },this._stream_bind_video)
    }
    init_emedia_callback() {
        emedia.config({
            restPrefix: "https://rtc-turn4-hsb.easemob.com"
        });
        let _this = this;
        emedia.mgr.onStreamAdded = function (member, stream) {
            console.log('onStreamAdded >>>', member, stream);

            _this._on_stream_added(member, stream)
        };
        emedia.mgr.onStreamRemoved = function (member, stream) {
            console.log('onStreamRemoved',member,stream);

            _this._on_stream_removeed(stream)
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

        emedia.mgr.onConfrAttrsUpdated = function(cattrs){
            console.log('confr_attrs', cattrs);

            let { name } = _this.props.user //自己的name
            let { role } = _this.state.user_room
            cattrs.map(item => {
                if(item.key == name){
                    return
                }
                if(
                    item.val == 'request_tobe_speaker' && 
                    item.op == 'ADD' &&
                    role == emedia.mgr.Role.ADMIN
                ) {
                    _this.handle_apply_talker(item.key)
                }
            })
        };

        emedia.mgr.onRoleChanged = function (role, confr) {

            console.log('onRoleChanged', role, confr);
            let { user_room } = _this.state;

            if(user_room.role == role){
                return;
            }

            if(role != 3){
                return
            }

            console.log('我变成了talker');
            
            user_room.role = role;

            _this.setState({ user_room });
            _this.publish()
        };
    }
    handle_apply_talker(useid) {
        if(!useid){
            return
        }

        const { confirm } = Modal;

        let confr = this.props.user_room;
        confirm({
            title:`是否同意${useid}的上麦请求`,
            onOk() {

                console.log('model ok');
                
                emedia.mgr.grantRole(confr, [useid], 3)
            }
        })
    }
    toggle_main(index) {

        if(!index) {
            return
        }

        let { stream_list } = this.state;

        let first_item = stream_list.splice(index,1)[0];
        stream_list.unshift(first_item);


        this.setState({ stream_list },this._stream_bind_video)
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
    

    apply_talker() {
        let { name } = this.props.user;

        if(!name) {
            return
        }

        let options = {
            key:name,
            val:'request_tobe_speaker'
        }
        emedia.mgr.setConferenceAttrs(options)
    }

    _stream_bind_video() {
        let { stream_list } = this.state;

        let _this = this;
        stream_list.map(item => {
            if( item ){

                let { id } = item.stream;
                let el = _this.refs[`list-video-${id}`];
    
                let { stream, member } = item;
                if( stream.located() ){
                    emedia.mgr.streamBindVideo(stream, el);
                }else {
                    emedia.mgr.subscribe(member, stream, true, true, el)
                }
            }
        })
    }

    _get_silder_component() {
        let _this = this;
        let { stream_list } = this.state;
        return (
            <Sider 
                width="300" 
                className="talker-list"
                // defaultCollapsed={true}
                // collapsedWidth='0'
            >
                <div className="total">主播6 观众234</div>
                <div className="item-wrap">
                    { stream_list.map((item, index) => {
                        if(index != 0 ){
                            let { id } = item.stream;
                            let { name, role } = item.member;
    
                            return (
                                <div 
                                    key={id} 
                                    className="item"
                                    onDoubleClick={() => this.toggle_main(index)}
                                >
    
                                    {_this._get_action_buttons(item.stream)}
                                    <span className="name">{ name + (role == 7 ? '(管理员)' : '') }</span>
                                    <video ref={`list-video-${id}`} autoPlay></video>
                                </div>
                            )
                        }
                    }) }
                </div>
            </Sider>
        )

    }

    _get_action_buttons(stream) {

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

            return '';

            // 二期的功能 02-28
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
                        type="primary" size="small"
                        onClick={() => this.unpublish(stream)}>下麦</Button>
                </div>
            );
        }

        
        
    }
    _get_main_video_el() {
        let { stream_list } = this.state;

        let main = this.state.stream_list[0];

        if(!main){
            return <Content></Content>
        }

        let name = '', role = undefined;

        if( main.member ){ //赋值显示
            name = main.member.name;
            role = main.member.role;
        }

        let main_stream = stream_list[0].stream
        let id = main_stream.id;
        
        return (
            <Content>
                {this._get_action_buttons(main.stream)}
                <span className="name">{ name + (role == 7 ? '(管理员)' : '') }</span>
                <video ref={`list-video-${id}`} autoPlay></video>
            </Content>
        )
    }

    render() {

        let { user_room } = this.state;

        // if(
        //     !user_room ||
        //     Object.keys(user_room).length == 0
        // ) {
        //     return <Redirect to='/login'/>
        // }

        console.log('props room', this.props.room);
        
        let { role } = this.state.user_room

        return (
            <Layout className="meeting">
                <Header>
                    <div className="info">
                        <div>
                            <span className="logo">logo</span>  
                            <span>network</span>
                        </div>
                        <div>
                            <span>name</span>
                            <span>00:00</span>
                        </div>
                        <div>
                            <span>admin:sqx</span>
                        </div>
                        <div>
                            {role == 1 ? <Button type="primary" 
                                        onClick={() => this.apply_talker()}
                                        style={{marginRight:'10px'}}>申请上麦</Button> : ''
                            }
                            <Button type="primary" onClick={() => this.leave()}>离开</Button>
                        </div>
                        
                        
                    </div>
                </Header>
                <Layout>
                    {this._get_main_video_el()}
                    {this._get_silder_component()}
                </Layout>
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
    // {login, create, join}
)(Room);