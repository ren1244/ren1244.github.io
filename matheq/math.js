document.addEventListener("DOMContentLoaded",function (evt){
	var onchangeInput=initOnChangeInput();
	document.addEventListener("change",onchangeInput);
	document.addEventListener("keyup",onchangeInput);
	document.getElementById("save").addEventListener("click",function (){
		html2canvas(document.querySelector("#output")).then(canvas => {
			var a=document.getElementById("picLink");
			a.href=canvas.toDataURL();
			a.download="eq.png";
			a.click();
		});
	});
	document.getElementById("copy").addEventListener("click",function (){
		var urlDisplay=document.getElementById("url");
		urlDisplay.select();
		document.execCommand('copy');
	});
	document.getElementById("getUrl").addEventListener("click",function (){
		var pos=location.href.search(/\?/g);
		var url=pos>=0?location.href.substr(0,pos):location.href;
		url+="?"+document.getElementById("input").value.toUTF8Array().deflate().encodeBase64().replace(/\+/g,"-").replace(/\//g,"_");
		var urlDisplay=document.getElementById("url");
		urlDisplay.parentElement.setAttribute("style","display:inline-block");
		urlDisplay.value=url;
		urlDisplay.select();
	});
	var pos=location.href.search(/\?/g);
	var data;
	if(pos<0)
		return;
	data=location.href.substr(pos+1);
	data=data.replace(/-/g,"+").replace(/_/g,"/").decodeBase64();
	data=data.inflate().toUTF8String();
	document.getElementById("input").value=data;
	onchangeInput();
});

function initOnChangeInput()
{
	var out=document.getElementById("output");
	var inp=document.getElementById("input");
	var ts=0,delay=300,flag=false;
	return function(evt)
	{
		ts=Date.now();
		if(!flag)
		{
			flag=true;
			setTimeout(proc0,delay);
		}
	}
	function proc0()
	{
		flag=false;
		var t=Date.now();
		if(t-ts>=delay)
		{
			out.innerHTML=inp.value.replace(/\\\[/g,'<div class="eq-ib">\\[').replace(/\\\]/g,'\\]</div>');
			MathJax.Hub.Typeset();
		}
		else
		{
			flag=true;
			setTimeout(proc0,t+delay-ts);
		}
	}
}
