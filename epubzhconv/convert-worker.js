//輸入 {api:'convert', file, encoding, locaConv}, {api:pack, data}
//輸出 {status, data, filename}
importScripts('./opencc-js/bundle-node.js');
importScripts('./jszip/jszip.min.js');

let converterCache = {};

onmessage = function (e) {
    let api = e.data.api;
    if(api==='convert') {
        let pos = e.data.file.name.lastIndexOf('.');
        let ext = pos >= 0 ? e.data.file.name.slice(pos + 1) : null;
        if (ext === 'epub') {
            convertEpubProcess(e.data.file, e.data.loca);
        } else {
            convertTextProcess(e.data.file, e.data.loca, e.data.encoding);
        }
    } else if(api==='pack') {
        packIntoSingleFile(e.data.data);
    }
}

function convertEpubProcess(epubFile, locaConv) {
    let oZip = new JSZip();
    new Promise(success => {
        let frd = new FileReader;
        frd.onload = function (evt) {
            success(this.result);
        }
        frd.readAsArrayBuffer(epubFile);
    }).then(buffer => {
        let iZip = new JSZip();
        return iZip.loadAsync(buffer);
    }).then(zip => {
        let compressOptions = {
            compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        }
        let arr = [];
        zip.forEach((relativePath, file) => {
            if (relativePath.match(/\.(xh?t?ml|html|ncx|opf)$/)) {
                arr.push(
                    file.async("string").then(str=>{
                        postMessage({
                            status: 'log',
                            data: `處理 ${relativePath} ...`,
                            filename: epubFile.name
                        });
                        str = locaConvert(str, locaConv);
                        oZip.file(relativePath, str, compressOptions);
                        return true;
                    })
                );
            } else {
                arr.push(
                    file.async("uint8array").then(u8arr=>{
                        postMessage({
                            status: 'log',
                            data: `處理 ${relativePath} ...`,
                            filename: epubFile.name
                        });
                        oZip.file(relativePath, u8arr, compressOptions);
                        return true;
                    })
                );
            }
        });
        return Promise.all(arr);
    }).then((arr) => {
        postMessage({
            status: 'log',
            data: `壓縮為 epub ...`,
            filename: epubFile.name
        });
        return oZip.generateAsync({ type: "uint8array" });
    }).then(u8arr=>{
        self.postMessage({
            status:'finish',
            data:u8arr,
            filename: epubFile.name
        });
    });
}

function convertTextProcess(file, locaConv, encoding) {
    let frd = new FileReader;
    frd.onload = function (evt) {
        let res = locaConvert(this.result, locaConv);
        postMessage({
            status: 'finish',
            data: res,
            filename: file.name
        });
    }
    frd.readAsText(file, encoding);
}

function locaConvert(text, locaConv) {
    const converter = getConverter(locaConv);
    return converter(text);
}

function getConverter(locaConv) {
    const key = `${locaConv.from}/${locaConv.to}`;
    if (!converterCache[key]) {
        converterCache[key] = OpenCC.Converter(locaConv);
    }
    return converterCache[key];
}

function packIntoSingleFile(dataCollection) {
    let compressOptions = {
        compression: "DEFLATE",
        compressionOptions: {
            level: 9
        }
    }
    let oZip = new JSZip();
    for(let fname in dataCollection) {
        oZip.file(fname, dataCollection[fname], compressOptions);
    }
    oZip.generateAsync({ type: "uint8array" }).then(u8arr=>{
        postMessage({
            status: 'pack-finish',
            data: u8arr,
            filename: 'all.zip'
        });
    });
}