/** 
 * 這個檔案是 epubReader 物件的定義
 * 使用方式：
 *   1. 先用 new 建立 epubReader 物件
 *   2. 用 .getPageContent 方法取得epub檔中某個頁面的html並處理
 */


/** 
 * epubReader 物件的 constructor
 *
 * @param ArrayBuffer buffer 讀取檔案的資料
 * @param callback function 當 epubReader 讀取完資料後，要執行的動作
 * @return void
 */
function epubReader(buffer, callback, mergeUntitled)
{
	/*
	 * 資料結構概述：
	 *   背景：
	 *     * epub 檔案中，每個文件或是圖片都有一個 id。
	 *     * zip 檔案則是依據路徑名稱存放資料。
	 *   epubReader 中的屬性：
	 *     itemMap
	 *       紀錄「epub id=>zip檔案路徑」的對應關係
	 *       格式範例：
	 *         {
	 *           id1: 'path1/file1',
	 *           id2: 'file2'
	 *           id3: 'file3'
	 *         }
	 *     pageList
	 *       相當於目錄
	 *       格式範例：
	 *         [
	 *           {
	 *             file: 'file1',
	 *             title: '第一章'
	 *           },{
	 *             file: 'file3' //有可能沒有 title
	 *           }
	 *         ]
	 *     pageMap
	 *       用來查詢某 id 在 pageList 的第幾個
	 *       格式範例：
	 *         {
	 *           file1: 0,
	 *           file3: 2
	 *         }
	 *     mimeMap
	 *       用來查詢某 zip檔的 mime
	 *       格式範例：
	 *         {
	 *           'path1/file1': 'text/xhtml',
	 *           'file2': 'image/jpeg',
	 *           'file3': 'text/xhtml'
	 *         }
	 */
	
	this.mimeMap;
	this.itemMap;
	this.pageList;
	this.pageMap;
	this.zip=new JSZip();
	this.callback=callback;
	this.mergeUntitled=mergeUntitled?true:false;
	
	//用 JSZip物件(this.zip) 載入 buffer 資料，完成後呼叫 this.readContainer
	let that=this;
	this.zip.loadAsync(buffer).then(function(){ 
		that.readContainer();
	});
}

/** 
 * 解出壓縮檔中的 META-INF/container.xml 檔案
 * 取得 <rootfile> 標籤內 full-path 屬性的值
 * 這個值是 OPF FILE 的檔名
 * 取得檔名後交給 this.readOpfFile 處理
 *
 * @return void
 */
epubReader.prototype.readContainer=function()
{
	let that=this;
	this.zip.file('META-INF/container.xml')
	   .internalStream("string")
	   .accumulate(function(){})
	   .then(function (data){
		   let parser=new DOMParser();
		   let doc=parser.parseFromString(data, 'application/xml');
		   let root=doc.getElementsByTagName('rootfile')[0];
		   let opfFile=root.getAttribute('full-path');
		   console.log('opf file: '+opfFile);
		   that.readOpfFile(opfFile);
	   });
}

/** 
 * 讀取 OPF 檔，取得 itemMap、mimeMap、pageList、pageMap、toc 檔名等資訊
 * 最後會把 toc 檔名傳給 this.readTocFile 處理
 * (關於 itemMap、pageList、pageMap 請參考 constructor 的註解)
 *
 * @param string opfFile Zip檔中，OPF 檔名
 * @return void
 */
epubReader.prototype.readOpfFile=function(opfFile)
{
	let navId=false;
	let that=this;
	this.itemMap={};
	this.pageList=[];
	this.pageMap={};
	this.mimeMap={};
	this.zip.file(opfFile)
	   .internalStream("string")
	   .accumulate(function(){})
	   .then(function (data){
		   let parser=new DOMParser();
		   let doc=parser.parseFromString(data, 'application/xml');
		   //取得 itemMap
		   let items=doc.querySelectorAll('manifest>item');
		   for(let i=items.length;--i>=0;) {
			   let href=items[i].getAttribute('href');
			   let file=that.zipFullPath(opfFile,href);
			   let prop=items[i].getAttribute('properties');
			   that.itemMap[items[i].id]=file;
			   that.mimeMap[file]=items[i].getAttribute('media-type');
			   if(prop==='nav') {
				   navId=items[i].id;
			   }
		   }
		   //取得 pageList 與 pageMap
		   let itemRefs=doc.querySelectorAll('spine>itemref');
		   for(let i=0; i<itemRefs.length;++i) {
			   let id=itemRefs[i].getAttribute('idref');
			   let isLinear=itemRefs[i].getAttribute('linear');
			   if(isLinear && isLinear.toLowerCase()==='no') {
				   continue;
			   }
			   that.pageList.push({
				   file:that.itemMap[id]
			   });
			   that.pageMap[that.itemMap[id]]=that.pageList.length-1;
		   }
		   //透過 nav 或是 toc 檔案抓目錄標題 
		   if(navId) {
			   that.readNavFile(that.itemMap[navId]);
		   } else {
			   let spine=doc.getElementsByTagName('spine')[0];
			   let toc=that.itemMap[spine.getAttribute('toc')];
			   console.log('toc file: '+toc);
			   that.readTocFile(toc);
		   }
	   });
}

/** 
 * 讀取 NCX 檔案資訊
 * 其實不用讀取這個檔案也已經能抓出所有頁面了
 * 但是這個檔案有一些"標題"的資訊
 * 所以這邊主要是把 "標題" 的資訊寫入 pageMap
 *
 * @param string tocFile ncx檔名
 * @return void
 */
epubReader.prototype.readTocFile=function(tocFile)
{
	let that=this;
	this.zip.file(tocFile)
	   .internalStream("string")
	   .accumulate(function(){})
	   .then(function (data){
		   let parser=new DOMParser();
		   let doc=parser.parseFromString(data, 'application/xml');
		   //讀取目錄
		   let points=doc.querySelectorAll('navMap navPoint');
		   for(let i=0;i<points.length;++i) {
			   let p=points[i];
			   let url=p.querySelector('content').getAttribute('src');
			   let file=that.zipFullPath(tocFile,url);
			   
			   /*
			    * 如果是這個 epub 存在的檔案才去抓標題
			    * (有些epub檔案這邊會有多餘的章節資訊，其實是其他本書的內容)
			   */
			   if(that.pageMap[file]!==undefined) { 
				   that.pageList[that.pageMap[file]]['title']=p.querySelector('navLabel>text').textContent;
			   }
		   }
		   if(that.mergeUntitled) {
			   that.mergeUntitledPages();
		   }
		   that.completeTitle();
	   });
}

/** 
 * 讀取導覽檔案資訊
 * 如果是 epub3 ，標題從這邊讀取，而不是 ncx 檔
 *
 * @param string navFile nav檔名
 * @return void
 */
epubReader.prototype.readNavFile=function(navFile)
{
	let that=this;
	this.zip.file(navFile)
	   .internalStream("string")
	   .accumulate(function(){})
	   .then(function (data){
		   let parser=new DOMParser();
		   let doc=parser.parseFromString(data, 'application/xml');
		   let as=doc.querySelectorAll('a');
		   for(let i=0;i<as.length;++i) {
			   let atag=as[i];
			   let fPath=that.zipFullPath(navFile, atag.getAttribute('href'));
			   let idx=that.pageMap[fPath];
			   if(idx!==undefined) {
				   that.pageList[idx]['title']=atag.textContent;
				   console.log(fPath, '標題設定為:', atag.textContent);
			   } else {
				   console.log('未使用的標題：', atag.textContent, `(${fPath})`);
			   }
		   }
		   if(that.mergeUntitled) {
			   that.mergeUntitledPages();
		   }
		   that.completeTitle();
	   });
}

/** 
 * 沒有 title 的部分，直接讀取該檔案的 title
 *
 * @return void
 */
epubReader.prototype.completeTitle=function()
{
	for(let i=0; i<this.pageList.length; ++i) {
		if(this.pageList[i].title) {
			continue;
		}
	}
	let that=this;
	let idx=0;
	readTitleFromFile();
	function readTitleFromFile() {
		if(idx>=that.pageList.length) {
			that.callback();
			return;
		}
		if(that.pageList[idx].title!==undefined) {
			++idx;
			readTitleFromFile();
			return;
		}
		that.zip.file(that.pageList[idx].file)
		    .internalStream("string")
		    .accumulate(function(){})
		    .then((data)=>{
				let parser=new DOMParser();
				let doc=parser.parseFromString(data, 'application/xml');
				let title=doc.title.trim();
				if(title==='') {
					let h1=document.querySelector('h1');
					if(h1) {
						title=h1.textContent.trim();
					}
				}
				if(title!=='') {
					that.pageList[idx].title=title;
				}
				console.log(that.pageList[idx].file, '抓到標題:', doc.title);
				++idx;
				readTitleFromFile();
			},()=>{
				++idx;
				readTitleFromFile();
			});
	}
}

epubReader.prototype.mergeUntitledPages=function()
{
	let cur=false;
	for(let i=0,n=this.pageList.length;i<n;++i) {
		let pageInfo=this.pageList[i];
		if(pageInfo.title!==undefined) {
			cur=pageInfo;
		} else {
			if(cur) {
				if(typeof(cur.file)==='string') {
					cur.file=[cur.file];
				}
				cur.file.push(pageInfo.file);
				this.pageList[i]=false;
			}
		}
	}
	this.pageList=this.pageList.filter((x)=>{return x});
}

/** 
 * 取得完整的 zip 檔名路徑
 *
 * @param string cur 目前位置
 * @param string rel 相對路徑
 * @return string 完整的 zip 檔名路徑
 */
epubReader.prototype.zipFullPath=function(cur, rel)
{
	let arr=cur.split('/');
	arr[arr.length-1]=rel;
	arr=arr.join('/').split('/');
	let n=0;
	for(let i=0;i<arr.length;++i) {
		let text=arr[i];
		if(text=='..') {
			if(n<1) {
				return null;
			}
			--n;
			continue;
		}
		arr[n++]=decodeURIComponent(arr[i]);
	}
	arr.length=n;
	return arr.join('/');
}

/** 
 * 取得目錄中的檔案，並轉換成html交給 callback
 * 這函式也負責 html 的渲染
 * 所以要變更輸出頁面的格式就得直接改這個函式的程式碼
 *
 * @param integer pageIdx 目錄中的第幾個
 * @param function callback 讀取資料，並轉換成 html 之後，會把 html 作為參數傳給 callback
 * @return void
 */
epubReader.prototype.getPageContent=function(pageIdx, callback)
{
	let file=this.pageList[pageIdx].file;
	let fileArray=(typeof(file)==='string'?[file]:file);
	let that=this;
	let imgMap={};
	Promise.all(fileArray.map((fullName)=>{
		return readAHtmlFile(fullName, this);
	})).then((x)=>{
		callback(x.join(''));
	});
	
	function readAHtmlFile(fullName, that)
	{
		let doc;
		return that.zip.file(fullName).internalStream("string")
		.accumulate((metadata)=>{}).then((data)=>{
			let parser=new DOMParser();
			doc=parser.parseFromString(data, 'application/xml');
			let promiseList=[];
			let imgs=doc.body.querySelectorAll('img');
			for(let i=imgs.length;--i>=0;) {
				let imgFullName=that.zipFullPath(fullName, imgs[i].getAttribute('src'));
				promiseList.push(getImgPromise(imgFullName));
			}
			imgs=doc.body.querySelectorAll('svg image');
			for(let i=imgs.length;--i>=0;) {
				let imgFullName=that.zipFullPath(fullName, imgs[i].getAttribute('xlink:href'));
				promiseList.push(getImgPromise(imgFullName));
			}
			return Promise.all(promiseList);
		}).then((imgDatas)=>{
			for(let i=imgDatas.length;--i>=0;) {
				imgMap[imgDatas[i].file]=imgDatas[i].data;
			}
			return getPageContent(doc.body, fullName);
		},function(x){
			console.log('err:'+x);
		});
	}
	
	function getImgPromise(imgFullName)
	{
		return new Promise(function(success, error){
			that.zip.file(imgFullName).internalStream("arraybuffer")
			.accumulate(function(metadata) {
				
			}).then(function(data){
				let u8arr=new Uint8Array(data);
				let mime=that.mimeMap[imgFullName];
				success({
					file:imgFullName,
					data:'data:'+mime+';base64,'+u8arr.str('base64')
				});
			},error);
		});
	}
	
	function getPageContent(node, pageFullName)
	{	
		switch(node.nodeType) {
			case 8: //'comments'
				return '';
			case 3: //'text'
				return htmlSpecial(node.textContent);
		}
		let tName=node.tagName.toUpperCase();
		switch(tName) {
			case 'IMG':
				let url=node.getAttribute('src');
				let fullUrl=epub.zipFullPath(pageFullName,url);
				return '<img src="'+imgMap[fullUrl]+'">';
			case 'IMAGE':
				let url2=node.getAttribute('xlink:href');
				let fullUrl2=epub.zipFullPath(pageFullName,url2);
				return '<img src="'+imgMap[fullUrl2]+'">';
			case 'BR':
				return '<br>';
		}
		let n=node.childNodes.length;
		let arr=[];
		for(let i=0;i<n;++i){
			arr.push(getPageContent(node.childNodes[i], pageFullName));
		}
		switch(tName) {
			case 'P':
				return '<p>'+arr.join('\n')+'</p>';
			case 'DIV':
				return '<div>'+arr.join('\n')+'</div>';
		}
		return arr.join('\n');
	}
}


