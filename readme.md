## 工具介绍
一款用于chrome下的HTTP包重放工具
HTTP请求记录又2种模式，一种为记录全部标签页的请求，另一种为记录当前`devtool`所在标签页的请求。


## 注意事项
- 在进行POST的时候，将默认以`application/x-www-form-urlencoded`的类型添加参数。
- 如无特殊需求，请自行删除`content-length`的内容。

## TO-DO
- 添加更多的POST的请求type。
- 完善未知bug。
- 修改HTTP请求后，无法保留原始请求。(对vue不熟悉,还没有找到解决办法)
- 此插件将保持更新与完善。