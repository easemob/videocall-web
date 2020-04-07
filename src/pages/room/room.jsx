import React, {Component} from 'react' 
import ReactDOM from 'react-dom'

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
    Popconfirm,
    List,
    Avatar,
    Dropdown,
    Menu,
    Switch,
    Radio
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
class ToAudienceList extends Component {
    state = {
        checked_talker: null,//checked talkers name(also username)
        show:false
    }
    // 展示这个框的时候，传入一个回调，处理完了执行这个回调，用来执行谁上麦
    show = (handle_apply_talker_callback) => {

        this.handle_apply_talker_callback = handle_apply_talker_callback;

        this.setState({ show: true})
    }
    hide = () => {
        this.setState({ show: false, checked_talker: null })
    }
    onChange = e => {
        this.setState({
            checked_talker: e.target.value,
        });
    }
    confirm = async () => {
        let confr = this.props.user_room;
        let { checked_talker } = this.state
        try {
            await emedia.mgr.grantRole(confr, [checked_talker], 1);
        
            if(
                this.handle_apply_talker_callback && 
                typeof this.handle_apply_talker_callback == 'function'
            ){
                this.handle_apply_talker_callback()
            }

            this.hide()
        } catch (error) {
            message.error('选人下麦失败，请重试')
        }
        
    }
    render() {
        let { stream_list } = this.props;
        let { show, checked_talker } = this.state

        let base_url = 'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/RtcDemo/headImage/';

        return (
            <Drawer 
                placement="left"
                closable={false}
                visible={show}
                mask={false}
                getContainer={false}
                width="336px"
                className="to-audience-list"
                destroyOnClose={true}
            >

               <div className="title">
                    <Button 
                        style={{background:'transparent',color:'#fff'}}
                        onClick={this.hide}
                    >返回</Button>

                    <span style={{textAlign:'center'}}>主播人数已满<br/>可选择替换主播</span> 

                    <Button onClick={this.confirm}
                    >确定</Button>
                </div> 
               <Radio.Group 
                    onChange={this.onChange}
                    value={checked_talker}
                    name="to-audience"
               >
                   { stream_list.map(item => {
                        if( // 自己不显示
                            item &&
                            item.member &&
                            !item.member.is_me
                        ) {
                            let { headImage } = item.member.ext;
                            return (
                                <div className="info-wrapper" key={item.member.name}>

                                    <Avatar src={ base_url + headImage }/>
                                    <span className="name">{item.member.nickName || item.member.name}</span>
                                    <Radio value={item.member.name} />
                                </div>
                            )
                        }
                    })}
               </Radio.Group>
            </Drawer>
        )
    }
}

class MuteAction extends Component {
    state = {
        mute_all: false
    }
    mute_all_action = () => {

        let { username } = this.props.user;

        let options = {
            key:'muteall',
            val:JSON.stringify({status: 1, setter:username, timestamp: new Date().getTime() })
        }
        
        emedia.mgr.setConferenceAttrs(options)

        message.success('已全体静音')
        this.setState({ mute_all:true })
    }
    unmute_all_action = () => {
        let { username } = this.props.user;

        let options = {
            key:'muteall',
            val:JSON.stringify({status: 0, setter:username, timestamp: new Date().getTime() })
        }
        
        emedia.mgr.setConferenceAttrs(options)
        message.success('已解除全体静音')
        this.setState({ mute_all:false })
    }
    render() {
        let { mute_all } = this.state
        return(

            <div className='mute-action-wrapper'>
                <Tooltip title={ mute_all ? '解除禁言' : '全体禁言' } placement="left">
                        {
                            mute_all ? 
                            <img src={get_img_url_by_name('mute-all-icon')} onClick={this.unmute_all_action}/> :
                            <img src={get_img_url_by_name('unmute-all-icon')} onClick={this.mute_all_action}/>
                            
                        }
                </Tooltip>
            </div>
        )
    }
}

class ManageTalker extends Component {
    // 静音某一人
    mute = () => {


        let { name, nickName } = this.props.member;
            nickName = nickName || name; 
            name = name.split('_')[1]// delete appkey

        let { my_username } = this.props;

        let options = {
            key:my_username,
            val: JSON.stringify( { action:"mute",uids:[name], timestamp: new Date().getTime() } ) 
        }
        
        emedia.mgr.setConferenceAttrs(options);

        message.success(`已设置${nickName}为静音`);
    }
    // 解除静音某人
    unmute = () => {

        let { name, nickName } = this.props.member;
            nickName = nickName || name; 
            name = name.split('_')[1]// delete appkey

        let { my_username } = this.props;
        let options = {
            key:my_username,
            val: JSON.stringify( { action:"unmute",uids:[name], timestamp: new Date().getTime() } ) 
        }
        
        emedia.mgr.setConferenceAttrs(options);

        message.success(`已解除${nickName}的静音`);
    }
    // 更多的操作
    more_action = ( {key} ) => {
        
        if(key == 'appoint_as_admin'){
            this.appoint_as_admin()
        } else if(key == 'move_out'){
            this.move_out()
        }
    }
    // 指定为主持人
    appoint_as_admin = async () => {
        let { confr } = this.props;
        let { memName, nickName } = this.props.member;
            nickName = nickName || memName; //兼容显示

        if(!confr || !memName){
            return
        }

        try {
            await emedia.mgr.grantRole(confr, [memName], 7);

            message.success(`已把${nickName}设为主持人`)
        } catch (error) {
            message.error('设为主持人失败')
        }
    }
    // 移出会议
    move_out = () => {
        

        let { confr } = this.props;
        let { memName } = this.props.member;

        if(!confr || !memName){
            return
        }
        emedia.mgr.kickMembersById(confr, [memName]);

    }

    render() {

        let { aoff } = this.props.stream;
        let { role } = this.props.member;

        const menu = (
            <Menu onClick={this.more_action}>
                <Menu.Item key="appoint_as_admin">
                    设为主持人
                </Menu.Item>
                <Menu.Item key="move_out">
                    移出会议
                </Menu.Item>
            </Menu>
        );

        return (
            <div className='manage-talker-mask'>
                <div className="action" ref="action-wrapper">

                    {
                        aoff ? <Button size='small' onClick={() => this.unmute()}>解除静音</Button>
                             : <Button size='small' onClick={() => this.mute()}>静音</Button>
                    }
                    
                    { role != 7 ? //非主持人才显示更多
                        <Dropdown 
                            overlay={menu} 
                            placement="bottomLeft"
                            trigger={["click"]}
                            getPopupContainer={() => this.refs['action-wrapper']}
                        >
                            <Button size='small'>更多</Button>
                        </Dropdown> : ''}
                </div>
            </div>
        )
    }
}

// 以函数调用的形式，显示提示框 appendChild + ReactDom.render()
const LeaveConfirmModal = {

    visible: false,
    roleToken:null,
    show(roleToken) {
        
        this.roleToken = roleToken;
        this.visible = true;
        this.render();
    },

    hide() {
        this.visible = false;
        this.render()
    },

    leave() {
        emedia.mgr.exitConference();
        this.visible = false;
        this.render();
        window.location.reload()
    },

    end() {
        if(!this.roleToken) {
            return
        }
        this.visible = false;
        emedia.mgr.destroyConference(this.roleToken);
        this.render();
        window.location.reload();
    },

    render() {
        let dom = document.querySelector('#leave-confirm-modal');
        if(!dom) {
            dom = document.createElement('div');
            dom.setAttribute('id', 'leave-confirm-modal');
            document.querySelector('.meeting').appendChild(dom);
        }

        ReactDOM.render(
            <div 
                className="leave-confirm-modal" 
                style={{opacity: this.visible ? 1 : 0}}
            >
                <div className="title">
                    <span>警告</span>
                    <img src={get_img_url_by_name('close-handle-icon')} onClick={() => this.hide()}/>
                </div>
                <div className="text">
                    如果您不想结束会议<br></br>请在离开会议前指定新的主持人
                </div>
                <div className="handle">
                    <span className="leave" onClick={() => this.leave()}>离开会议</span><br />
                    <span className="end" onClick={() => this.end()}>结束会议</span>
                </div>
            </div>, dom)
    }
}

// 获取头像组件
import axios from 'axios'
class HeadImages extends Component {

    state = {
        visible: false,
        url_list:{},
        headimg_url_suffix: ''
    }

    componentDidMount() {
        this.get_url_json()
    }
    async get_url_json () {

        let url = 'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/RtcDemo/headImage/headImage.conf';
        const result = await axios({
            method:'get',
            url
        })
        this.setState({ url_list:result.data.headImageList }); 
    }

    show = () => {
        this.setState({ visible: true })
    }
    handleCancel = () => {
        this.setState({ visible: false })
    }

    change(headimg_url_suffix) {
        if(!headimg_url_suffix) {
            return
        }
        this.setState({ headimg_url_suffix })
    }
    handleSubmit = () => {
        let { headimg_url_suffix } = this.state;
        this.props.headimg_change(headimg_url_suffix);
        this.setState({ visible:false })
    }
    render() {

        let { visible, url_list, headimg_url_suffix } = this.state;
        let base_url = 'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/RtcDemo/headImage/';
        return (
            <Modal 
                title="请选择头像"
                visible={visible}
                onOk={this.handleSubmit}
                onCancel={this.handleCancel}
                footer={null}
                getContainer={false}
                className="head-images-modal"
                width="470px"
            >
                <div className="head-image-list">
                    {
                        Object.keys(url_list).map((item, index) => {
                            return (
                                <div 
                                    className="avatar-wrapper"  
                                    key={index}
                                    onClick={() => this.change(url_list[item])}
                                >
                                    <Avatar src={ base_url + url_list[item] }/>
                                    { headimg_url_suffix == url_list[item] ? //被选中的显示样式
                                        <div className='checked-mask'>
                                            <Icon type="check" />
                                        </div> : ''
                                    }
                                </div>
                            )
                        })
                    }
                </div>
                        
                <div className="action">
                    <Button type="primary" onClick={this.handleSubmit}>保存并返回</Button>
                </div>
                
            </Modal>
        )
    }
}

// 设置 昵称、音视频开关、头像 modal
class Setting extends Component {

    state = {
        nickName: '',
        video: false,
        audio: true,
        visible: false,
        headimg_url_suffix: ''
    }

    componentDidMount() {
        this._map_props_to_state();
    }
    componentWillReceiveProps(nextProps) {

        this.setState({ 
            nickName: nextProps.nickName,   
            headimg_url_suffix: nextProps.headimg_url_suffix,   
        });
    }
    _map_props_to_state() {
        let { nickName, video, audio } = this.props

        this.setState({
            nickName, 
            video, 
            audio
        })
    }
    show = () => {
        this.setState({ visible: true })
    }
    handleCancel = () => {
        this.setState({ visible: false })
    }
    handleSubmit = () => {

        let {
            headimg_url_suffix,
            nickName,
            video,
            audio
        } = this.state;

        let _this = this;
        
        // 回调上去
        _this.props._get_setting_values({headimg_url_suffix, nickName,  video, audio})
        _this.setState({ visible: false })
        window.sessionStorage.setItem('easemob-nickName', nickName); //保存 nickName
        window.sessionStorage.setItem('easemob-headimg_url_suffix', headimg_url_suffix); //保存 头像 url
        
    }
    headimg_change = headimg_url_suffix => {

        if(!headimg_url_suffix){
            return
        }

        this.setState({ headimg_url_suffix })
    }
    nick_name_change = e => {
        const { value } = e.target;
        this.setState({
            nickName:value
        })
    }
    video_change = e => {
        this.setState({
            video:e.target.checked
        })
    }
    audio_change = e => {
        this.setState({
            audio:e.target.checked
        })
    }
    // 更换头像
    get_headimg_url = () => {
        this.head_images.show()
    }
    render() {
        let { visible, headimg_url_suffix, audio, video, nickName } = this.state;

        let base_url = 'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/RtcDemo/headImage/';

        return (
            <Modal 
                visible={visible}
                onOk={this.handleSubmit}
                onCancel={this.handleCancel}
                footer={null}
                getContainer={false}
                className="setting-modal"
                width="470px"
            >
                        <div className="avatar-wrapper ">
                            <Avatar 
                                src={base_url + headimg_url_suffix} 
                                onClick={this.get_headimg_url} 
                                className='setting-avatar'/>
                            <HeadImages 
                            ref={head_images => this.head_images = head_images}
                            headimg_change={this.headimg_change}/>
                        </div>
                        <div>昵称</div>
                        <Input placeholder="请输入昵称" value={nickName} onChange={this.nick_name_change} />
                        <Checkbox checked={video} onChange={this.video_change}>打开摄像头</Checkbox>
                        <Checkbox checked={audio} onChange={this.audio_change}>打开麦克风</Checkbox>
                        <div className="action">
                            <Button type="primary" onClick={this.handleSubmit}>保存并返回</Button>
                        </div>
                
            </Modal>
        )
    }
}




// 设置昵称 modal
class SetNickName extends Component {
    state = {
        visible: false,
        nickName:''
    }

    show = () => {
        this.setState({ visible: true })
    }

    hide() {
        this.setState({ visible: false })
    }
    onChange = e => {
        
        const { value } = e.target;

        this.setState({
            nickName: value
        })
    }
    submit() {
        let { nickName } = this.state;
        this.props._set_nickname(nickName);
        window.sessionStorage.setItem('easemob-nickName', nickName);

        this.setState({ visible: false })
    }

    render() {
        return (
            <Modal 
                title="请设置昵称"
                visible={this.state.visible}
                onCancel={() => this.hide()}
                onOk={() => this.submit()}
                okText="确定"
                cancelText="取消"
                getContainer={false}
                width="350px"
                centered={true}
                className="set-nickname-modal"
            >
                <Input onChange={this.onChange}/>
            </Modal>
        )
    }
}

// 申请主持人 或者 放弃主持人操作
function AdminChangeHandle(props) {
    let {
        my_username,
        my_role,
        stream_list,
        confr
    } = props;

    // 主播角色
    if(my_role == 3) {
        const apply_admin = () => {
    
            if(!my_username) {
                console.warn('ApplyAdmin username is required');
                return
            }
    
            let options = {
                key:my_username,
                val:'request_tobe_admin'
            }
            
            emedia.mgr.setConferenceAttrs(options);
            message.success('成为主持人申请已发出，请等待主持人同意')
        
        }
        return(
            <div className="admin-change-handle" onClick={apply_admin}>申请主持人</div>
        ) 
    }

    // 主持人角色
    if(my_role == 7) {

        let admin_number = 0;
        stream_list.map(item => { //必须大于2个主持人，才可放弃主持人，否则会有问题
            if(
                item && 
                item.member && 
                item.member.role == 7
            ) {
                admin_number++
            }
        });

        if( admin_number < 2) {
            return ''
        }

        const apply_talker = async () => {
    
            if(!my_username) {
                console.warn('ApplyAdmin username is required');
                return
            }
    
            let memName = 'easemob-demo#chatdemoui_' + my_username;
            try {
                await emedia.mgr.grantRole(confr, [memName], 3);
                message.success('您已经变为了主播')
            } catch (error) {
                message.error('变更主播失败')
            }
        
        }
        return(
            <div className="admin-change-handle" onClick={apply_talker}>放弃主持人</div>
        )
    }

    return ''
}
// 会议属性 处理
// 判断自己的角色 和 username
// 非主持人 无 操作权限
// 处理完 回调上去
const handle_conference_attrs = (options, callback) => {


    let {
        confr_attrs,
        my_username,
        my_role,
        confr
    } = options;

    if(my_role != emedia.Role.ADMIN) {
        return
    }
    const { confirm } = Modal;
    confr_attrs.map(item => {
        if(
            item.val == 'request_tobe_admin' && 
            item.op == 'ADD'
        ) { //处理上麦
            let username = item.key;
            if(!username) {
                return
            }

            let member_name = 'easemob-demo#chatdemoui_' + username; // sdk 需要一个fk 格式的username

            let nick_name = options._get_nickName_by_username(username);
            confirm({
                title:`是否同意${nick_name}成为主持人的请求`,
                async onOk() {
    
                    try {
                        await emedia.mgr.grantRole(confr, [member_name], 7);
                        message.success(`已经将${nick_name}变为了主持人`)
                    } catch (error) {
                        
                    }
                    
                    // delete confr_attrs,处理完请求删除会议属性
                    let options = {
                        key:username,
                        val:'request_tobe_admin'
                    }
                    emedia.mgr.deleteConferenceAttrs(options);

                    let result = {
                        type:'request_tobe_admin',
                        status:'agree'
                    }

                    callback && callback(result)//触发回调函数
                },
                onCancel() {
                    let options = {
                        key:username,
                        val:'request_tobe_admin'
                    }
                    emedia.mgr.deleteConferenceAttrs(options);

                    let result = {
                        type:'request_tobe_admin',
                        status:'refuse'
                    }

                    callback && callback(result)
                },
                cancelText:'拒绝',
                okText:'同意'
            });
        }
    })
}

// 网络状态

class NetworkStatus extends Component {

    // network_status
    //  0 : offline、1: slow-2g、2: 2g、3: 3g、4: 4g
    state = {
        network_status: 0
    }

    componentWillMount() {
        this.get_network_status();
        this.on_network_status_changed()
    }

    on_network_status_changed = () => {
        let _this = this;
        window.addEventListener("offline", function() {
            _this.setState({ network_status: 0 })
        })

        window.addEventListener("online", this.get_network_status);

        // chrome 网络状态 变化
        if(navigator.connection) {
            navigator.connection.addEventListener('change', this.onConnectionChange);
        }
    }

    // 只适用于 chrome 网络状态 变化
    onConnectionChange = () => {
        let { effectiveType } = navigator.connection;

        switch(effectiveType){
            case 'slow-2g':
                this.setState({ network_status: 1})
                break;
            case '2g':
                this.setState({ network_status: 2})
                break;
            case '3g':
                this.setState({ network_status: 3})
                break;
            case '4g':
                this.setState({ network_status: 4})
                break;
        }
    }

    get_network_status = () => {
        if(navigator.onLine){//已经联网 简单判断

            if(navigator.connection){ //判断网络状态、只有chrome 支持
                this.onConnectionChange()
            } else { // 别的浏览器直接显示 全网
                this.setState({ network_status: 4})
            } 
        } else {
            this.setState({ network_status: 0 })
        }
    }

    render() {

        let { network_status } = this.state;
        
        return (
            <div className="network-wrapper">
                <div className={`network-item one ${network_status>0 ? 'high-light' : ''}`}></div>
                <div className={`network-item two ${network_status>1 ? 'high-light' : ''}`}></div>
                <div className={`network-item three ${network_status>2 ? 'high-light' : ''}`}></div>
                <div className={`network-item four ${network_status>3 ? 'high-light' : ''}`}></div>
            </div>
        ) 
    }
}
// 房间设置 modal
function RoomSetting(props) {
    let { 
            room_setting_modal_show, 
            roomName, 
            password, 
            stream_list,

            confr,
            user,
            user_room
        } = props;

    
    let { username: my_username } = user;
    let { role: my_role } = user_room;
    const get_admins = () => {
        let admins = [];

        const get_nickname = member => {
            
            if(member.nickName && member.nickName.length < 30){
                return member.nickName
            }

            let username = member.name.split('_')[1];

            let before_username = username.slice(0,4); //优化成较短的显示
            let after_username = username.slice(-4);

            return before_username + '****' + after_username

        }
        stream_list.map(item => {
            if(
                item &&
                item.member &&
                item.member.role == 7
            ) {
                admins.push(get_nickname(item.member))
            }
        })
        
        return admins
    }

    return (
        <div 
            className={`room-setting${room_setting_modal_show ? " open":''}`}
        >
                <div className="title">房间名称</div>
                <div className="text">{roomName}</div>
            <div className="item-wrapper">
                <div className="title">房间密码</div>
                <Input type="text" disabled value={password}/>
            </div>
            <div className="item-wrapper">
                <div className="title">主持人</div>
                {
                    get_admins().map((item,index) => {
                        return <div key={index} className="text">{item}</div>
                    })
                }
            </div>
            <AdminChangeHandle { ...{my_username, stream_list, my_role, confr}}/>

        </div>
    )
}
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
            headimg_url_suffix: '',
            joined: false,
            loading: false,

            talker_is_full:false, //主播已满

            shared_desktop:false,

            set_nickname_modal_show: false,
            room_setting_modal_show: false
        };

        this.toggle_main = this.toggle_main.bind(this);
    }

    // join fun start
    async join() {

        this.setState({ loading:true, talker_is_full:false })
        let {
            roomName,
            password,
            nickName,
            headimg_url_suffix
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
            config:{ 
                nickName,
                ext: {
                    headImage: headimg_url_suffix //头像信息，用于别人接收
                }
            }
        }

        try {
            const user_room = await emedia.mgr.joinRoom(params);
    
            if(user_room.error == -200) { //主播已满
                this.setState({ talker_is_full: true, loading:false });
                return
            }
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
    
            this.startTime()
            
        } catch (error) { 
            message.error(user_room.errorMessage);
            this.setState({ loading:false })
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

    // 收集设置表单的数据， setState
    _get_setting_values = (values) => {

        if(!values) {
            return
        }
        for (const key in values) {
            this.setState({ [key]: values[key]})
        }
    }
    async componentDidMount () {

        
        const user = await login();
        this.setState({ user })
        this.init_emedia_callback();

        window.onbeforeunload=function(e){     
            var e = window.event||e;  
            emedia.mgr.exitConference();
        } 

        this._get_nickname_from_session();
        this._get_headimg_url_suffix_from_session();
    }

    componentWillUnmount() {
        clearInterval(this.timeID);
    }
    init_emedia_callback() {
        let _this = this;
        
        emedia.config({
            restPrefix: process.env.REACT_APP_RTC_HOST
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

        };

        emedia.mgr.onConferenceExit = function (reason, failed) {
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
                6: "超时",
                10: "其他设备登录",
                11: "会议关闭",
                12: "被踢出了会议"
            }

            if(reason){
                reason_text = reasons[reason];
            }

            if(reason == 4 && failed){
                reason_text = get_failed_reason(failed);
            }

            console.log('onConferenceExit', reason, failed);
            
            if(reason !== 0) { // 正常挂断不给提示
                message.warn(reason_text, 2, () => window.location.reload());
            } 
        };
        emedia.mgr.onConfrAttrsUpdated = function(confr_attrs){ 
            console.log('onConfrAttrsUpdated', confr_attrs);
            // 会议属性变更
            // 上麦、下麦、申请成为主持人 遍历判断
            // 

            let { username:my_username } = _this.state.user //自己的name
            let { role } = _this.state.user_room;
            let { confr }  = _this.state

            confr_attrs.map(item => {
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
                // 全体静音 key value 变换 与上面的
                if( item.key == 'muteall' ){
                    let value = JSON.parse(item.val);
                    let { setter, status } = value;

                    if(my_username == setter ){ //自己设置的全体静音，不静音自己
                        return
                    }


                    if(status == 1 ){//关闭麦克风
                        setTimeout(() => { // 等到拿到 自己的流再操作
                            _this.close_audio()
                        },200)
                    } else{
                        _this.open_audio()
                    }
                    return
                }
                

                

                // 某些人员静音
                if(
                    item.val &&
                    item.val.indexOf('"action"') > -1 &&
                    item.val.indexOf('"mute"') > -1 
                ) {
                    let val = JSON.parse(item.val);
                    if(val.uids){
                        if(val.uids.indexOf(my_username) > -1) {
                            _this.close_audio()
                        }
                    }
                }
                // 某些人员解除静音
                if(
                    item.val &&
                    item.val.indexOf('"action"') > -1 &&
                    item.val.indexOf('"unmute"') > -1 
                ) {
                    let val = JSON.parse(item.val);
                    if(val.uids){
                        if(val.uids.indexOf(my_username) > -1) {
                            _this.open_audio()
                        }
                    }  
                }
            });

            // 处理管理员申请
            // 返回处理类型 和 处理结果
            let options = {
                confr_attrs,
                my_username,
                my_role: role,
                _get_nickName_by_username: _this._get_nickName_by_username.bind(_this),
                confr
            }
            handle_conference_attrs(options, result => {
                let { type, status } = result;
                switch (type) {
                    case 'request_tobe_admin':
                        console.log('request_tobe_admin status', status);
                        break;
                }
            })
        };

        emedia.mgr.onRoleChanged = function (role) {
            _this._on_role_changed(role)
        };

        // 主持人变更回调
        emedia.mgr.onAdminChanged = function(admin) {
            
            let { memberId } = admin;
            if(!memberId){
                return
            }
            _this.admin_changed(admin)
        }

        // 视频流发布失败回调 -- 别人收不到 -- 自己能看到

        emedia.mgr.onPubVideoFailed = async evt => {

            if(evt.op == 107 && evt.endReason == 23) {
                Modal.warn({
                    title: '已达到最大视频数，请退出会议以音频重新进入',
                    onOk() { window.location.reload() },
                    okText:'确定'
                });
            }

        }
    }

    _on_role_changed(role) {
        if(!role) {
            return
        }

        let { user_room } = this.state;
        let old_role = user_room.role;
        user_room.role = role;

        let _this = this;

        this.setState({ user_room }, () => {

            // 从观众变为主播
            if(
                old_role == 1 &&
                role == 3
            ) {
                _this.publish();
                message.success('你已经上麦成功,并且推流成功')
                return
            }

            // 被允许下麦
            if(
                (old_role == 3 || old_role == 7) &&
                role == 1
            ) {
                message.success('你已经下麦了,并且停止推流')
                return
            }

            // 变成主持人
            if(
                old_role == 3 &&
                role == 7
            ) {
                message.success('你已经是主持人了')
                return
            }
        })

        const set_role_to_my_member = () => {// 变更流里面的角色
            let { joinId } = _this.state.user_room;
            let { stream_list } = _this.state;

            stream_list.map(item => {
                if(
                    item &&
                    item.member &&
                    item.member.id == joinId
                ) {
                    item.member.role = role
                }
            });

            _this.setState({ stream_list })
        }

        set_role_to_my_member();


    }
    // 从 sessionStore 拿昵称
    _get_nickname_from_session() {
        let nickName = window.sessionStorage.getItem('easemob-nickName');

        if(nickName) {
            this.setState({ nickName })
        } else {
            this.set_nickname_modal.show()
        }
    }
    // 从 sessionStore 拿头像 url
    _get_headimg_url_suffix_from_session() {
        let headimg_url_suffix = window.sessionStorage.getItem('easemob-headimg_url_suffix');

        if(!headimg_url_suffix) {// 默认给的头像
            headimg_url_suffix = 'Image1.png'
        }
        this.setState({ headimg_url_suffix })
    }
    _set_nickname = nickName => {
        let { username } = this.state.user;

        
        this.setState({ nickName: nickName || username })
    }
    leave() {

        let { role, confrId } = this.state.user_room;

        if(role == 7) {
            LeaveConfirmModal.show(confrId);
        } else {
            let is_confirm = window.confirm('确定退出会议吗？');
    
            if(is_confirm){
                emedia.mgr.exitConference();
                window.location.reload();
            }
        }

    }
    publish() {
        let { role } = this.state.user_room
        if(role == 1){//观众不推流
            return
        }
        
        let _this = this;

        let { audio, video }  = this.state;
        if( !audio && !video ) {
            this.setState({ //必须有一个开着的
                audio: true 
            },() => {
                let { audio,video } = _this.state //push 流取off(关) 的反值
                emedia.mgr.publish({ audio, video });
            })
        } else {
            emedia.mgr.publish({ audio, video });
        }
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

        let _this = this;
        confirm({
            title:`是否同意${this._get_nickName_by_username(username)}的上麦请求`,
            async onOk() {


                try {
                    await emedia.mgr.grantRole(confr, [member_name], 3);
                } catch (error) {
                    if(error.error == -523){
                        confirm({
                            title:'主播人数已满，请选人下麦',
                            cancelText:'取消',
                            okText:'确定',
                            onOk() {
                                _this.to_audience_list.show(() => {
                                    emedia.mgr.grantRole(confr, [member_name], 3);
                                })
                            }
                        })
                    }
                }
                
                // delete cattrs,处理完请求删除会议属性
                let options = {
                    key:username,
                    val:'request_tobe_speaker'
                }
                emedia.mgr.deleteConferenceAttrs(options);
            },

            onCancel () {
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

        let { stream_list } = this.state;
        if(stream_list.length == 1){
            message.warn('当前您是唯一主播，不允许下麦');
            return
        }
        let { username } = this.state.user;

        if(!username) {
            return
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


        let member_name = 'easemob-demo#chatdemoui_' + username; // sdk 需要一个fk 格式的name
        let confr = this.state.user_room;

        // delete cattrs,处理完请求删除会议属性
        let options = {
            key:username,
            val:'request_tobe_audience'
        }

        await emedia.mgr.grantRole(confr, [member_name], 1);
        emedia.mgr.deleteConferenceAttrs(options);
        
    }

    admin_changed(admin) {

        if(!admin) {
            return
        }
        let { memberId, role } = admin;
        let { stream_list } = this.state;

        stream_list.map(item => { //遍历所有 stream_list 将这个流的role 变为主持人
            if(item && item.member){
                if(memberId == item.member.id) {
                    item.member.role = role;
                    let name = item.member.nickName || item.member.name //优先获取昵称
                    let text = role == 7 ? '成为了主持人' : '变成了主播';
                    message.success(name + text)
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

    close_audio = async () => {

        
        let { role } = this.state.user_room;
        let { own_stream } = this.state;
        if(role == 1){
            return
        }
        
        if(!own_stream) {
            return
        }

        await emedia.mgr.pauseAudio(own_stream);
        this.setState({ audio:false })
    }
    open_audio = async () => {
        let { role } = this.state.user_room;
        let { own_stream } = this.state;
        if(role == 1){
            return
        }

        if(!own_stream) {
            return
        }

        
        await emedia.mgr.resumeAudio(own_stream);
        this.setState({ audio: true })
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
            member.is_me = true;
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

        // 音视频变化，触发 setState stream_list
         this.set_stream_item_changed = (constaints, id) => {

            if(!id || !constaints) {
                return
            }

            let { stream_list } = this.state
            let { aoff, voff } = constaints
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

        // 有人在说话处理流 status: is_speak 在说话、no_speak 没说话
        this.sound_chanaged = (id, status) => { 

            if(!status || !id) {
                return
            }

            let { stream_list } = this.state;

            stream_list = stream_list.map(item => {
                if(
                    item &&
                    item.stream &&
                    item.stream.id == id
                ){
                    
                    item.stream.is_speak = (status == 'is_speak' ? true : false)
                }

                return item
            })

            this.setState({ stream_list })
        }
        let _this = this;
        for (const key in this.refs) {
            let el = this.refs[key];
            
            // 监听音视频的开关
            emedia.mgr.onMediaChanaged(el, function (constaints, stream) {
                _this.set_stream_item_changed(constaints, stream.id)
            });

            // 监听谁在说话
            // 函数触发，就证明有人说话 拿 stream_id
            emedia.mgr.onSoundChanaged(el, function (meterData, stream) {
                
                let { instant } = meterData;
                if(instant * 100 > 1){
                    _this.sound_chanaged(stream.id, 'is_speak')
                }else {
                    _this.sound_chanaged(stream.id, 'no_speak')

                }
                
            });
        } 



    }
    _get_header_el() { 

        let { roomName, stream_list } = this.state;

        let admin = ''; 
        stream_list.map(item => { //获取admin name
            
            if(
                item &&
                item.member && 
                item.member.role == 7
            ) {
                admin = item.member.nickName || item.member.name.slice(-5);
                return
            }
        })

        return (
            <div className="header-wrapper">
                <div>
                    <img src={get_img_url_by_name('logo-text-room')}/>
                </div>
                <div className='info-wrapper'>
                    <Tooltip title={'主持人: ' + (admin || 'admin')} placement="bottom">
                        <img src={get_img_url_by_name('admin-icon')} />
                    </Tooltip>
                    <NetworkStatus />
                    <div className="name-wrapper">
                        <span className="name">{roomName || '房间名称'}</span>
                        <div className="time">{this._get_tick()}</div>
                    </div>
                </div>

                <div onClick={() => this.leave()} className="leave-action">
                    <img src={get_img_url_by_name('leave-icon')} />
                    <span>离开房间</span>
                </div>
            </div>
        )
    }
    _get_drawer_component() {
        let _this = this;
        let { stream_list } = this.state;
        let { role } = this.state.user_room;
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
                { role == 7 ? <MuteAction {...this.state}/> : ''}
            </Drawer>
        )


       

    }

    _get_main_el() {
        let main_stream = this.state.stream_list[0];

        if(main_stream) {
            let { is_speak } = main_stream.stream
            return (
                <div className="main-video-wrapper">
                    { is_speak ? 
                        <img src={get_img_url_by_name('is-speak-icon')} className='is-speak-icon'/> : ''
                    }
                    <video ref={`list-video-${main_stream.stream.id}`} autoPlay></video>
                </div>
            )
        }

        return <i></i>
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

        let { id, aoff, is_speak } = stream;
        let { role, is_me } = member;
        let { role:my_role } = this.state.user_room;//拿到我自己的角色
        let { username:my_username } = this.state.user;//拿到我自己的username
        let { confr } = this.state
        
        let nickName = member.nickName || member.name.split('_')[1];


        return (
            <div 
                key={id} 
                className="item"
                onDoubleClick={ index ? () => {this.toggle_main(index)} : () => {}} //mian 图不需要点击事件，所以不传index÷
            >

                <div className="info">
                    <span className="name">
                        { nickName + (role == 7 ? '(主持人)' : '') + (is_me ? '(我)' : '')}
                    </span>

                    {/* <img src={get_img_url_by_name('no-speak-icon')}/> */}
                    {/* 
                     * 对方没有开启音频 显示audio-is-close-icon
                     * 对方开启音频 不说话 不显示图标
                     * 对方开启音频 在说话 显示is-speak-icon
                     */}
                    <div className="status-icon"> 

                        {
                            aoff ? 
                            <img src={get_img_url_by_name('audio-is-close-icon')} /> : 
                            ( is_speak ? 
                            <img src={get_img_url_by_name('is-speak-icon')} /> : '' )
                        }
                        
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
                {/* 不是主持人并且不是主持人自己 不加载 */}
                { (my_role == 7 && !is_me) ? <ManageTalker { ...{stream, member, my_username, confr} } /> : '' } 
            </div>
        )

                            
    }

    // toggle 房间设置 modal
    toggle_room_setting_modal() {
        let { room_setting_modal_show } = this.state;

        this.setState({
            room_setting_modal_show: !room_setting_modal_show
        })
    }
    _get_footer_el() {
        let { role } = this.state.user_room

        let { 
                audio,
                video, 
                shared_desktop,
                room_setting_modal_show
            } = this.state
        
        return (
            <div className="actions-wrap">

                <img src={get_img_url_by_name('apply-icon')} style={{visibility:'hidden'}}/>
                <div className="actions">
                    {
                        <Tooltip title={ audio ? '静音' : '解除静音'}>
                            <img src={audio ? 
                                        get_img_url_by_name('micro-is-open-icon') : 
                                        get_img_url_by_name('micro-is-close-icon')} 
                                    onClick={() => this.toggle_audio()}/>
                        </Tooltip>
                           
                    }
                    {
                        <Tooltip title={ video ? '关闭视频' : '开启视频'}>
                            <img
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

                        <Tooltip title='房间设置'>
                            <img 
                                src={ room_setting_modal_show ? 
                                        get_img_url_by_name('room-setting-open-icon') : 
                                        get_img_url_by_name('room-setting-close-icon')
                                    } 
                                onClick={() => this.toggle_room_setting_modal()}
                            /> 
                        </Tooltip>
                </div>
                <img 
                    src={get_img_url_by_name('expand-icon')} 
                    onClick={this.expand_talker_list} 
                    style={{visibility:this.state.talker_list_show ? 'hidden' : 'visible'}}/>

                <RoomSetting {...this.state}/>
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
        let { role } = this.state.user_room;

        let { audio, video, nickName, headimg_url_suffix } = this.state;
        return (
            <div style={{width:'100%', height:'100%'}}>
                {/* join compoent */}
                <div className="login-wrap" style={{display: joined ? 'none' : 'flex'}}>
                    <div className="header">
                        <img src={get_img_url_by_name('logo-text-login')} />
                    </div>
                    <Form className="login-form">
                        <img 
                            src={get_img_url_by_name('setting-icon')}
                            className="setting-handle" 
                            onClick={() => this.setting_modal.show()}
                        /> 
                            
                        <img src={get_img_url_by_name('logo')} />
                        <div style={{margin:'17px 0 45px'}}>欢迎使用环信多人会议</div>
                        <Item>
                            {getFieldDecorator('roomName', {
                                initialValue: process.env.REACT_APP_ROOMNAME,
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
                            initialValue: process.env.REACT_APP_ROOMPASSWORD,
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
                        onOk={() => this.join_handle(1)}
                        onCancel={this.close_talker_model}
                        okText="以观众身份登录"
                        cancelText="暂不登录"
                        centered={true}
                        mask={false}
                        maskClosable={false}
                        width='470px'
                        className="talker-is-full-modal"

                    >
                        <div>
                            <img src={get_img_url_by_name('warning-icon')}/>
                        </div>
                        <div>主播人数已满<br></br>是否以观众身份进入？</div>
                    </Modal>

                    {/* 设置框 */}
                    <Setting 
                        { ...{audio, video, nickName, headimg_url_suffix} }
                        _get_setting_values={this._get_setting_values} 
                        ref={setting_modal => this.setting_modal = setting_modal} />

                    {/* 设置昵称框 */}
                    <SetNickName 
                        ref={set_nickname_modal => this.set_nickname_modal = set_nickname_modal}
                        _set_nickname={this._set_nickname}
                    />    
                </div>
                
                {/* room compoent */}
                
                <Layout className="meeting" style={{display: joined ? 'block' : 'none'}}>
                    <Header>
                        {this._get_header_el()}
                    </Header>
                    
                    <Content>
                        {this._get_main_el()}
                    </Content>
                    {this._get_drawer_component()}
                    <Footer>
                        {this._get_footer_el()}
                    </Footer>
                    {
                        role == 7 ?
                        <ToAudienceList {...this.state} ref={to_audience_list => this.to_audience_list = to_audience_list}/> :
                        <i></i>
                    }

                </Layout>
            </div>
        )
    }
}
const WrapRoom = Form.create()(Room)
export default WrapRoom


