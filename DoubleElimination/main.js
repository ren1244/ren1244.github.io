/*

getOrder(n)
[說明]
	取得種子球員位置順序
[參數]
	n:參與競賽總數
[回傳]
	整數陣列，個數為m=2^k。
	陣列元素值:第幾個位置。
	陣列索引值:第幾順位。
-------------------------------------
getPlayer(n)
[說明]
	取得該位置是第幾順位種子
[參數]
	n:參與競賽總數
[回傳]
	整數陣列，個數為m=2^k。
	陣列元素值:第幾順位種子(0代表該位置為空)
	陣列索引值:第幾個位置。
-------------------------------------
createDETree(n,playerList)
[說明]
	建立樹狀關係圖(尚未計算前)
[參數]
	n:參與競賽總數
	playerList:由getPlayer(n)產生的陣列
[回傳]
	陣列A
	A[0]=參賽人數，也就是n
	A[1~m]={
		idx:紀錄該index
		link:[index_L,index_R]
			index_L/R:正整數代表連結到A的index，負整數代表"第幾順位種子"
		status:狀態flag
		order:紀錄這是第幾場比賽
		height:紀錄這場比賽是第幾輪(勝部為正偶數，敗部為正整數)
	}
	※m=2^k>=n
-------------------------------------
runDETree(arr)
[說明]
	整理樹狀關係圖(計算輪空後結果與設定場次)
[參數]
	arr:由createDETree產生的陣列
[回傳]
	陣列A，同createDETree描述。
	不同之處：
		index_L/R的負整數更改為由左到右的順序
-------------------------------------

【status 常數】
var checkL:左邊比完
var checkR:右邊比完
var checkF:本場比完
var checkD:本場刪除
var checkA=checkL|checkR:左右比完
var checkM=checkA|checkF|checkD:遮罩

*/
function getOrder(n) //取得種子順序
{
	if(n<2)
		return [];
	var arr,m,i,j,N,sign;
	for(m=1;m<n;m<<=1);
	arr=[0,m-1];
	sign=1;
	for(j=m>>>1;j>2;j>>>=1)
		for(i=arr.length-1;i>=0;--i)
			arr.push(arr[i]+(j-1)*(sign*=-1));
	for(i=arr.length-1;i>=0;--i)
		arr.push(arr[i]+(sign*=-1))
	return arr;
}
function getPlayer(n)
{
	
	var i,arr;
	var od=getOrder(n);
	arr=[];
	arr.length=od.length;
	for(i=1;i<=n;++i)
		arr[od[i-1]]=i;
	for(;i<=od.length;++i)
		arr[od[i-1]]=0;
	return arr;
}

var checkL=1<<24; //左邊比完
var checkR=2<<24; //右邊比完
var checkF=4<<24; //本場比完
var checkD=8<<24; //本場刪除
var checkA=checkL|checkR; //左右比完
var checkM=checkA|checkF|checkD; //左右比完

function createDETree(n,playerList) //建立雙敗淘汰樹
{
	//常數-----------------------------------------
	var k,m; // 2^k=m >= n
	
	//重要物件-----------------------------------------------
	var arr=[n]; //儲存節點的陣列
		
	//雜用變數-----------------------------------------------
	var i_win,i_loss,i_lseed,i_child,i_childL,j,N,t,h;
	//=====================================================
	//計算 k,m
	for(k=0,m=1;m<n;++k,m<<=1);
	//勝部第一輪
	arr.length=m*2-1;
	for(i_win=0,N=m>>>1;i_win<N;++i_win)
	{
		t={
			idx:-1,
			link:[-playerList[i_win*2],-playerList[i_win*2+1]],
			status:checkL|checkR,
			order:0,
			height:0
		};
		arr[i_win+1]=t;
	}
	//其他場次
	i_childL=i_child=1;
	i_win=1+(m>>>1);
	i_loss=m;
	for(h=2;h<=k;++h)
	{
		N=m>>>h;
		i_lseed=i_loss+N;
		for(j=0;j<N;++j)
		{
			arr[i_lseed++]={idx:-1,link:[i_loss,i_win],status:0,order:0,height:(h-1)*2};
			arr[i_win++] ={idx:-1,link:[i_child,i_child+1],status:0,order:0,height:(h-1)*2};
			arr[i_loss++]={idx:-1,link:[i_childL,i_childL+1],status:0,order:0,height:(h-1)*2-1};
			i_child+=2;
			i_childL+=2;
		}
		i_childL=i_lseed-N;
		i_loss=i_lseed;
	}
	arr[i_loss]={idx:-1,link:[i_child,i_lseed-1],status:0,order:0,height:(h-1)*2-1};
	//第二輪順序交換
	N=m>>>3;
	i_lseed=m+(m>>>2);
	for(j=0;j<N;++j)
	{
		t=arr[i_lseed+N].link[1];
		arr[i_lseed+N].link[1]=arr[i_lseed].link[1];
		arr[i_lseed++].link[1]=t;
	}
	for(j=1;j<arr.length;++j)
		arr[j].idx=j;
	return arr;
	
}
function runDETree(arr)
{
	var count=1;
	function del()
	{
		var i,j,t;
		while(1)
		{
			for(i=arr.length-1;i>0;--i)
				if((arr[i].status&checkM)==checkA && (arr[i].link[0]==0 || arr[i].link[1]==0))
					break;
			if(i<=0)
				break;
			//執行刪除
			arr[i].status|=checkD;
			t=arr[i].link[0]==0?arr[i].link[1]:arr[i].link[0];
			//將 link中有 i 的用 t(=-indexL/R) 取代 並設置該status
			for(j=arr.length-1;j>0;--j)
			{
				if((arr[j].status&(checkL|checkD|checkF))==0 && arr[j].link[0]==i)
				{//左邊
					arr[j].link[0]=t<0 && j>=(arr.length+1>>>1)?0:t;
					arr[j].status|=checkL;
				}
				if((arr[j].status&(checkR|checkD|checkF))==0 && arr[j].link[1]==i)
				{//右邊
					arr[j].link[1]=t<0 && j>=(arr.length+1>>>1)?0:t;
					arr[j].status|=checkR;
				}
			}
		}
	}
	function getScore(x)
	{
		var l=arr[x].link[0]<0?arr[x].link[0]:arr[arr[x].link[0]].order;
		var r=arr[x].link[1]<0?arr[x].link[1]:arr[arr[x].link[1]].order;
		var t=Math.max(l,r);
		t=(arr[x].height<<20)|(t<0?x:(t<<10)|x); //高>順序>位置
		return t;
	}
	function findBest()
	{//找最佳的下一場，回傳arr陣列的index
		var i,idx,val,s;
		val=-1;
		for(i=arr.length-1;i>0;--i)
		{
			if((arr[i].status&checkM)==checkA)
			{
				s=getScore(i);
				if(val==-1 || val>s)
				{
					idx=i;
					val=s;
				}
			}
		}
		return idx;
	}
	function select(x) //選擇arr[x]的那一場
	{
		arr[x].status|=(checkF);
		arr[x].order=count;
		var t;
		//更新 link==x 者 set checkL/R
		for(i=1;i<arr.length;++i)
		{
			if((arr[i].status&(checkL|checkD|checkF))==0 && arr[i].link[0]==x)
				arr[i].status|=checkL;//左邊
			if((arr[i].status&(checkR|checkD|checkF))==0 && arr[i].link[1]==x)
				arr[i].status|=checkR;//右邊
		}
		++count;
	}
	
	del();
	var i,j,x,t;
	var bst;
	
	while(1)
	{
		for(i=arr.length-1;i>=1 && (arr[i].status&(checkF|checkD));--i);
		if(i<1)
			break;
		bst=findBest();
		select(bst);
		del();
	}
}
function printArr(arr)
{
	var i,str,t,list;
	str="";
	list=[];
	for(i=1;i<arr.length;++i)
	{
		t=arr[i];
		if(t===undefined)
			alert(i);
		list.push(["["+t.idx+"]",t.status>>>24,""+t.link+"",((t.order)>0?(t.order):"")]);
		/*str+="["+t.idx+"]\t"+(t.status>>>24)+"\t("+t.link+")\t"
			+((t.order)>0?(t.order):"")+"\n";*/
	}
	for(i=0;i<(list.length>>>1);++i)
	{
		t=list[i];
		str+=t.join("\t")+"\t\t";
		t=list[i+(list.length>>>1)];
		str+=t.join("\t")+"\n";
	}
	return str;
}

function drawSvg(arr,dx,dy,fontSize,strokeW)
{
	function getOrder3(arr)
	{
		function getOrder2(n)
		{ //取得滿位時次序
			var i,l,r,j,k,m,N,d;
			for(k=0,m=1;m<n;m<<=1,++k);// 2^k=m>=n
			var pos=[m-2,1];
			var arr;
			k=1;
			while((d=pos[pos.length-2]-pos[pos.length-1]-1)>=4)
			{
				arr=pos.slice(pos.length-(k<<=1));
				arr.sort(function(a,b){return a-b;});
				i=arr.length;
				for(j=(arr.length>>>1);j>0;--j)
				{
					r=arr[--i];
					l=arr[--i];
					pos.push(r-1);
					pos.push((l+r+1)>>>1);
					pos.push((l+r)>>>1);
					pos.push(l+1);
				}
			}
			//交換第二層
			N=m>>>3;
			i=pos.length-N*6;
			for(j=0;j<N;++j)
			{
				k=pos[i+j];
				pos[i+j]=pos[i+j+N];
				pos[i+j+N]=k;
			}
			arr=[];
			arr.length=k=m-1;
			arr[m-2]=k--;
			for(i=0;i<pos.length;++i)
				arr[pos[i]-1]=k--;
			return arr;
		}
		var i,j;
		var od2=getOrder2(arr[0]);
		var od3=[];
		for(i=1;i<=(arr.length>>>1);++i)
		{
			for(j=0;j<od2.length;++j)
			{
				if(od2[j]==arr[i].idx)
				{
					od2[j]=-arr[i].order;
					break;
				}
			}
		}
		for(j=0;j<od2.length;++j)
			if(od2[j]<0)
				od3.push(-od2[j]);
		return od3;
	}
	/*function getIdxByName(list,name,value) //return idx with list[idx].name==value
	{
		var i;
		for(i=0;i<list.length;++i)
			if((name!==null && list[i][name]==value)||(name===null && list[i]==value))
				return i;
		return null;
	}*/
	function bsearch(arr,target,cmp_func)
	{
		var l=0;
		var r=arr.length-1;
		if(r<0)
			return -1;
		var t;
		for(;l+1<r;)
		{
			m=(l+r)>>>1;
			
			t=cmp_func(arr[m],target);
			//alert([l,m,r,t]);
			if(t>0) //arr[m]太大
				r=m;
			else if(t<0)
				l=m; //arr[m]太小
			else
				return m;
		}
		return cmp_func(arr[l],target)==0?l:(cmp_func(arr[r],target)==0?r:-1);
	}
	function cmp_id(a,v)
	{
		return a.id-v;
	}
	var n=((arr.length+1)>>>1); //arr[1,n)勝部 arr[n,2n-1)敗部
	var np=arr[0]; //共多少參賽者
	var list_w=[]; //勝部場次紀錄
	var list_l=[]; //敗部場次紀錄
	var list_t; //暫存
	var i,count,np,x1,x2,y1,y2,list,t,x;
	var MP=new playerMap(np);
	//整理 list_w
	list=[];
	for(i=1;i<n;++i)
	{
		if(!(arr[i].status&checkF))
			continue;
		list.push(arr[i]);
	}
	list.sort(function(a,b){return a.order-b.order});
	list_t=getPlayer(np);
	//(1)從arr匯入場次於 List={data:arr[i],x1=0,y1=0,x2=0,y2=0,h=0}
	//(2)pos_arr：num->pos
	//(3)對每一場，l/r_link>0:x,y從那場去找；<0從pos_arr找
	for(i=0;i<list.length;++i)
	{
		l_link=list[i].link[0]<0?list[i].link[0]:arr[list[i].link[0]].order;
		r_link=list[i].link[1]<0?list[i].link[1]:arr[list[i].link[1]].order;
		l_link=bsearch(list_w,l_link,cmp_id);
		r_link=bsearch(list_w,r_link,cmp_id);
		t=list[i].link[0]<0?list[i].link[0]:arr[list[i].link[0]].order;
		x1=t<0?MP.list_pos[-t-1]:(list_w[l_link].x1+list_w[l_link].x2)/2;
		t=list[i].link[1]<0?list[i].link[1]:arr[list[i].link[1]].order;
		x2=t<0?MP.list_pos[-t-1]:(list_w[r_link].x1+list_w[r_link].x2)/2;
		list_w.push({
			id:list[i].order,
			x1:x1,
			x2:x2,
			y1:list[i].link[0]<0?0:list_w[l_link].h,
			y2:list[i].link[1]<0?0:list_w[r_link].h,
			h:list[i].height+2
		});
	}
	//整理 list_l
	list=[];
	for(i=n;i<n*2-2;++i)
	{
		if(!(arr[i].status&checkF))
			continue;
		list.push(arr[i]);
	}
		//插入高度調整
	list.sort(function(a,b){return a.height-b.height;});
	count=-2;
	t=-1;
	for(i=0;i<list.length;++i)
	{
		if(t<list[i].height)
		{
			t=list[i].height;
			count+=2;
		}
		list[i].height=count;
	}
		//高度調整結束
	list.sort(function(a,b){return a.order-b.order;});
	
	var lod=getOrder3(arr);
	for(i=0;i<lod.length;++i)
		lod[i]={idx:i,val:lod[i]};
	//alert(typeof(lod));
	lod.sort(function(a,b){return a.val-b.val;});
	for(i=0;i<list.length;++i)
	{
		l_link=list[i].link[0]<0?list[i].link[0]:arr[list[i].link[0]].order;
		r_link=list[i].link[1]<0?list[i].link[1]:arr[list[i].link[1]].order;
		l_link=bsearch(list_l,l_link,cmp_id);
		r_link=bsearch(list_l,r_link,cmp_id);
		x1=l_link===null||l_link<0?lod[bsearch(lod,arr[list[i].link[0]].order,function(a,v){return a.val-v})].idx+1
			:(list_l[l_link].x1+list_l[l_link].x2)/2;
		x2=r_link===null||r_link<0?lod[bsearch(lod,arr[list[i].link[1]].order,function(a,v){return a.val-v})].idx+1
			:(list_l[r_link].x1+list_l[r_link].x2)/2;
		list_l.push({
			id:list[i].order,
			x1:x1,
			x2:x2,
			y1:l_link===null||l_link<0?0:list_l[l_link].h,
			y2:r_link===null||r_link<0?0:list_l[r_link].h,
			h:list[i].height+2
		});
	}
	//輸出SVG
	var svgns="http://www.w3.org/2000/svg";
	var svg=document .createElementNS(svgns,"svg");
	var path,text;
	dy=-dy/2;
	//描繪勝部
	x0=0;
	for(i=0;i<list_w.length;++i)
	{
		t=list_w[i];
		//alert(dx)
		path=document .createElementNS(svgns,"path");
		path .setAttributeNS(null,"d",
			"M "+(t.x1+x0)*dx+","+t.y1*dy+" l"
			+" 0,"+(t.h-t.y1)*dy
			+" "+(t.x2-t.x1)*dx+",0"
			+" 0,"+(t.y2-t.h)*dy);
		path .setAttributeNS(null,"style","stroke:black;fill:none;stroke-width:"+strokeW);
		svg .appendChild(path);
		text=document .createElementNS(svgns,"text");
		text.innerHTML="("+t.id+")";
		text .setAttributeNS(null,"text-anchor","middle");
		text .setAttributeNS(null,"x",((t.x1+t.x2)/2+x0)*dx);
		text .setAttributeNS(null,"y",t.h*dy+fontSize*0.7);
		text .setAttributeNS(null,"font-size",fontSize*0.7);
		svg .appendChild(text);
	}
	for(i=1;i<=np;++i)
	{
		text=document .createElementNS(svgns,"text");
		text.innerHTML=i;
		text .setAttributeNS(null,"text-anchor","middle");
		text .setAttributeNS(null,"x",(i+x0)*dx);
		text .setAttributeNS(null,"y",fontSize);
		text .setAttributeNS(null,"font-size",fontSize);
		svg .appendChild(text);
	}
	//描繪敗部
	x0=np;
	for(i=0;i<list_l.length;++i)
	{
		t=list_l[i];
		path=document .createElementNS(svgns,"path");
		path .setAttributeNS(null,"d",
			"M "+(t.x1+x0)*dx+","+t.y1*dy+" l"
			+" 0,"+(t.h-t.y1)*dy
			+" "+(t.x2-t.x1)*dx+",0"
			+" 0,"+(t.y2-t.h)*dy);
		path .setAttributeNS(null,"style","stroke:black;fill:none;stroke-width:"+strokeW);
		svg .appendChild(path);
		text=document .createElementNS(svgns,"text");
		text.innerHTML="("+t.id+")";
		text .setAttributeNS(null,"text-anchor","middle");
		text .setAttributeNS(null,"x",((t.x1+t.x2)/2+x0)*dx);
		text .setAttributeNS(null,"y",t.h*dy+fontSize*0.7);
		text .setAttributeNS(null,"font-size",fontSize*0.7);
		svg .appendChild(text);
	}
	lod.sort(function(a,b){a.idx-b.idx});
	for(i=0;i<lod.length;++i)
	{
		text=document .createElementNS(svgns,"text");
		text.innerHTML=lod[i].val;
		text .setAttributeNS(null,"text-anchor","middle");
		text .setAttributeNS(null,"x",(i+1+x0)*dx);
		text .setAttributeNS(null,"y",fontSize);
		text .setAttributeNS(null,"font-size",fontSize);
		svg .appendChild(text);
	}
	//連接勝部敗部
	x1=(list_w[list_w.length-1].x1+list_w[list_w.length-1].x2)/2;
	x2=(list_l[list_l.length-1].x1+list_l[list_l.length-1].x2)/2;
	y1=list_w[list_w.length-1].h;
	y2=list_l[list_l.length-1].h;
	t=Math.max(y1,y2)+2;
	path=document .createElementNS(svgns,"path");
	path .setAttributeNS(null,"d",
		"M "+x1*dx+","+y1*dy+" l"
		+" 0,"+(t-y1)*dy
		+" "+(x2+x0-x1)*dx+",0"
		+" 0,"+(y2-t)*dy
		+" m "+(x1-x2-x0)/2*dx+","+dy*(t-y2)+" l "
		+" 0,"+(dy*2));
	path .setAttributeNS(null,"style","stroke:black;fill:none;stroke-width:"+strokeW);
	svg .appendChild(path);
	text=document .createElementNS(svgns,"text");
	text.innerHTML="("+arr[arr.length-1].order+")";
	text .setAttributeNS(null,"text-anchor","middle");
	text .setAttributeNS(null,"x",((x1+x2+x0)/2)*dx);
	text .setAttributeNS(null,"y",t*dy+fontSize*0.7);
	text .setAttributeNS(null,"font-size",fontSize*0.7);
	svg .appendChild(text);
	return svg;
	
}


function new_run()
{	
	var dx=parseFloat(document .getElementById("dx").value);
	var dy=parseFloat(document .getElementById("dy").value);
	var fz=parseFloat(document .getElementById("fontSize").value);
	var sw=parseFloat(document .getElementById("strokeW").value);
	//以上數據轉換為轉換為px
	dx=dx/2.54*90;
	dy=dy/2.54*90;
	fz=fz/72*90;
	sw=sw/72*90;
	
	var n=parseInt(document .getElementById("num").value);
	if(n<4)
		return;
	var p=getPlayer(n);
	var arr=createDETree(n,p);
	runDETree(arr);
	var svg=drawSvg(arr,dx,dy,fz,sw);
	
	
	//輸出SVG
	var div=document .getElementById("svgout");
	div.innerHTML="";
	div .appendChild(svg);
	var bbx=svg.getBBox();
	svg .setAttributeNS(null,"width",bbx.width+2);
	svg .setAttributeNS(null,"height",bbx.height+2);
	svg .setAttributeNS(null,"viewBox",(bbx.x-1)+" "+(bbx.y-1)+" "+(bbx.width+2)+" "+(bbx.height+2));
	
	//輸出種子順序
	var seedOrder=[];
	var i,count;
	seedOrder.length=n;
	count=0;
	for(i=0;i<p.length;++i)
	{
		if(p[i]==0)
			continue;
		seedOrder[p[i]-1]=++count;
	}
	document .getElementById("seed").innerHTML="種子位置順序："+seedOrder+"<br>"
		+"圖片尺寸："+Math.ceil((bbx.width+2)/90*25.4)/10+" cm x "+Math.ceil((bbx.height+2)/90*25.4)/10+" cm";
	
	//建立下載svg連結
	var svgstr=div.innerHTML;
	if(svgstr.search(/xmlns/)<0)
		svgstr=svgstr.replace(/<svg[ \t\n]/,"<svg xmlns=\"http://www.w3.org/2000/svg\" ");
	svgstr=svgstr.replace(/>[ \t\n]*<\/path>/g,"/>");
	svgstr=svgstr.replace(/></g,">\n<");
	var a_href=document .getElementById("save_svg");
	var blob=new Blob([svgstr],{type:"text/plain"});
	var blobUrl=URL.createObjectURL(blob);
	a_href .setAttribute("href",blobUrl);
	a_href .setAttribute("download","雙敗淘汰.svg");
	a_href .setAttribute("style","display:inline");
}












