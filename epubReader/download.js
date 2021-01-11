let zip=new JSZip();

let remoteFileMap={
    'style.html': {
        'https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.6.0/dist/themes/monolith.min.css': 'monolith.min.css',
        'https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.6.0/dist/pickr.min.js': 'pickr.min.js',
    }
}


let files=[
    'binJS.min.js',
    'index.html',
    'main.js',
    'jszip.min.js',
    'epubReader.js',
    'style.css',
    'style.html',
    'style.js'
].map(file=>{
    let url='./'+file;
    return fetch(url).then(x=>{
        if(x.status!==200) {
            throw new Error(`${ulr}: ${x.status}`);
        }
        return x.text();
    }).then(data=>{
        if(remoteFileMap[file]) {
            let arr=Object.keys(remoteFileMap[file]).map((url)=>{
                return fetch(url).then(x=>{
                    if(x.status!==200) {
                        throw new Error(`${ulr}: ${x.status}`);
                    }
                    return x.text();
                }).then(text=>{
                    let fname=remoteFileMap[file][url];
                    zip.file(fname, text);
                    return true;
                });
            });
            return Promise.all(arr).then(arr=>{
                Object.keys(remoteFileMap[file]).forEach(url=>{
                    data=data.replace(url, remoteFileMap[file][url]);
                });
                zip.file(file, data);
                return true;
            });
        } else {
            zip.file(file, data);
            return true;
        }
    });
});
Promise.all(files).then(arr=>{
    zip.generateAsync({type:"base64"}).then(function (base64) {
        let url="data:application/zip;base64," + base64;
        let a=document.querySelector('a');
        a.setAttribute('download', '簡樸epub閱讀器.zip');
        a.textContent='簡樸epub閱讀器.zip';
        a.href=url;
    });    
}).catch(()=>{
    document.querySelector('#log').textContent='發生錯誤，無法下載';
});