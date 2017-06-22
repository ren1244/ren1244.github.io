function game()
{
	this._A=[];
	this._player;
	this._st;
	this._aiList=[];
}
game.prototype.getStatus=function (count)
{
	return {player:(this._player&1)?2:1,status:this._st};
}
game.prototype.AI=function (count)
{
	if(this._st!=0)
		return this._st==3?0:(this._st==((this._player&1)?1:2)?-1:1);
	var i,st_tmp;
	var select_pos=-1,score_max=-100,score;
	st_tmp=this._st;
	for(i=0;i<9;++i)
	{
		if(this._A[i]==0)
		{
			this.setXY(i);
			score=-this.AI(count+1);
			if(score>score_max)
			{
				select_pos=i;
				score_max=score;
				if(count==0)
					this._aiList=[select_pos];
			}
			else if(score==score_max && count==0)
				this._aiList.push(i);
			this._A[i]=0;
			this._st=st_tmp;
			--this._player;
		}
	}
	if(count==0 && this._aiList.length>0)
	{
		this.setXY(this._aiList[Math.floor(Math.random()*this._aiList.length)]);
		console.log(select_pos+"\n"+score_max);
	}
	return score_max;
}
game.prototype.init=function ()
{
	var i;
	for(i=0;i<9;++i)
		this._A[i]=0;
	this._player=0;
	this._st=0;
}
game.prototype.setXY=function (pos)
{
	if(this._st==0 && this._A[pos]==0)
	{
		this._A[pos]=++this._player;
		this._st=this._status(pos);
	}
}
game.prototype.getXY=function (pos)
{
	var t=this._A[pos];
	return t==0?0:((t&1)?1:2);
}
game.prototype._status=function (pos)
{
	var c1,c2;
	var x,y;
	x=pos%3;
	y=pos/3|0;
	var i,t;
	for(c1=c2=i=1;i<3;++i)
	{
		t=this._A[y*3+(x+i)%3];
		if(t!=0 && (t&1)==(this._player&1))
			++c1;
		t=this._A[(y+i)%3*3+x];
		if(t!=0 && (t&1)==(this._player&1))
			++c2;
	}
	if(c1==3||c2==3)
		return (this._player&1)?1:2;
	if(x==y)
	{
		for(c1=i=0;i<3;++i)
			if(this._A[i*3+i]!=0 && (this._A[i*3+i]&1)==(this._player&1))
				++c1;
		if(c1==3)
			return (this._player&1)?1:2;
	}
	if(x+y==2)
	{
		for(c1=i=0;i<3;++i)
			if(this._A[i*3+2-i]!=0 && (this._A[i*3+2-i]&1)==(this._player&1))
				++c1;
		if(c1==3)
			return (this._player&1)?1:2;
	}
	return this._player>=9?3:0;
}
function mouseDownAt(obj)
{
	var pos=obj.pos;
	myGame.setXY(pos);
	if(mode!=0)
		myGame.AI(0);
	reFreshGame();
}
function getSVG()
{
	var svgns="http://www.w3.org/2000/svg";
	var svg=document .createElementNS(svgns,"svg");
	svg .setAttribute("width","6cm");
	svg .setAttribute("height","6cm");
	svg .setAttribute("viewBox","0 0 90 90");
	var i,j,t;
	for(i=0;i<3;++i)
	{
		for(j=0;j<3;++j)
		{
			t=myGame.getXY(i*3+j);
			if(t==0)
			{
				svg .appendChild(path=document .createElementNS(svgns,"path"));
				path .setAttributeNS(null,"d","M "+j*30+","+i*30+" l 30,0 0,30 -30,0 z");
				path .setAttributeNS(null,"style","fill:#FFFFFF");
				path .setAttributeNS(null,"onclick","mouseDownAt(this)");
				path.pos=i*3+j;
			}
			else 
			{
				if(t==1)
				{
					svg .appendChild(path=document .createElementNS(svgns,"circle"));
					path .setAttributeNS(null,"cx",j*30+15);
					path .setAttributeNS(null,"cy",i*30+15);
					path .setAttributeNS(null,"r","10");
				}
				else
				{
					svg .appendChild(path=document .createElementNS(svgns,"path"));
					path .setAttributeNS(null,"d","M "+(j*30+5)+","+(i*30+5)+" l 20,20 m 0,-20 l -20,20");
				}
				path .setAttributeNS(null,"style","stroke-width:1px;fill:none;stroke:#000000");
			}
		}
	}
	var path;
	svg .appendChild(path=document .createElementNS(svgns,"path"));
	path .setAttributeNS(null,"d","M 30,0 l 0,90");
	path .setAttributeNS(null,"style","stroke-width:1px;fill:none;stroke:#000000");
	svg .appendChild(path=document .createElementNS(svgns,"path"));
	path .setAttributeNS(null,"d","M 60,0 l 0,90");
	path .setAttributeNS(null,"style","stroke-width:1px;fill:none;stroke:#000000");
	svg .appendChild(path=document .createElementNS(svgns,"path"));
	path .setAttributeNS(null,"d","M 0,30 l 90,0");
	path .setAttributeNS(null,"style","stroke-width:1px;fill:none;stroke:#000000");
	svg .appendChild(path=document .createElementNS(svgns,"path"));
	path .setAttributeNS(null,"d","M 0,60 l 90,0");
	path .setAttributeNS(null,"style","stroke-width:1px;fill:none;stroke:#000000");
	return svg;
}
var myGame;
var mode;
function reFreshGame()
{
	var panel=document .getElementById("game_svg");
	panel.innerHTML="";
	panel .appendChild(getSVG());
	var p;
	panel .appendChild(p=document .createElement("p"));
	var st=myGame.getStatus();
	if(mode==0)
		p.innerHTML=st.status==0?(st.player+"的回合"):(st.status==3?"平手":"player "+st.status+" 勝利");
	else
		p.innerHTML=st.status==0?("進行中"):(st.status==3?"平手":(st.status==mode?"電腦":"玩家")+" 勝利");
}
function init()
{
	myGame=new game;
	myGame.init();
	mode=document .getElementById("mode").selectedIndex;
	console.log("mode="+mode);
	if(mode==1)
		myGame.AI(0);
	reFreshGame();
}
