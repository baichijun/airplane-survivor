# Android 开发环境（PowerShell）
# 用法：. .\scripts\setup-android-env.ps1

$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$JavaHome = "C:\Program Files\Android\Android Studio\jbr"

if (-not (Test-Path $SdkRoot)) {
    Write-Warning "未找到 Android SDK：$SdkRoot，请先在 Android Studio SDK Manager 中安装 SDK。"
}

if (Test-Path $JavaHome) {
    $env:JAVA_HOME = $JavaHome
    $env:Path = "$JavaHome\bin;$SdkRoot\platform-tools;$SdkRoot\emulator;$env:Path"
}

$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:GRADLE_USER_HOME = "$env:USERPROFILE\.gradle"

Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "GRADLE_USER_HOME=$env:GRADLE_USER_HOME"
Write-Host ""
Write-Host "持久化（可选）：在 Windows「环境变量」中新增用户变量："
Write-Host "  ANDROID_HOME = $SdkRoot"
Write-Host "  JAVA_HOME    = $JavaHome"
Write-Host "并将 %ANDROID_HOME%\platform-tools 加入 Path。"
