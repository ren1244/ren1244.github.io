var sourceData=null;
function readSourceFile(fs)
{//讀取檔案fs[0]，以Uint8Array形式儲存於sourceData
	sourceData=null;
	var reader=new FileReader();
	reader.onload=function(e)
	{
		var contnet=new Uint8Array(e.target.result);
		var fname=btoa(encodeURI(fs[0].name));
		console.log(decodeURI(atob(fname)));
		var buffer=new ArrayBuffer(2+fname.length+contnet.length);
		var wd=new Uint16Array(buffer,0,1);
		wd[0]=fname.length;
		console.log(fname.length);
		wd=new Uint8Array(buffer,2,fname.length);
		var i;
		for(i=0;i<fname.length;++i)
			wd[i]=fname.charCodeAt(i);
		wd=new Uint8Array(buffer,2+fname.length,contnet.length);
		for(i=0;i<contnet.length;++i)
			wd[i]=contnet[i];
		sourceData=new Uint8Array(buffer);
		console.log(sourceData.length);
	}
	if(fs.length>0)
		reader.readAsArrayBuffer(fs[0]);
}
function readImageFile(fs)
{//讀取檔案fs[0]，並繪製於canvas
	if(fs.length<=0)
		return;
	var img=new Image();
	img.onload=function ()
	{
		var canvas=document.getElementById("preview");
		var ctx=canvas.getContext('2d');
		canvas.width=img.width;
		canvas.height=img.height;
		ctx.drawImage(img,0,0);
	}
	img.src=URL.createObjectURL(fs[0]);
}
function mergeFiles()
{
	var canvas=document.getElementById("preview");
	if(!canvas || !sourceData)
	{
		alert("必須指定圖片以及要內嵌的資料");
		return;
	}
	var url=encodeImg(canvas,sourceData);
	if(url)
		saveToFile(url,"image.png");
	else
		alert("操作失敗！圖檔像素數量不足以內嵌資料。");
	
	function saveToFile(dataURL,filename)
	{//彈出下載視窗
		var dl=document.getElementById("download");
		var blob=dataUrlToBlob(dataURL);
		var a=document.createElement("a");
		var obj_url=URL.createObjectURL(blob);
		a.setAttribute("href",obj_url);
		a.setAttribute("download",filename);
		dl.appendChild(a);
		a.click();
		//URL.revokeObjectURL(obj_url);
	}
}
function getOrgFile()
{
	var canvas=document.getElementById("preview");
	if(!canvas)
		return;
	var u8arr=decodeImg(canvas);
	if(!u8arr)
	{
		alert("無法解析出資料");
		return;
	}
	var buffer=u8arr.buffer.slice(0);
	var rd=new Uint16Array(buffer,0,1);
	var fnlen=rd[0];
	rd=new Uint8Array(buffer,2,fnlen);
	var fname="";
	var i;
	for(i=0;i<fnlen;++i)
		fname+=String.fromCharCode(rd[i]);
	fname=decodeURI(atob(fname));
	rd=new Uint8Array(buffer,2+fnlen);
	var blob=new Blob([rd],{type:"application/octet-stream"});
	saveToFile(blob,fname);
	function saveToFile(blob,filename)
	{//彈出下載視窗
		var dl=document.getElementById("download");
		var a=document.createElement("a");
		var obj_url=URL.createObjectURL(blob);
		a.setAttribute("href",obj_url);
		a.setAttribute("download",filename);
		dl.appendChild(a);
		a.click();
		//URL.revokeObjectURL(obj_url);
	}
}
function dataUrlToBlob(dataURL)
{
	var mime=dataURL.slice(dataURL.indexOf(":")+1,dataURL.indexOf(";"));
	var data=dataURL.slice(dataURL.indexOf(",")+1);
	data=atob(data);
	var u8arr=new Uint8Array(data.length);
	var i;
	for(i=0;i<data.length;++i)
		u8arr[i]=data.charCodeAt(i);
	return new Blob([u8arr],{type:mime});
}
function encodeImg(canvas,u8arr_data)
{//將u8arr_data資料寫入canvas，並回傳DataURL
	var ctx=canvas.getContext('2d');
	var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
	var i,k,x;
	//寫入資料
	for(i=16,k=0;i<imgData.data.length && k<sourceData.length;i+=4,++k)
	{
		x=u8arr_data[k];
		imgData.data[i]  =imgData.data[i]  &0xF8|x&0x07;
		imgData.data[i+1]=imgData.data[i+1]&0xF8|x>>>3&0x07;
		imgData.data[i+2]=imgData.data[i+2]&0xFC|x>>>6&0x03;
	}
	//紀錄長度
	for(i=0;i<16;i+=4)
	{
		x=k>>>8*(i>>>2)&0xFF;
		imgData.data[i]  =imgData.data[i]  &0xF8|x&0x07;
		imgData.data[i+1]=imgData.data[i+1]&0xF8|x>>>3&0x07;
		imgData.data[i+2]=imgData.data[i+2]&0xFC|x>>>6&0x03;
	}
	//檢查資料是否能完全寫入
	if(k<sourceData.length)
		return false;
	//產生dataurl回傳
	ctx.putImageData(imgData,0,0);
	return canvas.toDataURL();
}
function decodeImg(canvas)
{//將canvas解出u8arr_data資料
	var ctx=canvas.getContext('2d');
	var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
	var i,k,x;
	if(imgData.data.length<16)
		return false;
	for(k=i=0;i<16;i+=4)
	{
		x=(imgData.data[i]&0x07)|(imgData.data[i+1]&0x07)<<3|(imgData.data[i+2]&0x03)<<6;
		k|=x<<8*(i>>>2);
	}
	if(k<=0 || (k+4)*4>imgData.data.length)
		return false;
	var u8arr_data=new Uint8Array(k);
	for(i=16;i<imgData.data.length && k>0;i+=4,--k)
	{
		x=(imgData.data[i]&0x07)|(imgData.data[i+1]&0x07)<<3|(imgData.data[i+2]&0x03)<<6;
		u8arr_data[(i>>>2)-4]=x;
	}
	return u8arr_data;
}
