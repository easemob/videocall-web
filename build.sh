
# env=$

echo "env=$1"

# REACT_APP_RTC_HOST="https://a1.easemob.com"
# REACT_APP_IM_HOST="https://a1.easemob.com"
# REACT_APP_WHITE_BOARD_HOST="https://wbrtc.easemob.com"

# if [ $1 = "prod" ] 
# then
#     REACT_APP_RTC_HOST="https://a1.easemob.com"
#     REACT_APP_IM_HOST="https://a1.easemob.com"
#     REACT_APP_WHITE_BOARD_HOST="https://wbrtc.easemob.com"
# elif [ $1 = "test" ] 
# then
#     REACT_APP_RTC_HOST='https://a1-hsb.easemob.com'
#     REACT_APP_IM_HOST='https://a1-hsb.easemob.com'
#     REACT_APP_WHITE_BOARD_HOST='https://wbrtc-hsb.easemob.com'
# elif [ $1 = "turn4" ] 
# then
#     REACT_APP_RTC_HOST='https://rtc-turn4-hsb.easemob.com'
#     REACT_APP_IM_HOST='https://a1-hsb.easemob.com'
#     REACT_APP_WHITE_BOARD_HOST='https://wbrtc-hsb.easemob.com'
# fi



# process.env.REACT_APP_IM_HOST=$REACT_APP_IM_HOST
# process.env.REACT_APP_RTC_HOST=$REACT_APP_RTC_HOST
# process.env.REACT_APP_WHITE_BOARD_HOST=$REACT_APP_WHITE_BOARD_HOST


react-app-rewired build

build_name=''
if [ $1 = "prod" ] 
then
    build_name='video_call_demo_prod'

    mv build ${build_name}
    scp -r ${build_name} turn4:/data/suqx/sdk-demos
elif [ $1 = "test" ] 
then
    build_name='video_call_demo'

    mv build ${build_name}
    scp -r ${build_name} turn4:/data/suqx/sdk-demos
elif [ $1 = "turn4" ] 
then
    build_name='video_call_demo_turn4'
    mv build ${build_name}

    scp -r ${build_name} turn4:/data/suqx/sdk-demos
fi


echo 'upload complete'

rm -r ${build_name}

