var pre=document.getElementById("preview");
var inp=document.getElementById("input");
var bbc=document.getElementById("bbcode");
var tab=document.getElementById("tab");
var lang=document.getElementById("lang");
var lang_use=document.getElementById("lang-use");
var theme=document.getElementById("theme");
var ctn=document.getElementsByClassName("content-row")[0];
var trans={
	"cpp":"C/C++",
	"cs":"C#",
	"css":"CSS",
	"http":"HTTP/HTTPS",
	"java":"Java",
	"javascript":"JavaScript",
	"json":"JSON",
	"objectivec":"Objective C",
	"perl":"Perl",
	"php":"PHP",
	"python":"Python",
	"ruby":"Ruby",
	"sql":"SQL",
	"vbnet":"VB.Net",
	"vbscript":"VBScript",
	"xml":"HTML/XML",
	"html":"HTML/XML"
};

function onChangeTab()
{
	hljs.configure({
		tabReplace: '        '.substr(-parseInt(tab.value,10))
	});
	refreshOutput();
}
function onChangeLang()
{
	refreshOutput();
}
var onThemeChange=(function (){
	var tmp=pre.parentElement.className;
	return function ()
	{
		var pfx=theme.options[theme.selectedIndex].innerHTML;
		pre.parentElement.className=pfx+" "+tmp;
		hljs.configure({
			classPrefix:pfx+'-'
		});
		refreshOutput();
	}
})();

function refreshOutput()
{
	var out;
	if(lang.value=="auto")
		out=hljs.highlightAuto(hljs.fixMarkup(inp.value));
	else
		out=hljs.highlight(lang.value,hljs.fixMarkup(inp.value),true);
	lang_use.textContent=trans[out.language]?trans[out.language]:out.language;
	pre.className=out.language;
	pre.innerHTML=out.value;
}

inp.addEventListener("change",refreshOutput);
inp.addEventListener("keyup",refreshOutput);
tab.addEventListener("change",onChangeTab);
lang.addEventListener("change",refreshOutput);
theme.addEventListener("change",onThemeChange);
window.addEventListener("resize",resize);
function resize()
{
	var h0=document.documentElement.clientHeight-20;
	var h1=document.getElementById("input-bar").offsetHeight;
	var obj=document.getElementsByClassName("auto_height");
	var i;
	for(i=obj.length-1;i>=0;--i)
	{
		obj[i].style.height=(h0-h1)+"px";
	}
}
function getBBCode(ele,bgcolor)
{
	var str,undo;
	var stack_node;
	if(ele.firstChild===null)
		return "null";
	var i,nd,n,top,attr_change=false,c_style;
	stack_node=[{nodes:ele.childNodes,"idx":0,"endTag":"[/size][/font][/td][/tr][/table]"}];
	c_style=window.getComputedStyle(ele,null);
	str="[table width=98% cellspacing=1 border=1][tr][td bgcolor="+conv_color(bgcolor)+"][font=Courier New][size=2][color="+conv_color(c_style["color"])+"]";
	for(n=stack_node.length;n>0;n=stack_node.length)
	{
		top=stack_node[n-1];
		if(top.idx==top.nodes.length)
		{
			str+=top.endTag;
			stack_node.length-=1;
			continue;
		}
		nd=top.nodes[top.idx++];
		switch(nd.nodeType)
		{
		case Node.TEXT_NODE:
			str+=nd.nodeValue;
			break;
		case Node.ELEMENT_NODE:
			c_style=window.getComputedStyle(nd,null);
			str+="[color="+conv_color(c_style["color"])+"]";
			undo="[/color]";
			if(c_style["fontStyle"].toLowerCase()=="italic")
			{
				str+="[i]";
				undo="[/i]"+undo;
			}
			if(c_style["fontWeight"]>550)
			{
				str+="[b]";
				undo="[/b]"+undo;
			}
			stack_node.push({nodes:nd.childNodes,"idx":0,"endTag":undo});
		default:
		}
	}
	str+="";
	return str;
}
function conv_color(cstr)
{
	var mch=cstr.match(/\d+/gi);
	return "#"
	+("0"+parseInt(mch[0],10).toString(16)).substr(-2)
	+("0"+parseInt(mch[1],10).toString(16)).substr(-2)
	+("0"+parseInt(mch[2],10).toString(16)).substr(-2);
}
String.prototype.convHtml=function()
{
	return this.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
}
function getSvg(ele,bgcolor)
{
	var tspan={
		newLine:true,
		y:0,
		dy:20,
		sty:[],
		pushStyle:function(ele){
			var c_style=window.getComputedStyle(ele,null);
			var s={};
			s.color=conv_color(c_style["color"]);
			s.italic=(c_style["fontStyle"].toLowerCase()=="italic"?";font-style:italic":"");
			s.bold=(c_style["fontWeight"]>550?";font-weight:bold":"");
			this.sty.push(s);
		},
		popStyle:function(){
			if(this.sty.length>0)
				this.sty.length-=1;
		},
		getStyle:function (){
			if(this.sty.length>0)
				return this.sty[this.sty.length-1];
			else
				return null;
		},
		writeText:function (txt){
			var arr=txt.split('\n');
			var i,n,v;
			var str="";
			var s=this.getStyle();
			for(i=0,n=arr.length;i<n;++i)
			{
				v=arr[i];
				if(this.newLine)
				{
					this.y+=this.dy;
					str+="<text x='0' y='"+this.y+"' style='font-size:16px;font-family:Courier New' xml:space='preserve'>";
					this.newLine=false;
				}
				str+="<tspan style='fill:"+s.color+s.italic+s.bold+"'>"+v.convHtml()+"</tspan>";
				//str+=v;
				if(i<n-1)
				{
					str+="</text>\n";
					this.newLine=true;
				}
			}
			return str;
		}
	}
	
	var str,tsp;
	var stack_node;
	if(ele.firstChild===null)
		return "null";
	var i,nd,n,top,attr_change=false;
	stack_node=[{nodes:ele.childNodes,"idx":0,"endTag":"</g></svg>"}];
	str='<svg xmlns="http://www.w3.org/2000/svg" style="background-color:'+conv_color(bgcolor)+'"><g>\n';
	tspan.pushStyle(ele);	
	for(n=stack_node.length;n>0;n=stack_node.length)
	{
		top=stack_node[n-1];
		if(top.idx==top.nodes.length)
		{
			str+=top.endTag;
			stack_node.length-=1;
			tspan.popStyle(nd);
			continue;
		}
		nd=top.nodes[top.idx++];
		switch(nd.nodeType)
		{
		case Node.TEXT_NODE:
			str+=tspan.writeText(nd.nodeValue);
			break;
		case Node.ELEMENT_NODE:
			tspan.pushStyle(nd);
			stack_node.push({nodes:nd.childNodes,"idx":0,"endTag":""});
		default:
		}
	}
	str+="";
	return str.replace("</tspan></svg>","</tspan><text></svg>");
}
function copyBBC()
{
	bbc.value=getBBCode(pre,theme.options[theme.selectedIndex].dataset["bgcolor"]);
	bbc.select();
	document.execCommand("copy");
	localStorage.setItem("theme",theme.options[theme.selectedIndex].innerHTML);
}
function getImg()
{
	var div=document.createElement("div");
	document.body.appendChild(div);
	div.setAttribute("style","width:1px;height:1px;box-sizing:content-box;overflow:hidden");
	div.innerHTML=getSvg(pre,theme.options[theme.selectedIndex].dataset["bgcolor"]);
	var svg=div.children[0];
	var bbx=svg.children[0].getBBox();
	svg.setAttributeNS(null,"width",bbx.width+16);
	svg.setAttributeNS(null,"height",bbx.height+16);
	svg.setAttributeNS(null,"viewBox",[bbx.x-8,bbx.y-8,bbx.width+16,bbx.height+16].join(' '));
	var blob=new Blob([div.innerHTML],{type:"image/svg+xml"});
	var img=new Image();
	img.onload=function ()
	{
		var cvs=document.createElement("canvas");
		cvs.width=img.width;
		cvs.height=img.height;
		var ctx=cvs.getContext('2d');
		ctx.drawImage(img,0,0);
		div.removeChild(svg);
		div.appendChild(cvs);
		cvs.toBlob(function (bb){
			var a=document.getElementById("imgdl");
			a.download="code.png";
			a.href=URL.createObjectURL(bb);
			a.click();
			document.body.removeChild(div);
		});
	}
	img.src=URL.createObjectURL(blob);
	localStorage.setItem("theme",theme.options[theme.selectedIndex].innerHTML);
}
(function init(path,prefix_list)
{
	var i,n,t;
	//偵測用暫時物件
	var tmp_pre=document.createElement("pre");
	document.body.appendChild(tmp_pre);
	//程式語言語言選單
	var lang_list=hljs.listLanguages(),
	    i,n,t;
	lang_list.sort();
	for(i=0,n=lang_list.length;i<n;++i)
	{
		lang.appendChild(t=document.createElement("option"));
		
		t.value=lang_list[i];
		if(trans[lang_list[i]])
			t.innerHTML=trans[lang_list[i]];
		else
			console.log(lang_list[i]+" translation error");
	}
	//風格樣式選單
	var b_list=[],d_list=[],tt;
	for(i=0,n=prefix_list.length;i<n;++i)
	{
		tt=colorStyle(prefix_list[i]);
		if(tt.type==0)
		{
			b_list.push(prefix_list[i]);
			b_list.push(tt.bgcolor);
		}
		else
		{
			d_list.push(prefix_list[i]);
			d_list.push(tt.bgcolor);
		}
	}
	theme.appendChild(t=document.createElement("option"));
	t.innerHTML="亮系風格";
	t.disabled=true;
	for(i=0,n=b_list.length;i<n;i+=2)
	{
		theme.appendChild(t=document.createElement("option"));
		t.dataset["bgcolor"]=b_list[i+1];
		t.innerHTML=b_list[i];
	}
	theme.appendChild(t=document.createElement("option"));
	t.innerHTML="暗系風格";
	t.disabled=true;
	for(i=0,n=d_list.length;i<n;i+=2)
	{
		theme.appendChild(t=document.createElement("option"));
		t.dataset["bgcolor"]=d_list[i+1];
		t.innerHTML=d_list[i];
	}
	//載入之前選定風格
	theme.selectedIndex=1;
	if(t=localStorage.theme)
	{
		for(i=theme.options.length-1;i>=0 && theme.options[i].innerHTML!=t;--i);
		if(i>=0)
			theme.selectedIndex=i;
	}
	onThemeChange();
	document.body.removeChild(tmp_pre);
	function colorStyle(cname)
	{
		tmp_pre.className=cname;
		var c_style=getComputedStyle(tmp_pre,null);
		
		return {
			type:colorMax(c_style["color"])<colorMax(c_style["backgroundColor"])?0:1,
			bgcolor:c_style["backgroundColor"]
		};
		//亮色風格回傳0 暗系風格回傳1
	}
	function colorMax(cstr)
	{
		var mch=cstr.match(/\d+/gi);
		return Math.max(parseInt(mch[0],10),parseInt(mch[1],10),parseInt(mch[2],10));
	}
	
})(theme_data.path,theme_data.css);
onChangeTab();
refreshOutput();
resize();

