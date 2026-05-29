Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & """ && node src/bot.js", 0, False
WScript.Sleep 3000
WshShell.Run "http://localhost:3000", 0, False
