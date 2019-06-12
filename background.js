let html_tmp = {};

var callback_beforeRequest = function (details) {
    html_tmp = {};
    if (details.requestBody) {
        if (details.requestBody.formData) {
            html_tmp['requestBody'] = details.requestBody;
        }
    }

    return {cancel: false} //为true是取消发送
};
// 监听哪些URL
const filter = {urls: ["<all_urls>"]};
// 额外的信息规范，可选的
/* 监听response headers接收事件*/
const extraInfoSpec = ["blocking", "requestBody"]; //表示阻止
//请求发送之前触发（请求的第1个事件，请求尚未创建，此时可以取消或者重定向请求）。
var callback_onBeforeSendHeaders = function (details) {


    // details.requestHeaders.push({name:"o1hy",value:"1"}) //可以修改头部
    return {requestHeaders: details.requestHeaders}  // 修改请求头后，进行返回内容

};
const extraInfoSpec2 = ["blocking", "requestHeaders", "extraHeaders"];
var callback_onsendheaders = function (details) {

    // console.log(details);
    html_tmp['id'] = details['requestId'];
    html_tmp['headers'] = details.requestHeaders;
    html_tmp['url'] = details.url;
    html_tmp['method'] = details.method;
    html_tmp['type'] = details.type;
    chrome.runtime.sendMessage({greeting: html_tmp}, function (response) {});
};
//onSendHeaders，请求头发送之前触发（请求的第3个事件，此时只能查看请求信息，可以确认onBeforeSendHeaders事件中都修改了哪些请求头）。
const extraInfoSpec3 = ["extraHeaders", "requestHeaders"];

var FLAG_LISTEN = false;

//用于重新构造发包的请求头
function rewriteHeaders(details) {
    // console.log('rewrite');
    // console.log(details);
    // console.log(url);

    //只判断域名，忽略https与http。防止来回跳转。
    //if判断 当前访问的与要修改的url是否相同，防止修改了其他的url。
    if (details.url.split('://')[1] === url.split('://')[1]) {
        details.requestHeaders = [];
        headers_all.forEach(function (header) {
            if(header.name!==""){
                details.requestHeaders.push({'name': header.name, 'value': header.value})
            }
        });
        if(details.method==="POST"){
            details.requestHeaders.push({'name':'Content-Type','value':'application/x-www-form-urlencoded'})
        }
        // details = [];
        return {requestHeaders: details.requestHeaders};
    }
}

chrome.runtime.onMessage.addListener(function (message, sender, callback) {
    // console.log(message);
    //收到myvue.js的post()函数
    // console.log(sender.url);
    if (sender.url !== chrome.runtime.getURL("/html/pt_dev.html")) {
        // chrome.webRequest.onBeforeSendHeaders.removeListener(rewriteHeaders);
        return;
    }

    if (message.send_message) {

        url = message.send_message.url;
        headers_all = message.send_message.header_all;
        bodys_all = message.send_message.bodys_all;
        methods_p = message.send_message.methods_p;
        tabid = message.send_message.tabid;
        //判断是get还是post
        if (methods_p === 'GET') {
            chrome.tabs.update(tabid, {url: url});
        } else {
            // console.log(bodys_all);
            const post_data = JSON.stringify(bodys_all);
            // console.log(post_data);
            // console.log(encodeURIComponent(post_data));
            chrome.tabs.executeScript(tabid, {code: 'let post_data = "' + encodeURIComponent(post_data) + '"; let url = "' + encodeURIComponent(url) + '"'}, function () {
                chrome.tabs.executeScript(tabid, {file: '/js/post_data.js'});
            });
        }
        chrome.webRequest.onBeforeSendHeaders.addListener(
            rewriteHeaders,
            {urls: ["<all_urls>"], tabId: tabid},
            ["blocking", "requestHeaders", "extraHeaders"] //修改cookie要添加extraHeaders
        );

    }

    // 设置监听
    FLAG_LISTEN = message.http_listen_flag;
    // console.log('FLAG:' + FLAG_LISTEN);

    if (FLAG_LISTEN) {
        chrome.webRequest.onBeforeRequest.addListener(callback_beforeRequest, filter, extraInfoSpec);
        chrome.webRequest.onBeforeSendHeaders.addListener(callback_onBeforeSendHeaders, filter, extraInfoSpec2);
        chrome.webRequest.onSendHeaders.addListener(callback_onsendheaders, filter, extraInfoSpec3);
    } else {
        chrome.webRequest.onBeforeRequest.removeListener(callback_beforeRequest);
        chrome.webRequest.onBeforeSendHeaders.removeListener(callback_onBeforeSendHeaders);
        chrome.webRequest.onSendHeaders.removeListener(callback_onsendheaders);
    }
});
