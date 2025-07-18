@echo off
echo Creating JEF Browser Extension v1.2.0 Release...

REM Create release directory
if exist "release" rmdir /s /q "release"
mkdir "release"
mkdir "release\JEF-Browser-Extension-v1.2.0"

REM Copy essential extension files only
copy "manifest.json" "release\JEF-Browser-Extension-v1.2.0\"
copy "background.js" "release\JEF-Browser-Extension-v1.2.0\"
copy "content.js" "release\JEF-Browser-Extension-v1.2.0\"
copy "popup.html" "release\JEF-Browser-Extension-v1.2.0\"
copy "popup.js" "release\JEF-Browser-Extension-v1.2.0\"
copy "popup.css" "release\JEF-Browser-Extension-v1.2.0\"
copy "styles.css" "release\JEF-Browser-Extension-v1.2.0\"

REM Copy icons folder
xcopy "icons" "release\JEF-Browser-Extension-v1.2.0\icons\" /E /I

REM Copy essential documentation
copy "README.md" "release\JEF-Browser-Extension-v1.2.0\"
copy "LICENSE" "release\JEF-Browser-Extension-v1.2.0\"

REM Create ZIP file
cd release
powershell -command "Compress-Archive -Path 'JEF-Browser-Extension-v1.2.0' -DestinationPath 'JEF-Browser-Extension-v1.2.0.zip' -Force"
cd ..

echo Release created: release\JEF-Browser-Extension-v1.2.0.zip
echo Ready for GitHub release upload!
pause
