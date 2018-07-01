var pre=document.getElementById("preview");
var inp=document.getElementById("input");
var bbc=document.getElementById("bbcode");
var tab=document.getElementById("tab");
var lang=document.getElementById("lang");
var lang_use=document.getElementById("lang-use");
var theme=document.getElementById("theme");
var theme_css=document.getElementById("theme-css");
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
		tabReplace: '        '.substr(-parseInt(tab.value,10)),
		classPrefix:'hljs-'
	});
	refreshOutput();
}
function onChangeLang()
{
	refreshOutput();
}
function onThemeChange()
{
	theme_css.href=theme.value;
}
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
	//hljs.highlightBlock(pre);
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
theme_css.addEventListener("load",function (){
	bbc.value=getBBCode(pre);
});
function getBBCode(ele)
{
	var str,undo;
	var stack_node,stack_attr;//{node,color,bold,italic};
	if(ele.firstChild===null)
		return "null";
	var i,nd,n,top,attr_change=false,c_style;
	stack_node=[{nodes:ele.childNodes,"idx":0,"endTag":"[/size][/font][/td][/tr][/table]"}];
	c_style=window.getComputedStyle(ele,null);
	str="[table width=98% cellspacing=1 border=1][tr][td bgcolor="+conv_color(c_style["background-color"])+"][font=Courier New][size=2][color="+conv_color(c_style["color"])+"]";
	//console.log(c_style);
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
}
(function init()
{//init the select list
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
})();
onChangeTab();
refreshOutput();
resize();
