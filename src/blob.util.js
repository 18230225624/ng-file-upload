"use strict";
var util_1 = require("./util");
var defaults_1 = require("./defaults");
if (!Promise.prototype['finally']) {
    Promise.prototype['finally'] = function (fn) {
        var _this = this;
        this.then(function (r) {
            fn.call(_this, r);
            return r;
        }).catch(function (e) {
            fn.call(_this, e);
            return e;
        });
        return this;
    };
}
var BlobUtil = (function () {
    function BlobUtil() {
    }
    BlobUtil.dataUrltoBlob = function (dataurl, name, origSize) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        var blob = new Blob([u8arr], { type: mime });
        blob.name = name;
        blob.$ngfOrigSize = origSize;
        return blob;
    };
    BlobUtil.urlToBlob = function (url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('get', url);
            xhr.responseType = 'arraybuffer';
            xhr.send();
            xhr.onload = function () {
                if (xhr.status == 200) {
                    var arrayBufferView = new Uint8Array(xhr.response);
                    var type = xhr.getResponseHeader('content-type') || 'image/WebP';
                    var blob = new Blob([arrayBufferView], { type: type });
                    resolve(blob);
                }
                else {
                    reject(xhr.response);
                }
            };
        });
    };
    ;
    BlobUtil.dataUrl = function (file, disallowObjectUrl) {
        var _this = this;
        if (!file)
            return util_1.Util.emptyPromise(file);
        if ((disallowObjectUrl && file.$ngfDataUrl != null) || (!disallowObjectUrl && file.$ngfBlobUrl != null)) {
            return util_1.Util.emptyPromise(disallowObjectUrl ? file.$ngfDataUrl : file.$ngfBlobUrl, file);
        }
        if (file.$$ngfDataUrlPromise)
            return file.$$ngfDataUrlPromise;
        return file.$$ngfDataUrlPromise = new Promise(function (resolve, reject) {
            if (!FileReader || !file) {
                setTimeout(function () {
                    file[disallowObjectUrl ? '$ngfDataUrl' : '$ngfBlobUrl'] = '';
                    reject(!file ? 'No file' : 'Not supported');
                });
            }
            //prefer URL.createObjectURL for handling refrences to files of all sizes
            //since it doesn´t build a large string in memory
            var w = window;
            var URL = w.URL || w.webkitURL;
            if (URL && URL.createObjectURL && !disallowObjectUrl) {
                var url;
                try {
                    url = URL.createObjectURL(file);
                }
                catch (e) {
                    return setTimeout(function () {
                        file.$ngfBlobUrl = '';
                        reject();
                    }, 0);
                }
                file.$ngfBlobUrl = url;
                BlobUtil.blobUrls.push({ url: url, size: file.size });
                BlobUtil.blobUrlsTotalSize += file.size || 0;
                _this.clearBlobUrlsCache();
                setTimeout(function () {
                    resolve(url);
                }, 0);
            }
            else {
                var fileReader = new FileReader();
                fileReader.onload = function (e) {
                    setTimeout(function () {
                        file.$ngfDataUrl = e.target.result;
                        resolve(e.target.result);
                        setTimeout(function () {
                            delete file.$ngfDataUrl;
                        }, 1000);
                    });
                };
                fileReader.onerror = function (e) {
                    setTimeout(function () {
                        file.$ngfDataUrl = '';
                        reject(e);
                    });
                };
                fileReader.readAsDataURL(file);
            }
        })['finally'](function () {
            delete file.$ngfDurationPromise;
        });
    };
    BlobUtil.clearBlobUrlsCache = function () {
        var maxMemory = defaults_1.Defaults.defaults.blobUrlsMaxMemory || 268435456;
        var maxLength = defaults_1.Defaults.defaults.blobUrlsMaxQueueSize || 200;
        while ((BlobUtil.blobUrlsTotalSize > maxMemory || BlobUtil.blobUrls.length > maxLength) &&
            BlobUtil.blobUrls.length > 1) {
            var obj = BlobUtil.blobUrls.splice(0, 1)[0];
            URL.revokeObjectURL(obj.url);
            BlobUtil.blobUrlsTotalSize -= obj.size;
        }
    };
    return BlobUtil;
}());
BlobUtil.blobUrls = [];
BlobUtil.blobUrlsTotalSize = 0;
exports.BlobUtil = BlobUtil;
//# sourceMappingURL=blob.util.js.map