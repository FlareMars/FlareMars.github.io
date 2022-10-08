# OpenApi Sample

虚实加工引擎接入虎牙OpenApi的示例工程

## 使用说明
1、安装bk的lua脚本插件BeautykitScriptingTools，使用说明文档可参考：https://lexiangla.com/docs/848712a028e911ec8485fae8b27670ec?company_from=324ca3f66f9111e983a75254002f1020

2、参考game.lua 获取网络管理对象NetworkManager(位于network_mgr.lua)，进行初始化，输入信息包括房间号、小程序开发者id和密钥和域名。示例中已包含虎牙测试环境和正式环境的接入方式

```
    --虎牙测试环境
    local roomId = 10006454                                     --主播房间号
    local appId = "yb738ed17d0a177a"                            --小程序开发者ID
    local secret = "06ea1ef748d636a6231a577b0be0bf99"           --小程序开发者密钥
    local domain = "ws://10.66.97.50:16336/index.html?do=comm&" --域名

    -- --虎牙正式环境
    -- local roomId = 15499846
    -- local appId = "f597f64cd0d052de"
    -- local secret = "f566612ad92b65b16bbb4ae2d86d0a3d"
    -- local domain = "ws://ws-apiext.huya.com/index.html?do=comm&"

    _network:initialize(roomId, appId, secret, domain)
```

3、查看控制台DEBUG CONSOLE，如果没有错误监听的回调，则连接成功。可以尝试在直播间里发送弹幕或者送礼，如果控制器有相应的输出，则说明有消息回调，接入成功。如需其他内容，请查看OpenApi的接口说明。

<img src="md_img/sample.png" width="50%" height="50%">
