echo TAG: $TRAVIS_TAG
# echo nexus_auth: ${nexus_auth}

packing(){
    # cd ./demo
    echo $PWD 

    # 如果有 build, 不再构建，直接发布
    if [ -d build ] 
    then 
        echo '\nhave build\n'

    else
        echo '\nnot have build\n'

        npm install
        echo -e "\nINSTALL DONE.\n"

        TRAVIS=true TAG_NAME=$TRAVIS_TAG npm run build
        echo -e "\nBUILD DONE.\n"
    fi

    sed -i "s/{#version}/${TRAVIS_TAG}/g"  ./build/index.html
    echo "replace version success: ${TRAVIS_TAG}"
}

upload(){
	# 为了不修改 ci，copy 一份
    echo -e "\nCOPY files...\n"
	cp -r ./build ./videocall-web
   
    echo -e "\nZIP files...\n"
	zip -r $TRAVIS_TAG.zip ./videocall-web
    
    echo -e "\nZIPED files...\n"

    UPLOAD_PARAMS="-v -F r=releases -F hasPom=false -F e=zip -F g=com.easemob.rtc.front.meeting -F a=meeting -F v="$TRAVIS_TAG" -F p=zip -F file=@"$TRAVIS_TAG".zip -u ci-deploy:Xyc-R5c-SdS-2Qr "
    UPLOAD_URL="https://hk.nexus.op.easemob.com/nexus/service/local/artifact/maven/content"
    echo -e "\nUPLOAD ZIP..."
    echo -e $UPLOAD_PARAMS"\n"$UPLOAD_URL"\n"
	curl $UPLOAD_PARAMS $UPLOAD_URL

}


if [ $TRAVIS_TAG ]; then
	echo -e "\n[is a tag] start packing\n"
	packing || exit 1
	upload
else
	echo -e "\n[not a tag] exit packing\n"
fi