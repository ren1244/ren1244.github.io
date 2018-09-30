/*
此函式庫由下列四個函式組成：
	String.prototype.toUTF8Array
	String.prototype.decodeBase64
	Uint8Array.prototype.toUTF8String
	Uint8Array.prototype.encodeBase64
使用方法：
	字串轉base64
	[unicode字串] ==toUTF8Array()==> [Uint8Array] ==encodeBase64()==> [Base64字串]

	base64轉字串
	[unicode字串] <==toUTF8String()== [Uint8Array] <==decodeBase64()== [Base64字串]
範例：
	str1="測試字串abc";
	base64_str=str.toUTF8Array().encodeBase64(); //以utf8編碼產生base64
	str2=base64_str.decodeBase64().toUTF8String(); //還原為原字串
注意：
	這邊的base64字串定義為[A-Z][a-z][0-9]+/組成，並以=填充
	對於unicode超過0xFFFF的字元，utf8編碼是錯誤的(沒有考慮UTF-16，而以USC-2處理)，因此：
		1. Uint8Array中的數值不是正確的utf-8編碼
		2. 若編碼成base64只是作為資料傳輸，仍然可以正確還原回原字串
*/
String.prototype.toUTF8Array=function()
{
	var i,N,k,sz;
	//計算空間
	sz=0;
	for(i=this.length-1;i>=0;--i)
	{
		k=this.charCodeAt(i);
		sz+=k<0x800?(k<0x80?1:2):(k<0x10000?3:4);
	}
	//建立array
	var buf=new ArrayBuffer(sz);
	var arr=new Uint8Array(buf);
	//寫入資料
	for(i=sz=0,N=this.length;i<N;++i)
	{
		k=this.charCodeAt(i);
		if(k<0x800)
		{
			if(k<0x80)
			{
				arr[sz++]=k;
			}
			else
			{
				arr[sz++]=(0xC0|k>>>6&0x1F);
				arr[sz++]=(0x80|k&0x3F);
			}
		}
		else
		{
			if(k<0x10000)
			{
				arr[sz++]=(0xE0|k>>>12&0x0F);
				arr[sz++]=(0x80|k>>>6&0x3F);
				arr[sz++]=(0x80|k&0x3F);
			}
			else
			{
				arr[sz++]=(0xF0|k>>>18&0x07);
				arr[sz++]=(0x80|k>>>12&0x3F);
				arr[sz++]=(0x80|k>>>6&0x3F);
				arr[sz++]=(0x80|k&0x3F);
			}
		}
	}
	return arr;
}
String.prototype.decodeBase64=function()
{
	var i,N,k,c,sz;
	for(N=this.length;N>0 && this.charAt(N-1)=="=";--N);
	sz=N&3;
	if(sz==1)
	{
		console.log('sz_1');
		return false;
	}
	sz=(N>>>2)*3+(sz==0?0:(sz==2?1:2));
	var buf=new ArrayBuffer(sz);
	var arr=new Uint8Array(buf);
	sz=0;
	for(k=i=0;i<N;++i)
	{
		c=this.charCodeAt(i);
		if(48<=c && c<=57) //0-9
			c=c-48+52;
		else if(65<=c && c<=90) //A-Z
			c=c-65;
		else if(97<=c && c<=122) //a-z
			c=c-97+26;
		else if(c==43) //+
			c=62;
		else if(c==47) // /
			c=63;
		else
		{
			console.log('char['+i+']:"'+this.charAt(i)+'"');
			return false;
		}
		k=k<<6|c;
		if((i&3)==1)
		{
			arr[sz++]=k>>>4;
			k&=0x0F;
		}
		else if((i&3)==2)
		{
			arr[sz++]=k>>>2;
			k&=0x03;
		}
		else if((i&3)==3)
		{
			arr[sz++]=k;
			k=0;
		}
	}
	return arr;
}
Uint8Array.prototype.toUTF8String=function()
{
	var mask=[0x7F,0x1F,0x0F,0x07];
	var msk2=[0x80,0xE0,0xF0,0xF8];
	var fit =[0x00,0xC0,0xE0,0xF0];
	var str="";
	var i,N,k,c,t;
	for(i=0,N=this.length;i<N;i+=k+1)
	{
		c=this[i];
		k=c<0xE0
		 ?(c<0xC0?0:1)
		 :(c<0xF0?2:3);
		if((c&msk2[k])!=fit[k])
			return false;
		c&=mask[k];
		for(j=0;j<k && i+j+1<N;++j)
		{
			t=this[i+j+1];
			if((t&0xC0)!=0x80)
				return false;
			c=c<<6|t&0x3F;
		}
		str+=String.fromCharCode(c);
	}
	return str;
}
Uint8Array.prototype.encodeBase64=function()
{
	var tb="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var i,N,k,t;
	var b64str="";
	for(i=k=0,N=this.length;i<N;++i)
	{
		k=k<<8|this[i];
		if(i%3==0)
		{
			b64str+=tb[k>>>2];
			k&=0x03;
		}
		else if(i%3==1)
		{
			b64str+=tb[k>>>4];
			k&=0x0F;
		}
		else
		{
			b64str+=tb[k>>>6];
			b64str+=tb[k&0x3F];
			k=0;
		}
	}
	if(i%3==1)
		b64str+=tb[k<<4]+"==";
	else if(i%3==2)
		b64str+=tb[k<<2]+"=";
	return b64str;
}
