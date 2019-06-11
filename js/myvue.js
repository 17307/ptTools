function post(flag) {
    //用于发包的方法
    console.log('post');
    let url = app.url;
    let headers = app.headers;
    let headers_new = app.headers_new;
    let bodys = app.bodys;
    let bodys_new = app.bodys_new;
    let header_all = headers.concat(headers_new);
    let bodys_all = bodys.concat(bodys_new);
    let methods_p = app.http_method;
    tabid = chrome.devtools.inspectedWindow.tabId;
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
                title: 'Methods',
                key: 'methods',
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
                title: 'Url',
                key: 'url'
            },
            {
                title: 'Type',
                key: 'type',
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
                    console.log(value);
                    console.log(row);
                    return value.indexOf(row.type) > -1;
                }
            },
            {
                title: 'Action',
                key: 'action',
                width: 150,
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
                                    app.show(params.index)
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
                                    app.remove(params.index)
                                }
                            }
                        }, 'Delete')
                    ]);
                }
            }
        ],
        data1: [
            {
                methods: 'GET',
                url: 'https://blog.o1hy.com',
                headers: '',
                parameters: '',
                type: 'main_frame'
            }
        ],
        modal1: false,
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
            headers = this.data1[index].headers;
            // console.log(app.headers);
            app.modal1 = true;
            if (headers && headers !== "") {
                app.headers = headers;
            } else {
                app.headers = [];
            }
            app.http_method = this.data1[index].methods;
            app.url = this.data1[index].url;
            console.log(this.data1[index].parameters);
            if (this.data1[index].parameters && this.data1[index].parameters !== "") {
                app.bodys = this.data1[index].parameters;
            } else {
                app.bodys = [];
            }
        },
        add1: function () {
            app.headers.push({name: '', value: ''})
        },
        addbody: function () {
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
            // alert(status);
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
tmptmp = [];

function currentTabListentCallback(request) {
    tmptmp.push(request);
    let tmp = request.request;
    let tmp_body = [];
    console.log(tmp.postData);
    if (tmp.postData) {
        let tmp_body_1 = tmp.postData.text
        let temp_body_list = tmp_body_1.split('&');
        temp_body_list.forEach(function (t) {
            n_v = t.split('=');
            tmp_body.push({name: n_v[0], value: n_v[1]})
        })
    } else {
        tmp_body = ''
    }
    console.log(tmp_body);
    app.data1.push({
        methods: tmp.method,
        type: request._resourceType,
        url: tmp.url,
        headers: tmp.headers,
        parameters: tmp_body
    })
}

function stopListenCurrentTab() {
    chrome.devtools.network.onRequestFinished.removeListener(currentTabListentCallback)
}

function startListenCurrentTab() {
    chrome.devtools.network.onRequestFinished.addListener(currentTabListentCallback)
}

reuqest_ids = [];

chrome.runtime.onMessage.addListener(function (message, sender, callback) {
    // console.log(message);
    let tmp = message.greeting;
    let tmp_body = [];
    let form_data_array;
    try {
        if (tmp.requestBody) {
            if (tmp.requestBody.formData) {
                form_data_array = tmp.requestBody.formData;
                for (let name in form_data_array) {
                    tmp_body.push({name: name, value: form_data_array[name][0]})
                }
            }
        }
    } catch (e) {
        console.log(e)
    }
    if (reuqest_ids.indexOf(tmp.id) === -1) {
        reuqest_ids.push(tmp.id);
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
});
