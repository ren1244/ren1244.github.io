var data='[{"jp":"ん","roman":"n"},{"jp":"わ","roman":"wa"},{"jp":"ら","roman":"ra"},{"jp":"や","roman":"ya"},{"jp":"ま","roman":"ma"},{"jp":"は","roman":"ha"},{"jp":"な","roman":"na"},{"jp":"た","roman":"ta"},{"jp":"さ","roman":"sa"},{"jp":"か","roman":"ka"},{"jp":"あ","roman":"a"},{"jp":"ゐ","roman":"wi"},{"jp":"り","roman":"ri"},{"jp":"み","roman":"mi"},{"jp":"ひ","roman":"hi"},{"jp":"に","roman":"ni"},{"jp":"ち","roman":"chi"},{"jp":"し","roman":"shi"},{"jp":"き","roman":"ki"},{"jp":"い","roman":"i"},{"jp":"る","roman":"ru"},{"jp":"ゆ","roman":"yu"},{"jp":"む","roman":"mu"},{"jp":"ふ","roman":"fu"},{"jp":"ぬ","roman":"nu"},{"jp":"つ","roman":"tsu"},{"jp":"す","roman":"su"},{"jp":"く","roman":"ku"},{"jp":"う","roman":"u"},{"jp":"ゑ","roman":"we"},{"jp":"れ","roman":"re"},{"jp":"め","roman":"me"},{"jp":"へ","roman":"he"},{"jp":"ね","roman":"ne"},{"jp":"て","roman":"te"},{"jp":"せ","roman":"se"},{"jp":"け","roman":"ke"},{"jp":"え","roman":"e"},{"jp":"を","roman":"wo"},{"jp":"ろ","roman":"ro"},{"jp":"よ","roman":"yo"},{"jp":"も","roman":"mo"},{"jp":"ほ","roman":"ho"},{"jp":"の","roman":"no"},{"jp":"と","roman":"to"},{"jp":"そ","roman":"so"},{"jp":"こ","roman":"ko"},{"jp":"お","roman":"o"}]';
document.addEventListener("DOMContentLoaded",function(evt){
	data=JSON.parse(data);
	document.getElementById('next').addEventListener('click',function(evt){
		app.refresh();
	});
	document.getElementById('mode').addEventListener('click',function(evt){
		app.changeMode();
	});
	app.refresh();
});

var app=(function(){
	var x;
	var mode=1;
	return {
		refresh:function(){
			x=Math.floor(Math.random()*data.length);
			document.getElementById('jp').textContent=data[x].jp;
			document.getElementById('roman').textContent=data[x].roman;
		},
		changeMode:function(){
			let roman=document.getElementById('roman');
			let modeEle=document.getElementById('mode');
			if(mode===1) {
				modeEle.textContent='開拼音';
				roman.style.visibility='hidden';
				mode=0;
			} else {
				modeEle.textContent='關拼音';
				roman.style.visibility='initial';
				mode=1;
			}
		}
	};
})();
