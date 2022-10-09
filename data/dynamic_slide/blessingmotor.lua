_blessingContents = {
    "永远幸福",
    "开开心心",
    "爱你一生",
    "伴你一生",
    "白头偕老",
    "生活富足",
    "青春常驻",
    "感谢有你",
    "OnlyYou",
    "LOVE U",
    "\\(^o^)/"
}

_flagOffsets = { 
    Vector2.new(100, 150),
    Vector2.new(90, 150),
    Vector2.new(120, 150),
    Vector2.new(130, 140),
    Vector2.new(140, 130),
    Vector2.new(115, 150)
}

_flagFlippedOffsets = { 
    Vector2.new(236 - 100, 150),
    Vector2.new(236 - 90, 150),
    Vector2.new(236 - 120, 150),
    Vector2.new(236 - 130, 140),
    Vector2.new(236 - 140, 130),
    Vector2.new(236 - 115, 150)
}

BlessingMotor = class(UIElement)

function BlessingMotor:ctor()
    self.scaleRatio = __gHeight > 1000 and 2.0 or 1.0
    self:enableLifeCircleCallback(true)
    self.isFlip = math.random() > 0.5
    self.currentMotorAnimationIndex = 1
    if self.isFlip then
        self.initPos = Vector2.new(-250 * self.scaleRatio, math.random(0, __gHeight - 300 * self.scaleRatio))
        self.endPos = Vector2.new(__gWidth, self.initPos:y())
    else
        self.initPos = Vector2.new(__gWidth, math.random(0, __gHeight - 300 * self.scaleRatio))
        self.endPos = Vector2.new(-250 * self.scaleRatio, self.initPos:y())
    end
    self:setPosition(self.initPos)
    self:setScale(self.scaleRatio)

    self.flag = UIImage.create(gResourceRootPath.."/flag.png")
    self.flag:setAnchorPoint(Vector2.new(137.0 / 300.0, 12.0 / 300.0))
    if self.isFlip then
        self.flag:setPosition(_flagFlippedOffsets[self.currentMotorAnimationIndex])
    else
        self.flag:setPosition(_flagOffsets[self.currentMotorAnimationIndex])
    end
    self.flag:setFlippedX(self.isFlip)
    self:addChild(self.flag)

    local labelContent = _blessingContents[math.random(1, #_blessingContents)]
    self.label = UILabel.create()
    self.label:setTTFFontSource(gResourceRootPath.."/cute.ttf")
    self.label:setColor(Color3B.new(255, 255, 255))
    self.label:setFontSize(25)
    self.label:enableOutline(Color4B.new(0, 0, 0, 255), 1)
    self.label:setString(labelContent)
    if self.isFlip then
        self.label:setPosition(Vector2.new(95, 130))
        self.label:setRotation(25)
    else
        self.label:setPosition(Vector2.new(105, 126))
        self.label:setRotation(-25)
    end
    self.flag:addChild(self.label)

    self.motor = UIImage.create(gResourceRootPath.."/motor_animation/motor"..tostring(math.floor(self.currentMotorAnimationIndex))..".png")
    self.motor:setAnchorPoint(Vector2.new(0.0, 0.0))
    self.motor:setPosition(Vector2.new(0.0, 0.0))
    self.motor:setFlippedX(self.isFlip)
    self:addChild(self.motor)
    self.motorCountDown = 150

    self:runAction(Sequence.create( {  MoveTo.create(math.random(6000, 8000) * self.scaleRatio, self.endPos), RemoveSelf.create() } ))
end

function BlessingMotor:onUpdate()
    self.motorCountDown = self.motorCountDown - gTimeSinceLastFrame
    if (self.motorCountDown < 0.0) then
        self.motorCountDown = 150
        self.currentMotorAnimationIndex = self.currentMotorAnimationIndex + 1
        if self.currentMotorAnimationIndex > 6 then
            self.currentMotorAnimationIndex = 1
        end
        if (self.isFlip) then
            self.flag:setPosition(_flagFlippedOffsets[self.currentMotorAnimationIndex])
        else
            self.flag:setPosition(_flagOffsets[self.currentMotorAnimationIndex])
        end
        self.motor:setImage(gResourceRootPath.."/motor_animation/motor"..tostring(math.floor(self.currentMotorAnimationIndex))..".png")
    end
end

function BlessingMotor:onDestroy()
    __gMotorCount = __gMotorCount - 1
end