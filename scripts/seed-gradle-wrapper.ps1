# 将本机已下载的 Gradle 分发包写入 Wrapper 缓存，避免 gradlew 在线下载。
# 用法：powershell -ExecutionPolicy Bypass -File scripts/seed-gradle-wrapper.ps1
# 可选：-ZipPath "D:\path\gradle-8.14.3-all.zip"

param(
    [string]$ZipPath = "$env:USERPROFILE\Downloads\gradle-8.14.3-all.zip"
)

$ErrorActionPreference = "Stop"
# 与 android/gradle/wrapper/gradle-wrapper.properties 中 distributionUrl 对应的缓存目录名
$wrapperHash = "10utluxaxniiv4wxiphsi49nj"

if (-not (Test-Path $ZipPath)) {
    Write-Error "未找到 Gradle 压缩包：$ZipPath"
}

$destDir = Join-Path $env:USERPROFILE ".gradle\wrapper\dists\gradle-8.14.3-all\$wrapperHash"
New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Copy-Item $ZipPath (Join-Path $destDir "gradle-8.14.3-all.zip") -Force

Write-Host "已写入 Gradle Wrapper 缓存：$destDir"
Write-Host "构建 APK 前请安装 Android Studio / SDK，并配置 android/local.properties（见 local.properties.example）"
Write-Host "然后：cd android; `$env:GRADLE_USER_HOME=`"`$env:USERPROFILE\.gradle`"; .\gradlew.bat assembleDebug"
