let configuration = {
	drawFileList: true,
	matching: 'lines',
	highlight: true,
	outputFormat: 'side-by-side'
};

function createRadioChangeHandler(name, callback, root) {
	if(root===undefined) {
		root=document;
	}
	let current=root.querySelector(`input[name="${name}"]:checked`);
	return function(e) {
		let ele=root.querySelector(`input[name="${name}"]:checked`);
		if(current!==ele) {
			current=ele;
			callback(ele);
		}
	}
}

function output() {
	const targetElement = document.querySelector('#output');
	const content = document.querySelector('#data').value;
	const diff2htmlUi = new Diff2HtmlUI(targetElement, content, configuration);
	diff2htmlUi.draw();
}

let onDisplayTypeChange=createRadioChangeHandler('displayType', (ele)=>{
	configuration.outputFormat=ele.dataset.val;
	output();
});
document.querySelectorAll('input[name="displayType"]').forEach((ele)=>{
	ele.addEventListener('click', onDisplayTypeChange);
});
document.querySelector('#next').addEventListener('click', ()=>{
	output();
	document.querySelectorAll('div.toggle').forEach((ele, idx)=>{
		ele.classList.toggle('hide', idx===0);
	});
});
document.querySelector('#back').addEventListener('click', ()=>{
	document.querySelectorAll('div.toggle').forEach((ele, idx)=>{
		ele.classList.toggle('hide', idx===1);
	});
});


