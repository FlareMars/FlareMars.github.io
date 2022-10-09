require('blessingmotor')

---脚本被加载时调用
---@param width number {comment = '画布宽度'}
---@param height number {comment = '画布高度'}
---@param viewportX number {comment = '可视窗口横坐标'}
---@param viewportY number {comment = '可视窗口纵坐标'}
---@param viewportWidth number {comment = '可视窗口宽度'}
---@param viewportHeight number {comment = '可视窗口高度'}
---@param initialParams table {comment = '初始化参数table 业务端通过加载素材包之前setScriptInitialXXParam进行设置'}
function initialize(width, height, viewportX, viewportY, viewportWidth, viewportHeight, initialParams)
    math.randomseed(os.time())
    __gWidth = width
    __gHeight = height

    _photoSpriteFrames = {}
    for index = 1, 9 do
        local texture = Texture2D.createWithFile(gResourceRootPath.."/photos/photo"..tostring(math.floor(index))..".jpg", false)
        local spriteFrame = SpriteFrame.createWithTexture(texture)
        spriteFrame:retain()
        table.insert(_photoSpriteFrames, spriteFrame)
    end
    
    __gCanvas = Canvas.create(Size.new(width, height))
    addChild(__gCanvas)

    _currentTargetImageIndex = 2
    _currentTargetImageContainer = 2
    _photoImages = {}
    for index = 1, 2 do
        local photoImage = UIImage.createWithSpriteFrame(_photoSpriteFrames[index])
        photoImage:setUseCustomSize(true)
        photoImage:setContentSize(Size.new(width, height))
        photoImage:setRenderMode(UIImageRenderMode.UIIMAGE_RENDERMODE_PRESERVE_ASPECT_RATIO_AND_FILL)
        photoImage:setAnchorPoint(Vector2.new(0.0, 0.0))
        photoImage:setPosition(Vector2.new((index - 1) * width, 0.0))
        table.insert(_photoImages, photoImage)
        __gCanvas:addChild(photoImage)
    end

    __gMotorCount = 0
    __gMotorGeneratorCooldown = 0
end

---脚本主循环 每渲染一帧均会被调用
---@param elapsedTime number {comment = '距离初始化后经过的时间 毫秒为单位'}
---@param timeSinceLastFrame number {comment = '距离上一帧经过的时间 毫秒为单位'}
---@param detectionInfo DetectionInfo {comment = 'AI识别数据'}
function update(elapsedTime, timeSinceLastFrame, detectionInfo)
    for index = 1, 2 do
        local photoImage = _photoImages[index]
        local pos = photoImage:getPosition()
        local currentX = pos:x()
        if (currentX - 2.0 <= 0.0) and _currentTargetImageContainer == index then
            local nextTargetImageContainer = _currentTargetImageContainer == 1 and 2 or 1
            _photoImages[nextTargetImageContainer]:setPosition(Vector2.new(__gWidth, 0.0))
            local nextTargetImageIndex = _currentTargetImageIndex + 1
            if (nextTargetImageIndex > 9) then
                nextTargetImageIndex = 1
            end
            _photoImages[nextTargetImageContainer]:setSpriteFrame(_photoSpriteFrames[nextTargetImageIndex])
            _currentTargetImageIndex = nextTargetImageIndex
            _photoImages[_currentTargetImageContainer]:setPosition(Vector2.new(0.0, 0.0))
            _currentTargetImageContainer = nextTargetImageContainer
            break
        else
            pos:x(currentX - 2.0)
            photoImage:setPosition(pos)
        end
    end

    __gMotorGeneratorCooldown = __gMotorGeneratorCooldown - timeSinceLastFrame
    if __gMotorCount < 8 and __gMotorGeneratorCooldown < 0 then
        __gMotorGeneratorCooldown = 2000
        __gMotorCount = __gMotorCount + 1
        local motor = BlessingMotor.new()
        __gCanvas:addChild(motor)
    end
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
    -- _network:finalize()

    for index = 1, 9 do
        _photoSpriteFrames[index]:release()
    end    
end