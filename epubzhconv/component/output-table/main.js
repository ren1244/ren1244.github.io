import style from './style.css';
import templateHtml from './template.html';
import OutputTr from '../output-tr/main.js';

class OutputTable {
    constructor(containerElement) {
        let temp = document.createElement('template');
        temp.innerHTML = templateHtml;
        this.tableEle = temp.content.querySelector('.output-table');
        this.dlAllEle = temp.content.querySelector('.output-table-dl-all');
        this.tableEle.style.display = 'none';
        containerElement.appendChild(temp.content);

        //OutputTr => filename
        this.trObjects = new Map();

        //filename => OutputTr
        this.filenames = {};

        //download all file
        this.url = false;

        this.tableEle.addEventListener('delete-output-tr', this.onDeleteTr.bind(this));
    }

    push(filename, convOpt) {
        if (this.filenames[filename]) {
            return false;
        }
        this.tableEle.removeAttribute('style');
        let o = new OutputTr(this.tableEle.tBodies[0], filename, convOpt);
        this.filenames[filename] = o;
        this.trObjects.set(o, filename);
        return true;
    }

    onDeleteTr(evt) {
        let o = evt.detail.component;
        let fname = this.trObjects.get(o);
        this.trObjects.delete(o);
        delete this.filenames[fname];
        if(Object.keys(this.filenames).length<=0) {
            this.tableEle.style.display = 'none';
        }
        this.hideDownloadAll()
        this._sendDoneEventIfComplete();
    }

    finish(fname, data) {
        if (!this.filenames[fname]) {
            return;
        }
        let trObj = this.filenames[fname];
        trObj.finish(data);
        this._sendDoneEventIfComplete();
    }

    log(fname, msg) {
        if (!this.filenames[fname]) {
            return;
        }
        let trObj = this.filenames[fname];
        trObj.log(msg);
    }

    error(fname, msg) {
        if (!this.filenames[fname]) {
            return;
        }
        let trObj = this.filenames[fname];
        trObj.error(msg);
    }

    _sendDoneEventIfComplete() {
        let dataCollection = {};
        let count = 0;
        for(let fname in this.filenames) {
            let o = this.filenames[fname];
            if(!o.finalData) {
                return;
            }
            dataCollection[fname] = o.finalData;
            ++count;
        }
        if(count>0) {
            this.tableEle.dispatchEvent(new CustomEvent('output-table-complete', {
                bubbles: true,
                detail: dataCollection
            }));
        }
    }

    showDownloadAll(fname, data) {
        if(this.url) {
            URL.revokeObjectURL(this.url);
        }
        this.url = URL.createObjectURL(new Blob([data]));
        this.dlAllEle.removeAttribute('style');
        let aTag = this.dlAllEle.querySelector('a');
        aTag.href = this.url;
        aTag.download = fname;
    }

    hideDownloadAll() {
        this.dlAllEle.setAttribute('style', 'display: none');
    }
}
export default OutputTable;