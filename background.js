const filter = {urls: ["<all_urls>"]};


//用于重新构造发包的请求头
function rewriteHeaders(details) {
    // console.log("==============================");
    //只判断域名，忽略https与http。防止来回跳转。
    //if判断 当前访问的与要修改的url是否相同，防止修改了其他的url。
    //清空原来头部信息
    details.requestHeaders = [];
    //添加用户的头部信息
    headers_all.forEach(function (header) {
        //防止HTTP/2的头部影响
        if (header.name !== "" && !header.name.startsWith(":")) {
            details.requestHeaders.push({'name': header.name, 'value': header.value})
        }
    });
    //为post表单添加Content-Type
    if (details.method === "POST") {
        details.requestHeaders.push(current_content_type)
    }
    // console.log(details);
    // console.log(details);
    return {requestHeaders: details.requestHeaders};

}

// 用于存储提交类型
current_content_type = {};
var headers_all;

chrome.runtime.onMessage.addListener(function (message, sender, callback) {

    if (sender.url !== chrome.runtime.getURL("/html/pt_dev.html")) {
        return;
    }

    if (message.send_message) {
        //下面的变量是用户要修改的内容
        let url = message.send_message.url;
        headers_all = message.send_message.header_all;
        let tabid = message.send_message.tabid;
        let methods_p = message.send_message.methods_p;
        if (methods_p === 'GET') {
            chrome.tabs.update(tabid, {url: url});
        } else {
            // console.log(message);
            if (message.send_message.contentType === "form") {
                current_content_type = {'name': 'Content-Type', 'value': 'application/x-www-form-urlencoded'};

                bodys_all = message.send_message.bodys_form;
                const post_data = JSON.stringify(bodys_all);
                //传递赋值
                chrome.tabs.executeScript(tabid, {code: 'let post_data = "' + encodeURIComponent(post_data) + '"; let url = "' + encodeURIComponent(url) + '"'}, function () {
                    //调用post_data.js注入表单
                    chrome.tabs.executeScript(tabid, {file: '/js/post_data.js'});
                });
            } else if (message.send_message.contentType === "json") {
                current_content_type = {'name': 'Content-Type', 'value': 'application/json'};
                //获取要访问的URL
                let dist_url = message.send_message.url;
                dist_url = dist_url.split(':')[1];
                chrome.tabs.executeScript(tabid, {code: 'var headers_all1 ="' + encodeURIComponent(JSON.stringify(message.send_message.header_all)) + '";post_data = "' + encodeURIComponent(JSON.stringify(message.send_message.bodys_all)) + '";url = "' + encodeURIComponent(dist_url) + '"'}, function () {
                    //调用post_data.js注入表单
                    chrome.tabs.executeScript(tabid, {file: '/js/post_data_json.js'});
                });
            }
            else if (message.send_message.contentType === "other") {
            }
        }
        //统一监听，进行头部修改
        chrome.webRequest.onBeforeSendHeaders.addListener(
            rewriteHeaders,
            {urls: ["<all_urls>"], tabId: tabid, types: ['main_frame']},
            ["blocking", "requestHeaders", "extraHeaders"],//修改cookie要添加extraHeaders,
        );

    }


});

