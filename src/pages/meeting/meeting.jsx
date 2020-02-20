import React, {Component} from 'react'
import {Redirect} from 'react-router-dom'


import { 
    Layout,
    Button,
    Icon
} from 'antd';
import './meeting.less'
const { Header, Footer, Sider, Content } = Layout;

class Meeting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            role: 'ADMIN'
        };
    }
    render() {
        let anchor_list = [
            {name:'sqx-1',type:1},
            {name:'sqx-2',type:1},
            {name:'sqx-3',type:1},
            {name:'sqx-4',type:1},
            {name:'sqx-5',type:1},
            {name:'sqx-6',type:1},
            {name:'sqx-7',type:1},
        ];

        let action_buttons = (
            <div className="talker-action action">
                <Button type="primary" size="small">摄像头</Button>
                <Button type="primary" size="small">麦克风</Button>
                <Button type="primary" size="small">下麦</Button>
            </div>
        )
        // anchor_list = [];
        return (
            // <div>
            //     <div className="header">
            //         <span className="logo">Logo</span>
            //         <div className="info"></div>
            //     </div>

            //     <div></div>
            // </div>

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
                        <video></video>
                    </Content>
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
                                return (
                                    <div key={''} className="item">
                                        {action_buttons}
                                        <video></video>
                                        {icon_mic_status}
                                    </div>
                                )
                            }) }
                        </div>
                    </Sider>
                </Layout>
            </Layout>
        )
    }
}
// function Meeting() {
//     return <h1>Meeting</h1>
// }

export default Meeting;