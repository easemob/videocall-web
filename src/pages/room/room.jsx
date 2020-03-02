import React, {Component} from 'react' 


import { 
    Layout,
    Button,
    Icon,
    Modal,
    Form,
    Input
} from 'antd';
import './room.less';


import emedia from 'easemob-emedia';
import login from './login.js'
import { req_create } from '../../api';

const Item = Form.Item 

const { Header, Sider, Content } = Layout;

class Room extends Component {
    constructor(props) {
        super(props);

        
        this.state = {

            // join start
            roomName:'',
            password:'',
            user: {},
            room: {},
            user_room: {
                role: undefined
            },
            // join end
            time:0,// 秒的单位
            stream_list: [null],
            aoff: false,
            voff: false,

            joined: false,
            loading: false
        };

        this.toggle_main = this.toggle_main.bind(this);
        this._get_action_buttons = this._get_action_buttons.bind(this);
        this.toggle_own_video = this.toggle_own_video.bind(this);
    }

    // join fun start
    async create() {

        this.setState({ loading:true })

        let {
            roomName,
            password
        } = this.state;

        let {
            name:memName,
            token
        } = this.state.user;
        

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
        const room = await req_create(params);

        if(!room.confrId){
          return
        };

        this.setState({ room },this.join)
    }

    async join() {
        let {
            confrId, 
            password
        } = this.state.room;

        let { name,token } = this.state.user
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
            role: this.state.user_room.role
        }

        emedia.mgr.setIdentity(name, token);
      
        let { ticket } = await emedia.mgr.reqTkt(params);
        let user_room = await emedia.mgr.joinConferenceWithTicket(confrId, ticket);

        this.setState({ 
            joined: true,
            user_room
        },this.publish)

        this.startTime()
    }

    join_handle(role){
        var _this = this;
        let { user_room } = this.state;
        user_room.role = role;
        this.props.form.validateFields((err, values) => {

            _this.setState({
                roomName: values.roomName,
                password: values.password,
                user_room
            },() => {
                if (!err) {
                    _this.create()
                }
            })
        });
    }
    // join fun end

    async componentDidMount () {

        const user = await login();
        this.setState({ user })
        this.init_emedia_callback();
        window.onbeforeunload=function(e){     
            var e = window.event||e;  
            emedia.mgr.exitConference();
        } 
    }

    componentWillUnmount() {
        clearInterval(this.timeID);
    }
    init_emedia_callback() {
        let _this = this;

        emedia.config({
            restPrefix: "http://a1-hsb.easemob.com"
        });
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
            let { name } = _this.state.user //自己的name
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

            
            let { user_room } = _this.state;
            console.log('onRole', JSON.stringify(user_room.role), role, confr);

            // 被允许上麦
            if(
                user_room.role == 1 &&
                role == 3
            ) {
                user_room.role = role;
                _this.setState({ user_room },_this.publish);
                return
            }

            user_room.role = role;

            _this.setState({ user_room });

        };
    }

    leave() {

        let is_confirm = confirm('确定退出会议吗？');

        if(is_confirm){
            emedia.mgr.exitConference();
            // this.setState({ joined:false });
            window.location.reload()
        }
        
    }
    publish() {
        let { role } = this.state.user_room
        if(role == 1){
            return
        }
        emedia.mgr.publish({ audio: true, video: true });
    }
    // 取消推流（下麦）
    unpublish(stream) {
        if(!stream){
            return
        }
        emedia.mgr.unpublish(stream);
    }

    apply_talker() {
        let { name } = this.state.user;

        if(!name) {
            return
        }

        let options = {
            key:name,
            val:'request_tobe_speaker'
        }
        emedia.mgr.setConferenceAttrs(options)
    }
    handle_apply_talker(useid) {
        if(!useid){
            return
        }

        const { confirm } = Modal;

        let confr = this.state.user_room;
        confirm({
            title:`是否同意${useid}的上麦请求`,
            onOk() {
                emedia.mgr.grantRole(confr, [useid], 3)
            }
        });

        // delete cattrs,处理完请求删除会议属性
        // let options = {
        //     key:useid,
        //     val:'request_tobe_speaker'
        // }

        // emedia.mgr.deleteConferenceAttrs(options)
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

        this.setState({ stream_list:stream_list },this._stream_bind_video)
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
                        if(index != 0 && item){
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
        } 
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
    _get_main_video_el() {
        let { stream_list } = this.state;

        let main = this.state.stream_list[0];

        if(!main){
            return <Content></Content>
        }

        let name = '', role = undefined;

        if( main.member ){ //赋值显示
            name = main.member.name.split('_')[1];
            role = main.member.role;
        }

        console.log('_get_main_video_el', main);
        console.log('_get_main_video_el', name,role);
        
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

    startTime() {
        let _this = this;
        this.timeID = setInterval(
            () => {
                _this.setState(state => ({
                    time:state.time + 1
                }))
            },
            1000
        )
    }
    _get_tick() {
        let { time } = this.state

        function get_second(second){
            return second<10 ? ('0'+second) : second
        }
        function get_minute(minute){
            return minute<10 ? ('0'+minute) : minute
        }
        let time_str = ''
        if(time < 60){
            time_str = '00:' + get_second(time)
        }else if(time >= 60){
            let minute = get_minute(parseInt(time/60));
            let surplus_second = get_second(time%60)
            time_str = minute +':'+ surplus_second
        }
        return time_str
    }
    render() {

        const { getFieldDecorator } = this.props.form;

        let { role } = this.state.user_room
        let { joined, roomName } = this.state

        return (
            <div style={{width:'100%', height:'100%'}}>
                {/* join compoent */}
                <div className="login-wrap" style={{display: joined ? 'none' : 'flex'}}>
                    <Form className="login-form">
                        <Item>
                        {getFieldDecorator('roomName', {
                            initialValue: 'room-3',
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
                            initialValue: '1',
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
                            loading={this.state.loading}
                        >
                            以主播身份进入
                        </Button>
                        <Button 
                            style={{ marginBottom:'15px' }}
                            type="primary"  
                            onClick={() => this.join_handle(1)}
                            loading={this.state.loading}
                        >
                            以观众身份进入
                        </Button>
                    </Form>
                </div>
                
                {/* room compoent */}
                
                <Layout className="meeting" style={{display: joined ? 'block' : 'none'}}>
                    <Header>
                        <div className="info">
                            <div>
                                <span className="logo">logo</span>  
                                <span>network</span>
                            </div>
                            <div>
                                <span style={{marginRight:'10px'}}>{roomName}</span>
                                <span>{this._get_tick()}</span>
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
            </div>
        )
    }
}
const WrapRoom = Form.create()(Room)
export default WrapRoom