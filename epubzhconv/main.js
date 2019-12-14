let convWorker=new Worker('worker.js');
let outputCollection={};
let inputFileNames={};
let outputCount=0;
let inputCount=0;
let txtExtList=(()=>{
	let obj={}
	let list=['txt', 'ass', 'ssa', 'srt'];
	list.forEach((ext)=>{
		obj[ext]=1;
	});
	return obj;
})();
convWorker.addEventListener('message', function(e) {
	let td,url,mime;
	switch(e.data.status) {
		case 'finish':
			td=ele.output.querySelector(`#file-${e.data.id}`);
			mime=e.data.fname.match(/\.txt$/)?'text/plain':'application/octet-stream';
			let blob=new Blob([e.data.data], {type:mime});
			url=URL.createObjectURL(blob);
			td.innerHTML=`
				<div class="msgAndBtn">
				<a href="${url}" download="${e.data.fname}">${e.data.fname}</a>
				<button onclick="deleteFile(${e.data.id})">x</button>
				</div>
			`;
			td.dataset.fname=e.data.fname;
			delete inputFileNames[e.data.fname];
			outputCollection[e.data.fname]=e.data.data;
			onConvertEnd();
			break;
		case 'progress':
			td=ele.output.querySelector(`#file-${e.data.id}`);
			td.innerHTML=e.data.msg;
			break;
		case 'error':
			td=ele.output.querySelector(`#file-${e.data.id}`);
			td.innerHTML=`
				<div class="msgAndBtn">
					<span>錯誤</span>
					<button style='float:right' onclick="deleteFile(${e.data.id})">x</button>
				</div>
			`;
			td.dataset.fname=e.data.fname;
			delete inputFileNames[e.data.fname];
			onConvertEnd();
			break;
		case 'pack-finish':
			ele.pack.style.display='initial';
			url=URL.createObjectURL(new Blob([e.data.data],{type:'application/octet-stream'}));
			ele.pack.href=url;
			break;
		case 'pack-error':
			ele.pack.style.display='initial';
			ele.pack.textContent='打包時發生錯誤';
	}
}, false);

function onConvertEnd()
{
	++outputCount;
	if(outputCount===inputCount) {
		repackSingleZip();
	}
}

function repackSingleZip()
{
	convWorker.postMessage({
		api:'pack',
		data:outputCollection
	});
}

function deleteFile(id)
{
	if(ele.pack.href) {
		URL.revokeObjectURL(ele.pack.href);
		ele.pack.removeAttribute('href');
	}
	ele.pack.style.display='none';
	let td=ele.output.querySelector(`#file-${id}`);
	let fname=td.dataset.fname;
	let a_tag=td.querySelector('a');
	if(a_tag && a_tag.href) {
		URL.revokeObjectURL(a_tag.href);
	}
	td.parentElement.parentElement.removeChild(td.parentElement);
	delete outputCollection[fname];
	if(Object.keys(outputCollection).length>0) {
		repackSingleZip();
	}
}

let ele={};
document.addEventListener("DOMContentLoaded",function(evt){
	['uploader','output','pack','mode','encoding'].forEach(function(id){
		ele[id]=document.getElementById(id);
	});
	ele.uploader.addEventListener('drop',function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
		ele.uploader .removeAttribute("style");
		onFilesInput(evt.dataTransfer.files);
	},true);

	ele.uploader.addEventListener('dragover',function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
		ele.uploader .setAttribute("style","border:2px solid lightgray;");
	},true);

	ele.uploader.addEventListener('dragleave',function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
		ele.uploader .removeAttribute("style");
	},true);

	ele.uploader.addEventListener('click',(function (evt) {
		let uploder=document.createElement('input');
		uploder.setAttribute('type','file');
		uploder.setAttribute('multiple',true);
		uploder.addEventListener('change',function(evt){
			onFilesInput(uploder.files);
		});
		return function(){
			uploder.click();
		}
	})());
});

function onFilesInput(files)
{
	let encoding=ele.encoding.value;
	let mode=ele.mode.value;
	if(ele.pack.href) {
		URL.revokeObjectURL(ele.pack.href);
		ele.pack.removeAttribute('href');
	}
	ele.pack.style.display='none';
	for(let i=0;i<files.length;++i) {
		let f=files[i];
		if(inputFileNames[f.name] || outputCollection[f.name]) {
			alert(`${f.name} 重複了`);
			continue;
		}
		++inputCount;
		inputFileNames[f.name]=1;
		convTheFile(f, mode, encoding);
	}
}

let count=0;
function convTheFile(file, mode, encoding)
{
	let pos=file.name.lastIndexOf('.');
	let ext=pos>=0?file.name.slice(pos+1):null;
	let tdId=count++;
	let tr=document.createElement('tr');
	if(ele.output.rows.length===0) {
		tr.innerHTML='<th>原始檔案</th><th>輸出</th>';
		ele.output.appendChild(tr);
		tr=document.createElement('tr');
	}
	tr.innerHTML=`<td>${file.name}</td><td id="file-${tdId}"></td>`;
	ele.output.appendChild(tr);
	let frd=new FileReader();
	if(txtExtList[ext]) {
		frd.onload=function(evt){
			convWorker.postMessage({
				api:'convertTxt',
				id:tdId,
				data:this.result,
				fname:file.name,
				convMethod:mode
			});
		};
		frd.readAsText(file, encoding);
	} else {
		frd.onload=function(evt){
			convWorker.postMessage({
				api:'convertEpub',
				id:tdId,
				data:this.result,
				fname:file.name,
				convMethod:mode
			});
		};
		frd.readAsArrayBuffer(file);
	}
}
