import React, {Component} from 'react' 


import { 
    Layout,
    Button,
    Icon,
    Modal,
    Form,
    Input,
    Checkbox,
    Row,
    message
} from 'antd';
import './room.less';


import emedia from 'easemob-emedia';
import login from './login.js'

const Item = Form.Item 

const { Header, Sider, Content, Footer } = Layout;

class Room extends Component {
    constructor(props) {
        super(props);

        
        this.state = {

            // join start
            roomName:'',
            password:'',
            user: {},
            user_room: {
                role: undefined
            },
            confr: {},
            own_stream:null,
            // join end
            time:0,// 秒的单位
            stream_list: [null],//默认 main画面为空

            audio:true,
            video:false,

            joined: false,
            loading: false,

            talker_is_full:false, //主播已满

            shared_desktop:false
        };

        this.toggle_main = this.toggle_main.bind(this);
    }

    // join fun start
    async join() {

        this.setState({ loading:true })
        let {
            roomName,
            password
        } = this.state;

        let { role } = this.state.user_room;
        let {
            name:memName,
            token
        } = this.state.user;
        
        let params = {
            roomName,
            password,
            role,
            memName,
            token
        }

        try {
            const user_room = await emedia.mgr.joinRoom(params);
    
            let _this = this;
            this.setState({ 
                joined: true,
                user_room
            },() => {
                _this.publish();
                _this.get_confr_info();
            })
    
            this.startTime()
            
        } catch (error) { 
            if(error.error == -200){//主播人数已满
                this.setState({ talker_is_full: true })
            }
        }
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
                    _this.join()
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
            restPrefix: process.env.REACT_APP_HOST
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

        emedia.mgr.onMemberLeave = function (member, reason, failed) {
            console.log('onMemberLeave', member, reason, failed);

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
            console.log('onConfrAttrsUpdated', cattrs);
            // 会议属性变更
            // 上麦、下麦、管理员变更 便利判断
            // 
            let { name } = _this.state.user //自己的name
            name = name.split('_')[0] // easemob-demo#chatdemoui_xxx fk格式 裁剪为 昵称
            let { role } = _this.state.user_room
            cattrs.map(item => {
                if(item.key == name){
                    return
                }
                if(
                    item.val == 'request_tobe_speaker' && 
                    item.op == 'ADD' &&
                    role == emedia.mgr.Role.ADMIN
                ) { //处理上麦
                    _this.handle_apply_talker(item.key);
                    return
                }
                if(
                    item.val == 'request_tobe_audience' && 
                    item.op == 'ADD' &&
                    role == emedia.mgr.Role.ADMIN
                ) { //处理下麦
                    _this.handle_apply_audience(item.key);
                    return
                }

                if(
                    item.val == 'become_admin' && 
                    item.op == 'ADD'
                ) { //处理下麦
                    _this.handle_become_admin(item.key)
                    return
                }
            })
        };

        emedia.mgr.onRoleChanged = function (role, confr) {
            let { user_room } = _this.state;

            // 被允许上麦
            if(
                user_room.role == 1 &&
                role == 3
            ) {
                user_room.role = role;
                _this.setState({ user_room },_this.publish);
                return
            }

            // 变为管理员
            if(
                user_room.role == 3 &&
                role == 7
            ) {
                _this.become_admin()
            }
            
            
            user_room.role = role;

            _this.setState({ user_room });

        };
    }

    leave() {

        let is_confirm = window.confirm('确定退出会议吗？');

        if(is_confirm){
            emedia.mgr.exitConference();
            window.location.reload()
        }
        
    }
    publish() {
        let { role } = this.state.user_room
        if(role == 1){
            return
        }
        let { audio,video } = this.state //push 流取off(关) 的反值
        emedia.mgr.publish({ audio, video });
    }

    // 上麦申请
    apply_talker() {
        let { name } = this.state.user;

        if(!name) {
            return
        }

        name = name.split('_')[1] // easemob_xxx fk格式请求后台 设置会议属性使用昵称
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

        let member_name = 'easemob-demo#chatdemoui_' + useid; // sdk 需要一个fk 格式的name
        const { confirm } = Modal;

        let confr = this.state.user_room;

        // delete cattrs,处理完请求删除会议属性
        let options = {
            key:useid,
            val:'request_tobe_speaker'
        }

        confirm({
            title:`是否同意${useid}的上麦请求`,
            async onOk() {
                await emedia.mgr.grantRole(confr, [member_name], 3);
                emedia.mgr.deleteConferenceAttrs(options)
            },
            cancelText:'取消',
            okText:'同意'
        });


    }
    // 下麦申请
    apply_audience() {

        let { name } = this.state.user;

        if(!name) {
            return
        }
        name = name.split('_')[1] // easemob_xxx fk格式请求后台 设置会议属性使用昵称
        let options = {
            key:name,
            val:'request_tobe_audience'
        }
        emedia.mgr.setConferenceAttrs(options)
    }
    
    async handle_apply_audience(useid) {
        if(!useid){
            return
        }

        const { confirm } = Modal;

        let member_name = 'easemob-demo#chatdemoui_' + useid; // sdk 需要一个fk 格式的name
        let confr = this.state.user_room;

        // delete cattrs,处理完请求删除会议属性
        let options = {
            key:useid,
            val:'request_tobe_audience'
        }

        let { name } = this.state.user;
        name = name.split('_')[1];
        if( useid == name) { //管理员下麦自己
            await emedia.mgr.grantRole(confr, [member_name], 1);
            emedia.mgr.deleteConferenceAttrs(options)

        }else {
            confirm({
                title:`是否同意${useid}的下麦请求`,
                async onOk() {
                    await emedia.mgr.grantRole(confr, [member_name], 1);
                    emedia.mgr.deleteConferenceAttrs(options)
                },
                cancelText:'取消',
                okText:'同意'
            });
        }
    }

    become_admin() {
        let useid = this.state.user.name.split('_')[1]

        let options = {
            key:useid,
            val:'become_admin'
        }
        emedia.mgr.setConferenceAttrs(options)
    }
    handle_become_admin(useid) {

        if(!useid) {
            return
        }

        let { stream_list } = this.state;

        stream_list.map(item => { //便利所有 stream_list 将这个流的role 变为管理员
            if(item && item.member){
                let name = item.member.name;
                name = name.split('_')[1]
                if(name == useid) {
                    item.member.role = emedia.mgr.Role.ADMIN
                }
            }
        })

        this.setState({ stream_list })

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
    async toggle_video() {

        let { role } = this.state.user_room;
        let { own_stream } = this.state;
        if(role == 1){
            return
        }

        if(!own_stream) {
            return
        }

        let { video } = this.state
        if(video){
            await emedia.mgr.pauseVideo(own_stream);
            video = !video
            this.setState({ video })
        }else {
            await emedia.mgr.resumeVideo(own_stream);
            video = !video
            this.setState({ video })
        }

    }
    video_change = e => {
        this.setState({
          video: e.target.checked,
        });
    };
    async toggle_audio() {
        let { role } = this.state.user_room;
        let { own_stream } = this.state;
        if(role == 1){
            return
        }

        if(!own_stream) {
            return
        }

        let { audio } = this.state
        if(audio){
            await emedia.mgr.pauseAudio(own_stream);
            audio = !audio
            this.setState({ audio })
        }else {
            await emedia.mgr.resumeAudio(own_stream);
            audio = !audio
            this.setState({ audio })
        }
    }

    audio_change = e => {
        this.setState({
          audio: e.target.checked,
        });
    };
    
    async share_desktop() {
        try {
            let _this = this; 

            var options = {
                stopSharedCallback: () => _this.stop_share_desktop()
            }
            await emedia.mgr.shareDesktopWithAudio(options);
            
            this.setState({ shared_desktop:true });
        } catch (err) {
            if( //用户取消也是 -201 所以两层判断
                err.error == -201 &&
                err.errorMessage.indexOf('ShareDesktopExtensionNotFound') > 0
            ){
                message.error('请确认已安装共享桌面插件 或者是否使用的 https域名');
            }
        }
    }

    stop_share_desktop() {
        let { stream_list } = this.state;

        stream_list.map((item) => {
            if(
                item &&
                item.stream &&
                item.stream.type == emedia.StreamType.DESKTOP
            ){
                emedia.mgr.unpublish(item.stream);
            }
        })
        
        this.setState({ 
            shared_desktop:false
        });
    }
    _on_stream_added(member, stream) {
        if(!member || !stream) {
            return
        }

        let { stream_list } = this.state

        if(stream.located()) {//自己 publish的流，添加role 属性
            let { role } = this.state.user_room;
            member.role = role;

            if( stream.type != emedia.StreamType.DESKTOP ) { // 自己推的人像流（用来被控制开关摄像头）
                this.setState({ own_stream: stream }) //用来控制流
            }
        }

        if(stream.located() && !stream_list[0]){// 自己publish的流 并且main没有画面
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
                item &&
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

    _get_header_el() { 

        let { roomName, stream_list } = this.state;
        let admin = '';
        stream_list.map(item => {
            
            if(
                item &&
                item.member && 
                item.member.role == 7
            ) {
                admin = item.member.name.slice(-5);
                return
            }
        })

        return (
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
                    <span>admin: {admin}</span>
                </div>
                <div>
                    <Button type="primary" onClick={() => this.leave()}>离开</Button>
                </div>
            </div>
        )
    }
    _get_silder_component() {
        let _this = this;
        let { stream_list } = this.state;
        let { audienceTotal } = this.state.confr;

        function get_talkers() {
            let talkers = 0;
            let { stream_list } = _this.state;
            stream_list.map(item => {
                if(
                    item &&
                    item.stream &&
                    item.stream.type != emedia.StreamType.DESKTOP
                ){ //null 的不计数 共享桌面不计数
                    talkers++
                }
            })
            return talkers
        }
        
        return (
            <Sider 
                width="300" 
                className="talker-list"
            >
                <div className="total">主播{get_talkers()} 观众{audienceTotal}</div>
                <div className="item-wrap">
                    { stream_list.map((item, index) => {
                        if(index != 0 && item){
                            return _this._get_video_item(item,index);
                        }
                    }) }
                </div>
            </Sider>
        )

    }

    _get_video_item(talker_item,index) {

        let { stream, member } = talker_item;
        if(
            !stream ||
            !member ||
            Object.keys(stream).length == 0 ||
            Object.keys(member).length == 0 
        ) {
            return ''
        }

        let { id } = stream;
        let { name, role } = member;
        name = name.split('_')[1];

        let is_me = false; //判断是否是自己
        if(
            this.state.user_room.joinId == stream.owner.id
        ) {
            is_me = true
        }


        return (
            <div 
                key={id} 
                className="item"
                onDoubleClick={ index ? () => {this.toggle_main(index)} : () => {}} //mian 图不需要点击事件，所以不传index÷
            >

                <span className="name">
                    { name + (role == 7 ? '(管理员)' : '') + (is_me ? '(我)' : '')}
                </span>
                <video ref={`list-video-${id}`} autoPlay></video>
            </div>
        )

    }

    _get_footer_el() {
        let { role } = this.state.user_room
        let { audio, video, shared_desktop} = this.state
        
        return (
            <div className="actions-wrap">
                {
                    role == 1 ? 
                    <Button 
                    type="primary" 
                    onClick={() => this.apply_talker()} 
                    style={{marginRight:'10px'}}>申请上麦</Button> : 
                    <Button type="primary" 
                    onClick={() => this.apply_audience()}
                                    style={{marginRight:'10px'}}>申请下麦</Button>
                }

                {
                   <Button 
                        type="primary"
                        onClick={() => this.toggle_video()}>{video ? '关闭摄像头' : '打开摄像头'}</Button>
                                
                }
                {
                    <Button 
                        type="primary"
                        onClick={() => this.toggle_audio()}>{audio ? '关闭麦克风' : '打开麦克风'}</Button>
                }
                {
                    shared_desktop ? 
                    <Button 
                        type="primary"
                        onClick={() => this.stop_share_desktop()}>停止共享桌面</Button> :
                    <Button 
                        type="primary"
                        onClick={() => this.share_desktop()}>共享桌面</Button>
                }
            </div>
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

    // 获取会议信息
    get_confr_info = async () => {
        let { confrId } = this.state.user_room;
        let { password } = this.state;

        if(!confrId){
            return
        }

        const confr = await emedia.mgr.selectConfr(confrId, password);

        this.setState({ confr:confr.confr })
        
    }
    close_talker_model = () => {
        this.setState({
            talker_is_full: false
        })
    }
    render() {

        const { getFieldDecorator } = this.props.form;

        let { joined } = this.state;
        let main_stream = this.state.stream_list[0]

        return (
            <div style={{width:'100%', height:'100%'}}>
                {/* join compoent */}
                <div className="login-wrap" style={{display: joined ? 'none' : 'flex'}}>
                    <Form className="login-form">

                        <h1 className="title">Video Call</h1>
                        <Item>
                        {getFieldDecorator('roomName', {
                            initialValue: '',
                            rules: [
                                { required: true, message: '请输入房间名称' },
                                { min:3 , message: '房间名称不能少于3位'}
                            ],
                        })(
                            <Input
                            prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder="房间名称"
                            />,
                        )}
                        </Item>
                        <Item>
                        {getFieldDecorator('password', {
                            initialValue: '',
                            rules: [
                                { required: true, message: '请输入房间密码' },
                                { min:3 , message: '密码长度不能小于3位'}
                            ],
                        })(
                            <Input
                            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            type="password"
                            placeholder="房间密码"
                            />,
                        )}
                        </Item>
        
                        {/* <div>会议设置</div> */}
                        
                        <Row 
                            type="flex"
                            justify="space-between"
                            style={{margin: '-8px 0px 30px'}}>
                            <Checkbox
                                checked={this.state.video}
                                onChange={this.video_change}
                            >入会开启摄像头</Checkbox>
                        </Row>

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
                
                    {/* 主播人数已满提醒框 */}
                    <Modal
                        visible={this.state.talker_is_full}
                        onOk={this.close_talker_model}
                        onCancel={this.close_talker_model}
                        okText="确定"
                        cancelText="取消"
                        centered={true}
                    >
                        <p>主播人数已满，以观众身份进入！</p>
                    </Modal>
                </div>
                
                {/* room compoent */}
                
                <Layout className="meeting" style={{display: joined ? 'block' : 'none'}}>
                    <Header>
                        {this._get_header_el()}
                    </Header>
                    <Layout>
                        <Content>
                            {main_stream ? this._get_video_item(main_stream) : ''}
                        </Content>
                        {this._get_silder_component()}
                    </Layout>
                    <Footer>
                        {this._get_footer_el()}
                    </Footer>
                </Layout>
            </div>
        )
    }
}
const WrapRoom = Form.create()(Room)
export default WrapRoom