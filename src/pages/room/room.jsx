import React, {Component, PureComponent} from 'react' 
import ReactDOM from 'react-dom'
// import debounce from 'lodash.debounce'; // 防抖函数

import { 
    Layout,
    Button,
    Icon,
    Modal,
    Form,
    Input,
    Checkbox,
    message,
    Tooltip,
    Drawer,
    Avatar,
    Dropdown,
    Menu,
    Switch,
    Radio,
    Tabs,
    Alert,
    notification,
    Spin
} from 'antd';
import './room.less';


// import emedia from 'easemob-emedia';
import emedia from '../../sdk/EMedia_sdk-3.4.1';
import whiteBoards from './whiteboardsSdk';
import login from './login.js'
import { appkey, version } from '../../config';


// assets
function notification_show(type, message) {
    notification[type]({
        message,
        placement: 'bottomRight',
        className: 'openNotification',
        // duration: 50000
    });
}
const requireContext = require.context('../../assets/images', true, /^\.\/.*\.png$/)// 通过webpack 获取 img
const get_img_url_by_name = (name) => {
    if(!name){
        return
    }
    let id = requireContext.resolve(`./${name}.png`);

    return __webpack_require__(id);
}

// 获取优化后的 nickName 
const get_nickname = member => {
            
    const get_spliced_name = name => {
        let before_username = name.slice(0,4); //优化成较短的显示
        let after_username = name.slice(-4);
    
        return before_username + '****' + after_username
    }

    let nick_name = undefined;

    if(
        !member.nickName ||
        member.nickName.split('_')[1]
    ) { // 没有 nickName 或者 nickName 是username 裁剪 username
        let name = member.name.split('_')[1];
        nick_name = get_spliced_name(name);
        return nick_name
    }

    if(member.nickName.length < 15){
        nick_name = member.nickName;
        return nick_name;
    }

    nick_name = get_spliced_name(member.nickName) //过长的裁剪
    return nick_name

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
                        if( // 自己不显示 并且共享桌面的 不重复显示
                            item &&
                            item.member &&
                            !item.member.is_me &&
                            item.stream.type != emedia.StreamType.DESKTOP
                        ) {
                            let headImage = item.member.ext && item.member.ext.headImage;
                            return (
                                <div className="info-wrapper" key={item.member.name}>

                                    <Avatar src={ base_url + headImage }/>
                                    <span className="name">{
                                        get_nickname(item.member) + (item.member.role == 7 ? '(主持人)' : '')
                                    }</span>
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
    mute_all_action = async () => {

        let { confrId } = this.props.user_room;

        await emedia.mgr.muteAll(confrId);
        this.setState({ mute_all:true })
    }
    unmute_all_action = async () => {

        let { confrId } = this.props.user_room;

        await emedia.mgr.unmuteAll(confrId);
        this.setState({ mute_all:false })
    }
    render() {
        let { mute_all } = this.state
        return(

            <Tooltip title={ mute_all ? '解除静音' : '全体静音' } placement="left">
                {
                    mute_all ? 
                    <img className='mute-action' src={get_img_url_by_name('mute-all-icon')} onClick={this.unmute_all_action}/> :
                    <img className='mute-action' src={get_img_url_by_name('unmute-all-icon')} onClick={this.mute_all_action}/>
                    
                }
            </Tooltip>
        )
    }
}

class ManageTalker extends Component {
    // 静音某一人
    mute = () => {
        let { confrId } = this.props.user_room;
        let { id:memberId } = this.props.member;
        emedia.mgr.muteBymemberId(confrId, memberId);
    }
    // 解除静音某人
    unmute = () => {
        let { confrId } = this.props.user_room;
        let { id:memberId } = this.props.member;
        emedia.mgr.unmuteBymemberId(confrId, memberId);
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
        let { user_room } = this.props;
        let { memName, nickName } = this.props.member;
            nickName = nickName || memName; //兼容显示

        if(!user_room || !memName){
            return
        }

        try {
            await emedia.mgr.grantRole(user_room, [memName], 7);

            message.success(`已把${nickName}设为主持人`)
        } catch (error) {
            message.error('设为主持人失败')
        }
    }
    // 移出会议
    move_out = () => {
        

        let { user_room } = this.props;
        let { memName } = this.props.member;

        if(!user_room || !memName){
            return
        }
        emedia.mgr.kickMembersById(user_room, [memName]);

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
        this.setState({ 
            visible: false,
            headimg_url_suffix: ''
        })
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
        visible: false,
        headimg_url_suffix: '',

        push_cdn: false,
        cdn: '',
        rec:false,
        recMerge:false,
        join_as_audience: false
    }
    
    componentWillReceiveProps(nextProps) {

        this.setState({ 
            // nickName: nextProps.nickName,   
            headimg_url_suffix: nextProps.headimg_url_suffix,   
        });
    }
    show = () => {
        let {
            push_cdn,
            cdn,
            rec,
            recMerge,
            join_as_audience 
        } = this.props;

        this.setState({ 
            visible: true,

            push_cdn, // 获取room state
            cdn,
            rec,
            recMerge,
            join_as_audience
        })
    }
    handleCancel = () => {
        this.setState({ visible: false });

    }
    handleSubmit = () => {

        let {
            headimg_url_suffix,
            cdn,
            push_cdn,
            rec,
            recMerge,
            join_as_audience
        } = this.state;

        
        // 回调上去
        this.props._get_setting_values({
            headimg_url_suffix, cdn, push_cdn,
            rec,recMerge,join_as_audience
        })
        this.setState({ visible: false });
        
        window.sessionStorage.setItem('easemob-headimg_url_suffix', headimg_url_suffix); //保存 头像 url
        
    }
    
    headimg_change = headimg_url_suffix => {

        if(!headimg_url_suffix){
            return
        }

        this.setState({ headimg_url_suffix })
    }

    handleChange = (event) => {
        const target = event.target;
        const value = target.name === 'cdn' ? target.value : target.checked;
        const name = target.name;
    
        this.setState({
          [name]: value
        });

    }
    
    // 更换头像
    get_headimg_url = () => {
        this.head_images.show()
    }
    
    render() {
        let { 
            visible, 
            headimg_url_suffix
         } = this.state;

        let base_url = 'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/RtcDemo/headImage/';

        let _this = this;
        return (
            <Modal 
                visible={visible}
                onOk={this.handleSubmit}
                onCancel={this.handleCancel}
                destroyOnClose={true}
                footer={null}
                getContainer={false}
                className="setting-modal"
                width="470px"
            >
                <form action="" onSubmit={this.handleSubmit}>

                    <div className="avatar-wrapper ">
                        <Avatar 
                            src={base_url + headimg_url_suffix} 
                            onClick={this.get_headimg_url} 
                            className='setting-avatar'/>
                        <HeadImages 
                        ref={head_images => this.head_images = head_images}
                        headimg_change={this.headimg_change}/>
                    </div>

                    {
                        [
                            {key: 'push_cdn', text: '开启推流 CDN'},
                            {key: 'cdn', text: '推流CDN地址'},
                            {key: 'rec', text: '开启录制'},
                            {key: 'recMerge', text: '开启录制合并'},
                            {key: 'join_as_audience', text: '以观众身份加入会议'},
                        ].map((item,index) => {
                            let { key, text } = item;
                            if(key == 'cdn') {
                                return <Input 
                                            key={index}
                                            placeholder={text} 
                                            name={key} 
                                            value={_this.state[key]} 
                                            onChange={_this.handleChange} disabled={!_this.state['push_cdn']} 
                                        />
                            } else {
                                return <Checkbox 
                                        key={index}
                                        checked={_this.state[key]} 
                                        name={key} 
                                        onChange={_this.handleChange}>{text}</Checkbox>
                            }
                        })
                    }
                    
                    <div className='join_as_audience_tips'>加入后只能观看，需申请上麦</div>

                    <div className="action">
                        <Button type="primary" onClick={this.handleSubmit}>保存并返回</Button>
                    </div>
                </form>
            </Modal>
        )
    }
}

// 网络连接状态监听
window.addEventListener("offline", function() {
    message.error('您的网络链接断开了')
})

window.addEventListener("online", () =>  message.success('您的网络链接成功'));

// 申请主持人 或者 放弃主持人操作
function AdminChangeHandle(props) {
    let {
        my_username,
        my_role,
        stream_list,
        user_room
    } = props;

    // 主播角色
    if(my_role == 3) {
        const apply_admin = () => {
    
            message.success('主持人申请已发出，请等待主持人同意');
            emedia.mgr.requestToAdmin(user_room.confrId);
        
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
                item.member.role == 7 &&
                item.stream.type != emedia.StreamType.DESKTOP
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
    
            let memName = appkey + '_' + my_username;
            try {
                await emedia.mgr.grantRole(user_room, [memName], 3);
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

// 网络状态
class NetworkStatus extends Component {


    render() {

        let { network_status } = this.props; // 0: 断网 1: 弱网 2: 良好
        network_status = network_status == undefined ? 2 : network_status;

        let c_status = { 0: 'dis', 1: 'weak', 2: ''};

        return (
            <div className={`network-wrapper ${c_status[network_status]}`}>
                <div className={`network-item one ${network_status>0 ? 'high-light' : ''}`}></div>
                <div className={`network-item two ${network_status>0 ? 'high-light' : ''}`}></div>
                <div className={`network-item three ${network_status>1 ? 'high-light' : ''}`}></div>
                <div className={`network-item four ${network_status>1 ? 'high-light' : ''}`}></div>

                <div className="icon">
                    <span className="line"></span>
                </div>
            </div>
        ) 
    }
}
// 房间设置 modal
function RoomSetting(props) {
    let { 
            room_setting_modal_show, 
            roomName, 
            stream_list,

            // confr,
            user,
            user_room
        } = props;

    
    let { username: my_username } = user;
    let { role: my_role } = user_room;
    const get_admins = () => {
        let admins = [];

       
        stream_list.map(item => {
            if(
                item &&
                item.member &&
                item.member.role == 7 &&
                item.stream.type != emedia.StreamType.DESKTOP
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
            <div className="toast-title">
                <span>会议名称</span>
                <Icon 
                    type="close-circle"
                    onClick={() => props.toggle_room_setting_modal()}
                />
            </div>
            <div className="text">{roomName}</div>
            <div className="item-wrapper">
                <div className="title">主持人</div>
                {
                    get_admins().map((item,index) => {
                        return <div key={index} className="text">{item}</div>
                    })
                }
            </div>
            <AdminChangeHandle { ...{my_username, stream_list, my_role, user_room} }/>

        </div>
    )
}

// toast 框组件 退出白板
function toast(config) {

    const div = document.createElement('div');
    document.body.appendChild(div);

    
    function destroy() {
        const unmountResult = ReactDOM.unmountComponentAtNode(div);
        if (unmountResult && div.parentNode) {
          div.parentNode.removeChild(div);
        }
        
    }

    function onOk_handle() {
        let { onOk } = config
        if(
            !onOk ||
            typeof onOk != 'function'
        ) {
            return
        }

        onOk();

        destroy();
    }
    ReactDOM.render(
        <div className="toast" >
            <div className="toast-title">
                <span>提示</span>
                <Icon type="close-circle" onClick={() => destroy()}/>
            </div>
            <div className="text"> 退出后将结束互动白板 </div>
            <div className="handle">
                {/*  */}
                <span className="leave" onClick={() => onOk_handle()}>继续退出</span><br />
                <span className="end" onClick={() => destroy()}>取消</span>
            </div>
        </div>, div)
}

// toast message
function toast_msg_show(text) {

    let el_m = document.createElement('div');
    el_m.id = 'toast-msg'; // 只能有一个
    el_m.innerText = text
    document.body.appendChild(el_m);


    setTimeout(() => {
        if(document.querySelector('#toast-msg')){
            document.body.removeChild(document.querySelector('#toast-msg'))
        }
    },2000)
}

// 邀请他人文案框
function inviteModal(info) {

    if(!info) {
        return
    }

    if(document.querySelector('#inviteModal')) {
        return
    }
    const div = document.createElement('div');
    div.id = 'inviteModal'
    document.body.appendChild(div);

    function destroy() {
        const unmountResult = ReactDOM.unmountComponentAtNode(div);
        if (unmountResult && div.parentNode) {
          div.parentNode.removeChild(div);
        }
        
    }

    function copy() { // 复制邀请文本
        let textarea = document.querySelector('textarea#invite');
        textarea.select();//选中文本
        try {
            document.execCommand('copy');
            message.success('已复制邀请文本到粘贴板')
        } catch (error) {
            message.error('复制邀请文本失败')
        }
    }

    const roomName = info.roomName || '';
    const invitees = info.invitees || ''; //邀请人

    let content = invitees + '邀请您参加视频会议\r\n' +
    '会议名称：' + roomName + '\r\n\r\n' + 
    
    '点击链接直接加入会议:\r\n' + 
    'https://meeting.easemob.com/invite/index.html?'+
    'roomName='+ encodeURI(roomName) + '&invitees='+ encodeURI(invitees) +'\r\n\r\n' +
    
    'app下载地址：http://www.easemob.com/download/rtc';

    
    ReactDOM.render(
        <div className="inviteModal" >
            <span className="close" onClick={destroy}>x</span>
            <div className="title">会议名称：{roomName}</div>
            <textarea value={content} readOnly id='invite'></textarea>
            <Button type="primary" onClick={copy}>复制</Button>
        </div>, div)
}

// 问题反馈按钮
class Exc_feed extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            visible: false
        }

        this.handle_click = this.handle_click.bind(this)
        this.handleCancel = this.handleCancel.bind(this)
        this.handleOk = this.handleOk.bind(this)
        this.onChange = this.onChange.bind(this)
    }

    handle_click(){
        this.setState({ visible: true })
    }

    handleOk() {
        let { msg } = this.state;


        this.setState({
            confirmLoading: true,
        });
        setTimeout(() => {
            this.setState({
              visible: false,
              confirmLoading: false,
            });

            emedia.fileReport('', msg);

            Modal.success({
                title: '您的会议日志，已经保存到了本地',
                content: `请添加QQ：454374569, 进行问题反馈`,
                okText: '知道了'
            });
        }, 500);
    }

    handleCancel() {
        this.setState({ visible: false })
    }

    onChange(e) {
        let value = e.target.value;

        this.setState({
            msg: value
        })
    }
    render() {

        let {
            visible ,
            confirmLoading
        } = this.state;

        const { TextArea } = Input
        return (
            <div>
                <Modal
                title="请填写您遇到的问题"
                visible={visible}
                onOk={this.handleOk}
                confirmLoading={confirmLoading}
                onCancel={this.handleCancel}
                okText='确定'
                cancelText='取消'
                >
                    <TextArea rows={4} onChange={this.onChange}/>
                </Modal>
                <div className="exception-feedback-action" onClick={this.handle_click}>问题反馈</div>
            </div>
        )
    }
}
// 选择共享桌面流组件
class ChooseDesktopMedia extends PureComponent {

    state = {
        visible:false,
        sources:[],
        accessApproved: null,
        choosed_stream: null
    }

    show (sources, accessApproved, accessDenied) {

        this.setState({ 
            sources,
            accessApproved,
            accessDenied,
            visible: true 
        })
    }

    hide() {
        this.setState({ 
            visible: false,
            choosed_stream: null 
        });
        
        let { accessDenied } = this.state
        if(
            accessDenied &&
            typeof accessDenied == 'function'
        ) {
            accessDenied()
        }
    }

    // 选中某个桌面流
    choose(stream) {
        if(!stream) {
            return
        }


        this.setState({
            choosed_stream: stream
        })
    }

    //分享
    share() {
        let { accessApproved, choosed_stream } = this.state;

        if(
            !accessApproved ||
            !choosed_stream
        ) {
            return
        }
        
        if(typeof accessApproved != 'function'){
            return
        }

        accessApproved(choosed_stream)

        this.setState({
             visible: false,
             choosed_stream: null
        })
    }
    render(){
        let { visible, sources, choosed_stream } = this.state;

        let screen_list = [];
        let window_list = [];

        sources.map(item => { // 区分 整个屏幕和应用窗口
            if(item){
                if(/window/.test(item.id)) {
                    window_list.push(item)
                } else if(/screen/.test(item.id)) {
                    screen_list.push(item)
                }
            }
        })
        const { TabPane } = Tabs;

        return (
            <Modal
                title="共享屏幕"
                visible={visible}
                destroyOnClose={true}
                mask={false}
                maskClosable={false}
                okText='分享'
                cancelText='取消'
                closable={false}
                onOk={() => this.share()}
                okButtonProps={{ disabled: !choosed_stream }}
                onCancel={() => this.hide()}
                wrapClassName='electorn-choose-desktop-media'
                getContainer={false}
                width={600}
                style={{ top: 20 }}
            >
                    <div>Electorn 想要共享您屏幕上的内容。请选择你希望共享哪些内容</div>

                    <Tabs defaultActiveKey="1">
                        <TabPane tab="您的整个屏幕" key="1">
                            <div className="tab-content">

                                {
                                    screen_list.map((item, index) => {

                                        let choosed_style = {};

                                        if(choosed_stream){ //判断是否选中的
                                            if(choosed_stream.id == item.id) {
                                                choosed_style = {
                                                    borderColor: 'rgba(146, 210, 241, 0.7)'
                                                }
                                            }
                                        }
                                        return (
                                            <div 
                                                className="img-wrapper" 
                                                onClick={() => this.choose(item)}
                                                style={choosed_style}
                                                key={index}
                                            >
                                                <img src={item.hxThumbDataURL} />
                                                <div className='name'> {item.name} </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </TabPane>
                        <TabPane tab="应用窗口" key="2">
                        <div className="tab-content">
                            {
                                window_list.map((item, index) => {
                                    
                                        let choosed_style = {};


                                        if(choosed_stream){ //判断是否选中的
                                            if(choosed_stream.id == item.id) {
                                                choosed_style = {
                                                    borderColor: 'rgba(146, 210, 241, 0.7)'
                                                }
                                            }
                                        }
                                        
                                        return (
                                            <div 
                                                className="img-wrapper" 
                                                onClick={() => this.choose(item)}
                                                style={choosed_style}
                                                key={index}
                                            >
                                            <img src={item.hxThumbDataURL} />
                                            <div className='name'> {item.name} </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                        </TabPane>
                    </Tabs>
            </Modal>
        )
    }
}

function getPageQuery(query) { // 从url获取参数
    if(!query) {
        return ''
    }

    let search = window.location.href.split('?')[1];

    if(!search) {
        return ''
    }

    let query_value = '';

    let key_value_arr = search.split('&');
    key_value_arr.map(item => {
        let key = item.split('=')[0];
        let value = item.split('=')[1];

        if(query == key) {
            query_value = value
        }

    })

    return decodeURI(query_value)

}

class Room extends Component {
    constructor(props) {
        super(props);

        
        this.state = {

            // join start
            roomName: getPageQuery('roomName') ||'',
            nickName:'',
            user: {},
            user_room: {
                role: 3
            },
            own_stream:null,
            own_desktop_stream: null, // 自己发起的桌面流，不显示（保存起来，用于停止共享）
            own_member: null,
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
            talker_full_btn_disable: false, // talker_is_full model button disabled
            shared_desktop:false,

            set_nickname_modal_show: false,
            room_setting_modal_show: false,

            cdn:'', //推流 cdn url
            push_cdn: false, //是否开启推流 cdn 

            liveCfg : { // 推流CDN的画布 配置、创建推流 CDN 时使用
                cdn:'',
                layoutStyle : 'GRID',
                canvas :{ 
                    bgclr : 0x000000,
                    w : 640,
                    h : 480,
                    fps: 20, //输出帧率
                    bps: 1200000,  //输出码率
                    codec: "H264" //视频编码，现在必须是H264
                }
            },

            cdn_zorder:1, //更新CDN布局，递增 1，配合服务端

            use_white_board:true, //是否启用白板
            white_board_url: '', // 白板加载的外部链接
            white_board_is_created: false, // 白板是否创建
            am_i_white_board_creator: false, // 我是否是白板创建者


            not_visible_arr: [], // 主播列表不可见标签集合，默认都可见
            leaveConfirmModal_show: false,

            prev_volumes: {}, // 每个流的音量集合
            subed_v_els: {}, // 订阅过的 video 标签

            join_btn_disable: false, // 是否可以加入会议

            main_loading: false, // meeting-loading
            main_loading_text: '',

        };

        this.toggle_main = this.toggle_main.bind(this);
        this.join_handle = this.join_handle.bind(this);
        this.talker_is_full_handle = this.talker_is_full_handle.bind(this);
        this.leave = this.leave.bind(this);
        this.toggle_audio = this.toggle_audio.bind(this);
        this.toggle_video = this.toggle_video.bind(this);
        this.apply_talker = this.apply_talker.bind(this); 
        this.apply_audience = this.apply_audience.bind(this); 
        this.stop_share_desktop = this.stop_share_desktop.bind(this); 
        this.share_desktop = this.share_desktop.bind(this); 
        
        this.toggle_room_setting_modal = this.toggle_room_setting_modal.bind(this); 
        
        
        this.confirm_destory_white_board = this.confirm_destory_white_board.bind(this);   
        this.create_white_board = this.create_white_board.bind(this);
        
        this.talker_list_scroll = this.talker_list_scroll.bind(this, this.talker_list_scroll_stop.bind(this), 1000)();


        this.hide_leaveConfirmModal = this.hide_leaveConfirmModal.bind(this);
        this.leave_handle = this.leave_handle.bind(this);
        this.leave = this.leave.bind(this);


    }
    whetherCanUse() {

        if(navigator.userAgent.indexOf('Mobile') > -1) { // 手机不支持
            this.setState({
                join_btn_disable: true
            })

            return
        }
        if(
            !emedia.isChrome &&
            !emedia.isElectron && 
            !emedia.isEdge && 
            !emedia.isSafari 
        ) {
            this.setState({
                join_btn_disable: true
            })
        }
        

    }
    // join fun start
    async join() {

        this.setState({ loading:true, talker_is_full:false });

        let {
            roomName,
            nickName,
            headimg_url_suffix,
            push_cdn,
            cdn,
            rec, 
            recMerge
        } = this.state;

        let role = this.state.user_room.role;
        
        let params = {
            roomName,
            password: roomName,
            role,
            config:{ 
                nickName,
                ext: {
                    headImage: headimg_url_suffix //头像信息，用于别人接收
                },
                rec, 
                recMerge,

                // maxTalkerCount:3,//会议最大主播人数
                // maxVideoCount:2, //会议最大视频数
                maxPubDesktopCount:1 //会议最大共享桌面数
            }
        }

        // 如果设置推流 添加 cdn配置
        if(push_cdn && cdn) {

            // let liveCfg = {
            //     cdn,
            //     layoutStyle : 'GRID'
            // }
            // let liveCfg = {
            //     cdn,
            //     layoutStyle : 'CUSTOM',
            //     canvas :{ 
            //         bgclr : 980000,
            //         w : 640,
            //         h : 480
            //     }
            // }
            let { liveCfg } = this.state;
            liveCfg.cdn = cdn;
            params.config.liveCfg = liveCfg
        }

        try {
            const user_room = await emedia.mgr.joinRoom(params);
    
            process.env.NODE_ENV == 'development' ? '' : this.startTime();

            this._set_config_to_localStorage(); 

            this.setState({ 
                joined: true,
                user_room,
            })
    
            window.location.hash = '' //加入会议成功，清除query 防止退出后，重复加入

            if(user_room.role == emedia.mgr.Role.AUDIENCE){ // 观众不推流
                
                return
            }
            this.publish();

            
        } catch (error) { 
            
            if(/cause: -523|cause:-523/.test(error.errorMessage)){ // 主播已满
                this.setState({ 
                    talker_is_full: true, 
                    loading:false,
                    talker_full_btn_disable: true
                });
                return
            }

            let err_o = {
                '-530':'创建session失败',
                '-531':'设置布局失败',
                '-532':'画布不能为空',
                '-533':'删除session失败',
                '-534':'自定义录制失败',
                '-200':'参数错误',

            }
            message.error(err_o[error.error] || error.errorMessage || error.message) // errorMessage: 接口错误， message：js 语法错误 
            this.setState({ loading:false });

        }
    }
    join_handle = (e) => {

        e && e.preventDefault();
        
        var _this = this;
        this.props.form.validateFields((err, values) => {
            let { 
                roomName,
                nickName,
                audio, 
                video
             } = values;

            _this.setState({
                roomName,
                audio,
                video,
                nickName
            },() => {
                if (!err) {
                    _this.join()
                }
            })
        });
    }
    talker_is_full_handle() { // 主播已满，修改角色
        
        this.setState({
            join_as_audience: true,
            user_room: {
                role: 1
            }
        }, this.join_handle)

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

        console.log('values', values);
        // 设置角色
        if(values.join_as_audience){
            this.setState({
                user_room: {
                    role: 1
                }
            })
        }else {
            this.setState({
                user_room: {
                    role: 3
                }
            })
        }
    }
    async componentDidMount () {

        this.whetherCanUse()
        
        this.setState({loading: true})
        const user = await login(); // IM 登录
        this.setState({loading: false})

        this.setState({ user })
        this.init_emedia_callback(); //登录之后 初始化 emedia
        this.init_white_board(); //初始化 white_board
        
        let _this = this;
        window.onbeforeunload=function(e){     
            var e = window.event||e;  
            if(
                _this.state.am_i_white_board_creator
            ) { // 是白板创建者 首先销毁白板

                _this.emit_white_board_is_destroyed();
                _this.destroy_white_board()
            }

            if(_this.state.shared_desktop) {
                _this.stop_share_desktop()
            }

            emedia.mgr.exitConference();

        } 

        this._get_config_from_localStorage();
        this._get_headimg_url_suffix_from_session();

        if(getPageQuery('roomName')) { // 有roomName 认定为邀请的，自动加入会议
            let _this = this;
            setTimeout(() => {
                _this.join_handle()
            },1000) // 给个延时，让页面充分加载
        }
    }

    
    componentWillUnmount() {
        clearInterval(this.timeID);
    }
    init_emedia_callback() {
        let _this = this;
        
        let { username, token } = this.state.user;

        emedia.config({
            appkey,
            // useDeployMore:true //开启多集群部署
        });


        let memName = appkey +'_'+ username;
        emedia.mgr.setIdentity(memName, token); //设置memName 、token

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
            
            
            if(
                _this.state.am_i_white_board_creator
                //  &&
                // reason == 11
            ){ // 会议结束、 销毁白板,
                _this.destroy_white_board();
            }

            if(_this.state.shared_desktop) {
                _this.stop_share_desktop()
            }
            
            message.warn(reason_text, 1, () => {
                
                if(_this.state.talker_is_full){ // 主播已满的加入会议，也会走正常挂断 -- 但是不能刷新
                    _this.setState({
                        talker_full_btn_disable: false
                    })
                    return
                }

                window.location.reload()
            });
        };
        emedia.mgr.onConfrAttrsUpdated = function(confr_attrs){ 
            console.log('onConfrAttrsUpdated', confr_attrs);
            // 会议属性变更
            _this.confrAttrsUpdated(confr_attrs)
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

        // 视频流达到最大数失败回调
        emedia.mgr.onPubVideoTooMuch = async () => {
            message.warn('已达到最大视频数，只能开启音频')

            let { own_stream } = _this.state;
            if(own_stream) { // 断开自己的流
                await emedia.mgr.unpublish(own_stream)
            }

            _this.setState({ 
                audio:true, video:false 
            }, _this.publish)
        }
        // 共享桌面最大数发布 回调
        emedia.mgr.onPubDesktopTooMuch = () => {
            message.warn('共享桌面数已经达到最大');
            _this.stop_share_desktop()
        }

        // 主持人 收到上麦申请回调
        // applicat 申请者信息 {memberId, nickName}
        // 只有管理员会收到这个回调
        
        emedia.mgr.onRequestToTalker = function(applicat, agreeCallback, refuseCallback) {
            
            _this.handle_apply_talker(applicat, agreeCallback, refuseCallback)
        }

        // 观众收到 上麦申请的回复 result 0: 同意 1: 拒绝
        emedia.mgr.onRequestToTalkerReply = function(result) {
            if(result == 1){
                message.error('管理员拒绝了你的上麦申请')
            }
        }
        // 主播收到 申请主持人的回复 result 0: 同意 1: 拒绝
        emedia.mgr.onRequestToAdminReply = function(result) {
            if(result == 1){
                message.error('管理员拒绝了你的主持人申请')
            }
        }

        // 收到主播的主持人申请, applicat 申请者信息 {memberId, nickName}
        emedia.mgr.onRequestToAdmin = function(applicat, agreeCallback, refuseCallback) {
            
            let { memberId, nickName } = applicat; 

            if(!memberId){
                return
            }
            const { confirm } = Modal;
            confirm({
                title:`是否同意${nickName || memberId}的主持人请求`,
                onOk: () => agreeCallback(memberId),
                onCancel: () => refuseCallback(memberId),
                cancelText:'拒绝',
                okText:'同意'
            });
        }

        // 某人被管理员静音或取消静音的回调
        emedia.mgr.onMuted = () => { 
            message.warn('你被管理员静音了'); 
            _this.close_audio()
        }
        emedia.mgr.onUnmuted = () => { 
            message.success('你被管理员取消了静音');
            _this.open_audio()
        }

        // 全体静音或取消全体静音
        emedia.mgr.onMuteAll = () => { 
            message.warn('管理员启用了全体静音');
            setTimeout(_this.close_audio, 500)  //如果静音，加入会议就会触发，所以设置延时
        }
        emedia.mgr.onUnMuteAll = () => { 
            message.success('管理员取消了全体静音');
            _this.open_audio()
        }

        // 网络质量检测
        emedia.mgr.onNetworkQuality = (sId, status) => {

            let { stream_list, n_weak_ms_t } = _this.state;


            let changed = false;
            stream_list.map(item => {
                if(
                    item &&
                    item.stream &&
                    item.stream.id == sId
                ) {
                    let perv_n_status = item.stream.network_status;
                    if(perv_n_status != status) {
                        changed = true;
                        item.stream.network_status = status;
                        console.log(`onNetworkQuality change: sid=${sId}, status=${status}`);

                    }

                    // 自己弱网的提示
                    if(item.member && item.member.is_me && status !=2 ) {
                        let t = new Date().getTime()
                        if(!n_weak_ms_t) {
                            _this.setState({ n_weak_ms_t: t});
                            toast_msg_show('您的网络状态不佳');
                        } else {
                            
                            if(t - n_weak_ms_t > 10000) {
                                _this.setState({ n_weak_ms_t: t});
                                toast_msg_show('您的网络状态不佳')
                            };
                        }
                    }
                }


            });

            if(changed) {
                _this.setState({ stream_list })
            }

        }
       

        // electorn 兼容 
        if(emedia.isElectron) {
            emedia.chooseElectronDesktopMedia = function(sources, accessApproved, accessDenied){
                
                if(_this.choose_desktop_media) {
                    _this.choose_desktop_media.show(sources, accessApproved, accessDenied);
                }
            }
        }


    }

    // 初始化白板
    init_white_board() {
        this.white_board = new whiteBoards({
			restApi: process.env.REACT_APP_WHITE_BOARD_HOST,
            apiUrl: process.env.REACT_APP_RTC_HOST,
            appKey: appkey
            
		});
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
                _this.setState({
                    audio:true
                },_this.publish)
                message.success('你已经上麦成功,并且推流成功');
                
                return
            }

            // 被允许下麦
            if(
                (old_role == 3 || old_role == 7) &&
                role == 1
            ) {
                message.success('你已经下麦了,并且停止推流');
                _this.setState({
                    join_as_audience: true
                })
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
    // 会议属性变更
    confrAttrsUpdated(confr_attrs) {
        // confr_attrs ---  Array 

        // 白板相关
        let white_board_attr = confr_attrs.filter(item => item.key == 'whiteBoard');
        
        if(white_board_attr.length > 0) {
            let { op, val } = white_board_attr[0];

            if( op == 'DEL') {
                message.success('白板管理员销毁了白板');
                this.setState({
                    white_board_is_created: false,
                })
                return
            }


            val = JSON.parse(val)

            // 如果是自己创建的白板，忽略会议属性
            let { username } = this.state.user;
            if( val.creator == username ) {
                return
            }

            // 如果不是 删除白板的会议属性，都是加入
            message.success('有人创建了白板');

            let { roomName, roomPswd:password } = val;
            let { username:userName, token } = this.state.user;

            let join_white_board_params = {
                roomName,
                password,
                userName,
                token
            }

            this.setState({ 
                join_white_board_params,
                talker_list_show: true
            }, this.join_white_board);
        }
    }

    // 从 sessionStore 拿昵称 return false: 没有昵称，需要设置， true：有昵称，不需要设置
    _get_nickname_from_session() {
        let nickName = window.localStorage.getItem('easemob-nickName');
        let nickName_used = window.localStorage.getItem('easemob-nickName-used');

        if(!nickName) {
            window.localStorage.setItem('easemob-nickName-used', true);
            this.setState({ // 没有nickName，肯定是拥有者，用于判断是否需要 存到 localStorge-nickName
                is_localStorage_nickName_admin: true
            })
            return
        } 
        
        if(nickName_used == 'true') { // 有人打开了 一个页面了 已经
            return 
        } else { // null 或者 false 说明是拥有者，直接置为 true
            window.localStorage.setItem('easemob-nickName-used', true);
            this.setState({ 
                is_localStorage_nickName_admin: true,
                nickName 
            });
            return
        }

    }

    // 从 昵称、音视频开启状态、头像路径，存储在本地
    _get_config_from_localStorage() {
        let config = window.localStorage.getItem('em-meeting-config');
        console.log('config', config);
        config = JSON.parse(config);

        for (const key in config) {
            this.setState({
                [key]: config[key]
            })
        }

    }
    _set_config_to_localStorage() {

        // 将昵称、音频开启状态、视频开启状态 存储起来
        let {
            nickName,
            audio,
            video
        } = this.state;

        let config = {
            nickName,
            audio,
            video
        }
        
        window.localStorage.setItem('em-meeting-config', JSON.stringify(config))
    }
    
    _get_headimg_url_suffix_from_session() {
        let headimg_url_suffix = window.sessionStorage.getItem('easemob-headimg_url_suffix');

        if(!headimg_url_suffix) {// 默认给的头像
            headimg_url_suffix = 'Image1.png'
        }
        this.setState({ headimg_url_suffix })
    }

    _set_nickname = nickName => {
        let { username } = this.state.user;

        this.setState({ nickName: nickName || username },this.join_handle);

        if(this.state.is_localStorage_nickName_admin) { 
            // 是否是 localStorage_nickName 拥有者，一个浏览器只有第一个页面拥有localStorage_nickName
            window.localStorage.setItem('easemob-nickName', nickName);
        }
    }

    // 退出会议相关
    hide_leaveConfirmModal() {
        this.setState({ leaveConfirmModal_show: false})
    }
    get_leaveConfirmModal() {
        let { leaveConfirmModal_show } = this.state;
        if(!leaveConfirmModal_show) return '';
        
        let { confrId } = this.state.user_room;

        return <div className="leave-confirm-modal" >
                <div className="toast-title">
                    <span>警告</span>
                    <Icon type="close-circle"  onClick={this.hide_leaveConfirmModal} />
                </div>
                <div className="text">
                    如果您不想结束会议<br></br>请在离开会议前指定新的主持人
                </div>
                <div className="handle">
                    <span className="leave" onClick={this.leave}>离开会议</span><br />
                    <span className="end" onClick={() => emedia.mgr.destroyConference(confrId)}>结束会议</span>
                </div>
            </div>
    }
    leave_handle() {

        let { role } = this.state.user_room;

        if(role == 7) {
            this.setState( state => ({leaveConfirmModal_show: !state.leaveConfirmModal_show}) )
        } else {
            let is_confirm = window.confirm('确定退出会议吗？');
    
            if(is_confirm){
                this.leave()
            }
        }

    }
    leave(){
        let { am_i_white_board_creator,shared_desktop } = this.state;
        if(am_i_white_board_creator) {
            this.emit_white_board_is_destroyed()
            this.destroy_white_board()
        }
        if(shared_desktop) {
            Modal.info({
                title: '您还在共享桌面，请先停止共享桌面'
            });
            return
        }

        setTimeout(emedia.mgr.exitConference,300) // 用于发送 销毁会议的消息
    }

    publish() {
        let { audio, video }  = this.state;
        // video = { // 设置 video 分辨率
        //     width: {
        //         exact: 1280
        //     },
        //     height: {
        //         exact: 720
        //     }
        // }
        let constraints = { audio, video };
        if(!audio && !video) { // mic 和 camera 都没打开， 直接publish会报错
            constraints = { audio: true }
        }

        let _this = this;
        (async function() {
            try {
                const stream = await emedia.mgr.publish(constraints);
                notification_show('success', '发布流成功');
                if(!audio && !video) { // getUserMedia 后再关闭音频
                    _this.close_audio()
                }
            } catch (error) {
                console.error('发布流失败',error);
                notification_show('error', '发布流失败');
                if(error.error == -201) {
                    notification_show('error', '请检查摄像头或麦克风是否被允许');
                }
            }
        })()

    }
    // 上麦申请
    apply_talker() {

        let { confrId } = this.state.user_room;
        message.success('上麦申请已发出，请等待主持人同意');
        emedia.mgr.requestToTalker(confrId)

    }
    handle_apply_talker(applicat, agreeCallback, refuseCallback) {

        
        let { memberId, nickName } = applicat; //申请者信息

        if(!memberId){
            return
        }
        const { confirm } = Modal;

        confirm({
            title:`是否同意${nickName || memberId}的上麦请求`,
            onOk: () => agreeCallback(memberId, to_audience_modal), // 如果主播已满（sdk 内部测试）, to_audience_modal: 为回调函数
            onCancel: () => refuseCallback(memberId),
            cancelText:'拒绝',
            okText:'同意'
        });

        let _this = this;
        const to_audience_modal = () => { //选人下麦提示框

            confirm({
                title:'主播人数已满，请选人下麦',
                cancelText:'取消',
                okText:'确定',
                onOk() {
                    _this.to_audience_list.show(() => agreeCallback(memberId)) // 再回调一下同意上麦
                },
                onCancel: () => refuseCallback(memberId)
            })
        }

    }
    // 下麦申请
    async apply_audience() {

        let { stream_list, am_i_white_board_creator, shared_desktop } = this.state;
        
        if(am_i_white_board_creator){ // 白板进行中不允许下麦
            message.warn('当前您正在共享白板，请退出白板后，再下麦');
            return
        }

        if(stream_list.filter(item => item).length == 1){ // 过滤后 如果只有一个主播
            message.warn('当前您是唯一主播，不允许下麦');
            return
        }
        let { username:my_username } = this.state.user;
        let { confrId } = this.state.user_room;

        if(!my_username) {
            return
        }
        let memName = appkey + '_' + my_username;

        let _this = this;
        Modal.confirm({
            title: '下麦后不能发布语音视频',
            okText: '确认下麦',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await emedia.mgr.degradeRole(confrId, [memName], emedia.mgr.Role.AUDIENCE);
                    if(shared_desktop) {
                        _this.stop_share_desktop()
                    }
                } catch (error) {
                    
                }
            }
        });


    }
    
    reset_state() { // 重置 state、比如下麦成功后
        this.setState({
            // audio:false,
            // video:false,
            shared_desktop:false,
            room_setting_modal_show: false
        })
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
        let shared_content = this._check_has_shared();
        if(shared_content) { // 共享桌面或者白板，不可切换大图
            message.warn(`${shared_content == 'desktop' ? '有人在共享桌面，不可切换大图': '有人在共享白板，不可切换大图'}`);
            return 
        }

        let { stream_list } = this.state;
        let first_item = stream_list.splice(index,1)[0];
        stream_list.unshift(first_item);


        this.setState({ 
            stream_list
        }, this.move_v_els)
    }
    // 更新 stream by id
    upload_stream_by_id(sId, source) { 
        // 只做一层拷贝
        if(sId == this.state.own_stream.id) {

            let own_stream = Object.assign(this.state.own_stream, source)
            this.setState({ own_stream })
        }


        let { stream_list } = this.state;
        stream_list.map(item => {
            if(
                item &&
                item.stream &&
                item.stream.id == sId
            ) {
                Object.assign(item.stream, source)
            }
        });

        this.setState({ stream_list })
    }
    // toggle 代指关闭或开启
    // 关闭或开启自己的
    async toggle_video(e) {

        let { role } = this.state.user_room;
        let { own_stream } = this.state;
        if(role == 1){
            return
        }

        
        if(!own_stream) {
            return
        }
        
        let { video } = this.state;
    
        if(video){
            await emedia.mgr.pauseVideo(own_stream);
            video = !video
            this.setState({ video })
        }else {
            let t_el;
            if(e) { //loading
                t_el = e.target;
                t_el.style.cursor = 'wait'
            }
            await emedia.mgr.resumeVideo(own_stream);

            if(t_el) {
                t_el.style.cursor = 'pointer'
            }

            video = !video
            this.setState({ 
                video 
            })
        }



        let {id: sId} = own_stream;
        this.upload_stream_by_id(sId, { voff: video ? 0 : 1})

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

        let { confrId } = this.state.user_room;

        try {
            let _this = this; 

            var options = {
                withAudio:true,
                confrId,
                stopSharedCallback: sId => _this.stop_share_desktop(sId)
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

    stop_share_desktop(sId) {
        let { own_desktop_stream } = this.state;

        if(!own_desktop_stream) return;

        emedia.mgr.unpublish(own_desktop_stream);
        
        this.setState({ 
            shared_desktop:false,
            own_desktop_stream: null
        });
    }
    _on_stream_added(member, stream) {

        if(
            stream.type == emedia.StreamType.DESKTOP 
            && stream.located()
        ) { // 自己的共享桌面不显示
            this.setState({ // 保存下来，用于停止共享
                own_desktop_stream: stream
            })
            return
        }
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

            this.setState({own_member: member})
        }

        if(stream.type == emedia.StreamType.DESKTOP) {
            stream_list.unshift({stream,member});
        } else if( // 将自己推的流显示到 main
            !this._check_has_shared() // 没人在共享
            && stream.located() 
            && !stream_list[0] 
        ) {
            stream_list.unshift({stream,member});
        } else {
            stream_list.push({stream,member});
        }
        


        let _this = this;
        this.setState({ 
            stream_list:stream_list,
            talker_list_show: true
        },() => {
            _this.insert_video_by_stream(member,stream);

            if(stream.type == 1) { // 桌面流还要移动 位置
                _this.move_v_els()
            }

            let { push_cdn, user_room } = _this.state;
            if(push_cdn && user_room.isCreator){ //只有创建者 并且开启推流 可更新布局

                _this.setState(state => ({ // 每次更新布局 cdn_zorder 递增1
                    cdn_zorder: state.cdn_zorder + 1
                }), _this._update_live_layout)
            }
        })
    } 

    insert_video_by_stream(member,stream) {

        let el = document.createElement('video');
        el.autoplay = true;

        if(stream.located() && stream.type != 1) { //自己的媒体流 镜像显示
            el.setAttribute('is-main-media', true);
        }
        
        let w_el = document.querySelector('[sid='+ stream.id +']');

        let loading_el = this._get_video_loading_el();
        w_el.appendChild(loading_el);

        setTimeout(() => { // 删除 v-loading
            let v_ls = document.querySelectorAll('.v-wrapper .loading-wrapper');

            for (let index = 0; index < v_ls.length; index++) {
                const element = v_ls[index];
                element.parentNode.removeChild(element)
            }
        },1000)
        if( stream.located() ){
            emedia.mgr.streamBindVideo(stream, el);
            
            // w_el.appendChild(el)

            // w_el.removeChild(loading_el)
        }else {
            let sub_optioon = { video: true, audio: true };
            console.log('%c sub','color:green');
            emedia.mgr.subscribe(member, stream, sub_optioon.video, sub_optioon.audio, el)
            .then(() => { 
                // w_el.appendChild(el);
                
                // w_el.removeChild(loading_el)
            })
            .catch(error => {
                console.error('订阅流失败',error);
                notification_show('error', `订阅${member.nickName}的流失败`);
                
                // w_el.removeChild(loading_el)
            });
        }

        w_el.appendChild(el);
        this._on_media_chanaged_by_stream(el, stream)

        let { subed_v_els } = this.state;
        subed_v_els[stream.id] = el;
        this.setState({
            subed_v_els
        });

    }

    move_v_els() {
        // 通过原生 js， 移动 DOM 节点
        let v_wrappers = document.querySelectorAll('.v-wrapper[sid]');

        for (let index = 0; index < v_wrappers.length; index++) {
            const v_wrapper = v_wrappers[index];
            
            let sId = v_wrapper.getAttribute('sid');
            let v_el = this.state.subed_v_els[sId];

            let prev_v_el = v_wrapper.querySelector('video');
            prev_v_el ? v_wrapper.removeChild(prev_v_el) : '' // 先删除


            v_wrapper.appendChild(v_el);
        }

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

        let _this = this;
        this.setState({ stream_list },() => {
            _this.move_v_els()
            let { push_cdn, user_room } = _this.state;
            if(push_cdn && user_room.isCreator){ //只有创建者 并且开启推流 可更新布局

                _this.setState(state => ({ // 每次更新布局 cdn_zorder 递增1
                    cdn_zorder: state.cdn_zorder + 1
                }), _this._update_live_layout)
            }
        });

        // 删除退出的流 el
        let { subed_v_els } = this.state;
        if(subed_v_els[stream.id]) delete subed_v_els[stream.id];

        this.setState({ subed_v_els })
    }
    
    // 检查是否有别人共享了桌面或者 白板
    _check_has_shared(type) {

        let { own_desktop_stream, white_board_is_created, am_i_white_board_creator } = this.state;
        let main_stream = this.state.stream_list[0];

        // 返回是共享的屏幕或者白板，可区分
        if(!type) { // type 没值，就是不是图标状态的变化
            if(own_desktop_stream) { // 自己共享的屏幕
                return 'desktop'
            }

            if( // 有人在共享桌面
                main_stream 
                && main_stream.stream 
                && main_stream.stream.type == 1
            ) {
                return 'desktop'
            }
      
            if(white_board_is_created) { return 'white-board' } // 有人共享白板

            return false
        } else { // 就是图标状态 需要检测是否自己共享的白板或者屏幕
            // 当有type 时, 是操作按钮的显示状态，需要判断是否是自己共享的桌面 或者 创建的白板
            // type， desktop: 共享桌面，white-board: 白板
            // 如果是自己共享的 需要停止共享 return false
            // 只检测不可点击状态 

            let check = false;

            if(
                type == 'desktop'
            ) { // 有人共享白板，别人共享屏幕 
                if( white_board_is_created ) check = 'white-board';
                if (
                    main_stream 
                    && main_stream.stream 
                    && main_stream.stream.type == 1
                ) check = 'desktop';
            }
            
            if( type == 'white-board' ) {
                if(
                    own_desktop_stream 
                    || (
                        main_stream 
                        && main_stream.stream 
                        && main_stream.stream.type == 1
                    )
                ) check = 'desktop'; // 有人共享屏幕
                if (white_board_is_created && !am_i_white_board_creator) { //  别人共享白板
                    check = 'white-board'
                }
            }

            return check

        }

        
    }

    //监听音视频变化
    _on_media_chanaged_by_stream(el, stream) {

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
        this.sound_chanaged = (id, volume) => { 

            if(!id) {
                return
            }

            let { stream_list } = this.state;

            stream_list = stream_list.map(item => {
                if(
                    item &&
                    item.stream &&
                    item.stream.id == id
                ){
                    item.stream.volume = volume
                }

                return item
            })

            this.setState({ stream_list })
        }
        let _this = this;
        
        // 监听音视频的开关
        emedia.mgr.onMediaChanaged(el, function (constaints, stream) {
            _this.set_stream_item_changed(constaints, stream.id)
        });

        process.env.NODE_ENV == 'development' ? '' : 
        // 监听谁在说话
        // 函数触发，就证明有人说话 拿 stream_id
        emedia.mgr.onSoundChanaged(el, function (meterData, stream) {
            let { instant } = meterData;

            let one_unit_pic = 0.15/14; // 音量（instant）high 为 0.25，也就是图片显示为14

            let volume = Math.round(instant/one_unit_pic);
            volume = volume > 14 ? 14 : volume; 


            let prev_volumes = _this.state.prev_volumes;
            if(prev_volumes[stream.id] != volume ) { // 避免每次 setState
                _this.sound_chanaged(stream.id, volume);
                prev_volumes[stream.id] != volume
                _this.setState({
                    prev_volumes
                })
            }
        });

    }

    // 推流 CDN 更新布局 九宫格布局
    _update_live_layout() {

            let { stream_list } = this.state;

            let _this = this;

            // 根据流的数据 计算应该排几行几列
            const get_layout_info = () => {

                let streamcounts = 0; //获取 stream 的个数
                let { stream_list } = _this.state;
                stream_list.map(item => { // 过滤到空项
                    if(item) {
                        streamcounts++ 
                    }
                })


                // 九宫格设计
                // 根据个数开方求列
                // 根据个数除以 列数求行数
                // 都是向上取整
    
                let col_num = Math.ceil( Math.sqrt(streamcounts) );// 获取列数
                let row_num = Math.ceil( streamcounts/col_num );// 获取行数
    
                // 计算每个流占据的尺寸
                let { liveCfg } = _this.state;
                let { w: canvas_width, h: canvas_height } = liveCfg.canvas; //获取画布的尺寸
                
                let cell_width = parseInt(canvas_width/col_num);
                let cell_height = parseInt(canvas_height/row_num);

                let layout_info = {
                    col_num,
                    row_num,
                    cell_width,
                    cell_height,
                }
                return layout_info

            }

            // 根据在画布中 是第几个流 拿到position
            const get_position_in_canvas = (index, layout_info) => {
                let position = {
                    x:0,
                    y:0
                }


                // 计算在 第几行第几列
                let {
                    col_num,
                    cell_width,
                    cell_height,
                } = layout_info;

                let position_row = Math.ceil(index/col_num);
                let position_col = index%col_num;

                if(position_col == 0) {
                    position_col += col_num
                }
                // 根据第几行第几列计算 x、y
                position.x = cell_width * (position_col - 1);
                position.y = cell_height * (position_row - 1);


                return position
            }


            let layout_info = get_layout_info();

            let regions = [];
            let index = 0;//在画布中的第几个流
            let { cdn_zorder } = this.state;

            stream_list.map(item => {
                if(item){
                    index ++;
                    let position = get_position_in_canvas(index, layout_info);

                    let { id: stream_id } = item.stream;
                    regions.push({
                        "sid": stream_id,
                        "x": position.x,
                        "y": position.y,
                        "z": cdn_zorder,
                        "w": layout_info.cell_width,
                        "h": layout_info.cell_height,
                        "style": "AspectFit"
                    })
                }
            })

            let { confrId } = this.state.user_room;
            let { liveCfgs } = emedia.config;
            if(liveCfgs && liveCfgs[0]) emedia.mgr.updateLiveLayout(confrId, liveCfgs[0].id, regions);
    }
    _get_header_el() { 

        let { roomName, own_stream } = this.state;

        return (
            <div className="header-wrapper">
                <img className='logo' src={get_img_url_by_name('logo-text-room')}/>
                <div className="name-wrapper">
                    <div className="name">{roomName || '房间名称'}</div>
                    <div className="time">{this._get_tick()}</div>
                </div>

                <div className='leave-action-wrapper'>
                    
                    { own_stream ? 
                        <div className="network-icon">
                            <NetworkStatus network_status={own_stream.network_status} />
                        </div> : ''
                    }
                    
                    <div onClick={this.leave_handle} className="leave-action">
                        <img src={get_img_url_by_name('leave-icon')} />
                        <span>离开会议</span>
                    </div>

                    <Exc_feed />
                </div>
            </div>
        )
    }

    
    // 视频关闭的显示框，不直接显示 video 是个黑框
    // type: 区分 main画面和talker-list， 默认不显示admin 标志和 名字（因为talker-list 上面有）
    _voff_show(stream, type) {

        if(!stream) {
            return <div className="voff-show"></div>
        }

        let { ext } = stream.member;
        if( !ext || !ext.headImage ) {
            return <div className="voff-show"></div>
        }

        let base_url = 'https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/RtcDemo/headImage/';
        return <div className="voff-show">
                    <div className="avatar-wrapper">
                        <img className='avatar' src={ base_url + ext.headImage }/>
                        {/* 只在main 画面显示 */}
                        { type == 'main' ? 
                            <div className='nick-name'> 
                                { get_nickname(stream.member) } 
                                { stream.member.role == 7 ? <img src={ get_img_url_by_name('admin-icon') }/> : ''}
                            </div> : ''
                        }
                    </div>
                </div>
                
    }

    // get loading el
    _get_video_loading_el() {

        let el = document.createElement('div')
        el.classList.add('loading-wrapper');


        let children = [
            `<div class="loading">
                <div class="circle circle1">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div class="circle circle2">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div class="circle circle3">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>`
        ]

        el.innerHTML = children;
        return el
    }

    // 主播列表滚动 
    // 更新订阅，不可见的只订阅音频
    talker_list_scroll(fun, wait) {
        // 当画面不可见时，重新订阅（只订阅音频）
        let timer;
        let _this = this;

        return function() {
            // 获取需要更新的video元素
            let els = document.querySelectorAll('.talker-list-wrapper video');

            const prev_not_visible = sid => {
                let { not_visible_arr } = _this.state;
                if(not_visible_arr.indexOf(sid) > -1) {
                    // 上次是不可见

                    return true
                }

                return false
            }

            const getItemBySid = sid => { // 获取 stream 和 member
                if(!sid) {
                    return null
                }
    
                let result = null
                _this.state.stream_list.map(item => {
                    if(
                        item
                        && item.member
                        && item.stream
                        && item.stream.id == sid
                    ) {
                        result = item
                    }
                })
    
                return result
            }

            for (let index = 0; index < els.length; index++) {

                const element = els[index];


                let par_node = element.parentNode;
                let sid = element.getAttribute('hx_stream');

                let item = getItemBySid(sid);

                if(item.stream.voff) { continue }; //不添加

                if(
                    !_this.talker_is_not_visble(element)
                    && prev_not_visible(sid)
                ) { 
                    if(!par_node.querySelector('.loading-wrapper')) {
                        par_node.appendChild(_this._get_video_loading_el());
                    } 
                } else {
                    let loading_el = par_node.querySelector('.loading-wrapper');
                    loading_el ? par_node.removeChild(loading_el) : '';
                }

            }
            
            
                if(timer) clearTimeout(timer);

                timer = setTimeout(fun, wait)
        }
    }
    // 主播列表滚动 停止
    // 更新订阅，不可见的只订阅音频
    talker_list_scroll_stop() {
        
        
        // 当画面不可见时，重新订阅（只订阅音频）

        // 获取需要更新的video元素
        let els = document.querySelectorAll('.talker-list-wrapper video');

        let _this = this;
        const getItemBySid = sid => { // 获取 stream 和 member
            if(!sid) {
                return null
            }

            let result = null
            _this.state.stream_list.map(item => {
                if(
                    item
                    && item.member
                    && item.stream
                    && item.stream.id == sid
                ) {
                    result = item
                }
            })

            return result
        }

        const visible_change = (sid, type) => { 

            let { not_visible_arr } = _this.state;
            // 存储一个不可见 arr
            if(type == 'not-visible' && not_visible_arr.indexOf(sid) > -1) {
                // 上次也是不可见

                return false
            }

            if(type == 'not-visible' && not_visible_arr.indexOf(sid) == -1) {
                // 上次可见 或者首次
                not_visible_arr.push(sid);

                _this.setState({ not_visible_arr })
                return true
            }

            if(type == 'visible' && not_visible_arr.indexOf(sid) > -1) {
                // 上次是不可见, 这次是可见，从不可见剔除出来
                let index = not_visible_arr.indexOf(sid);
                not_visible_arr.splice(index, 1)

                _this.setState({ not_visible_arr })
                return true
            }

            if(type == 'visible' && not_visible_arr.indexOf(sid) == -1) {
                // 上次是可见, 这次也是可见，不做处理
                
                return false
            }

        }

        const del_loading = par_node => { // 删除loading el
            
            let loading_el = par_node.querySelector('.loading-wrapper');
            loading_el ? par_node.removeChild(loading_el) : '';
        }

        for (let index = 0; index < els.length; index++) {

            const element = els[index];

            let sid = element.getAttribute('hx_stream');
            if(!sid) { continue };
            
            let item = getItemBySid(sid);

            if(item.stream.voff) { continue }; // 没开视频，不管都订阅，不影响性能
            if(item.stream.located()) { continue }; // 自己的不做任何处理


            let par_node = element.parentNode;
            del_loading(par_node);       

            if(this.talker_is_not_visble(element)) {
                
                if(visible_change(sid, 'not-visible')) {// 检测可见行是否变化
                    // 不订阅视频
                    // emedia.mgr.subscribe(item.member, item.stream, false, true, element)
                    emedia.useCurrentXService.subscribe(item.stream.id, {subSVideo: false, subSAudio: true})
                    
                } 
            } else { // 恢复订阅视频
                if(visible_change(sid, 'visible')) { 
                    // emedia.mgr.subscribe(item.member, item.stream, false, true, element)
                    emedia.useCurrentXService.subscribe(item.stream.id, {subSVideo: true, subSAudio: true})
                    
                }
            }

            
        }


        
    }

    // 主播列表内主播是否可见
    talker_is_not_visble(element) {
        let body_height = document.body.getBoundingClientRect().height;
        let el_height = document.querySelectorAll('.talker-list-wrapper .v-wrapper')[0].getBoundingClientRect().height;
        let footer_height = document.querySelector('footer').getBoundingClientRect().height;

        let top = element.getBoundingClientRect().top;

        if(top >= (body_height-footer_height )) { // top 比(容器 - 底部栏高度 )还高，说明在容器下面
            return true
        }

        // 在上面 往上滑 125：是第一个可见的 video 的位置 滑出去了看不见了
        if(top < 125 && Math.abs(top - 125) > el_height) {
            return true
        }

        return false // 介于 125 ~ boby_height 之间的为可见

    }


    // 视频列表
    _get_drawer_component() {

        let _this = this;
        let { stream_list, talker_list_show } = this.state;
        let { role } = this.state.user_room;

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

        return  <div className="talker-list-placeholder">
                    <div 
                        className="talker-list-wrapper" 
                        style={talker_list_show ? {} : {transform: 'translateX(calc(100% + 10px))'}}
                    >
                        <div className="control-btn" onClick={this.control_talker_list}>
                            <img 
                                src={get_img_url_by_name('expand-icon')} 
                                style={ talker_list_show ? {transform: 'rotateY(180deg)'} : {} }
                            />
                        </div>
                        <div className="header">
                            参会人数 {get_talkers()}
                            { role == 7 ? <MuteAction {...this.state}/> : ''}
                        </div>
                        <div className="content"
                            onScroll={this.talker_list_scroll}
                        >
                            { stream_list.map((item, index) => {

                                if(index != 0 && item){ // 不渲染主画面， 0位置：代表的主页面
                                    return _this._get_video_item(item,index);
                                }
                            }) }
                        </div>
                    </div>
                </div>
    }
    
    _get_main_el() {
        let main_stream = this.state.stream_list[0];

        if(main_stream) {
            let { volume, type, voff, aoff } = main_stream.stream; //volume 说话音量

            return (
                <div className="main-video-wrapper v-wrapper" sid={main_stream.stream.id} >
                    
                    {type == 1 ? '' :
                     aoff ? 
                        <img src={get_img_url_by_name('micro-is-close-icon')} className='is-speak-icon'/> : 
                        <img src={get_img_url_by_name('volume-' + (volume || 0))} className='is-speak-icon'/>
                    }
                    { voff ? this._voff_show(main_stream, 'main') :'' } {/* 覆盖到 video上, 不能替换否则 stream 丢失*/}
                    
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

        let { id, aoff, volume, type, voff } = stream;
        let { role, is_me } = member;
        let { role:my_role } = this.state.user_room;//拿到我自己的角色
        let { username:my_username } = this.state.user;//拿到我自己的username
        let { user_room } = this.state
        
        let nickName = get_nickname(member);


        return (
            <div 
                key={id} 
                className="item v-wrapper"
                sid={stream.id}
                onDoubleClick={ () => this.toggle_main(index) } //mian 图不需要点击事件，所以不传index÷
            >

                <div className="info">
                    <span className="name">
                        { nickName + (is_me ? '(我)' : '')}
                    </span>

                    {/* <img src={get_img_url_by_name('no-speak-icon')}/> */}
                    {/* 
                     * 对方没有开启音频 显示audio-is-close-icon
                     * 对方开启音频 不说话 不显示图标
                     * 对方开启音频 在说话 显示volume-icon
                     */}
                    <div className="status-icon"> 
                        <div className="network-icon">
                            <NetworkStatus network_status={stream.network_status} />
                        </div>
                        { role == 7 ? <img className='admin' src={ get_img_url_by_name('admin-small-icon') }/> : ''}
                        {
                            aoff ? 
                            <img src={get_img_url_by_name('micro-is-close-icon')} /> : 
                            <img src={get_img_url_by_name('volume-'+(volume || 0))} />
                        }
                        
                    </div>
                </div>
                { voff ? this._voff_show(talker_item) :'' }

                {/* <video ref={`list-video-${id}`} autoPlay></video> */}
                {/* 不是主持人 并且不是主持人自己 并且流不是共享桌面 才加载 */}
                { 
                    (my_role == 7 && !is_me && type != emedia.StreamType.DESKTOP) ? 
                        <ManageTalker { ...{stream, member, my_username, user_room} } /> : '' 
                } 
            </div>
        )

                            
    }

    _get_action_el() {
        let { role } = this.state.user_room

        let { 
                audio,
                video, 
                shared_desktop,
                room_setting_modal_show,
                roomName,
                own_member,
                join_as_audience,
                nickName
            } = this.state
        

        let icons = { // 图标的样式和动作
            micro:{
                icon_index: 'audio'
            },
            camera: {
                icon_index: 'video'
            },
            change_role: {
                icon_index: 'role'
            }, 
            share_desktop: {
                icon_index: 'shared_desktop'
            },
            share_white_board: {
                icon_index: 'white_board_is_created'
            },
            invitees: {
                icon_index: 'invitees'
            },
            seeting: {
                icon_index: ''
            }
        }
        
        let shared_content = this._check_has_shared('desktop');

        return (
                
                <div className="actions">
                    <div className="wrapper">
                        <img 
                            className={role == 1 ? 'disabled' : '' } 
                            src={
                                role == 1 ? 
                                get_img_url_by_name('micro-is-close-icon') :

                                audio ? get_img_url_by_name('micro-is-open-icon') : 
                                get_img_url_by_name('micro-is-close-icon')} 

                             onClick={() => this.toggle_audio()}
                        />
                        <span className="text">{role == 1 ? '解除静音': audio ? '静音' : '解除静音'}</span>
                    </div>
                    <div className="wrapper">
                        <img 
                            className={role == 1 ? 'disabled' : '' } 
                            src={
                                role == 1 ?
                                get_img_url_by_name('video-is-close-icon') :

                                video ? get_img_url_by_name('video-is-open-icon') : 
                                get_img_url_by_name('video-is-close-icon')} 

                             onClick={(e) => this.toggle_video(e)}
                        />
                        <span className="text">{role == 1 ? '开启视频': video ? '关闭视频' : '开启视频'}</span>
                    </div>
                    {/* 只有以观众进入的才展示 上下麦按钮 */}
                    { join_as_audience ? 
                        <div className="wrapper">
                            { role == 1 ? 
                                <img 
                                    src={get_img_url_by_name('apply-to-talker-icon')} 
                                    onClick={() => this.apply_talker()}
                                /> :
                                <img 
                                    src={get_img_url_by_name('apply-to-audience-icon')} 
                                    onClick={() => this.apply_audience()}
                                /> 
                            }
                            <span>{ role == 1 ? '上麦' : '下麦' }</span>
                        </div>
                        : ''
                    }

                    { this.get_white_board_action_btn() }
                    
                    <div className="wrapper">
                        <img 
                            src={get_img_url_by_name('invite-icon')} 
                            onClick={() => inviteModal({
                                roomName, 
                                invitees: nickName
                            })}
                        />
                        <span>邀请他人</span>
                    </div>
                    <div className="wrapper">
                        {
                            role == 1 ? (
                                <Tooltip title='观众不可共享桌面'>
                                    <img 
                                        src={get_img_url_by_name('share-desktop-icon')} 
                                        style={{opacity:'0.7', cursor:'not-allowed'}}
                                    />
                                </Tooltip>
                            ) :

                            shared_content ? 
                            <Tooltip title={ shared_content == 'desktop' ? 
                                            '有人在共享桌面，不可再共享桌面': '有人在共享白板，不可再共享桌面'}>
                                <img 
                                    src={get_img_url_by_name('share-desktop-icon')} 
                                    style={{opacity:'0.7', cursor:'not-allowed'}}
                                />
                            </Tooltip> :
                            shared_desktop ? 
                                <img 
                                    src={get_img_url_by_name('stop-share-desktop-icon')} 
                                    onClick={() => this.stop_share_desktop()}
                                /> :
                                <img 
                                    src={get_img_url_by_name('share-desktop-icon')} 
                                    onClick={() => this.share_desktop()}
                                />
                        }
                        <span>{shared_desktop? '停止共享' : '共享桌面'}</span>
                    </div>
                    <div className="wrapper">
                        <img 
                            src={ room_setting_modal_show ? 
                                    get_img_url_by_name('room-setting-open-icon') : 
                                    get_img_url_by_name('room-setting-close-icon')
                                } 
                            onClick={() => this.toggle_room_setting_modal()}
                        /> 
                        <span>会议信息</span>
                    </div>
                    

                </div>
        )
    }
    // toggle 会议信息 modal
    toggle_room_setting_modal() {
        let { room_setting_modal_show } = this.state;

        this.setState({
            room_setting_modal_show: !room_setting_modal_show
        })
    }


    // 白板相关的方法
    // 获取发起白板的操作按钮
    get_white_board_action_btn() {

        let { 
            use_white_board,
            white_board_is_created,
        } = this.state;

        if(!use_white_board) { // 不启用白板
            return ''
        }
        
        let { role } = this.state.user_room;
        if( role == emedia.mgr.Role.AUDIENCE) { // 观众不能启用 
            return ''
        }
        let shared_content = this._check_has_shared('white-board');

        if(shared_content)
        { 
            return <div className="wrapper">
                        <Tooltip title={ shared_content == 'desktop' ? 
                                            '有人在共享桌面，不可再发起白板': '有人在共享白板，不可再发起白板'}>
                            <img 
                                src={get_img_url_by_name('join-white-board-icon')} 
                                style={{opacity:'0.7', cursor:'not-allowed'}}
                            />
                        </Tooltip>
                        <span>发起白板</span>
                </div>
        }

        // 白板没有创建，都能发起白板
        if(!white_board_is_created) {
            return <div className="wrapper">
                        <img 
                            src={get_img_url_by_name('join-white-board-icon')} 
                            onClick={() => this.create_white_board()}
                        />
                        <span>发起白板</span>
                    </div>
        }

        return <div className="wrapper">
                    <img 
                        src={get_img_url_by_name('destory-white-board-icon')} 
                        onClick={() => this.confirm_destory_white_board()}
                    />
                    <span>退出白板</span>
                </div>


                
        
    }
    // 获取白板的操作界面
    get_white_board_content_el() {
        let { 
            white_board_is_created, 
            white_board_url
        } = this.state; //白板相关

        if( !white_board_is_created ) {
            return ''
        }

        
        // 如果是 https 协议，将返回的路径 协议名替换为 https 否则 iframe报错（不同协议）
        // 返回的是 http 协议
        if(location.protocol == 'https:') {
            white_board_url = white_board_url.replace(/http:\/\//g,'https://')
        }

        
        return <iframe 
                name="white-board" 
                src={ white_board_url } 
               >
            </iframe>
    }
    // 白板创建成功 在会议中进行广播
    emit_white_board_is_created() {

        let { username:creator } = this.state.user;

        let { roomName } = this.state;

        let options = {
            key:'whiteBoard',
            val:JSON.stringify({
                creator, 
                roomName,
                roomPswd: roomName, // 房间密码和名称一样
                timestamp: new Date().getTime() 
            })
        }
        
        emedia.mgr.setConferenceAttrs(options)
    }
    // 白板销毁成功 在会议中进行广播
    emit_white_board_is_destroyed() {
        
        emedia.mgr.deleteConferenceAttrs({
            key:'whiteBoard'
        })
    }
    
    create_white_board() {
        let { roomName } = this.state;
        let { username:userName, token } = this.state.user;

        let _this = this;
        let params = {
            roomName,
            password: roomName, // 房间名称和密码一样
            userName,
            token,

            suc: (res) => {
                let white_board_url =  res.whiteBoardUrl; //为白板房间地址
                
                _this.setState({
                    white_board_url,
                    white_board_is_created: true,
                    am_i_white_board_creator: true,
                    talker_list_show: true,


                    // main_loading: false,
                    // main_loading_text: ''
                    
                })
                message.success('创建白板成功');
                _this.emit_white_board_is_created()
                _this.set_main_stream_to_talker_list()

                this.setState({
                    white_board_info: res
                })
            },
            error: (error) => {
                message.error(error)
            },
        }

        this.setState({
            main_loading: true,
            main_loading_text: '正在创建白板...'
        })
        this.white_board.join(params)

    }
 
    // 加入白板
    join_white_board() {
        let { join_white_board_params } = this.state;

        if(!join_white_board_params) {
            return
        }

        let _this = this;
        this.white_board.join({
            ...join_white_board_params,
            suc: function(res){
                let white_board_url =  res.whiteBoardUrl; //为白板房间地址
                _this.setState({
                    white_board_url,
                    white_board_is_created: true,
                })
                message.success('加入白板成功')
                _this.set_main_stream_to_talker_list()
            },
            error: function(err){
                console.log("加入白板失败", err);

            }
        })

    }

    // 白板加入成功，将mian 画面挤到列表
    set_main_stream_to_talker_list() {
        let { stream_list } = this.state;
        stream_list.unshift(null)

        this.setState({
            stream_list
        }, this.move_v_els)
    }
    // confirm destory_white_board
    confirm_destory_white_board() {
        toast({
            onOk: this.destroy_white_board.bind(this)
        });
    }
    // 销毁白板
    destroy_white_board() {

        let { white_board_info } = this.state;

        if(!white_board_info) {
            return
        }

        let { roomId } = white_board_info;
        let { username: userName, token } = this.state.user;

        this.setState({
            main_loading: true,
            main_loading_text: '正在销毁白板...'
        })
        let _this = this;
        this.white_board.destroy({
            roomId,
            userName,
            token,
            suc: function(data){

                message.success('已经退出了白板');
                _this.setState({ 
                    white_board_is_created: false,
                    am_i_white_board_creator: false,

                    main_loading: false,
                    main_loading_text: ''
                });// 默认不显示
                _this.emit_white_board_is_destroyed()
            },
            error: function(err){
                message.error('退出白板失败');
            }
        });
        
    }

    control_talker_list = () => {
        this.setState(state => ({ talker_list_show: !state.talker_list_show }) )
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
    _get_tick() { // 会议时间
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

    close_talker_model = () => {
        this.setState({
            talker_is_full: false
        })
    }

    // loading 状态 --- 白板、退出。。。
    _get_loading_el() {

        let {
            main_loading,
            main_loading_text
        } = this.state;

        if(main_loading) {
            return <div className="main-loading-wrapper">
                        <Spin tip={main_loading_text}> </Spin>
                    </div>
        }

        return ''
    }
    render() {

        const { getFieldDecorator } = this.props.form;

        let { joined } = this.state;
        let { role } = this.state.user_room;

        let { 
            audio,
            video, 
            nickName, 
            headimg_url_suffix,
            roomName,
            talker_full_btn_disable,
            shared_desktop,
            join_btn_disable,
            
        } = this.state;

        return (
            <div style={{width:'100%', height:'100%'}}>

                {/* join compoent */}
                <div 
                    className="login-wrap" 
                    style={{
                        display: joined ? 'none' : 'flex',
                        background: "url("+ get_img_url_by_name('login-bg') +")",
                        backgroundSize: 'cover'
                    }}
                >
                    {
                        join_btn_disable ? <Alert message="为了最佳使用体验，请使用chrome浏览器" type="warning" closable/> : ''
                    }
                    <div className="header">
                        <img src={get_img_url_by_name('logo-text-login')} />
                    </div>
                    <Form className="login-form" onSubmit={this.join_handle}>
                        <img 
                            src={get_img_url_by_name('setting-icon')}
                            className="setting-handle" 
                            onClick={() => this.setting_modal.show()}
                        /> 
                            
                        <img src={get_img_url_by_name('logo')} />
                        <div className='app-name'>环信视频会议</div>
                        
                        <Item>
                            {getFieldDecorator('roomName', {
                                initialValue: roomName || process.env.REACT_APP_ROOMNAME,
                                rules: [
                                    { required: true, message: '请输入会议名称' },
                                    { min:3 , message: '会议名称不能少于3位'},
                                    { pattern: /^[\u4e00-\u9fa5\w-]*$/, message: '请输入中文、英文、数字、减号或下划线'},
                                ],
                                
                            })(
                                <Input
                                    prefix={<Icon type="home" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                    placeholder="会议名称"
                                    maxLength={18}
                                    autoComplete="off"
                                />
                            )}
                            
                        </Item>
                        <Item>
                        {getFieldDecorator('nickName', {
                                initialValue: nickName || '',
                                rules: [
                                    { required: true, message: '请输入您的昵称' },
                                ],
                                
                            })(
                                <Input
                                prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder="请输入您的昵称"
                                autoComplete="off"
                                />
                            )}
                            
                        </Item>
                        <div className='control-contraints'>
                            {getFieldDecorator('video', {
                                valuePropName:'checked',
                                initialValue: video
                            })( <Checkbox >打开摄像头</Checkbox> )}
                            {getFieldDecorator('audio', {
                                valuePropName:'checked',
                                initialValue: audio
                            })( <Checkbox >打开麦克风</Checkbox> )}
                            
                        </div>
                        <div className="action">
                            <Button 
                                type="primary"  
                                htmlType="submit"
                                onClick={this.join_handle}
                                loading={this.state.loading}
                                style={{width:'100%'}}
                                disabled={join_btn_disable}
                            >
                                加入会议
                            </Button>
                            <div className='info-tips'>
                                <Icon type="info-circle" /> 
                                不用创建会议，初次加入则自动创建
                            </div>
                        </div>
                        <div className='version-text'>Version:{version}</div>
                    </Form>
                
                    {/* 主播人数已满提醒框 */}
                    <Modal
                        visible={this.state.talker_is_full}
                        closable={false}
                        onOk={() => this.talker_is_full_handle()}
                        onCancel={this.close_talker_model}
                        okText="以观众身份登录"
                        cancelText="暂不登录"
                        centered={true}
                        mask={false}
                        maskClosable={false}
                        width='470px'
                        className="talker-is-full-modal"

                        okButtonProps={{disabled: talker_full_btn_disable}}
                        cancelButtonProps={{disabled: talker_full_btn_disable}}
                    >
                        <div>
                            <img src={get_img_url_by_name('warning-icon')}/>
                        </div>
                        <div>主播人数已满<br></br>是否以观众身份进入？</div>
                    </Modal>

                    {/* 设置框 */}
                    <Setting 
                        { ...this.state }
                        _get_setting_values={this._get_setting_values} 
                        // is_localStorage_nickName_admin={this.state.is_localStorage_nickName_admin}
                        ref={setting_modal => this.setting_modal = setting_modal} />

                </div>
                
                {/* room compoent */}
                
                <Layout className="meeting" style={{display: joined ? 'block' : 'none'}}>
                    <Header>
                        {this._get_header_el()}
                    </Header>

                    {/* 白板的iframe  */}
                    <Content>
                        { this._get_loading_el()}
                        { this.get_white_board_content_el() }
                        {this._get_main_el()}
                    </Content>
                    
                    {this._get_drawer_component()}
                    <Footer>
                        {this._get_action_el()}
                        <RoomSetting {...this.state} toggle_room_setting_modal={this.toggle_room_setting_modal}/>
                    </Footer>
                    {/* 退出确认框 */}
                    { this.get_leaveConfirmModal() }
                    {/* 左侧选人下麦框 */}
                    {
                        role == 7 ?
                        <ToAudienceList {...this.state} ref={to_audience_list => this.to_audience_list = to_audience_list}/> :
                        <i></i>
                    }

                    {/* electorn 选择屏幕的插件 */}
                    {
                        emedia.isElectron ? 
                        <ChooseDesktopMedia  
                            ref={choose_desktop_media => this.choose_desktop_media = choose_desktop_media } />
                        : ''
                    }

                { shared_desktop ? 
                    <Alert 
                        className='shared-desktop-alert' 
                        message="您正在共享桌面" 
                        type="info"
                        showIcon
                    /> : ''}
                </Layout>
            </div>
        )
    }
}
const WrapRoom = Form.create()(Room)
export default WrapRoom


