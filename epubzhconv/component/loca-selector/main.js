import style from './style.css';
import templateHtml from './template.html';

const storageName = 'loca-selector';

class LocaSelector {
    constructor(containerElement) {
        let temp = document.createElement('template');
        temp.innerHTML = templateHtml;
        this.warpEle = temp.content.querySelector('.loca-selector');
        this.encEle = temp.content.querySelector('.loca-selector-enc');
        containerElement.appendChild(temp.content);

        this.fromEle = this.warpEle.querySelector('.loca-selector-from');
        this.toEle = this.warpEle.querySelector('.loca-selector-to');

        //從 locastorage 讀取之前的設定
        let loca
        try {
            loca = JSON.parse(localStorage.getItem(storageName));
            if (!(loca instanceof Object)) {
                throw 'not object';
            }
        } catch (e) {
            loca = {
                from: 'cn',
                to: 'tw',
                encoding: 'utf-8'
            };
        }
        this.setSelectValue(this.fromEle, loca.from);
        this.setSelectValue(this.toEle, loca.to);
        this.setSelectValue(this.encEle, loca.encoding);
        this.fromEle.addEventListener('change', this.saveToLocalStorage.bind(this));
        this.toEle.addEventListener('change', this.saveToLocalStorage.bind(this));
        this.encEle.addEventListener('change', this.saveToLocalStorage.bind(this));
    }

    setSelectValue(ele, value) {
        let opts = ele.options, idx;
        for (idx = opts.length-1; idx >=0 ; --idx) {
            if(opts[idx].value === value) {
                break;
            }
        }
        if(idx>=0) {
            ele.selectedIndex = idx;
        }
    }

    saveToLocalStorage(evt) {
        localStorage.setItem(storageName, JSON.stringify(this.getData()));
    }

    getData() {
        return {
            from: this.fromEle.value,
            to: this.toEle.value,
            encoding: this.encEle.value
        };
    }
}
export default LocaSelector;