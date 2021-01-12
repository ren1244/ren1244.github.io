const JSZip = require("jszip");
let zip=new JSZip;
function ajax(url, textFlag) {
    if(textFlag) {
        return fetch(url, {
            headers:{
                Accept: 'application/vnd.github.v3.raw'
            }
        }).then((r)=>{
            if(r.status!==200) {
                throw new Error('fetch error: '+url);
            }
            return r.text();
        });
    } else{
        return fetch(url).then((r)=>{
            if(r.status!==200) {
                throw new Error('fetch error: '+url);
            }
            return r.json();
        });
    }
}

function findDirUrl(dirname) {
    return function(json) {
        let idx=json.tree.findIndex(x=>x.path===dirname);
        if(idx<0) {
            throw new Error(`dir ${dirname} not found`);
        }
        return json.tree[idx].url;
    }
}

ajax('https://api.github.com/repos/ren1244/ren1244.github.io/git/trees/master')
.then(findDirUrl('epubReader'))
.then(ajax)
.then((json)=>{
    //檔案
    let files=['index.html', 'style.html'];
    let dictUrl=findDirUrl('dist')(json);
    let arr=json.tree.filter(o=>files.indexOf(o.path)>=0).map(o=>{
        return {
            url: `epubReader/${o.path}`,
            file: o.path
        }
    });
    return ajax(dictUrl).then(json2=>{
        json2.tree.forEach(o=>{
            if(o.path.search(/\.(js|css)$/)>=0) {
                arr.push({
                    url: `epubReader/dist/${o.path}`,
                    file: `dist/${o.path}`
                })
            }
        });
        return arr;
    });
}).then(arr=>{
    let parr=arr.map((o)=>{
        return ajax(`https://api.github.com/repos/ren1244/ren1244.github.io/contents/${o.url}`, true)
        .then((t)=>{
            zip.file(o.file, t);
            console.log(o.file, t.length);
        });
    });
    return Promise.all(parr);
}).then(()=>{
    zip.generateAsync({type:"base64"}).then(function (base64) {
        let url="data:application/zip;base64," + base64;
        let a=document.querySelector('a');
        a.setAttribute('download', '簡樸epub閱讀器.zip');
        a.textContent='簡樸epub閱讀器.zip';
        a.href=url;
        document.querySelector('#log').setAttribute('style', 'display:none');
    });
}).catch(()=>{
    document.querySelector('#log').textContent='發生錯誤';
});
