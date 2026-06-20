# 生成本地 Release 签名 keystore（仅用于本机打包，勿提交仓库）
# 用法：powershell -ExecutionPolicy Bypass -File scripts/create-release-keystore.ps1

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $Root 'android'
$KeystorePath = Join-Path $AndroidDir 'release.keystore'
$PropsPath = Join-Path $AndroidDir 'keystore.properties'

if (Test-Path $KeystorePath) {
    Write-Host "已存在 $KeystorePath，跳过生成。"
    exit 0
}

$Keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
if (-not (Test-Path $Keytool)) {
    $Keytool = 'keytool'
}

$StorePass = 'airplane-survivor'
$KeyAlias = 'release'
$KeyPass = 'airplane-survivor'

Write-Host "正在生成 release.keystore ..."
& $Keytool -genkeypair `
    -v `
    -keystore $KeystorePath `
    -alias $KeyAlias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $StorePass `
    -keypass $KeyPass `
    -dname 'CN=Airplane Survivor, OU=Dev, O=Local, L=Local, ST=Local, C=CN'

@"
storeFile=release.keystore
storePassword=$StorePass
keyAlias=$KeyAlias
keyPassword=$KeyPass
"@ | Set-Content -Path $PropsPath -Encoding Ascii

Write-Host "已生成："
Write-Host "  $KeystorePath"
Write-Host "  $PropsPath"
Write-Host ""
Write-Host "现在可运行：npm run android:release"
