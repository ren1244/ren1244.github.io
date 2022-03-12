self.importScripts('node-opencc/node-opencc.js','jszip/jszip.min.js');

self.addEventListener('message', function(e) {
	switch(e.data.api) {
		case 'convertEpub':
			convAllText(e.data.data, e.data.id, e.data.convMethod).then((u8arr)=>{
				self.postMessage({
					status:'finish',
					id:e.data.id,
					data:u8arr,
					fname:e.data.fname
				});
			},(reason)=>{
				self.postMessage({
					status:'error',
					id:e.data.id
				});
			});
			break;
		case 'convertTxt':
			self.postMessage({
				status:'progress',
				id:e.data.id,
				msg:`處理 ${e.data.fname}...`
			});
			console.log(e.data.data);
			let str=opencc[e.data.convMethod](e.data.data);
			self.postMessage({
				status:'finish',
				id:e.data.id,
				data:str,
				fname:e.data.fname
			});
			break;
		case 'pack':
			pack2zip(e.data.data).then((u8arr)=>{
				self.postMessage({
					status:'pack-finish',
					data:u8arr
				});
			},(reason)=>{
				self.postMessage({
					status:'pack-error'
				});
			});
			break;
	}
}, false);

function pack2zip(filesData)
{
	let oZip = new JSZip();
	let opt={compression:'STORE'};
	for(let fname in filesData) {
		let fdata=filesData[fname];
		oZip.file(fname, fdata, opt);
	}
	return oZip.generateAsync({type:"uint8array"});
}

function convAllText(iData, tdId, convMethod)
{
	let iZip = new JSZip();
	let oZip = new JSZip();
	let arr=[];
	let compressOptions={
		compression: "DEFLATE",
		compressionOptions: {
			level: 9
		}
	}
	
	return iZip.loadAsync(iData).then((zip)=>{ 
		zip.forEach(function (relativePath, file){
			if(relativePath.match(/\.(xh?t?ml|html|ncx|opf)$/)) {
				arr.push(convText(relativePath, file));
			} else {
				arr.push(convOther(relativePath, file));
			}
		});
		return Promise.all(arr);
	}).then((arr)=>{
		return oZip.generateAsync({type:"uint8array"});
	});
	
	function convText(relativePath, file)
	{
		return file.async("string").then((content)=>{
			self.postMessage({
				status:'progress',
				id:tdId,
				msg:`處理 ${relativePath}...`
			});
			let str=opencc[convMethod](content);
			oZip.file(relativePath, str, compressOptions);
			return relativePath+'[str]:'+content.length;
		});
	}

	function convOther(relativePath, file)
	{
		return file.async('uint8array').then((u8)=>{
			self.postMessage({
				status:'progress',
				id:tdId,
				msg:`處理 ${relativePath}...`
			});
			oZip.file(relativePath, u8, compressOptions);
			return relativePath+'[u8]:'+u8.length;
		});
	}
}
