AAA = {}

function AAA.testCallback()
    print("AAA.testCallback")
end

---脚本被加载时调用
---@param width number {comment = '画布宽度'}
---@param height number {comment = '画布高度'}
---@param viewportX number {comment = '可视窗口横坐标'}
---@param viewportY number {comment = '可视窗口纵坐标'}
---@param viewportWidth number {comment = '可视窗口宽度'}
---@param viewportHeight number {comment = '可视窗口高度'}
---@param initialParams table {comment = '初始化参数table 业务端通过加载素材包之前setScriptInitialXXParam进行设置'}
function initialize(width, height, viewportX, viewportY, viewportWidth, viewportHeight, initialParams)    
    _gSpriteFrameCache = SpriteFrameCache.create()
    _gSpriteFrameCache:setTextureCache(gContextWrapper:getTextureCache())
    local tex = _gSpriteFrameCache:addSpriteFramesWithJsonFile(gResourceRootPath.."/res/atlas_config.json", false)

    local spriteBatchNode = SpriteBatchNode.createWithTexture(tex, 200)
    addChild(spriteBatchNode)

    for i = 1, 1000 do
        local spriteIndex = math.random(1, 9)
        local sprite = Sprite.createWithSpriteFrame(_gSpriteFrameCache:getSpriteFrameByName("ep_"..spriteIndex..".png"))
        sprite:setPosition(Vector2.new(math.random(0, width), math.random(0, height)))
        spriteBatchNode:addChild(sprite)
    end

    local layer = LayerColor.create(Color4B.new(0, 200, 200, 255))
    layer:setContentSize(Size.new(50, 50))
    layer:setPosition(Vector2.new(width / 2, 25))
    layer:setAnchorPoint(Vector2.new(0.5, 0.5))
    addChild(layer)

    local move = MoveBy.create(2000, Vector2.new(0.0, height - 25))
    local move_ease_in = EaseBounceIn.create(move)
    local move_ease_in_back = move_ease_in:reverse()
    local delay = DelayTime.create(250)
    local seq1 = Sequence.create({move_ease_in, delay, move_ease_in_back, delay:clone()})
    layer:runAction(RepeatForever.create(seq1))

    local label = Label.createWithTTF("hello，世界!", gResourceRootPath.."/res/default.ttf", 50, Size.zero(), TextHAlignment.TEXTHALIGNMENT_CENTER, TextVAlignment.TEXTVALIGNMENT_CENTER)
    label:setPosition(Vector2.new(width / 2, height / 2))
    label:enableOutline(Color4B.new(255, 0, 0, 255), 10)
    -- label:enableGlow(Color4B.new(255, 0, 0, 255))
    addChild(label)

    -- local imageView = ImageView.createWithFile(gResourceRootPath.."/res/gift_icon_panel_20209.png")
    -- imageView:setPosition(Vector2.new(width / 2, height / 2))
    -- imageView:setContentSize(Size.new(1000, 1000))
    -- imageView:ignoreContentAdaptWithSize(false)
    -- addChild(imageView)

    -- local layout = UILayout.create()
    -- layout:setContentSize(Size.new(300, 300))
    -- layout:setClippingType(ClippingType.CLIPPINGTYPE_STENCIL)
    -- layout:setClippingEnabled(true)
    -- layout:setPosition(Vector2.new(300, 300))
    -- local stencilDrawNode = layout:customlizeStencilDrawNode()
    -- stencilDrawNode:drawSolidRoundedRect(Vector2.new(0.0, 0.0), Vector2.new(300.0, 300.0), 50, 1000, Color4F.new(1.0, 1.0, 1.0, 1.0))
    -- addChild(layout)

    -- local widget = Widget.create()
    -- widget:setContentSize(Size.new(1000, 1000))
    -- layout:addChild(widget)

    -- local scale9Sprite = Scale9Sprite.create(gResourceRootPath.."/res/textbg.9.png")
    -- scale9Sprite:setContentSize(Size.new(300, 300))
    -- scale9Sprite:setPosition(Vector2.new(width / 2, height / 2))
    -- addChild(scale9Sprite)
    gContextWrapper:notifyEvent("lua_load_success", 0)

    postCallableWithDelay(AAA.testCallback, 2000)
end

---脚本主循环 每渲染一帧均会被调用
---@param elapsedTime number {comment = '距离初始化后经过的时间 毫秒为单位'}
---@param timeSinceLastFrame number {comment = '距离上一帧经过的时间 毫秒为单位'}
---@param detectionInfo DetectionInfo {comment = 'AI识别数据'}
function update(elapsedTime, timeSinceLastFrame, detectionInfo)
    -- player:setFrameTime(30)
    -- sprite:setContentSize(Size.new(2000, 2000))
end

function onSizeChanged(newWidth, newHeight, oldWidth, oldHeight)
    print("onSizeChanged "..newWidth.." "..newHeight.." "..oldWidth.." "..oldHeight)
    return false
end

---触摸开始事件
---@param x number {comment = '基于画布坐标系的横坐标'}
---@param y number {comment = '基于画布坐标系的纵坐标'}
---@param pointer number {comment = '手指序号（通过序号可以处理多点触控效果）'}
function onTouchBegin(x, y, pointer)
end

---触摸移动事件
---@param x number {comment = '基于画布坐标系的横坐标'}
---@param y number {comment = '基于画布坐标系的纵坐标'}
---@param pointer number {comment = '手指序号（通过序号可以处理多点触控效果）'}
function onTouchMove(x, y, pointer)
end

---触摸结束事件
---@param x number {comment = '基于画布坐标系的横坐标'}
---@param y number {comment = '基于画布坐标系的纵坐标'}
---@param pointer number {comment = '手指序号（通过序号可以处理多点触控效果）'}
function onTouchEnd(x, y, pointer)
end

---外部命令回调
---@param content string {comment = '基于业务代表不同的含义'}
function onCommand(content)

end

---当前脚本析构时回调（特效被移除，特效切换等）
function finalize()
end