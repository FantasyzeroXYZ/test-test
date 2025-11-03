# batch_download_kuromoji.ps1
# 批量下载 kuromoji.js dict 文件

# 读取 urls.txt
$urls = Get-Content "urls.txt"

# 创建 dict 文件夹
$dest = "dict"
if (-Not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest | Out-Null
}

# 循环下载
foreach ($url in $urls) {
    $file = Split-Path $url -Leaf
    $outfile = Join-Path $dest $file
    Write-Host "Downloading $file..."
    Invoke-WebRequest -Uri $url -OutFile $outfile
}

Write-Host "All files downloaded successfully!"
