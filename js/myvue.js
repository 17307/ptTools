function post(flag) {
    //用于发包的方法
    console.log('post');
    //获取当前要做的内容
    let url = app.url;
    let headers = app.headers;
    let headers_new = app.headers_new;
    let bodys = app.bodys;
    let bodys_new = app.bodys_new;
    let header_all = headers.concat(headers_new);
    let bodys_all = bodys.concat(bodys_new);
    let methods_p = app.http_method;
    //获取打开devtool的窗口id
    tabid = chrome.devtools.inspectedWindow.tabId;
    //向background发包
    chrome.runtime.sendMessage({
        send_message: {
            url: url,
            bodys_all: bodys_all,
            header_all: header_all,
            methods_p: methods_p,
            tabid: tabid
        },
        http_listen_flag: app.switch1
    }, function (response) {
        console.log('收到来自后台的回复：' + response);
    });
}


app = new Vue({
    el: '#app',
    data: {
        columns1: [
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
                width: 200,
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
                        }, 'View'),
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
                type: 'main_frame'
            }
        ],
        modal1: false, //模态框
        value: '',
        url: 'blog.o1hy.com',
        headers: [],
        headers_new: [],
        bodys: [],
        bodys_new: [],
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
        switch1: false,
        switch2: false
    },
    methods: {
        show: function (index) {
            //展示当前行详细内容
            headers = this.data1[index].headers;
            app.modal1 = true;
            if (headers && headers !== "") {
                app.headers = headers;
            } else {
                app.headers = [];
            }
            app.http_method = this.data1[index].methods;
            app.url = this.data1[index].url;
            if (this.data1[index].parameters && this.data1[index].parameters !== "") {
                app.bodys = this.data1[index].parameters;
            } else {
                app.bodys = [];
            }
        },
        add1: function () {
            //添加新的头部
            app.headers.push({name: '', value: ''})
        },
        addbody: function () {
            //添加新表单数据
            app.bodys.push({name: '', value: ''})
        },
        cancel: function () {
            app.headers_new = [];
            app.bodys_new = [];
        },
        ok: function () {
            post();
        },
        change: function (status) {
            //监控tab
            if (status) {
                app.switch2 = false;
                stopListenCurrentTab();
            }
            chrome.runtime.sendMessage({http_listen_flag: status})
        },
        change2: function (status) {
            if (status) {
                app.switch1 = false;
                chrome.runtime.sendMessage({http_listen_flag: app.switch1});
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
    let tmp_body = [];
    if (tmp.postData) {
        //获取post的body
        let tmp_body_1 = tmp.postData.text;
        let temp_body_list = tmp_body_1.split('&');
        temp_body_list.forEach(function (t) {
            n_v = t.split('=');
            tmp_body.push({name: n_v[0], value: n_v[1]})
        })
    } else {
        tmp_body = ''
    }
    // console.log(tmp_body);
    // 将内容添加到表格种
    console.log(tmp.url);
    if(!tmp.url.startsWith('data:image')){
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
