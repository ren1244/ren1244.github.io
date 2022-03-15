let convertWorker = new Worker("convert-worker.js");
let c1 = document.querySelector('#c1');
let c2 = document.querySelector('#c2');
let loca = new MyComponent.LocaSelector(c1);
let file = new MyComponent.FileUploader(c1);
let outTb = new MyComponent.OutputTable(c2);

convertWorker.addEventListener('message', (worker) => {
    let filename = worker.data.filename;
    let data = worker.data.data;
    switch (worker.data.status) {
        case 'finish':
            outTb.finish(filename, data);
            break;
        case 'log':
            outTb.log(filename, data);
            break;
        case 'error':
            outTb.error(filename, data);
            break;
        case 'pack-finish':
            checkSingleFile.busy = false;
            if(!checkSingleFile.data) {
                outTb.showDownloadAll(filename, data);
            }
            checkSingleFile.execute();
    }
});

document.body.addEventListener('upload-files', (evt) => {
    outTb.hideDownloadAll();
    let files = evt.detail.files;
    let ignoreFiles = [];
    for (let i = 0; i < files.length; ++i) {
        let opt = loca.getData();
        opt.loca = {
            from: opt.from,
            to: opt.to
        };
        if (outTb.push(files[i].name, opt)) {
            opt.file = files[i];
            opt.api = 'convert';
            convertWorker.postMessage(opt);
        } else {
            ignoreFiles.push(files[i].name);
        }
    }
    if (ignoreFiles.length > 0) {
        alert('因檔名重複，忽略了以下檔案：\n' + ignoreFiles.join('\n'));
    }
});

const checkSingleFile = {
    busy: false,
    data: false,
    push(data) {
        this.data = data;
        this.execute();
    },
    execute() {
        if(!this.busy && !!this.data) {
            let tmp = this.data;
            this.busy = true;
            this.data = false;
            convertWorker.postMessage({
                api: 'pack',
                data: tmp
            });
        }
    }
}

document.body.addEventListener('output-table-complete', (evt) => {
    checkSingleFile.push(evt.detail);
});
