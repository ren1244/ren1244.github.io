document.addEventListener("DOMContentLoaded",function(evt){
	document.querySelector('input').addEventListener('change',function(evt){
		let file=evt.target.files[0];
		let frd=new FileReader();
		frd.onload=function(){
			let txt=this.result;
			let img=new Image();
			let t=10;
			img.onload=function(){
				let canvas=document.querySelector('canvas');
				canvas.width=this.width*t;
				canvas.height=this.height*t;
				let ctx=canvas.getContext('2d');
				ctx.imageSmoothingEnabled= false;
				ctx.drawImage(this,0,0,this.width*t,this.height*t);
			}
			img.src=createBMPFromText(txt, utf16_be_encode);
		};
		frd.readAsText(file);
	});
});

//給予字串，輸出 base64 url 的圖片
//輸出的圖檔為 24bit 的 BMP圖檔
// encoder 為函式，可以把字串轉為 Uint8Array
function createBMPFromText(text, encoder)
{
	let data=encoder(text);
	let pixels=Math.ceil(data.length/3); //像素
	let width=Math.round(Math.sqrt(pixels)); //寬
	let height=Math.ceil(pixels/width); //高
	let rowBytes=Math.ceil(width*3/4)*4; //每列位元組數
	let totalSize=0x36+rowBytes*height;
	let buffer=new ArrayBuffer(totalSize);
	let setter=new DataView(buffer);
	//Bitmap File Header
	setter.setUint16(0,0x424D); //BM
	setter.setUint32(0x02,totalSize,true); //整個點陣圖檔案的大小
	setter.setUint32(0x06,0,true); //保留欄位
	setter.setUint32(0x0A,0x36,true); //點陣圖資料開始之前的偏移量
	//Bitmap Info Header
	setter.setUint32(0x0E,0x28,true); //Bitmap Info Header 的長度
	setter.setUint32(0x12,width,true); //點陣圖的寬度
	setter.setInt32(0x16,-height,true); //點陣圖的高度(加負號以便由上到下)
	setter.setUint16(0x1A,1,true); //點陣圖的位元圖層數
	setter.setUint16(0x1C,24,true); //每個像素的位元數
	setter.setUint32(0x1E,0,true); //壓縮方式
	setter.setUint32(0x22,rowBytes*height,true); //點陣圖資料的大小
	setter.setUint32(0x26,3543,true); //水平解析度
	setter.setUint32(0x2A,3543,true); //垂直解析度
	setter.setUint32(0x2E,0,true); //點陣圖使用的調色盤顏色數
	setter.setUint32(0x32,0,true); //重要的顏色數
	//Bitmap Array
	let bmp=new Uint8Array(buffer);
	for(let y=0; y<height; ++y) {
		bmp.set(data.slice(y*width*3, (y+1)*width*3), 0x36+y*rowBytes);
	}
	return 'data:image/bmp;base64,'+base64_encode(bmp);
}

//將字串以 UTF16-BE 的方式編碼，輸出為 Unit8Array
function utf16_be_encode(text)
{
	let len=text.length;
	let arr=new Uint8Array(len*2);
	for(let i=0;i<len;++i) {
		let x=text.charCodeAt(i);
		arr[i*2]=x>>>8&0xFF;
		arr[i*2+1]=x&0xFF;
	}
	return arr;
}

//將 Unit8Array 輸出為 base64
function base64_encode(u8arr)
{
	//其實本來只要 return String.fromCharCode.apply(null,u8arr); 即可
	//但當 u8arr 太大時要分段，避免參數過長
	//(分段時應取 3 的倍數，這邊是用 768)
	let arr=[];
	for(let i=0;i<u8arr.length;i+=768) {
		let x=btoa(String.fromCharCode.apply(null,u8arr.slice(i,(i+768))));
		arr.push(x);
	}
	return arr.join('');
}