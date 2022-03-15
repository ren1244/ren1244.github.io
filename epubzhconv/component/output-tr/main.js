import style from './style.css';
import templateHtml from './template.html';

class OutputTr {
    constructor(containerElement, filename, convOpt) {
        let temp = document.createElement('template');
        temp.innerHTML = templateHtml;
        this.trEle = temp.content.querySelector('.output-tr');
        containerElement.appendChild(temp.content);

        this.filename = filename;
        this.trEle.querySelector('.output-tr-filename').textContent = filename;
        this.trEle.querySelector('.output-tr-info').textContent = this.getInfoStr(filename, convOpt);
        this.msg = this.trEle.children[1].querySelector('span');
        this.aTag = this.trEle.children[1].querySelector('a');
        this.closeBtn = this.trEle.children[2].querySelector('button');
        this.closeBtn.addEventListener('click', this.destory.bind(this));
        this.url = false;
        this.finalData = false;
    }

    destory() {
        if (this.url) {
            URL.revokeObjectURL(this.url);
        }
        this.trEle.parentElement.dispatchEvent(new CustomEvent('delete-output-tr', {
            bubbles: true,
            detail: {
                component: this
            }
        }));
        this.trEle.parentElement.removeChild(this.trEle);
    }

    finish(data) {
        this._updateUrl(data);
        this.closeBtn.removeAttribute('style');
        this.msg.setAttribute('style', 'display: none');
        this.aTag.removeAttribute('style');
        this.aTag.href = this.url;
        this.aTag.download = this.filename;
        this.aTag.textContent = this.filename;
    }

    log(msg) {
        this.msg.textContent = msg;
    }

    error(msg) {
        this.closeBtn.removeAttribute('style');
        this.msg.textContent = msg;
    }

    _updateUrl(data) {
        if (this.url) {
            URL.revokeObjectURL(this.url);
        }
        this.finalData = data;
        data = new Blob([data]);
        this.url = URL.createObjectURL(data);
    }

    getInfoStr(fname, opt) {
        let pos = fname.lastIndexOf('.');
        let ext = pos >= 0 ? fname.slice(pos + 1) : null;
        if (ext === 'epub') {
            return `(epub ; ${opt.loca.from} => ${opt.loca.to})`;
        } else {
            return `(${opt.encoding} => utf-8 ; ${opt.loca.from} => ${opt.loca.to})`;
        }
    }
}
export default OutputTr;