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
    Switch
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
        checked_talkers: []//checked talkers name(also username)
    }
    onChange = (checkedValues) => {
        this.setState({ checked_talkers: checkedValues})
    }
    confirm = () => {
        let confr = this.props.user_room;
        let { checked_talkers } = this.state
        emedia.mgr.grantRole(confr, checked_talkers, 1);
    }
    render() {
        let { stream_list, to_audience_list_show} = this.props;
        return (
            <Drawer 
                title='主播人数已满，请选人下麦'
                placement="left"
                closable={false}
                visible={to_audience_list_show}
                mask={false}
                getContainer={false}
                width="336px"
                className="to-audience-list"
            >
               <Checkbox.Group 
                    onChange={this.onChange}
               >

                    { stream_list.map(item => {
                        if(
                            item &&
                            item.member &&
                            !item.member.is_me
                        ) {
                            return (<Checkbox 
                                        value={item.member.name}
                                        key={item.member.name}
                                   >
                                        {item.member.nickName || item.member.name}
                                   </Checkbox>)
                        }
                    })}
               </Checkbox.Group>
               <div className='actions'>
                    <Button 
                        size='small' 
                        style={{background:'transparent',color:'#fff'}}
                        onClick={this.props.close_to_audience_list}
                    >返回</Button> 
                    <Button 
                        size='small'
                        onClick={this.confirm}
                    >确定</Button> 
               </div>
            </Drawer>
        )
    }
}

class MuteAction extends Component {
    state = {
        mute_all: false
    }
    mute_all_action = () => {
        // let { mute_all } = this.state;
        // if(mute_all){
        //     return
        // }

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
                <Button 
                    type={mute_all ? 'primary' : ''}
                    onClick={this.mute_all_action}>全体静音</Button>
                <Button
                    onClick={this.unmute_all_action}>解除全体静音</Button>
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
        this.render()
    },

    end() {
        if(!this.roleToken) {
            return
        }
        this.visible = false;
        emedia.mgr.destroyConference(this.roleToken);
        this.render()
    },

    render() {
        let dom = document.querySelector('#leave-confirm-modal');
        if(!dom) {
            dom = document.createElement('div');
            dom.setAttribute('id', 'leave-confirm-modal');
            document.querySelector('.meeting').appendChild(dom);
        }

        ReactDOM.render(
            <Modal 
                visible={this.visible}
                onCancel={() => this.hide()}
                footer={null}
                getContainer={false}
            >
                <p>如果您不想结束会议<br></br>请在离开会议前指定新的主持人</p>
                <div className="action-wrapper">

                    <Button type="primary" onClick={() => this.leave()}>离开会议</Button>
                    <Button type="primary" onClick={() => this.end()}>结束会议</Button>
                    <Button onClick={() => this.hide()}>取消</Button>
                </div>
            </Modal>, dom)
    }
}

// 获取头像组件
import axios from 'axios'

const HeadImages = {
    url_list:{},

    async get_url_json () {
        const result = await axios.get('https://download-sdk.oss-cn-beijing.aliyuncs.com/downloads/RtcDemo/headImage/headImage.conf')
        this.url_list = result; 
    },
    async get() {
        if(
            !this.url_list ||
            Object.keys(this.url_list).length == 0
        ) {
            await this.get_url_json();

            return this.url_list
        }

        return this.url_list
    }
} 
// 设置 昵称、音视频开关、头像 modal
class Setting extends Component {

    state = {
        visible: false,
        headimg_url: ''
    }

    show = () => {
        this.setState({ visible: true })
    }
    handleCancel = () => {
        this.setState({ visible: false })
    }
    handleSubmit = () => {
        let _this = this;
        this.props.form.validateFields((err, values) => {
            // 回调上去
            _this.props._get_setting_values(values)
            _this.setState({ visible: false })
            window.sessionStorage.setItem('easemob-nickName', values.nickName); //保存 nickName
        })
    }

    // 更换头像
    get_headimg_url = async () => {
        let headimg_url = await HeadImages.get();

        console.log(headimg_url);
        
    }
    render() {
        let { visible, headimg_url } = this.state;

        const { getFieldDecorator } = this.props.form;
        const formItemLayout = {
            labelCol: { span: 6 },
            wrapperCol: { span: 14 },
        };

        let { audio, video, nickName } = this.props;
        return (
            <Modal 
                title="个人设置"
                visible={visible}
                onOk={this.handleSubmit}
                onCancel={this.handleCancel}
                okText="确认"
                cancelText="取消"
                getContainer={false}
                className="setting-modal"
            >
                <Form {...formItemLayout} onSubmit={this.handleSubmit}>
                    <Form.Item label="头像">
                        <Avatar src={headimg_url} onClick={this.get_headimg_url}/>
                    </Form.Item>


                    <Form.Item label="昵称">
                        {getFieldDecorator('nickName', { initialValue: nickName })(<Input placeholder="请输入昵称" />)}
                    </Form.Item>

                    <Form.Item label="摄像头">
                        {getFieldDecorator('video', { valuePropName: 'checked', initialValue: video })(<Switch />)}
                    </Form.Item>
                    <Form.Item label="麦克风">
                        {getFieldDecorator('audio', { valuePropName: 'checked', initialValue: audio })(<Switch />)}
                    </Form.Item>
                </Form>
            </Modal>
        )
    }
}
const SettingWrap = Form.create()(Setting)

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
            to_audience_list_show: true,
            audio:true,
            video:true,

            joined: false,
            loading: false,

            talker_is_full:false, //主播已满

            shared_desktop:false,

            set_nickname_modal_show: false
        };

        this.toggle_main = this.toggle_main.bind(this);
    }

    // join fun start
    async join() {

        this.setState({ loading:true, talker_is_full:false })
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
            config:{ 
                nickName,
                maxTalkerCount: 5
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
    
            // this.startTime()
            
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

        this._get_nickname_from_session()
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
            message.warn(reason_text, 2, () => window.location.reload())
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
                    item.val.indexOf('"action":"mute"') > -1 
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
                    item.val.indexOf('"action":"unmute"') > -1 
                ) {
                    let val = JSON.parse(item.val);
                    if(val.uids){
                        if(val.uids.indexOf(my_username) > -1) {
                            _this.open_audio()
                        }
                    }  
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
            if(
                user_room.role == 3 &&
                role == 7
            ) {
                let { joinId } = _this.state.user_room;
                user_room.role = role;
                _this.setState({ user_room }, _this.admin_changed(joinId));//变为管理员，修改显示
            }
        };

        emedia.mgr.onAdminChanged = function(admin) {
            let { memberId } = admin;
            if(!memberId){
                return
            }
            _this.admin_changed(memberId)
        }
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
    _set_nickname = nickName => {

        this.setState({ nickName })
    }
    leave() {

        let { role, confrId } = this.state.user_room;

        if(role == 7) {
            LeaveConfirmModal.show(confrId);
        } else {
            let is_confirm = window.confirm('确定退出会议吗？');
    
            if(is_confirm){
                emedia.mgr.exitConference();
            }
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
                                _this.setState({to_audience_list_show: true})
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

    close_audio = async () => {

        
        let { role } = this.state.user_room;
        let { own_stream } = this.state;
        if(role == 1){
            return
        }
        
        console.log('close audio inner own_stream', own_stream);
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
            let stream_id = key.split('list-video-')[1];// 截取id list-video-***(stream_id)
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
                admin = item.member.nickName || item.member.name.slice(-5);
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
                {/* 不是管理员并且不是管理员自己 不加载 */}
                { (my_role == 7 && !is_me) ? <ManageTalker { ...{stream, member, my_username, confr} } /> : '' } 
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
    close_to_audience_list = () => {
        this.setState({ to_audience_list_show: false })
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
        let main_stream = this.state.stream_list[0];
        let { role } = this.state.user_room;

        let { audio, video, nickName } = this.state;
        return (
            <div style={{width:'100%', height:'100%'}}>
                {/* join compoent */}
                <div className="login-wrap" style={{display: joined ? 'none' : 'flex'}}>
                    <div className="header">
                        <img src={get_img_url_by_name('logo-text-login')} />
                    </div>
                    <Form className="login-form">
                        <Button 
                            type="primary" 
                            className="setting-handle" 
                            onClick={() => this.setting_modal.show()}> 
                            设置
                        </Button>
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
                    <SettingWrap 
                        { ...{audio, video, nickName} }
                        _get_setting_values={this._get_setting_values} 
                        wrappedComponentRef={setting_modal => this.setting_modal = setting_modal} />

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
                        {/* {main_stream ? this._get_video_item(main_stream) : ''} */}
                        {main_stream ? <video ref={`list-video-${main_stream.stream.id}`} autoPlay></video> : ''}
                    </Content>
                    {this._get_drawer_component()}
                    <Footer>
                        {this._get_footer_el()}
                    </Footer>
                    {
                        role == 7 ?
                        <ToAudienceList {...this.state} close_to_audience_list={this.close_to_audience_list}/> :
                        <i></i>
                    }
                </Layout>
            </div>
        )
    }
}
const WrapRoom = Form.create()(Room)
export default WrapRoom