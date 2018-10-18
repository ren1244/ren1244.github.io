document.addEventListener("DOMContentLoaded",function (evt){
	var onchangeInput=initOnChangeInput();
	//document.addEventListener("change",onchangeInput);
	//document.addEventListener("keyup",onchangeInput);
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
		url+="?"+CKEDITOR.instances.input.getData().toUTF8Array().deflate().encodeBase64().replace(/\+/g,"-").replace(/\//g,"_");
		var urlDisplay=document.getElementById("url");
		urlDisplay.parentElement.setAttribute("style","display:inline-block");
		urlDisplay.value=url;
		urlDisplay.select();
	});
	window.addEventListener('resize',resize);
	CKEDITOR.replace('input',{
		on:{
			'instanceReady':()=>{
				resize();
				var pos=location.href.search(/\?/g);
				var data;
				if(pos<0)
					return;
				data=location.href.substr(pos+1);
				data=data.replace(/-/g,"+").replace(/_/g,"/").decodeBase64();
				data=data.inflate().toUTF8String();
				CKEDITOR.instances.input.setData(data);
				console.log(data);
				onchangeInput();
			},
			'change':onchangeInput
		},
		customConfig:'../cke_config.js'
	});
});

function initOnChangeInput()
{
	var out=document.getElementById("output");
	var ts=0,delay=400,flag=false;
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
			out.innerHTML=CKEDITOR.instances.input.getData();
			MathJax.Hub.Typeset();
		}
		else
		{
			flag=true;
			setTimeout(proc0,t+delay-ts);
		}
	}
}
function resize(evt)
{
	var h0=window.innerHeight,
	    h1=document.getElementById("tools").getBoundingClientRect().height;
	CKEDITOR.instances.input.resize("100%",(h0-h1-2));
	document.getElementById("ct-output").style.height=(h0-h1-2)+"px";
}
