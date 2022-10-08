HY_GET_MESSAGE_NOTICE = "getMessageNotice" -- 弹幕通知数据
HY_GET_SENDITEM_NOTICE = "getSendItemNotice" -- 送礼通知数据
HY_GET_VIPENTERBANNER_NOTICE = "getVipEnterBannerNotice" -- 高级用户进场通知数据
HY_GET_ONTVAWARD_NOTICE = "getOnTVAwardNotice" -- 上电视弹幕中奖
HY_GET_OPENNOBLE_NOTICE = "getOpenNobleNotice" -- 开通续费贵族
HY_GET_OPENGUARDIAN_NOTICE = "getOpenGuardianNotice" -- 开通续费守护
HY_GET_USERMUTED_NOTICE = "getUserMutedNotice" -- 房管禁言事件
HY_GET_COMMAND_NOTICE = "command" -- 发送command的回包数据

NetworkManager = class()

--发送监听
function NetworkManager:webSocketOpenCallback(socket)
    print("webSocketOpenCallback!")
    self.__socketReadied = true
    self.__socket:send('{"command":"subscribeNotice","data":["getRoomGiftInfoList","getExitRoomNotice","getShareLiveNotice","getSendItemNotice","getMessageNotice","getVipEnterBannerNotice","getSendItemNotice","getOnTVAwardNotice", "getOpenNobleNotice", "getOpenGuardianNotice", "getUserMutedNotice"],"reqId":"123456789"}')
end

--关闭监听
function NetworkManager:webSocketCloseCallback(socket)
    print("webSocketCloseCallback!")
    self.__socketReadied = false
end

--消息监听
function NetworkManager:webSocketMessageCallback(socket, data, length, issued, isBinary)
    local json = rapidjson.decode(data)

    if json.statusCode == nil or json.statusCode ~= 200 then
        print("ERROR: messageData decode error with code: ", data)
        return
    end

    -- 获取观众的昵称
    local userId = json.data.sendNick or json.data.senderNick
    if userId then

        if json.notice == HY_GET_MESSAGE_NOTICE then          --获取弹幕内容
            local content = json.data.content
            print("用户昵称:"..userId..", 弹幕:"..content)
        elseif json.notice == HY_GET_SENDITEM_NOTICE then           --获取礼物内容
            local totalPay = json.data.totalPay --总价值
            local itemId = json.data.itemId --礼物ID
            local sendItemCount = json.data.sendItemCount --礼物数量
            print("用户昵称:"..userId..", 礼物:".."payType:"..", totalPay"..totalPay..", itemId:"..itemId..", sendItemCount:"..sendItemCount)
        end
    end

end

--错误监听
function NetworkManager:webSocketErrorCallback(socket, errorCode)
    print("webSocketErrorCallback!")
    if errorCode == WebSocketErrorCode.WEBSOCKETERRORCODE_TIME_OUT then
        print("ERROR: WEBSOCKETERRORCODE_TIME_OUT")
    elseif errorCode == WebSocketErrorCode.WEBSOCKETERRORCODE_CONNECTION_FAILURE then
        print("ERROR: WEBSOCKETERRORCODE_CONNECTION_FAILURE")
    elseif errorCode == WebSocketErrorCode.WEBSOCKETERRORCODE_UNKNOWN then
        print("ERROR: WEBSOCKETERRORCODE_UNKNOWN")
    else
        print("ERROR: WEBSOCKETERRORCODE_RET_UNKNOWN")
    end
end

--初始化
-- roomId 主播房间号
-- appId 小程序开发者ID
-- appSecret 小程序开发者密钥
-- domain 域名地址，支持Websocket和HTTPS两种
function NetworkManager:initialize(roomId, appId, appSecret, domain)
    self:closeConnection()

    local profileId = ""
    local extId = ""

    -- 主播房间号
    local url = domain .. "roomId=" .. roomId .. "&"
    -- 开发者账号id
    url = url .. "appId=" .. appId .. "&"
    -- 时间戳相关
    local currentTimestamp = os.time()
    local iat = currentTimestamp
    local exp = currentTimestamp + 10 * 60 -- 10分钟过期
    url = url .. "iat=" .. tostring(iat) .. "&"
    url = url .. "exp=" .. tostring(exp) .. "&"
    -- 生成鉴权sToken
    url = url .. "sToken=" .. HyAPI.getToken(appId, appSecret, extId, profileId ,iat, exp)
    
    print("Request Url = ", url)

    self.__socket = WebSocket.create(url, "text", "cacert.pem")
    addChild(self.__socket)

    self.__socketReadied = false

    --设置监听
    self.__socket:setOnOpenCallback(function(...) self:webSocketOpenCallback(...) end)
    self.__socket:setOnCloseCallback(function(...) self:webSocketCloseCallback(...) end)
    self.__socket:setOnMessageCallback(function(...) self:webSocketMessageCallback(...) end)
    self.__socket:setOnErrorCallback(function(...) self:webSocketErrorCallback(...) end)

    --openapi教程要求，定时器以文本数据发送ping，保持与服务器的心跳
    local heartBeatTimer = Timer.new()
    addChild(heartBeatTimer)

    heartBeatTimer:schedule(15000, function()
        if self.__socketReadied then self.__socket:send("ping") end
    end)
    heartBeatTimer:start()
end

function NetworkManager:initializeWithRawUrl(url)
    self:closeConnection()

    self.__socket = WebSocket.create(url, "text", "cacert.pem")
    addChild(self.__socket)

    self.__socketReadied = false

    --设置监听
    self.__socket:setOnOpenCallback(function(...) self:webSocketOpenCallback(...) end)
    self.__socket:setOnCloseCallback(function(...) self:webSocketCloseCallback(...) end)
    self.__socket:setOnMessageCallback(function(...) self:webSocketMessageCallback(...) end)
    self.__socket:setOnErrorCallback(function(...) self:webSocketErrorCallback(...) end)

    --openapi教程要求，定时器以文本数据发送ping，保持与服务器的心跳
    local heartBeatTimer = Timer.new()
    addChild(heartBeatTimer)

    heartBeatTimer:schedule(15000, function()
        if self.__socketReadied then self.__socket:send("ping") end
    end)
    heartBeatTimer:start()
end

function NetworkManager:closeConnection()
    if self.__socket then
        self.__socket:close()
        self.__socket:destroy()
    end
    if self.__socketReadied then
        self.__socketReadied = false
    end
end

function NetworkManager:finalize()
    if self.__socketReadied  and self.__socket then
        self.__socket:close()
    end
end
