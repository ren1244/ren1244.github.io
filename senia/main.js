var current_img_idx;
var scroll_target,scroll_current,scroll_id,scroll_t;
var tag_pos;
var current_select_tag;
var slideshow;
var pwdHash;
var imgUrls={};

var decoder=(function(){
	let queue=[];
	let status=0;
	let current;
	let callback;
	return function(url, data, cbk){
		if(cbk) {
			callback=cbk;
		}
		queue.push({url:url,data:data});
		run();
	}
	function run(){
		if(status || queue.length===0) {
			return;
		}
		status=1;
		current=queue[0];
		queue=queue.slice(1);
		setTimeout(dec,10);
	}
	function dec()
	{
		let cipher=current.data;
		let data=new Uint8Array(cipher, 16);
		let iv=new Uint8Array(cipher, 0, 16);
		if(callback) {
			data=data.decipher('aes_cbc_pkcs7', pwdHash, iv);
			callback(current.url, data);
		}
		status=0;
		run();
	}
})();


function loadBodyContent(bt)
{
	bt.disabled=true;
	pwdHash=document.getElementById('pwd').value.bin('utf8').sha2('256');
	var xhr=new XMLHttpRequest();
	xhr.open('GET','body.txt');
	xhr.responseType='arraybuffer';
	xhr.onreadystatechange=function (){
		if(this.readyState==4){
			if(this.status==200){
				decoder('',this.response,function(url,data){
					data=data.str('utf8');
					if(data!==false) {
						let mch=data.match(/<!--title=(.*?)-->/);
						if(mch!==null) {
							document.title=mch[1];
						}
						let div=document.getElementById('div-password');
						div.parentElement.removeChild(div);
						loadImages(data, init);
					} else {
						bt.disabled=false;
					}
				});
				//let data=decoder(this.response).str('utf8');				
			} else {
				bt.disabled=false;
			}
		}
	}
	
	xhr.send();
}

function init(bodyContent)
{
	document.body.innerHTML=bodyContent;
	let imgs=document.getElementsByTagName('img');
	for(let i=imgs.length-1; i>=0; --i) {
		if(imgUrls[imgs[i].dataset.src]) {
			imgs[i].src=imgUrls[imgs[i].dataset.src];
		}
	}
	window.addEventListener('resize',resize_proc);
	current_img_idx=0;
	//隱藏原本的ul圖片列表
	slideshow=initSlideshow("slideshow",'slideshow_ani_start');
	//處理圖片縮圖按鈕
	var p,ele,idx,t;
	p=document.getElementById("slideshow_menu").children;
	p[0].children[1].setAttribute("class","over_current");
	for(idx=p.length-1;idx>=0;--idx)
	{
		ele=p[idx];
		ele.setAttribute("onclick","slideshow("+idx+")");
	}
	//
	initTagPosition();
	current_select_tag=0;
	window.addEventListener("scroll", myScroll);
}
function loadImages(bodyContent, cbk)
{
	let reg=/<img\s+data-src="(.*?)"/g;
	let mch;
	let count=0;
	let log=document.getElementById('log');
	while((mch=reg.exec(bodyContent))!==null) {
		let url=mch[1];
		let p=document.createElement('p');
		let span=document.createElement('span');
		p.textContent=url+' ... ';
		p.appendChild(span);
		log.appendChild(p);
		let xhr=new XMLHttpRequest();
		xhr.responseType='arraybuffer';
		xhr.open('GET',url);
		xhr.onreadystatechange=(function(url,span){
			return function(evt){
				if(this.readyState==4){
					span.innerHTML='解密中';
					span.offsetHeight;
					if(this.status==200){
						decoder([url,span],this.response,
							 function(obj,data){
								let ext=obj[0].match(/\.(.*)$/)[1];
								if(ext==='jpg') {
									ext='jpeg';
								} else if(ext==='svg') {
									ext='svg+xml';
								}
								imgUrls[obj[0]]=URL.createObjectURL(new Blob([data],{type:'image/'+ext}));
								log.removeChild(obj[1].parentElement);
								if(--count==0 && cbk) {
									cbk(bodyContent);
								}
							}
						);
					} else {
						console.log(me.dataset.src+'載入失敗');
						if(--count==0 && cbk) {
							cbk(bodyContent);
						}
					}
					
				}
			}
		})(url,span);
		xhr.addEventListener('progress',(function(span){
			return function(evt){				
				span.innerHTML=evt.loaded;
				span.offsetHeight;
			}
		})(span));
		++count;
		span.textContent='讀取中';
		xhr.send();
	}
}
function initSlideshow(ul_id, animation)
{
	let ul=document.getElementById(ul_id);
	let img1=document.createElement('img');
	let img2=document.createElement('img');
	let ani=animation;
	let srcList=[];
	let current_index=0;
	(function(){
		let i,n=ul.children.length;
		for(i=0;i<n;++i){
			ul.children[i].style.display='none';
			srcList.push(ul.children[i].getElementsByTagName('img')[0].src);
		}
		let li=document.createElement('li');
		let div=document.createElement('div');
		ul.insertBefore(li,ul.children[0]);
		div.appendChild(img1);
		div.appendChild(img2);
		li.appendChild(div);
		div.setAttribute('style','display:inline-block;position:relative');
	})();
	img1.src=srcList[0];
	img2.src=srcList[0];
	img2.addEventListener('animationend',function(){
		img1.src=img2.src;
	});
	img2.setAttribute('style','position:absolute;top:0px;left:0px;');
	return function(idx){
		img2.className='';
		img2.offsetHeight;
		img2.className=ani;
		img2.src=srcList[idx];
		current_index=idx;
		//處理縮圖區
		var i,p;
		p=document.getElementById("slideshow_menu").children;
		for(i=p.length-1;i>=0;--i)
		{
			p[i].children[1].setAttribute("class",i==idx?"over_current":"over");
		}
	};
}

function myScroll()
{
	var y=window.scrollY+window.innerHeight*0.3;
	var i,N;
	for(i=0,N=tag_pos.length;i<N && tag_pos[i]<=y;++i);
	--i;
	i=i>=N?N-1:i;
	menuSelect(i);
}
function initTagPosition()
{
	tag_pos=[];
	tag_pos.push(document.getElementById("home").offsetTop+(window.innerWidth<=600?0:-55));
	tag_pos.push(document.getElementById("story").offsetTop+(window.innerWidth<=600?0:-55));
	tag_pos.push(document.getElementById("character").offsetTop+(window.innerWidth<=600?0:-55));
	tag_pos.push(document.getElementById("system").offsetTop+(window.innerWidth<=600?0:-55));
	tag_pos.push(document.getElementById("download").offsetTop+(window.innerWidth<=600?0:-55));
}
function menuSelect(idx)
{
	if(current_select_tag==idx)
		return;
	var i;
	var A=document.getElementById("nav-list").children;
	current_select_tag=idx;
	for(i=A.length-1;i>=0;--i)
	{
		if(i!=idx)
			A[i].removeAttribute("class");
		else
			A[i].setAttribute("class","nav-selected");
	}
}

function scrollToElement(id)
{
	initTagPosition();
	var obj=document .getElementById(id);
	//window.scrollTo(0,t.offsetTop);
	scroll_target=obj.offsetTop+(window.innerWidth<=600?0:-55);
	if(window.innerWidth<=600)
		menu_hide();
	scroll_current=window.scrollY;
	scroll_t=0;
	if(scroll_id!==null)
	{
		clearInterval(scroll_id);
		scroll_id=null;
	}
	window.removeEventListener("scroll",myScroll);
	scroll_id=setInterval(function(){
		var v_max=3;//速度上限 0.5 px/ms = 500 px/s
		var a=v_max/750; //加速度 0.2 秒加速到上限
		
		var cur=window.scrollY;
		var L=Math.abs(scroll_target-scroll_current);
		var y;
		
		scroll_t+=50;
		
		if(L>=v_max*v_max/a)
		{
			if(scroll_t<=v_max/a)
			{
				y=0.5*a*scroll_t*scroll_t;
				y=scroll_target>scroll_current?scroll_current+y:scroll_current-y;
				window.scrollTo(0,y);
			}
			else if(scroll_t<=L/v_max)
			{
				y=v_max*scroll_t-v_max*v_max/2/a;
				y=scroll_target>scroll_current?scroll_current+y:scroll_current-y;
				window.scrollTo(0,y);
			}
			else if(scroll_t<=L/v_max+v_max/a)
			{
				y=L-v_max*v_max/2/a+v_max*(scroll_t-L/v_max)-0.5*a*(scroll_t-L/v_max)*(scroll_t-L/v_max);
				y=scroll_target>scroll_current?scroll_current+y:scroll_current-y;
				window.scrollTo(0,y);
			}
			else
			{
				window.addEventListener("scroll", myScroll);
				window.scrollTo(0,scroll_target);
				clearInterval(scroll_id);
				scroll_id=null;
				myScroll();
			}
		}
		else{
			var mid_t=Math.sqrt(L/a);
			if(scroll_t<=mid_t)
			{
				y=0.5*a*scroll_t*scroll_t;
				y=scroll_target>scroll_current?scroll_current+y:scroll_current-y;
				window.scrollTo(0,y);
			}
			else if(scroll_t<=mid_t*2)
			{
				var tt=Math.sqrt(L/a);
				y=L/2+(scroll_t-tt)*(tt*a-0.5*a*(scroll_t-tt));
				y=scroll_target>scroll_current?scroll_current+y:scroll_current-y;
				window.scrollTo(0,y);
			}
			else
			{
				window.addEventListener("scroll", myScroll);
				window.scrollTo(0,scroll_target);
				clearInterval(scroll_id);
				scroll_id=null;
				myScroll();
			}
		}
	},50);
}
function resize_proc()
{
	initTagPosition();
	if(window.innerWidth<=600)
		menu_hide();
	else
		menu_show();
}
function menu_hide()
{
	document.getElementById("navobj").setAttribute("style","display:none;");
}
function menu_show()
{
	document.getElementById("navobj").removeAttribute("style");
}

