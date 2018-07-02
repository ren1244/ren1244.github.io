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
	pre.className="hljs "+out.language;
	pre.innerHTML=out.value;
	bbc.value=getBBCode(pre);
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
function getBBCode(ele)
{
	var str,undo;
	var stack_node,stack_attr;
	if(ele.firstChild===null)
		return "null";
	var i,nd,n,top,attr_change=false,c_style;
	stack_node=[{nodes:ele.childNodes,"idx":0,"endTag":"[/size][/font][/td][/tr][/table]"}];
	c_style=window.getComputedStyle(ele,null);
	str="[table width=98% cellspacing=1 border=1][tr][td bgcolor="+conv_color(c_style["background-color"])+"][font=Courier New][size=2][color="+conv_color(c_style["color"])+"]";
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
	function conv_color(cstr)
	{
		var mch=cstr.match(/\d+/gi);
		return "#"
		+("0"+parseInt(mch[0],10).toString(16)).substr(-2)
		+("0"+parseInt(mch[1],10).toString(16)).substr(-2)
		+("0"+parseInt(mch[2],10).toString(16)).substr(-2);
	}
}
function copyBBC()
{
	bbc.select();
	document.execCommand("copy");
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
	var b_list=[],d_list=[];
	for(i=0,n=prefix_list.length;i<n;++i)
	{
		if(colorStyle(prefix_list[i])==0)
			b_list.push(prefix_list[i]);
		else
			d_list.push(prefix_list[i]);
	}
	theme.appendChild(t=document.createElement("option"));
	t.innerHTML="亮系風格";
	t.disabled=true;
	for(i=0,n=b_list.length;i<n;++i)
	{
		theme.appendChild(t=document.createElement("option"));
		t.innerHTML=b_list[i];
	}
	theme.appendChild(t=document.createElement("option"));
	t.innerHTML="暗系風格";
	t.disabled=true;
	for(i=0,n=d_list.length;i<n;++i)
	{
		theme.appendChild(t=document.createElement("option"));
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
		return colorMax(c_style["color"])<colorMax(c_style["backgroundColor"])?0:1;
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
