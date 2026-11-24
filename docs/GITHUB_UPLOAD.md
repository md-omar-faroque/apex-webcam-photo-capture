# Publishing this project to GitHub (manual, web browser)

## 1. Create the repository
1. Sign in at https://github.com and click **+** (top right) -> **New repository**.
2. Repository name: `apex-webcam-photo-capture`.
3. Description: `Oracle APEX webcam photo capture with background change and full-image BLOB save`.
4. Choose **Public** (or Private).
5. Leave "Add a README", ".gitignore" and "license" **unchecked** (they are already in the project).
6. Click **Create repository**.

## 2. Upload the files
1. Unzip `apex-webcam-photo-capture.zip` on your computer.
2. On the new empty repository page click **uploading an existing file**.
3. Open the unzipped folder and select everything **inside** it (README.md, LICENSE, .gitignore, webcam-capture.js, and the `docs`, `snippets`, `scripts` folders). Drag them into the browser window. Dragging folders keeps their structure.
   - `.gitignore` is a hidden file; if it does not show, enable "show hidden files" or add it later with **Add file -> Create new file**.
4. Commit message: `Add APEX webcam photo capture`, keep **Commit directly to the main branch**, click **Commit changes**.

## 3. Check
- The repository front page should show the README.
- Folders: `docs/`, `snippets/`, `scripts/`.
- Optional: **Settings -> General -> Social preview / Topics**: add `oracle-apex`, `plsql`, `webcam`, `javascript`.

## 4. Share
Copy the repository URL and paste it into your LinkedIn post.

## Alternative: command line
```
cd apex-webcam-photo-capture
git init -b main
git add -A
git commit -m "Add APEX webcam photo capture"
git remote add origin https://github.com/<your-user>/apex-webcam-photo-capture.git
git push -u origin main
```
