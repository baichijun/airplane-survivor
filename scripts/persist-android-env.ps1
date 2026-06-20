# 将 Android 开发环境变量写入当前用户（持久化）
# 用法：powershell -ExecutionPolicy Bypass -File scripts/persist-android-env.ps1

$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$JavaHome = "C:\Program Files\Android\Android Studio\jbr"

if (-not (Test-Path $SdkRoot)) {
    Write-Error "未找到 Android SDK：$SdkRoot"
    exit 1
}

if (-not (Test-Path $JavaHome)) {
    Write-Error "未找到 JDK：$JavaHome"
    exit 1
}

[Environment]::SetEnvironmentVariable('ANDROID_HOME', $SdkRoot, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $SdkRoot, 'User')
[Environment]::SetEnvironmentVariable('JAVA_HOME', $JavaHome, 'User')

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$pathEntries = @(
    "$JavaHome\bin",
    "$SdkRoot\platform-tools",
    "$SdkRoot\emulator"
)

foreach ($entry in $pathEntries) {
    if ($userPath -notlike "*$entry*") {
        if ($userPath) {
            $userPath = "$userPath;$entry"
        } else {
            $userPath = $entry
        }
    }
}

[Environment]::SetEnvironmentVariable('Path', $userPath, 'User')

Write-Host "已写入用户环境变量："
Write-Host "  ANDROID_HOME = $SdkRoot"
Write-Host "  JAVA_HOME    = $JavaHome"
Write-Host "  Path         += platform-tools, emulator, jbr\bin"
Write-Host ""
Write-Host "请重新打开终端后生效。"
