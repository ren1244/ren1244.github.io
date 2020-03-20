function filter_string(d) {
	if(typeof(d)!=='String') {
		return true;
	} else {
		return false;
	}
}

function filter_id(d) {
	let m=d.match(/^[a-zA-Z0-9@]*$/);
	if(m) {
		return true;
	} else {
		return false;
	}
}

function filter_phone(d) {
	let m=d.match(/^[0-9\-\+\s\(\)#~_]*$/);
	if(m) {
		return true;
	} else {
		return false;
	}
}

function filter_date(d) {
	let m=d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if(m) {
		return true;
	} else {
		return false;
	}
}

let filters={
	"總機構代號": filter_id,
	"機構代號": filter_id,
	"機構名稱": filter_string,
	"地址": filter_string,
	"電話": filter_phone,
	"負責人": filter_string,
	"異動日期": filter_date,
	"金融機構網址": filter_string
};

let getTimestamp=(()=>{
	let t=new Date();
	t.setHours(0);
	t.setMinutes(0);
	t.setSeconds(0);
	t.setMilliseconds(0);
	return function(str) {
		let arr=str.split('-').map(x=>parseInt(x,10));
		t.setFullYear(arr[0]);
		t.setMonth(arr[1]-1);
		t.setDate(arr[2]);
		return t.getTime();
	}
})();

function render(data, notifyLogs, errorLogs)
{
	let p=document.createElement('p');
	let html='';
	if(data!==false) {
		html+=`<h3>輸出</h3><a download="金融機構基本資料.json" href="data:application/json;base64,${BinJS(JSON.stringify(data, null, '\t')).bin('utf8').str('base64').val()}">json 下載</a> (以機構代碼為key)`;
	}
	if(errorLogs.length>0) {
		html+='<h3>錯誤</h3>'+errorLogs.map((txt)=>{
			p.className='errorLog';
			p.textContent=txt;
			return p.outerHTML;
		}).join('\n');		
	}
	if(notifyLogs.length>0) {
		html+='<h3>注意</h3>'+notifyLogs.map((txt)=>{
			p.className='warningLog';
			p.textContent=txt;
			return p.outerHTML;
		}).join('\n');		
	}
	document.querySelector('#output').innerHTML=html;
}

function loadFile(input)
{
	new Promise((success, error)=>{
		let frd=new FileReader();
		frd.onload=function(){
			success(frd.result);
		}
		frd.readAsText(input.files[0]);
	}).then((data)=>{
		let errorLogs=[],
		    notifyLogs=[],
			units={};
		let arr=data.trim().replace(/\r/g, '').split('\n').map(x=>x.split(','));
		let keys=['總機構代號', '機構代號', '機構名稱', '地址', '電話', '負責人', '異動日期', '金融機構網址'];
		if(arr.length<2) {
			errorLogs.push('沒有資料');
			render(false, notifyLogs, errorLogs);
			return;
		}
		if(arr[0].join(',')!==keys.join(',')) {
			errorLogs.push('欄位資料不符合');
			render(false, notifyLogs, errorLogs);
			return;
		}
		
		let n=arr.length,
			m=keys.length,
			f=keys.map(x=>filters[x]);
		for(let i=1;i<n;++i) {
			let row=arr[i];
			if(row.length!=m) {
				errorLogs.push(`欄位數量不符合(列 ${i+1})： ${row.join(', ')}`);
				continue;
			}
			let errFlag=false;
			for(j=0;j<m;++j) {
				if(f[j](row[j])===false) {
					errorLogs.push(`格式錯誤(列 ${i+1}, 欄 ${j+1})： ${row.join(', ')}`);
					errFlag=true;
					break;
				}
			}
			if(errFlag) {
				continue;
			}
			let id=row[1]===''?row[0]:row[1];
			if(units[id]) {
				let t_new=getTimestamp(row[6]);
				let t_old=getTimestamp(units[id][6]);
				if(t_old>t_new) {
					notifyLogs.push(`機構代號「${id}」有重複資料。採取動作：忽略`);
					continue;
				} else if(t_old===t_new) {
					errorLogs.push(`機構代號「${id}」無法判別先後順序`);
					continue;
				} else {
					notifyLogs.push(`機構代號「${id}」有重複資料。採取動作：覆蓋舊資料`);
				}
			}
			units[id]=row;
		}
		render(units, notifyLogs, errorLogs);
	});
}


