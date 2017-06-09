var dx=0;
var dy=0;
var imgx=null;
function run()
{
	var i,j,k,t,w,h;
	var sidx=document .getElementById("mode").selectedIndex;
	w=imgx.width+(sidx==0?Math.abs(dx):0);
	h=imgx.height+(sidx==0?Math.abs(dy):0);
	var canvas=document.getElementById('img');
	canvas .setAttribute("width",w);
	canvas .setAttribute("height",h);
	var ctx=canvas.getContext('2d');
	ctx.drawImage(imgx, 0, 0);
	var src_data=ctx.getImageData(0,0,imgx.width,imgx.height);
	var dest_data=ctx.createImageData(w,h);
	function setPixel(x,y,dx,dy)
	{
		var k=(y*canvas.width+x)*4;
		var t=((y+dy)*src_data.width+x+dx)*4;
		if(x<0 || x>=canvas.width || y<0 || y>canvas.height)
			return;
		if(x+dx<0 || x+dx>=src_data.width || y+dy<0 || y+dy>=src_data.height)
		{
			dest_data.data[k]=0;
			dest_data.data[k+1]=0;
			dest_data.data[k+2]=0;
			dest_data.data[k+3]=0;
		}
		else
		{
			dest_data.data[k]=src_data.data[t];
			dest_data.data[k+1]=src_data.data[t+1];
			dest_data.data[k+2]=src_data.data[t+2];
			dest_data.data[k+3]=src_data.data[t+3];
		}
	}
	if(sidx==0)
	{
		for(i=0;i<h;++i)
			for(j=0;j<w;++j)
				setPixel(j,i,
					(dx>0 && (i&1))||(dx<0 && !(i&1))?-Math.abs(dx):0,
					(dy>0 && (i&1))||(dy<0 && !(i&1))?-Math.abs(dy):0);
	}
	else
	{
		for(i=(sidx&1);i<h;i+=2)
			for(j=0;j<w;++j)
				setPixel(j,i,0,0);
		for(i=(sidx+1&1);i<h;i+=2)
			for(j=0;j<w;++j)
			{
				k=(i*w+j)*4;
				t=w*4;
				dest_data.data[k]=(((i-1<0?0:dest_data.data[k-t])+(i+1>=h?0:dest_data.data[k+t])+1)>>>1);
				dest_data.data[k+1]=(((i-1<0?0:dest_data.data[k+1-t])+(i+1>=h?0:dest_data.data[k+1+t])+1)>>>1);
				dest_data.data[k+2]=(((i-1<0?0:dest_data.data[k+2-t])+(i+1>=h?0:dest_data.data[k+2+t])+1)>>>1);
				dest_data.data[k+3]=(((i-1<0?0:dest_data.data[k+3-t])+(i+1>=h?0:dest_data.data[k+3+t])+1)>>>1);
			}
	}
	ctx.putImageData(dest_data,0,0);
}
function readImage()
{
	var reader=new FileReader();
	reader.onload=function(e){
		dx=0;
		dy=0;
		imgx.src=reader.result;
	}
	reader.readAsDataURL(document .getElementById("ifile").files[0]);
}
function changeMode(refSelect)
{
	dx=dy=0;
	var cd=refSelect.children;
	refSelect.blur();
	if(refSelect.selectedIndex!=0)
		document.getElementById("hint").setAttribute("style","display:none");
	else
		document.getElementById("hint").removeAttribute("style");
	if(imgx)
		run();
}
function init()
{
	window.addEventListener("keydown",function(e){
		if(e.keyCode==37)
			--dx;
		else if(e.keyCode==38)
			dy-=2;
		else if(e.keyCode==39)
			++dx;
		else if(e.keyCode==40)
			dy+=2;
		if(37<=e.keyCode && e.keyCode<=40)
			run();
	})
	imgx=new Image();
	imgx.addEventListener("load",run);
}
