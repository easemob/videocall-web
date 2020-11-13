
# env=$

echo "env=$1"

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

