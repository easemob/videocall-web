import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'


import { 
    Layout,
    Button,
    Icon
} from 'antd';
import './room.less';

import {connect} from 'react-redux';
// import {login,create} from '../../redux/actions';

import emedia from 'easemob-emedia';

const { Header, Footer, Sider, Content } = Layout;


class AnchorList extends Component {

    componentDidMount() {
        this.fill_stream_to_video()
    }

    fill_stream_to_video() {

        this.props.anchor_list.map(item => {
            let { id } = item.stream;
            let el = this.refs[`list-video-${id}`];
            console.log('componentDidMount el', el);
            
            if(el) {
                emedia.mgr.streamBindVideo(item.stream, el)
            }
        })
    }
    componentDidUpdate() {
        this.fill_stream_to_video()
    }
    render() {

        console.log('Anlist render');
        
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
                        return (
                            <div key={id} className="item">
                                {/* {action_buttons} */}
                                <video ref={`list-video-${id}`}></video>
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
            anchor_list: []
        };
    }

    init_emedia_callback() {
        emedia.config({
            restPrefix: "https://rtc-turn4-hsb.easemob.com"
        });

        let _this = this;
        emedia.mgr.onStreamAdded = function (member, stream) {
            console.log('onStreamAdded >>>', member, stream);

            let anchor_list = [];

            anchor_list.push({stream});

            _this.setState({ anchor_list })
            if(stream.located()){
                let videoTag = _this.refs['main-video'];
                emedia.mgr.streamBindVideo(stream, videoTag)
            }
        };

    }
    componentDidMount() {

        this.init_emedia_callback();
        this.join();
        
        window.onbeforeunload=function(e){     
            var e = window.event||e;  
            emedia.mgr.exitConference();
        } 
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
            this.publish()
        } catch (error) {
            console.error('join_error', error)
        }
    }

    async publish() {

        try {
            const stream = emedia.mgr.publish({ audio: true, video: true });
            console.log('publish stream', stream);
            
        } catch (error) {
            console.log('publis error',error);
            
        }
    }

    render() {


        let action_buttons = (
            <div className="talker-action action">
                <Button type="primary" size="small">摄像头</Button>
                <Button type="primary" size="small">麦克风</Button>
                <Button type="primary" size="small">下麦</Button>
            </div>
        );
        return (
            <Layout className="meeting">
                <Header>
                    <span className="logo">logo</span>
                    <div className="info">
                        <span>network</span>
                        <span>name</span>
                        <span>admin</span>
                        <Button type="primary">离开</Button>
                    </div>
                </Header>
                <Layout>
                    <Content>
                        {action_buttons}
                        <video className="main" ref="main-video"></video>
                    </Content>
                    <AnchorList anchor_list={this.state.anchor_list}/>
                </Layout>
            </Layout>
        )
    }
}

export default connect(
    state => ({user:state.user,room: state.room}),
    // {login, create }
)(Room);