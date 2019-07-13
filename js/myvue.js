function post(flag) {
    //获取当前要做的内容
    let url = app.url;
    let headers = app.headers;
    let bodys = app.bodys;
    let methods_p = app.http_method;
    //获取打开devtool的窗口id
    tabid = chrome.devtools.inspectedWindow.tabId;
    //向background发包
    chrome.runtime.sendMessage({
        send_message: {
            url: url,
            bodys_all: bodys,
            bodys_form: app.bodys_form,
            header_all: headers,
            methods_p: methods_p,
            tabid: tabid,
            contentType: app.contentType
        },
        http_listen_flag: app.switch1
    }, function (response) {
        console.log('收到来自后台的回复：' + response);
    });
}


app = new Vue({
    el: '#app',
    data: {
        tableColumns: [
            {
                title: 'Methods', //请求方法
                key: 'methods',
                width: 200,
                filters: [
                    {
                        label: 'GET',
                        value: 'GET'
                    },
                    {
                        label: 'POST',
                        value: 'POST'
                    }
                ],
                filterMethod(value, row) {
                    return row.methods.indexOf(value) > -1;
                }

            },
            {
                title: 'Url', //请求URL
                key: 'url'
            },
            {
                title: 'Type',
                key: 'type',
                width: 200,
                filters: [
                    {
                        label: 'js',
                        value: ['js', 'script']
                    },
                    {
                        label: 'html',
                        value: ['main_frame', 'document']
                    },
                    {
                        label: 'img',
                        value: ['img', 'image']
                    },
                    {
                        label: 'font',
                        value: ['font']
                    },
                    {
                        label: 'css',
                        value: ['stylesheet']
                    },
                    {
                        label: 'xhr',
                        value: ['xmlhttprequest', 'xhr']
                    },
                    {
                        label: 'other',
                        value: ['other']
                    }
                ],
                filterMethod(value, row) {
                    return value.indexOf(row.type) > -1;
                }
            },
            {
                title: 'Action',
                key: 'action',
                width: 250,
                align: 'center',
                render: (h, params) => {
                    return h('div', [
                        h('Button', {
                            props: {
                                type: 'primary',
                                size: 'small'
                            },
                            style: {
                                marginRight: '5px'
                            },
                            on: {
                                click: () => {
                                    app.show(params.index) //展示当前详细信息
                                }
                            }
                        }, 'Edit'),
                        h('Button', {
                            props: {
                                type: 'error',
                                size: 'small'
                            },
                            on: {
                                click: () => {
                                    app.remove(params.index) //删除此行
                                }
                            }
                        }, 'Delete')
                    ]);
                }
            }
        ],
        data1: [
            {
                //示例数据
                methods: 'GET',
                url: 'https://blog.o1hy.com',
                headers: '',
                parameters: '',
                type: 'main_frame',
                content: ' '
            }
        ],
        modalDetails: false, //模态框
        value: '',
        url: 'blog.o1hy.com',
        headers: [],
        bodys: [], //存放json或者other类型body
        bodys_form:[], ////存放form类型body
        methodList: [
            {
                value: 'POST',
                label: 'POST'
            },
            {
                value: 'GET',
                label: 'GET'
            }
        ],
        http_method: 'GET',
        listenFlag: false,
        contentType: 'form'
    },
    methods: {
        show: function (index) {
            //展示当前行详细内容
            headers = this.data1[index].headers;
            app.modalDetails = true;
            if (headers && headers !== "") {
                app.headers = headers;
            } else {
                app.headers = [];
            }
            app.http_method = this.data1[index].methods;
            app.url = this.data1[index].url;
            if (this.data1[index].parameters && this.data1[index].parameters !== "") {
                app.bodys_form = [];
                app.bodys = this.data1[index].parameters;
                try{
                    this.data1[index].parameters.split('&').forEach(function (p) {
                        ps = p.split('=');
                        app.bodys_form.push({name:ps[0],value:ps[1]});
                    })
                }catch (e) {
                    console.log(e)
                }
            } else {
                app.bodys = [];
                app.bodys_form = [];
            }
        },
        addHeaders: function () {
            //添加新的头部
            app.headers.push({name: '', value: ''})
        },
        addbody: function () {
            //添加新表单数据
            app.bodys_form.push({name: '', value: ''})
        },
        cancel: function () {
        },
        ok: function () {
            post();
        },
        changeListenFlag: function (status) {
            if (status) {
                startListenCurrentTab()
            } else {
                stopListenCurrentTab()
            }
        },
        clearData: function () {
            app.data1 = []
        },
        remove(index) {
            this.data1.splice(index, 1);
        }
    }
});


function currentTabListentCallback(request) {
    //current tab监听模块
    let tmp = request.request;

        let tmp_body = '';
        if (tmp.postData) {
            //获取post的body
            //修正了body的展示方法
            tmp_body = tmp.postData.text;
        }
        // console.log(tmp_body);
        // 将内容添加到表格种
        if(!tmp.url.startsWith('data:image') && !tmp.url.startsWith('data:application')){
            app.data1.push({
                methods: tmp.method,
                type: request._resourceType,
                url: tmp.url,
                headers: tmp.headers,
                parameters: tmp_body
            })
        }

}

function stopListenCurrentTab() {
    //停止current tab的监听
    chrome.devtools.network.onRequestFinished.removeListener(currentTabListentCallback)
}

function startListenCurrentTab() {
    //开始current tab的监听
    chrome.devtools.network.onRequestFinished.addListener(currentTabListentCallback)
}

//用来防止添加重复的request，针对all tab监听
reuqest_ids = [];

chrome.runtime.onMessage.addListener(function (message, sender, callback) {
    //监听background的消息
    let tmp = message.greeting;
    let tmp_body = [];
    let form_data_array;
    try {
        //获取post请求的body内容
        if (tmp.requestBody) {
            if (tmp.requestBody.formData) {
                form_data_array = tmp.requestBody.formData;
                for (let name in form_data_array) {
                    tmp_body.push({name: name, value: form_data_array[name][0]})
                }
            }
        }
        //如果没有出现过该request
        if (reuqest_ids.indexOf(tmp.id) === -1) {
            reuqest_ids.push(tmp.id);
            //向表格添加信息
            app.data1.push(
                {
                    methods: tmp.method,
                    type: tmp.type,
                    url: tmp.url,
                    headers: tmp.headers,
                    parameters: tmp_body
                }
            );
        }
    } catch (e) {
        console.log(e)
    }
});
