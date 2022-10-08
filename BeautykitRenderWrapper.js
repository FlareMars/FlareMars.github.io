document.write("<script src=\"jszip.min.js\"> <\/script>")
document.write("<script src=\"protobuf.min.js\"> <\/script>")
document.write("<script language=\"javascript\" src=\"datatypes/datatypes.js\"> <\/script>")
document.write("<script language=\"javascript\" src=\"effects/BeautykitEffects.js\"> <\/script>")


// function JS_XHRGet(url, cb) {
//     var request = new XMLHttpRequest();
//     request.open("GET", url, true);
//     request.responseType = "arraybuffer";
//     request.url = url;
//     request.wrap_cb = cb;
//     request.onreadystatechange = function(){
//         if (request.readyState == 4) {
//             if (request.status == 200) {
//                 let bytes = request.response;
//                 let u8Array = new Uint8Array(bytes);
//                 let bytesLength = bytes.byteLength;
//                 let fileName = url;
//                 const fileNameBuffer = Module._malloc(fileName.length + 1);
//                 Module.stringToUTF8(fileName, fileNameBuffer, fileName.length + 1);
//                 Module._startStoreFile(fileNameBuffer, bytesLength)
//                 Module._free(fileNameBuffer);

//                 const dataBuffer = Module._malloc(64 * 1024);
//                 let dataIndex = 0;
//                 let tempLength = 64 * 1024;
//                 while (dataIndex < bytesLength) {
//                     tempLength = Math.min(64 * 1024, bytesLength - dataIndex);
//                     Module.writeArrayToMemory(u8Array.subarray(dataIndex, dataIndex + tempLength), dataBuffer);
//                     Module._writeFileData(dataBuffer, tempLength)
//                     dataIndex = dataIndex + tempLength;
//                 }
//                 Module._free(dataBuffer);
//                 Module._endStoreFile();
//                 Module._onFileRequestFinish(request.url, bytes, bytesLength, request.wrap_cb);
//             }
//             else {
//                 Module._onFileRequestError(request.url, request.status, request.wrap_cb);
//                 // Module._XHROnError(request.url, request.status, request.wrap_cb);
//             }
//         }
//     };
//     request.send();
// }

// mergeInto(LibraryManager.library, {
//    XHRGet: function (url, cb) {
//        return JS_XHRGet(Pointer_stringify(url), cb);
//    },
//    // js_console_log_int: function (param) {
//    //     console.log("js_console_log_int:" + param);
//    // }
//})

Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};

Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

function defaultBeautykitLogFunc(string, level) {
    //let message ={ lvl: level, msg: string };
    console.log('lvl:%d, msg:%s', level, string);
}

var nativeObjectsInTableMap;
var autoObjReleasePtr;

class BeautykitRenderWrapper {
    constructor(canvasId) {
        const idBuffer = Module._malloc(canvasId.length+1);
        Module.stringToUTF8(canvasId, idBuffer, canvasId.length+1);
        Module._initBeautykitContext(idBuffer);
        Module._setEnableLogs(false);
        Module._free(idBuffer);

        //Module._setEnableLogs(true);
        //this.setLogCallback(defaultBeautykitLogFunc);

        try {
			//如果协议支持跨域资源访问，开启多线程功能
        	if (crossOriginIsolated) {
				Module._setEnableMultiThread(true);
			}
		} catch (error) {
		}
        
        if (!nativeObjectsInTableMap) {
			nativeObjectsInTableMap = new Map();
		}
        autoObjReleasePtr = Module.addFunction(nativeObjectReleaseFunc, "vi");
    }

    getVersionName() {
		var versionNamePtr = Module._getVersionName();
		return Module.UTF8ToString(versionNamePtr);
	}
	
	getVersioNumber() {
		return Module._getVersioNumber();
	}

    setEnableLogs(flag) {
        Module._setEnableLogs(flag);
    }

    setLogCallback(logCallback) {
        var callbackFunc = Callback1Generator(logCallback);
        var beautykitLogFuncPtr = Module.addFunction(callbackFunc, "vii");
        Module._renderWrapper_setLogCallback(beautykitLogFuncPtr);
    }

    removeLogCallback() {
        Module._renderWrapper_removeLogCallback();
    }

    setEnableMultiThread(enable) {
		Module._setEnableMultiThread(enable);
	}

    setProfilerEnable(enable) {
		Module._setProfilerEnable(enable);
	}

	setSilentRenderModeEnable(enable) {
		Module._setSilentRenderModeEnable(enable);
	}

    genNativeTexture() {
        return Module._genTexture();
    }

    storeFiles(fileItem) {
        var filesToBeProcessed = new Array();

        function scanFiles(item, parentPath, resolve, reject) {
            let fileName = parentPath + item.name;
            filesToBeProcessed.push(fileName);
            if (item.isDirectory) {
                let directoryReader = item.createReader();
                directoryReader.readEntries(function(entries) {
                    entries.forEach(function(entry) {
                        scanFiles(entry, parentPath + item.name + "/", resolve, reject);
                    });
                    filesToBeProcessed.remove(fileName);
                    if (filesToBeProcessed.length == 0) {
                        resolve();
                    }
                });
            } else if (item.isFile) {
                item.file(f => {
                let reader = new FileReader();
                reader.onload = () => {
                  let bytes = reader.result;
                  let u8Array = new Uint8Array(bytes);
                  let bytesLength = bytes.byteLength;

                  const fileNameBuffer = Module._malloc(fileName.length+1);
                  Module.stringToUTF8(fileName, fileNameBuffer, fileName.length+1);
                  Module._startStoreFile(fileNameBuffer, bytesLength)
                  Module._free(fileNameBuffer);

                  const dataBuffer = Module._malloc(64 * 1024);
                  let dataIndex = 0;
                  let tempLength = 64 * 1024;
                  while (dataIndex < bytesLength) {
                    tempLength = Math.min(64 * 1024, bytesLength - dataIndex);
                    Module.writeArrayToMemory(u8Array.subarray(dataIndex, dataIndex + tempLength), dataBuffer);
                    Module._writeFileData(dataBuffer, tempLength)
                    dataIndex = dataIndex + tempLength;
                  }
                  Module._free(dataBuffer);
                  Module._endStoreFile();
                  filesToBeProcessed.remove(fileName);
                  if (filesToBeProcessed.length == 0) {
                    resolve();
                  }
                }
                reader.onerror = () => {
                    filesToBeProcessed.remove(fileName);
                    reject();
                }
                reader.readAsArrayBuffer(f);
              })
            }
        }

        return new Promise((resolve, reject) => {
            if (fileItem) {
                var resolveWrapper = function() {
                    resolve(fileItem.name);
                };
                scanFiles(fileItem, '', resolveWrapper, reject);
            } else if (reject) {
                reject('cannot pass null item!');
            }
        });
    }

    setTextureSize(width, height) {
		Module._setTextureSize(width, height);
	}
    
    syncTextureSize() {
        Module._syncTextureSize();
    }

    render(inputTextureName) {
        Module._requestBeautykitRender(inputTextureName);
        return gl.getParameter(gl.TEXTURE_BINDING_2D);
    }

    applyEffect(effectName, groupName) {
        const effectNameBuffer = Module._malloc(effectName.length+1);
        Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
        const groupNameBuffer = Module._malloc(groupName.length+1);
        Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
        Module._applyEffect(effectNameBuffer, groupNameBuffer);
        Module._free(effectNameBuffer);
        Module._free(groupNameBuffer);
    }

    clearEffectGroup(groupName) {
        const groupNameBuffer = Module._malloc(groupName.length+1);
        Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
        Module._clearEffectGroup(groupNameBuffer);
        Module._free(groupNameBuffer);
    }

    release() {
        Module._releaseBeautykitContext();
         if (nativeObjectsInTableMap) {
			ativeObjectsInTableMap.clear();
		}
        Module.removeFunction(autoObjReleasePtr);
    }
    
    addChild(child) {
        return Module._renderWrapper_addChild(child.nativePtr);
    }

    addChildrenWithConfigPackage(configPackage) {
        const configPackageBuffer = Module._malloc(configPackage.length+1);
		Module.stringToUTF8(configPackage, configPackageBuffer, configPackage.length+1);
		var __result = Module._renderWrapper_addChildrenWithConfigPackage(configPackageBuffer);
		Module._free(configPackageBuffer);
		return new Node(__result);
    }

    getChildrenCount() {
		var __result = Module._renderWrapper_getChildrenCount();
		return __result;
	}

	getChildByIndex(index) {
		var __result = Module._renderWrapper_getChildByIndex(index);
		return new Node(__result);
	}

	removeChild(child) {
		var __result = Module._renderWrapper_removeChild(child.nativePtr);
		return __result;
	}

	findNodeByPath(str) {
		const strBuffer = Module._malloc(str.length+1);
		Module.stringToUTF8(str, strBuffer, str.length+1);
		var __result = Module._renderWrapper_findNodeByPath(strBuffer);
		Module._free(strBuffer);
		return new Node(__result);
	}

	appendChildToGroup(child, groupName) {
		const groupNameBuffer = Module._malloc(groupName.length+1);
		Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
		var __result = Module._renderWrapper_appendChildToGroup(child.nativePtr, groupNameBuffer);
		Module._free(groupNameBuffer);
		return __result;
	}

	clearChildrenInGroup(groupName) {
		const groupNameBuffer = Module._malloc(groupName.length+1);
		Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
		Module._renderWrapper_clearChildrenInGroup(groupNameBuffer);
		Module._free(groupNameBuffer);
	}

	clearAllChildren() {
		Module._renderWrapper_clearAllChildren();
	}

	destroyChild(child) {
		Module._renderWrapper_destroyChild(child.nativePtr);
	}

    onMouseDown(event) {
        var canvas = document.getElementById('canvas');
        var bbox = canvas.getBoundingClientRect();
        var loc = {
          x: event.clientX - bbox.left * (canvas.width / bbox.width),
          y: event.clientY - bbox.top * (canvas.height / bbox.height)
        };
        Module._renderWrapper_onMouseDown(loc.x, loc.y);
    }
    
    onMouseMove(event) {
        var canvas = document.getElementById('canvas');
        var bbox = canvas.getBoundingClientRect();
        var loc = {
          x: event.clientX - bbox.left * (canvas.width / bbox.width),
          y: event.clientY - bbox.top * (canvas.height / bbox.height)
        };
        Module._renderWrapper_onMouseMove(loc.x, loc.y);
    }
    
    onMouseUp(event) {
        var canvas = document.getElementById('canvas');
        var bbox = canvas.getBoundingClientRect();
        var loc = {
          x: event.clientX - bbox.left * (canvas.width / bbox.width),
          y: event.clientY - bbox.top * (canvas.height / bbox.height)
        };
        Module._renderWrapper_onMouseUp(loc.x, loc.y);
    }

	onKeyPress(event) {
        Module._renderWrapper_onKeyDown(event.keyCode);
    }

	OnKeyUp(event) {
        Module._renderWrapper_onKeyUp(event.keyCode);
    }

	createAtlasNode(groupName) {
		const effectName = "AtlasNode";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new AtlasNode(ptr);
	}

	createAutoBatchNode(groupName) {
		const effectName = "AutoBatchNode";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new AutoBatchNode(ptr);
	}

	create2DGameModule(groupName) {
		const effectName = "bk2dgamemodule";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new BK2DGameModule(ptr);
	}

	createDirector(groupName) {
		const effectName = "Director";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Director(ptr);
	}

	createDrawNode(groupName) {
		const effectName = "DrawNode";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new DrawNode(ptr);
	}

	createLabel(groupName) {
		const effectName = "Label";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Label(ptr);
	}

	createLayer(groupName) {
		const effectName = "Layer";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Layer(ptr);
	}

	createLayerColor(groupName) {
		const effectName = "LayerColor";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new LayerColor(ptr);
	}

	createLayerGradient(groupName) {
		const effectName = "LayerGradient";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new LayerGradient(ptr);
	}

	createLayerRadialGradient(groupName) {
		const effectName = "LayerRadialGradient";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new LayerRadialGradient(ptr);
	}

	createLight2D(groupName) {
		const effectName = "Light2D";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Light2D(ptr);
	}

	createProgressTimer(groupName) {
		const effectName = "ProgressTimer";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new ProgressTimer(ptr);
	}

	createRenderTargetNode(groupName) {
		const effectName = "RenderTargetNode";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new RenderTargetNode(ptr);
	}

	createScale9Sprite(groupName) {
		const effectName = "Scale9Sprite";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Scale9Sprite(ptr);
	}

	createScene(groupName) {
		const effectName = "Scene";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Scene(ptr);
	}

	createSequenceFrameAnimationPlayer(groupName) {
		const effectName = "SequenceFrameAnimationPlayer";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new SequenceFrameAnimationPlayer(ptr);
	}

	createSprite(groupName) {
		const effectName = "Sprite";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Sprite(ptr);
	}

	createSpriteBatchNode(groupName) {
		const effectName = "SpriteBatchNode";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new SpriteBatchNode(ptr);
	}

	createTMXLayer(groupName) {
		const effectName = "TMXLayer";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new TMXLayer(ptr);
	}

	createTMXTiledMap(groupName) {
		const effectName = "TMXTiledMap";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new TMXTiledMap(ptr);
	}

	createTextField(groupName) {
		const effectName = "TextField";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new TextField(ptr);
	}

	createTexture3DEffect(groupName) {
		const effectName = "Texture3DEffect";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Texture3DEffect(ptr);
	}

	createTileMapAtlas(groupName) {
		const effectName = "TileMapAtlas";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new TileMapAtlas(ptr);
	}

	createGController(groupName) {
		const effectName = "GController";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GController(ptr);
	}

	createGButton(groupName) {
		const effectName = "GButton";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GButton(ptr);
	}

	createGComboBox(groupName) {
		const effectName = "GComboBox";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GComboBox(ptr);
	}

	createGComponent(groupName) {
		const effectName = "GComponent";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GComponent(ptr);
	}

	createGGraph(groupName) {
		const effectName = "GGraph";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GGraph(ptr);
	}

	createGGroup(groupName) {
		const effectName = "GGroup";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GGroup(ptr);
	}

	createGImage(groupName) {
		const effectName = "GImage";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GImage(ptr);
	}

	createGLabel(groupName) {
		const effectName = "GLabel";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GLabel(ptr);
	}

	createGList(groupName) {
		const effectName = "GList";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GList(ptr);
	}

	createGLoader(groupName) {
		const effectName = "GLoader";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GLoader(ptr);
	}

	createGLoader3D(groupName) {
		const effectName = "GLoader3D";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GLoader3D(ptr);
	}

	createGMovieClip(groupName) {
		const effectName = "GMovieClip";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GMovieClip(ptr);
	}

	createGObject(groupName) {
		const effectName = "GObject";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GObject(ptr);
	}

	createGProgressBar(groupName) {
		const effectName = "GProgressBar";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GProgressBar(ptr);
	}

	createGRoot(groupName) {
		const effectName = "GRoot";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GRoot(ptr);
	}

	createGSlider(groupName) {
		const effectName = "GSlider";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GSlider(ptr);
	}

	createGTextField(groupName) {
		const effectName = "GTextField";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GTextField(ptr);
	}

	createGTextInput(groupName) {
		const effectName = "GTextInput";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GTextInput(ptr);
	}

	createGTree(groupName) {
		const effectName = "GTree";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new GTree(ptr);
	}

	createTransition(groupName) {
		const effectName = "Transition";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Transition(ptr);
	}

	createWindow(groupName) {
		const effectName = "Window";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Window(ptr);
	}

	createUIEventDispatcher(groupName) {
		const effectName = "UIEventDispatcher";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIEventDispatcher(ptr);
	}

	createPhysics2DBody(groupName) {
		const effectName = "Physics2DBody";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Physics2DBody(ptr);
	}

	createPhysics2DDynamicBody(groupName) {
		const effectName = "Physics2DDynamicBody";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Physics2DDynamicBody(ptr);
	}

	createPhysics2DFixture(groupName) {
		const effectName = "Physics2DFixture";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Physics2DFixture(ptr);
	}

	createPhysics2DKinematicBody(groupName) {
		const effectName = "Physics2DKinematicBody";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Physics2DKinematicBody(ptr);
	}

	createPhysics2DStaticBody(groupName) {
		const effectName = "Physics2DStaticBody";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Physics2DStaticBody(ptr);
	}

	createBone(groupName) {
		const effectName = "Bone";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Bone(ptr);
	}

	createSkeleton(groupName) {
		const effectName = "Skeleton";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Skeleton(ptr);
	}

	createSkeletonSprite(groupName) {
		const effectName = "SkeletonSprite";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new SkeletonSprite(ptr);
	}

	createCanvas(groupName) {
		const effectName = "Canvas";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Canvas(ptr);
	}

	createUIButton(groupName) {
		const effectName = "UIButton";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIButton(ptr);
	}

	createUICheckBox(groupName) {
		const effectName = "UICheckBox";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UICheckBox(ptr);
	}

	createUICombo(groupName) {
		const effectName = "UICombo";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UICombo(ptr);
	}

	createUIElement(groupName) {
		const effectName = "UIElement";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIElement(ptr);
	}

	createUIImage(groupName) {
		const effectName = "UIImage";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIImage(ptr);
	}

	createUILabel(groupName) {
		const effectName = "UILabel";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UILabel(ptr);
	}

	createUILayer(groupName) {
		const effectName = "UILayer";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UILayer(ptr);
	}

	createUIListView(groupName) {
		const effectName = "UIListView";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIListView(ptr);
	}

	createUIListViewCell(groupName) {
		const effectName = "UIListViewCell";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIListViewCell(ptr);
	}

	createUIMask(groupName) {
		const effectName = "UIMask";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIMask(ptr);
	}

	createUIPopup(groupName) {
		const effectName = "UIPopup";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIPopup(ptr);
	}

	createUIRadioButton(groupName) {
		const effectName = "UIRadioButton";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIRadioButton(ptr);
	}

	createUIRadioButtonGroup(groupName) {
		const effectName = "UIRadioButtonGroup";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIRadioButtonGroup(ptr);
	}

	createUIScrollView(groupName) {
		const effectName = "UIScrollView";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIScrollView(ptr);
	}

	createUIShape(groupName) {
		const effectName = "UIShape";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIShape(ptr);
	}

	createUISlider(groupName) {
		const effectName = "UISlider";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UISlider(ptr);
	}

	createUIBaseLayout(groupName) {
		const effectName = "UIBaseLayout";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIBaseLayout(ptr);
	}

	createUILinearLayout(groupName) {
		const effectName = "UILinearLayout";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UILinearLayout(ptr);
	}

	createUIRelativeLayout(groupName) {
		const effectName = "UIRelativeLayout";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UIRelativeLayout(ptr);
	}

	createAbstractCheckButton(groupName) {
		const effectName = "AbstractCheckButton";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new AbstractCheckButton(ptr);
	}

	createCheckBox(groupName) {
		const effectName = "CheckBox";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new CheckBox(ptr);
	}

	createHBox(groupName) {
		const effectName = "HBox";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new HBox(ptr);
	}

	createUILayout(groupName) {
		const effectName = "UILayout";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new UILayout(ptr);
	}

	createListView(groupName) {
		const effectName = "ListView";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new ListView(ptr);
	}

	createLoadingBar(groupName) {
		const effectName = "LoadingBar";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new LoadingBar(ptr);
	}

	createRadioButton(groupName) {
		const effectName = "RadioButton";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new RadioButton(ptr);
	}

	createRadioButtonGroup(groupName) {
		const effectName = "RadioButtonGroup";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new RadioButtonGroup(ptr);
	}

	createRecyclerView(groupName) {
		const effectName = "RecyclerView";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new RecyclerView(ptr);
	}

	createRecyclerViewCell(groupName) {
		const effectName = "RecyclerViewCell";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new RecyclerViewCell(ptr);
	}

	createRecyclerViewDataSource(groupName) {
		const effectName = "RecyclerViewDataSource";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new RecyclerViewDataSource(ptr);
	}

	createRelativeBox(groupName) {
		const effectName = "RelativeBox";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new RelativeBox(ptr);
	}

	createRichText(groupName) {
		const effectName = "RichText";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new RichText(ptr);
	}

	createScrollViewBar(groupName) {
		const effectName = "ScrollViewBar";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new ScrollViewBar(ptr);
	}

	createSlider(groupName) {
		const effectName = "Slider";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Slider(ptr);
	}

	createText(groupName) {
		const effectName = "Text";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new BKText(ptr);
	}

	createVBox(groupName) {
		const effectName = "VBox";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new VBox(ptr);
	}

	createWidget(groupName) {
		const effectName = "Widget";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Widget(ptr);
	}

	createCanvasEffect(groupName) {
		const effectName = "bkcanvaseffect";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new BKCanvasEffect(ptr);
	}

	createCustomCollectionEffect(groupName) {
		const effectName = "customCollectionEffect";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new BKCustomCollectionEffect(ptr);
	}

	createAutoMemoryObject(groupName) {
		const effectName = "AutoMemoryObject";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new AutoMemoryObject(ptr);
	}

	createNodeCanvas(groupName) {
		const effectName = "NodeCanvas";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new NodeCanvas(ptr);
	}

	createTimer(groupName) {
		const effectName = "Timer";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new Timer(ptr);
	}

	createMediaStreamPlayer(groupName) {
		const effectName = "MediaStreamPlayer";
		const effectNameBuffer = Module._malloc(effectName.length+1);
		Module.stringToUTF8(effectName, effectNameBuffer, effectName.length+1);
		var ptr = 0;
		if(groupName) {
			const groupNameBuffer = Module._malloc(groupName.length+1);
			Module.stringToUTF8(groupName, groupNameBuffer, groupName.length+1);
			ptr = Module._createEffectEntry(groupNameBuffer, effectNameBuffer);
			Module._free(groupNameBuffer);
		}
		else {
			ptr = Module._createEffectNode(effectNameBuffer);
		}
		Module._free(effectNameBuffer);
		return new MediaStreamPlayer(ptr);
	}


}

function unZipFile(zipFilePath, destPath, addZipEntryFunc) {
    var zipFilePathPtr = Module.allocateUTF8(zipFilePath);
    var destPathPtr = Module.allocateUTF8(destPath);
    //func
    if (typeof addZipEntryFunc != 'undefined'){
        var cbPtr = Module.addFunction(addZipEntryFunc, "viiiii");
        var zipRes = Module._unZipFileToPath(zipFilePathPtr, destPathPtr, cbPtr);
         Module.removeFunction(cbPtr);
    }
    else{
        var zipRes = Module._unZipFileToPath(zipFilePathPtr, destPathPtr, 0);
    }
    
    Module._free(zipFilePathPtr);
    Module._free(destPathPtr);
    return zipRes;
}

function unZipStreamHandleFuncGen(func) {
	return function(buff, size) {
		if (func) {
			return func(buff, size);
		}
	}
}

function unZipStreamToCallback(bytes, unCompressBuffHandle) {
	// 后期优化可以一次解压一部分添加到解压后数据里面
	// let dataIndex = 0;
	// let chunkLength = 64 * 1024;
	// const dataBuffer = Module._malloc(chunkLength);
	// while (dataIndex < bytesLength) {
	// 	chunkLength = Math.min(chunkLength, bytesLength - dataIndex);
	//   	Module.writeArrayToMemory(u8Array.subarray(dataIndex, dataIndex + chunkLength), dataBuffer);
	// 	dataIndex = dataIndex + chunkLength;
	// }
    //func
    if (typeof unCompressBuffHandle != 'undefined'){
		let u8Array = new Uint8Array(bytes);
		bytesLength = bytes.length;
		const dataBuffer = Module._malloc(bytesLength);
		Module.writeArrayToMemory(u8Array, dataBuffer);

        var cbPtr = Module.addFunction(unCompressBuffHandle, "vii");
        Module._unZipStreamToArray(dataBuffer, bytesLength, cbPtr);
        Module.removeFunction(cbPtr);
		Module._free(dataBuffer);
    }
}

// function wasmIniteWithBytes(buff, size) {
// 	const outArray = Module.HEAPU8.subarray(buff, buff + size);
// 	Module.wasmBinary = outArray.buffer;
// 	//Module.wasmBinary = bytes;
	
// 	var script = document.createElement('script');
// 	script.src = wasmJs;
// 	document.body.appendChild(script);
// }

Module = {};
var wasmZipFile = "wasm.zip";
var wasmFile = "beautykitweb.wasm";
var wasmJs = "beautykitweb.js";
try {
	//如果协议支持跨域资源访问，开启多线程功能
	// if (crossOriginIsolated){
	// 	wasmZipFile = "wasm_mt.zip";
	// 	wasmFile = "beautykitweb_mt.wasm"
	// 	wasmJs = "beautykitweb_mt.js"
	// }
}
catch(error) {
}

var initWithWasmZipFile = false;
/*changeInitWithWasmZipFile*/
if (!initWithWasmZipFile) {
	fetch(wasmFile).then(response => response.arrayBuffer()).then((bytes) => {
		//WebAssembly.instantiateStreaming(response);
		Module.wasmBinary = bytes;
		var script = document.createElement('script');
		script.src = wasmJs;
		document.body.appendChild(script);
	})
}
else {
	fetch(wasmZipFile).then(response => response.arrayBuffer()).then((bytes) => {
		JSZip.loadAsync(bytes).then(function (zip) {
			return zip.file(wasmFile).async("arraybuffer");
		}).then(function (content) {
				Module.wasmBinary = content;
				var script = document.createElement('script');
				script.src = wasmJs;
				document.body.appendChild(script);
		});
	})
}
Module.onRuntimeInitialized = function() {
const pb_vector2_load_promise = protobuf.load("datatypes/pb_vector2.proto");
const pb_vector3_load_promise = protobuf.load("datatypes/pb_vector3.proto");
const pb_vector4_load_promise = protobuf.load("datatypes/pb_vector4.proto");
const pb_matrix_load_promise = protobuf.load("datatypes/pb_matrix.proto");
const pb_bkmat4x4_load_promise = protobuf.load("datatypes/pb_bkmat4x4.proto");
const pb_bksizef_load_promise = protobuf.load("datatypes/pb_bksizef.proto");

Promise.all([pb_vector2_load_promise, pb_vector3_load_promise, pb_vector4_load_promise, pb_matrix_load_promise, pb_bkmat4x4_load_promise, pb_bksizef_load_promise]).then((roots) => {
    window.PBVector2 = roots[0].lookupType("pbbk.PBVector2");
    window.PBVector2.instance = PBVector2.create();
    var temp = PBVector2.encode(PBVector2.instance).finish();
    window.PBVector2.nativeBuffer = Module._malloc(temp.length);
    window.PBVector2.buffer = function(input) {
        PBVector2.instance.x = input.x;
        PBVector2.instance.y = input.y;
        temp = PBVector2.encode(PBVector2.instance).finish();
        const bufferMalloced = Module._malloc(temp.length);
        Module.writeArrayToMemory(temp, bufferMalloced);
        return bufferMalloced;
    };
    window.PBVector2.freeBuffer = function(bufferMalloced) {
        Module._free(bufferMalloced);
    };

    window.PBVector3 = roots[1].lookupType("pbbk.PBVector3");
    window.PBVector3.instance = PBVector3.create();
    temp = PBVector3.encode(PBVector3.instance).finish();
    window.PBVector3.nativeBuffer = Module._malloc(temp.length);
    window.PBVector3.buffer = function(input) {
        PBVector3.instance.x = input.x;
        PBVector3.instance.y = input.y;
        PBVector3.instance.z = input.z;
        temp = PBVector3.encode(PBVector3.instance).finish();
        const bufferMalloced = Module._malloc(temp.length);
        Module.writeArrayToMemory(temp, bufferMalloced);
        return bufferMalloced;
    };
    window.PBVector3.freeBuffer = function(bufferMalloced) {
        Module._free(bufferMalloced);
    };

    window.PBVector4 = roots[2].lookupType("pbbk.PBVector4");
    window.PBVector4.instance = PBVector4.create();
    temp = PBVector4.encode(PBVector4.instance).finish();
    window.PBVector4.nativeBuffer = Module._malloc(temp.length);
    window.PBVector4.buffer = function(input) {
        PBVector4.instance.x = input.x;
        PBVector4.instance.y = input.y;
        PBVector4.instance.z = input.z;
        PBVector4.instance.w = input.w;
        temp = PBVector4.encode(PBVector4.instance).finish();
        const bufferMalloced = Module._malloc(temp.length);
        Module.writeArrayToMemory(temp, bufferMalloced);
        return bufferMalloced;
    };
    window.PBVector4.freeBuffer = function(bufferMalloced) {
        Module._free(bufferMalloced);
    };

    window.PBMatrix = roots[3].lookupType("pbbk.PBMatrix");
    window.PBMatrix.instance = PBMatrix.create();
    temp = PBMatrix.encode(PBMatrix.instance).finish();
    window.PBMatrix.nativeBuffer = Module._malloc(temp.length);
    window.PBMatrix.buffer = function(input) {
        PBMatrix.instance.m00 = input.m[0];
        PBMatrix.instance.m01 = input.m[1];
        PBMatrix.instance.m02 = input.m[2];
        PBMatrix.instance.m03 = input.m[3];
        PBMatrix.instance.m10 = input.m[4];
        PBMatrix.instance.m11 = input.m[5];
        PBMatrix.instance.m12 = input.m[6];
        PBMatrix.instance.m13 = input.m[7];
        PBMatrix.instance.m20 = input.m[8];
        PBMatrix.instance.m21 = input.m[9];
        PBMatrix.instance.m22 = input.m[10];
        PBMatrix.instance.m23 = input.m[11];
        PBMatrix.instance.m30 = input.m[12];
        PBMatrix.instance.m31 = input.m[13];
        PBMatrix.instance.m32 = input.m[14];
        PBMatrix.instance.m33 = input.m[15];
        temp = PBMatrix.encode(PBMatrix.instance).finish();
        const bufferMalloced = Module._malloc(temp.length);
        Module.writeArrayToMemory(temp, bufferMalloced);
        return bufferMalloced;
    };
    window.PBMatrix.freeBuffer = function(bufferMalloced) {
        Module._free(bufferMalloced);
    };

    window.PBBKMat4x4 = roots[4].lookupType("pbbk.PBBKMat4x4");
    window.PBBKMat4x4.instance = PBBKMat4x4.create();
    temp = PBBKMat4x4.encode(PBBKMat4x4.instance).finish();
    window.PBBKMat4x4.nativeBuffer = Module._malloc(temp.length);
    window.PBBKMat4x4.buffer = function(input) {
        PBBKMat4x4.instance.m00 = input.m[0];
        PBBKMat4x4.instance.m01 = input.m[1];
        PBBKMat4x4.instance.m02 = input.m[2];
        PBBKMat4x4.instance.m03 = input.m[3];
        PBBKMat4x4.instance.m10 = input.m[4];
        PBBKMat4x4.instance.m11 = input.m[5];
        PBBKMat4x4.instance.m12 = input.m[6];
        PBBKMat4x4.instance.m13 = input.m[7];
        PBBKMat4x4.instance.m20 = input.m[8];
        PBBKMat4x4.instance.m21 = input.m[9];
        PBBKMat4x4.instance.m22 = input.m[10];
        PBBKMat4x4.instance.m23 = input.m[11];
        PBBKMat4x4.instance.m30 = input.m[12];
        PBBKMat4x4.instance.m31 = input.m[13];
        PBBKMat4x4.instance.m32 = input.m[14];
        PBBKMat4x4.instance.m33 = input.m[15];
        temp = PBBKMat4x4.encode(PBBKMat4x4.instance).finish();
        const bufferMalloced = Module._malloc(temp.length);
        Module.writeArrayToMemory(temp, bufferMalloced);
        return bufferMalloced;
    };
    window.PBBKMat4x4.freeBuffer = function(bufferMalloced) {
        Module._free(bufferMalloced);
    };

    window.PBBKSizeF = roots[5].lookupType("pbbk.PBBKSizeF");
    window.PBBKSizeF.instance = PBBKSizeF.create();
    var temp = PBBKSizeF.encode(PBBKSizeF.instance).finish();
    window.PBBKSizeF.nativeBuffer = Module._malloc(temp.length);
    window.PBBKSizeF.buffer = function(input) {
        PBBKSizeF.instance.width = input.width;
        PBBKSizeF.instance.height = input.height;
        temp = PBBKSizeF.encode(PBBKSizeF.instance).finish();
        const bufferMalloced = Module._malloc(temp.length);
        Module.writeArrayToMemory(temp, bufferMalloced);
        return bufferMalloced;
    };
    window.PBBKSizeF.freeBuffer = function(bufferMalloced) {
        Module._free(bufferMalloced);
    };

    if (Beautykit && Beautykit['onRuntimeInitialized']) Beautykit['onRuntimeInitialized']();
});
}
