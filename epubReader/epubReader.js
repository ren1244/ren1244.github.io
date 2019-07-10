
function epubReader(buffer, callback)
{
	this.mimeMap;
	this.itemMap;
	this.pageList;
	this.pageMap; //用 zipName(key) 查詢 pageList 的 index(value)
	this.zip=new JSZip();
	this.callback=callback;
	let that=this;
	this.zip.loadAsync(buffer).then(function(){
		that.readContainer();
	});
}

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

epubReader.prototype.readOpfFile=function(opfFile)
{
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
			   that.itemMap[items[i].id]=file;
			   that.mimeMap[file]=items[i].getAttribute('media-type');
		   }
		   //取得 pageList 與 pageMap
		   let itemRefs=doc.querySelectorAll('spine>itemref');
		   for(let i=0; i<itemRefs.length;++i) {
			   let id=itemRefs[i].getAttribute('idref');
			   that.pageList.push({
				   file:that.itemMap[id]
			   });
			   that.pageMap[that.itemMap[id]]=i;
		   }
		   //取得 toc 檔案
		   let spine=doc.getElementsByTagName('spine')[0];
		   let toc=that.itemMap[spine.getAttribute('toc')];
		   console.log('toc file: '+toc);
		   that.readTocFile(toc);
	   });
}

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
			   if(that.pageMap[file]!==undefined) {
				   that.pageList[that.pageMap[file]]['title']=p.querySelector('navLabel>text').textContent;
			   }
		   }
		   that.callback();
	   });
}

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
epubReader.prototype.getPageContent=function(pageIdx, callback)
{
	let pageFullName=this.pageList[pageIdx].file;
	let that=this;
	let imgMap={};
	let doc;
	this.zip.file(pageFullName).internalStream("string")
	.accumulate(function(metadata) {
		
	}).then(function(data) {
		let parser=new DOMParser();
		doc=parser.parseFromString(data, 'application/xml');
		let promiseList=[];
		let imgs=doc.body.querySelectorAll('img');
		for(let i=imgs.length;--i>=0;) {
			let imgFullName=that.zipFullPath(pageFullName, imgs[i].getAttribute('src'));
			promiseList.push(getImgPromise(imgFullName));
		}
		img=doc.body.querySelectorAll('svg image');
		for(let i=img.length;--i>=0;) {
			let imgFullName=that.zipFullPath(pageFullName, img[i].getAttribute('xlink:href'));
			promiseList.push(getImgPromise(imgFullName));
		}
		return Promise.all(promiseList);
	}).then(function(imgDatas){
		for(let i=imgDatas.length;--i>=0;) {
			imgMap[imgDatas[i].file]=imgDatas[i].data;
		}
		callback(getPageContent(doc.body));
	},function(x){
		console.log('err:'+x);
	});
	
	function getImgPromise(imgFullName)
	{
		return new Promise(function(success, error){
			//console.log(imgFullName);
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
	
	function getPageContent(node)
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
			arr.push(getPageContent(node.childNodes[i]));
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


