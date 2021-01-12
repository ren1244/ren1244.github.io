import './style.css';
import '@simonwep/pickr/dist/themes/monolith.min.css';
import Pickr from '@simonwep/pickr';

let picker;
let color=(()=>{
    let o={
        type:'text'
    };
    let cfg={
        text: 'ccc',
        back: '333',
        link: 'cc3'
    };
    Object.keys(cfg).forEach((k)=>{
        let k2='_'+k;
        o[k2]=cfg[k];
        Object.defineProperty(o, k, {
            get: function() {
                return this[k2];
            },
            set: function(x) {
                this.type=k;
                this[k2]=x;
            },
        });
    });
    return o;
})();
let navSpan;

document.addEventListener('DOMContentLoaded', function(){
    document.querySelector('#radio-set').addEventListener('change', onChangeRadio);
    document.querySelector('#radio-set').addEventListener('click', function(){
        picker.show();
    });
    let cfg={
        el: '.color-picker',
        container: '#aaa',
        theme: 'monolith', // or 'monolith', or 'nano',
        lockOpacity: true,
        position: 'bottom-middle',
        useAsButton: true,
    
        components: {
    
            // Main components
            hue: true,
    
            // Input / output Options
            interaction: {
                input: true,
                hex: true,
                rgba: true,
                hsla: true,
                save: false
            }
        }
    }
    picker=Pickr.create(cfg).on('change', onColorSelect);
    navSpan=document.querySelector('#nav>span');
    document.body.style.color=color.text;
    document.body.style.backgroundColor=color.back;
    navSpan.style.color=color.link;
    navSpan.addEventListener('click', function(){
        location.href=`./index.html?tc=${encodeURIComponent(color.text)}&bc=${encodeURIComponent(color.back)}&lc=${encodeURIComponent(color.link)}`;
    })
});

function onColorSelect(c, s, o) {
    let cs=c.toHEXA().join('');
    color[color.type]=cs;
    switch(color.type) {
        case 'text':
            document.body.style.color='#'+cs;
            break;
        case 'back':
            document.body.style.backgroundColor='#'+cs;
            break;
        case 'link':
            navSpan.style.color='#'+cs;
            break;
    }
}

function onChangeRadio(e) {
    let k=e.target.dataset.type;
    color.type=k;
    picker.setColor(color[k]); //初始化顏色
}