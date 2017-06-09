/*
0,7,4,3,2,5,6,1
1,0,5,4,3,6,0,2
*/
function playerMap(num_of_player)
{
	var m,k,N;
	var list_pos;//位置=list_pos[player_id]
	N=num_of_player;
	for(m=1,k=0;m<N;m<<=1,++k);
	//this.list_org=this.seedOrig(N);   //位置(0base)->第幾種子
	this.list_player=this.getPlayer(N); //位置(1base)->第幾種子 ※0表輪空
	this.list_pos=this.getPosX(N);       //第幾種子->位置(1base) ※-1表輪空或查無此人
}

playerMap.prototype.seedOrig=function(n) //取得種子順序
{
	if(n<2)
		return [];
	var arr,m,i,j,N,sign;
	for(m=1;m<n;m<<=1);
	arr=[0,m-1];
	sign=1;
	for(j=m>>>1;j>2;j>>>=1)
		for(i=arr.length-1;i>=0;--i)
			arr.push(arr[i]+(j-1)*(sign*=-1));
	for(i=arr.length-1;i>=0;--i)
		arr.push(arr[i]+(sign*=-1))
	return arr;
}
playerMap.prototype.getPlayer=function(n)
{
	var i,arr,N,count;
	arr=this.seedOrig(n);
	N=arr.length;
	for(i=0;i<N;++i)
		arr[i]=arr[i]<n?arr[i]+1:0;
	return arr;
}
playerMap.prototype.getPosX=function(n)
{
	var i,arr,N,count;
	N=this.list_player.length;
	arr=[];
	arr.length=n;
	for(i=count=0;i<n;++i)
		arr[i]=-1;
	for(i=0;i<N;++i)
		if(this.list_player[i]>0)
			arr[this.list_player[i]-1]=++count;
	return arr;
}
playerMap.prototype.getOrder2=function(n)
{ //取得滿位時次序
	var i,l,r,j,k,m,N,d;
	for(k=0,m=1;m<n;m<<=1,++k);// 2^k=m>=n
	var pos=[m-2,1];
	var arr;
	k=1;
	while((d=pos[pos.length-2]-pos[pos.length-1]-1)>=4)
	{
		arr=pos.slice(pos.length-(k<<=1));
		arr.sort(function(a,b){return a-b;});
		i=arr.length;
		for(j=(arr.length>>>1);j>0;--j)
		{
			r=arr[--i];
			l=arr[--i];
			pos.push(r-1);
			pos.push((l+r+1)>>>1);
			pos.push((l+r)>>>1);
			pos.push(l+1);
		}
	}
	//交換第二層
	N=m>>>3;
	i=pos.length-N*6;
	for(j=0;j<N;++j)
	{
		k=pos[i+j];
		pos[i+j]=pos[i+j+N];
		pos[i+j+N]=k;
	}
	arr=[];
	arr.length=k=m-1;
	arr[m-2]=k--;
	for(i=0;i<pos.length;++i)
		arr[pos[i]-1]=k--;
	return arr;
}
playerMap.prototype.getOrder3=function(arr)
{//刪去沒有比的場次
	
	var i,j;
	var od2=getOrder2(arr[0]);
	var od3=[];
	for(i=1;i<=(arr.length>>>1);++i)
	{
		for(j=0;j<od2.length;++j)
		{
			if(od2[j]==arr[i].idx)
			{
				od2[j]=-arr[i].order;
				break;
			}
		}
	}
	for(j=0;j<od2.length;++j)
		if(od2[j]<0)
			od3.push(-od2[j]);
	return od3;
}
