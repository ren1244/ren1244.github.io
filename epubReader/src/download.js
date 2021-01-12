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
    let file2url={};
    let reg=/^(dict\/.*\.(js|css)|index\.html|style\.html)$/;
    let arr=json.tree.filter(o=>o.path.search(reg)>=0).map((o)=>{
        return ajax(`https://api.github.com/repos/ren1244/ren1244.github.io/contents/epubReader/${o.path}`, true)
        .then((t)=>{
            zip.file(o.path, t);
        });
    });
    return Promise.all(arr);
}).then(()=>{
    zip.generateAsync({type:"base64"}).then(function (base64) {
        let url="data:application/zip;base64," + base64;
        let a=document.querySelector('a');
        a.setAttribute('download', '簡樸epub閱讀器.zip');
        a.textContent='簡樸epub閱讀器.zip';
        a.href=url;
    });
});
