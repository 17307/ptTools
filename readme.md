## 工具介绍
一款用于chrome下的HTTP包重放工具
HTTP请求记录又2种模式，一种为记录全部标签页的请求，另一种为记录当前`devtool`所在标签页的请求。

## 使用流程

- F12打开后，选到pttools标签。
- 选择监听方式。
- 选择view即可修改HTTP请求。对于POST的HTTP请求，可以添加body的参数。

## 注意事项

- 在进行POST的时候，将以`application/x-www-form-urlencoded`的类型添加参数。
- 如无特殊需求，请自行删除`content-length`的内容。

## TO-DO

- 添加更多的POST的请求type。[优先]
- 完善未知bug。[优先]
- 修改HTTP请求后，无法保留原始请求。(对vue不熟悉,还没有找到解决办法)
- 此插件将保持更新与完善。
- current tab增加response预览功能。

## 简单介绍

![](https://ws1.sinaimg.cn/large/007BTj79gy1g3xk7up846j30v90ik75q.jpg)

大体的流程如上。

