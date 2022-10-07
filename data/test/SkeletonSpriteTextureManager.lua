function string.split(str, delimiter)
    if str == nil or str == '' or delimiter == nil then
        return nil
    end
    local delimiter1 = delimiter
    if delimiter == '.' or delimiter == '+' or delimiter == '*' or delimiter == '-' or delimiter == '?' or delimiter == '%' then
        delimiter1 = "%"..delimiter --转义特殊字符的间隔符
    end
    local result = {}
    for match in (str..delimiter):gmatch("(.-)"..delimiter1) do
        table.insert(result, match)
    end
    return result
end

-- 假设有一个配置项为id和纹理数组
__gSkeletonSpriteTextures = {
    petId = "ceshi1.png,ceshi2.png"
}

local mgr = {}

function mgr:cache(petId)
    local count = mgr[petId]
    if count == nil then
        count = 0
        mgr[petId] = count
    end

    if count >= 1 then return end

    local files = string.split(__gSkeletonSpriteTextures[petId], ',')
    for key, file in pairs(files) do
        if SCRIPT_LIB_VERSION ~= nil then
            gContextWrapper:getTextureCache()->addImageWithoutPreload(gResourceRootPath.."/res/"..file)
        else
            gContextWrapper:getTextureCache()->addImageAsync(gResourceRootPath.."/res/"..file, function(texture) end)
        end
    end
    mgr[petId] = count + 1
end

function mgr:uncache(petId)
    local count = mgr[petId]
    if count == nil then return end

    count = count - 1
    if count == 0 then
        local files = string.split(__gSkeletonSpriteTextures[petId], ',')
        for key, file in pairs(files) do
            gContextWrapper:getTextureCache()->removeTextureForKey(gResourceRootPath.."/res/"..file)
        end
    end
    mgr[petId] = count
end

return mgr