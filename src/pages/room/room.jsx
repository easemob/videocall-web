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
    message,
    Tooltip,
    Drawer,
    Popconfirm
} from 'antd';
import './room.less';


import emedia from 'easemob-emedia';
import login from './login.js'

// assets

const requireContext = require.context('../../assets/images', true, /^\.\/.*\.png$/)// 通过webpack 获取 img
const get_img_url_by_name = (name) => {
    if(!name){
        return
    }
    let id = requireContext.resolve(`./${name}.png`);

    return __webpack_require__(id);
}


const Item = Form.Item 

const { Header, Content, Footer } = Layout;

class Room extends Component {
    constructor(props) {
        super(props);

        
        this.state = {

            // join start
            roomName:'',
            password:'',
            nickName:'',
            user: {},
            user_room: {
                role: undefined
            },
            confr: {},
            own_stream:null,
            // join end
            time:0,// 秒的单位
            stream_list: [null],//默认 main画面为空
            talker_list_show:false,
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
            password,
            nickName
        } = this.state;

        let { role } = this.state.user_room;
        let {
            username,
            token
        } = this.state.user;
        
        let params = {
            roomName,
            password,
            role,
            memName: 'easemob-demo#chatdemoui_' + username, // appkey + username 格式（后台必须）
            token,
            config:{ nickName }
        }

        try {
            const user_room = await emedia.mgr.joinRoom(params);
    
            if(user_room.error){
                message.error(user_room.errorMessage);
                this.setState({ loading:false })
                return
            }
            let _this = this;
            this.setState({ 
                joined: true,
                user_room
            },() => {
                _this.publish();
                _this.get_confr_info();
            })
    
            // this.startTime()
            
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
            
            let { audio, video } = _this.state;
            if(role == 1){//观众默认关闭摄像头、麦克风
                audio = false;
                video = false;
            }
            _this.setState({
                roomName: values.roomName,
                password: values.password,
                nickName: values.nickName,
                audio,
                video,
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

            _this._on_stream_removed(stream)
        };
        emedia.mgr.onMemberJoined = function (member) {
            console.log('onMemberJoined',member);
            message.success(`${member.nickName || member.name} 加入了会议`);
        };

        emedia.mgr.onMemberLeave = function (member, reason, failed) {
            console.log('onMemberLeave', member, reason, failed);
            message.success(`${member.nickName || member.name} 退出了会议`);

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
            // 上麦、下麦、申请成为管理员 遍历判断
            // 

            let { username:my_username } = _this.state.user //自己的name
            let { role } = _this.state.user_room
            cattrs.map(item => {
                if(item.key == my_username && role != emedia.mgr.Role.ADMIN ){
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

            })
        };

        emedia.mgr.onRoleChanged = function (role) {

            let { user_room } = _this.state;

            // 被允许上麦
            if(
                user_room.role == 1 &&
                role == 3
            ) {
                user_room.role = role;
                let audio = true;//放开音频,否则无法推流
                _this.setState({ user_room, audio },_this.publish);
                message.success('你已经上麦成功,并且推流成功')
                return
            }

            // 被允许下麦
            if(
                (user_room.role == 3 || user_room.role == 7) &&
                role == 1
            ) {
                user_room.role = role;
                _this.setState({ user_room });
                message.success('你已经下麦了,并且停止推流')
                return
            }

            // 变成管理员
            user_room.role = role;
            _this.setState({ user_room });
        };

        emedia.mgr.onAdminChanged = function(admin) {
            let { memberId } = admin;
            if(!memberId){
                return
            }
            _this.admin_changed(memberId)
        }
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
        if(role == 1){//观众不推流
            return
        }
        let { audio,video } = this.state //push 流取off(关) 的反值
        emedia.mgr.publish({ audio, video });
    }

    _get_nickName_by_username(username) {
        if(!username){
            return
        }

        let member_name = 'easemob-demo#chatdemoui_' + username;
        let nickName = username;
        let { stream_list } = this.state;
        stream_list.map(item => {
            if(
                item &&
                item.member &&
                item.member.name == member_name
            ){
                nickName = item.member.nickName || username
            }
        })

        return nickName
    }
    // 上麦申请
    apply_talker() {
        let { username } = this.state.user;

        message.success('上麦申请已发出，请等待主持人同意')
        
        if(!username) {
            return
        }

        let options = {
            key:username,
            val:'request_tobe_speaker'
        }
        emedia.mgr.setConferenceAttrs(options)
    }
    handle_apply_talker(username) {
        if(!username){
            return
        }

        let member_name = 'easemob-demo#chatdemoui_' + username; // sdk 需要一个fk 格式的username
        const { confirm } = Modal;

        let confr = this.state.user_room;

        confirm({
            title:`是否同意${this._get_nickName_by_username(username)}的上麦请求`,
            async onOk() {
                await emedia.mgr.grantRole(confr, [member_name], 3);

                // delete cattrs,处理完请求删除会议属性
                let options = {
                    key:username,
                    val:'request_tobe_speaker'
                }
                emedia.mgr.deleteConferenceAttrs(options);
            },
            cancelText:'取消',
            okText:'同意'
        });


    }
    // 下麦申请
    apply_audience() {

        let { username } = this.state.user;
        let { role } = this.state.user_room

        if(!username) {
            return
        }

        if(role != 7){
            message.success('下麦申请已发出，请等待主持人同意')
        }
        let options = {
            key:username,
            val:'request_tobe_audience'
        }
        emedia.mgr.setConferenceAttrs(options)
    }
    
    async handle_apply_audience(username) {
        if(!username){
            return
        }

        const { confirm } = Modal;

        let member_name = 'easemob-demo#chatdemoui_' + username; // sdk 需要一个fk 格式的name
        let confr = this.state.user_room;

        // delete cattrs,处理完请求删除会议属性
        let options = {
            key:username,
            val:'request_tobe_audience'
        }

        let { username:my_username } = this.state.user;

        if( username == my_username) { //管理员下麦自己
            await emedia.mgr.grantRole(confr, [member_name], 1);
            emedia.mgr.deleteConferenceAttrs(options)

        }else {
            confirm({
                title:`是否同意${this._get_nickName_by_username(username)}的下麦请求`,
                async onOk() {
                    await emedia.mgr.grantRole(confr, [member_name], 1);
                    emedia.mgr.deleteConferenceAttrs(options)
                },
                cancelText:'取消',
                okText:'同意'
            });
        }
    }

    admin_changed(memberId) {

        if(!memberId) {
            return
        }

        let { stream_list } = this.state;

        stream_list.map(item => { //遍历所有 stream_list 将这个流的role 变为管理员
            if(item && item.member){
                if(memberId == item.member.id) {
                    item.member.role = emedia.mgr.Role.ADMIN;
                    let name = item.member.nickName || item.member.name //优先获取昵称
                    message.success(`${name} 成为了管理员`)
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
    _on_stream_removed(stream) {
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
        });

        // 当bind stream to video 就监听一下video
        this._on_media_chanaged();
    }

    //监听音视频变化
    _on_media_chanaged() {
         this.set_stream_item_changed = (constaints, id) => {

            if(!id || !constaints) {
                return
            }


            let { stream_list } = this.state
            let { aoff,voff } = constaints
            stream_list = stream_list.map(item => {
                if(
                    item &&
                    item.stream &&
                    item.stream.id == id
                ){
                    item.stream.aoff = aoff
                    item.stream.voff = voff
                }

                return item
            })

            this.setState({ stream_list })
        }


        let _this = this;
        for (const key in this.refs) {
            let el = this.refs[key];
            let stream_id = key.split('-')[2];
            emedia.mgr.onMediaChanaged(el, function (constaints) {
                _this.set_stream_item_changed(constaints, stream_id)
            });
        } 
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
                    <img src={get_img_url_by_name('logo-text-room')}/>
                </div>
                <div style={{lineHeight:1}}>
                    <div>
                        <Tooltip title={'主持人: ' + (admin || 'sqx')} placement="bottom">
                            <img src={get_img_url_by_name('admin-icon')} style={{marginTop:'-5px'}}/>
                        </Tooltip>
                        {/* <span>network</span> */}
                        <span className="name">{roomName || '房间名称'}</span>
                    </div>
                    <div className="time">{this._get_tick()}</div>
                </div>

                <div onClick={() => this.leave()} style={{cursor: 'pointer',color:'#EF413F'}}>
                    <img src={get_img_url_by_name('leave-icon')} />
                    <span>离开房间</span>
                </div>
            </div>
        )
    }
    _get_drawer_component() {
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
            <Drawer 
                title={`主播${get_talkers()} 观众${audienceTotal}`}
                placement="right"
                closable={false}
                visible={this.state.talker_list_show}
                mask={false}
                getContainer={false}
                width="336px"
            >
                <img src={get_img_url_by_name('expand-icon')} className='expand-icon' onClick={this.collapse_talker_list}/>
                { stream_list.map((item, index) => {
                    if(index != 0 && item){
                        return _this._get_video_item(item,index);
                    }
                }) }
            </Drawer>
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

        let { id, aoff, voff } = stream;
        let { role } = member;
        let nickName = member.nickName || member.name.split('_')[1];

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

                <div className="info">
                    <span className="name">
                        { nickName + (role == 7 ? '(管理员)' : '') + (is_me ? '(我)' : '')}
                    </span>

                    {/* <img src={get_img_url_by_name('no-speak-icon')}/> */}
                    <div className="status-icon">
                        <img 
                            src={get_img_url_by_name('audio-icon')} 
                            style={{marginRight:'4px',visibility: aoff ? 'hidden' : 'visible'}}/>
                        <img 
                            src={get_img_url_by_name('video-icon')} 
                            style={{visibility: voff ? 'hidden' : 'visible'}}/>
                    </div>
                </div>

                {/* <Popconfirm
                    title="是否禁言该用户?"
                    placement="topLeft"
                    // onConfirm={confirm}
                    // onCancel={cancel}
                    okText="禁言"
                    cancelText="取消"
                    getPopupContainer = {() => document.querySelector('.ant-drawer-body')}
                >
                    <span className="no-speak-action">禁言</span>
                </Popconfirm> */}
                
                <video ref={`list-video-${id}`} autoPlay></video>
            </div>
        )

                            
    }

    _get_footer_el() {
        let { role } = this.state.user_room
        let { audio, video, shared_desktop} = this.state
        
        return (
            <div className="actions-wrap">

                <img src={get_img_url_by_name('apply-icon')} style={{visibility:'hidden'}}/>
                <div className="actions">
                    {
                        <Tooltip title={ audio ? '静音' : '解除静音'}>
                            <img src={audio ? 
                                        get_img_url_by_name('audio-is-open-icon') : 
                                        get_img_url_by_name('audio-is-close-icon')} 
                                    onClick={() => this.toggle_audio()}/>
                        </Tooltip>
                           
                    }
                    {
                        <Tooltip title={ video ? '关闭视频' : '开启视频'}>
                            <img style={{margin:'0 10px'}}
                                   src={video ? 
                                       get_img_url_by_name('video-is-open-icon') : 
                                       get_img_url_by_name('video-is-close-icon')} 
                                   onClick={() => this.toggle_video()}/>
                        </Tooltip>
                    }
                    {
                        role == 1 ? 
                        <Tooltip title='申请上麦'>
                            <img 
                                src={get_img_url_by_name('apply-to-talker-icon')} 
                                onClick={() => this.apply_talker()}
                            />
                        </Tooltip> :
                        <Tooltip title='下麦'>
                            <img 
                                src={get_img_url_by_name('apply-to-audience-icon')} 
                                onClick={() => this.apply_audience()}
                            /> 
                        </Tooltip>

                    }
                    {
                        shared_desktop ? 
                        <Tooltip title='停止共享桌面'>
                            <img 
                                src={get_img_url_by_name('stop-share-desktop-icon')} 
                                onClick={() => this.stop_share_desktop()}
                            />
                        </Tooltip> :
                        <Tooltip title='共享桌面'>
                            <img 
                                src={get_img_url_by_name('share-desktop-icon')} 
                                onClick={() => this.share_desktop()}
                            /> 
                        </Tooltip>
                    }
                </div>
                <img 
                    src={get_img_url_by_name('expand-icon')} 
                    onClick={this.expand_talker_list} 
                    style={{visibility:this.state.talker_list_show ? 'hidden' : 'visible'}}/>
            </div>
        )
    }
    expand_talker_list = () => {
        this.setState({
            talker_list_show:true
        })
    }
    collapse_talker_list = () => {
        this.setState({
            talker_list_show:false
        })
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
                    <div className="header">
                        <img src={get_img_url_by_name('logo-text-login')} />
                    </div>
                    <Form className="login-form">
                        <img src={get_img_url_by_name('logo')} />
                        <div style={{margin:'17px 0 45px'}}>欢迎使用环信多人会议</div>
                        <Item>
                            {getFieldDecorator('roomName', {
                                initialValue: 'room-8',
                                rules: [
                                    { required: true, message: '请输入房间名称' },
                                    { min:3 , message: '房间名称不能少于3位'},
                                    { pattern: /^[\u4e00-\u9fa5\w-]*$/, message: '请输入中文、英文、数字、减号或下划线'},
                                ],
                                
                            })(
                                <Input
                                prefix={<Icon type="home" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder="房间名称"
                                maxLength={18}
                                autoComplete="off"
                                />
                            )}
                        </Item>
                        <Item>
                        {getFieldDecorator('password', {
                            initialValue: '123',
                            rules: [
                                { required: true, message: '请输入房间密码' },
                                { min:3 , message: '密码长度不能小于3位'},
                                { pattern: /^[\u4e00-\u9fa5\w-]*$/, message: '请输入中文、英文、数字、减号或下划线'},
                                { max:18, message:'请小于18位'}
                            ],
                        })(
                            <Input
                            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            type="password"
                            placeholder="房间密码"
                            autoComplete="off"
                            />
                        )}
                        </Item>
                        <Item>
                        {getFieldDecorator('nickName')(
                            <Input
                                prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                type="text"
                                placeholder="加入会议的昵称"
                            />
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

                        <div className="action">
                            <Button 
                                type="primary"  
                                onClick={() => this.join_handle(3)}
                                loading={this.state.loading}
                            >
                                以主播身份进入
                            </Button>
                            <Button 
                                type="primary"  
                                onClick={() => this.join_handle(1)}
                                loading={this.state.loading}
                            >
                                以观众身份进入
                            </Button>
                        </div>

                        
                    </Form>
                
                    {/* 主播人数已满提醒框 */}
                    <Modal
                        visible={this.state.talker_is_full}
                        closable={false}
                        onOk={this.close_talker_model}
                        onCancel={this.close_talker_model}
                        okText="以观众身份登录"
                        cancelText="暂不登录"
                        centered={true}
                        mask={false}
                        maskClosable={false}
                        width='470px'

                    >
                        <div>
                            <img src={get_img_url_by_name('warning-icon')}/>
                        </div>
                        <div>主播人数已满<br></br>是否以观众身份进入？</div>
                    </Modal>
                </div>
                
                {/* room compoent */}
                
                <Layout className="meeting" style={{display: joined ? 'block' : 'none'}}>
                    <Header>
                        {this._get_header_el()}
                    </Header>
                    <Content>
                        {/* {main_stream ? this._get_video_item(main_stream) : ''} */}
                        {main_stream ? <video ref={`list-video-${main_stream.stream.id}`} autoPlay></video> : ''}
                    </Content>
                    {this._get_drawer_component()}
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