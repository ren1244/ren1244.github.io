import './style.css';
const epubReader=require('./epubReader.js');

let ele={};
let queryParams={};
let epub;

document.addEventListener("DOMContentLoaded",function(evt){
	['uploader','list','content','nav','dir','page','epub'].forEach(function(id){
		ele[id]=document.getElementById(id);
	});
	divSwitch('epub');
	ele.uploader.addEventListener('drop',function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
		ele.uploader .removeAttribute("style");
		loadEpubFile(evt.dataTransfer.files[0]);
	},true);

	ele.uploader.addEventListener('dragover',function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
		ele.uploader .setAttribute("style","border:2px solid lightgray;");
	},true);

	ele.uploader.addEventListener('dragleave',function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
		ele.uploader .removeAttribute("style");
	},true);

	ele.uploader.addEventListener('click',(function (evt) {
		let uploder=document.createElement('input');
		uploder.setAttribute('type','file');
		uploder.addEventListener('change',function(evt){
			var file=uploder.files[0];
			loadEpubFile(uploder.files[0]);
		});
		return function(){
			uploder.click();
		}
	})());
	
	let pos=location.href.indexOf('#');
	if(pos>0) {
		location.href.slice(pos+1).split('&').forEach((x)=>{
			x=x.trim();
			if(x=='') {
				return;
			}
			let arr=x.split('='),k;
			if(arr.length>0 && (k=arr[0].trim()).length>0) {
				queryParams[k]=arr.length===1?'':arr[1].trim();
			}
		});
	}
});

/** 
 * 讀取 epub 檔案
 *
 * @param File物件 file 要讀取的epub 檔案
 * @return void
 */
function loadEpubFile(file)
{
	new Promise(function(success, error){
		let frd=new FileReader();
		frd.onload=success;
		frd.readAsArrayBuffer(file);
	}).then(function(evt){
		return new Promise(function(success,error){
			epub=new epubReader(evt.target.result,function(){
				success();
			}, queryParams['merge']==='1'?true:false);
		});
	}).then(function(){
		//讀取epub產生目錄
		ele.list.innerHTML='';
		let ul=document.createElement('ul');
		ele.list.appendChild(ul);
		for(let i in epub.pageList) {
			let page=epub.pageList[i];
			let li=document.createElement('li');
			ul.appendChild(li);
			li.textContent=page['title']!==undefined?page['title']:'(無標題)';
			li.addEventListener('click',(function(pageIdx){
				return function(){
					epub.getPageContent(pageIdx,function(htmlData){
						refreshPage(pageIdx, htmlData);
					});
				}
			})(i));
		}
		//匯入自訂顏色
		let urlobj=new URL(location.href);
		['tc', 'bc', 'lc'].forEach((k)=>{
			let c=urlobj.searchParams.get(k);
			if(c!==null) {
				switch(k) {
					case 'tc':
						document.body.style.color='#'+c;
						break;
					case 'bc':
						document.body.style.backgroundColor='#'+c;
						break;
					case 'lc':
						ele['nav'].style.color='#'+c;
						break;
				}
			}
		});
		divSwitch('dir');
		document.title="目錄";
	});
}

/** 
 * 顯示文章頁面
 *
 * @param integer pageIdx 第幾頁
 * @param string htmlData 這頁的html
 * @return void
 */
function refreshPage(pageIdx, htmlData)
{
	pageIdx=parseInt(pageIdx,10);
	ele.content.innerHTML=htmlData;
	ele.nav.innerHTML='';
	let title=epub.pageList[pageIdx]['title'];
	document.title=title!==undefined?title:'';
	let span;
	if(pageIdx>0){
		ele.nav.appendChild(span=document.createElement('span'));
		span.textContent='上頁';
		span.addEventListener('click',(function(pageIdx){
			return function(){
				epub.getPageContent(pageIdx,function(htmlData){
					refreshPage(pageIdx, htmlData);
				});
			}
		})(pageIdx-1));
		ele.nav.appendChild(document.createTextNode(' '));
	}
	ele.nav.appendChild(span=document.createElement('span'));
	span.textContent='目錄';
	span.addEventListener('click',function(){
		document.title="目錄";
		window.scrollTo(0,0);
		divSwitch('dir');
	});
	if(pageIdx<epub.pageList.length-1){
		ele.nav.appendChild(document.createTextNode(' '));
		ele.nav.appendChild(span=document.createElement('span'));
		span.textContent='下頁';
		span.addEventListener('click',(function(pageIdx){
			return function(){
				epub.getPageContent(pageIdx,function(htmlData){
					refreshPage(pageIdx, htmlData);
				});
			}
		})(pageIdx+1));
	}
	window.scrollTo(0,0);
	divSwitch('page');
}

/** 
 * 切換分頁
 *
 * @param string show_id 要顯示的分頁id(其餘分頁隱藏)
 * @return void
 */
function divSwitch(show_id)
{
	['page','epub','dir'].forEach(function(id){
		if(show_id===id) {
			ele[id].removeAttribute('style');
		} else {
			ele[id].setAttribute('style','display:none');
		}
	});
}