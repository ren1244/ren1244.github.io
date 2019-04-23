<?php
$iFile=__dir__ .'/bodyorig.txt';
$oFile=__dir__ .'/body.txt';
$origDirName=__dir__ .'/imgorig/';
$targetDirName=__dir__ .'/images/';
//
function encoder($iFile, $oFile, $key)
{
    $data=file_get_contents($iFile);
    $padding = 16 - (strlen($data) % 16);
    $data .= str_repeat(chr($padding), $padding);
    $key=hash('sha256',$key,true);
    $len=openssl_cipher_iv_length('AES-256-CBC');
    $iv=openssl_random_pseudo_bytes($len);
    $cipher=openssl_encrypt($data, 'AES-256-CBC', $key,  OPENSSL_RAW_DATA|OPENSSL_ZERO_PADDING, $iv);
    file_put_contents($oFile, $iv.$cipher);
}

if($argc!==2) {
    exit('usage: php converter.php {password}');
}
$key=$argv[1];
//轉換 body
encoder($iFile, $oFile, $key);
//轉換圖檔
$list=scandir($origDirName);
foreach($list as $fname) {
    if($fname[0]==='.') {
        continue;
    }
    encoder($origDirName.$fname, $targetDirName.$fname, $key);
}
