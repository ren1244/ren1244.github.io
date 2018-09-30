var pako=require('pako');

Uint8Array.prototype.deflate=function ()
{
	return pako.deflateRaw(this,{level:9});
}
Uint8Array.prototype.inflate=function ()
{
	return pako.inflateRaw(this);
}
