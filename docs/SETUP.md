# Step-by-step setup in Oracle APEX

Tested on APEX 24.2. Replace names in CAPS with your own.

## Step 1 - Page items
- File item `PX_PHOTO` (type *File Upload*, accept `image/jpeg,image/png`).
- A `<canvas id="pat-image-preview">` in a Static Content region (or HTML in the item's pre/post text).
- Do **not** keep a hidden item for the photo base64; it will not be used.

## Step 2 - Page JavaScript
Page -> JavaScript -> *Function and Global Variable Declaration*: paste `webcam-capture.js`.
Edit the ids `pat-image-preview` and `P1024027_PAT_PHOTO` to match your page.

## Step 3 - Camera button
1. Create a button `OPEN_CAMERA`, Action: *Defined by Dynamic Action* (icon `fa-camera`).
2. Create a Dynamic Action: Event *Click*, Selection Type *Button*, True action *Execute JavaScript Code*: `openWebcam();`

## Step 4 - File picker handling
Dynamic Action on *Change* of the file item, Execute JavaScript:
```
var file = this.triggeringElement.files[0];
if (!file) return;
if (['image/jpeg','image/png'].indexOf(file.type) === -1) {
    this.triggeringElement.value = '';
    apex.message.alert('Only JPG or PNG images are allowed.');
    return;
}
renderPhoto(URL.createObjectURL(file));
// Resize to max 800px JPEG for upload
var url = URL.createObjectURL(file), im = new Image();
im.onload = function () {
    var s = Math.min(800/im.width, 800/im.height, 1), c = document.createElement('canvas');
    c.width = Math.round(im.width*s); c.height = Math.round(im.height*s);
    var cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0,0,c.width,c.height);
    cx.drawImage(im,0,0,c.width,c.height);
    patPhotoB64 = c.toDataURL('image/jpeg',0.85).split(',')[1];
    URL.revokeObjectURL(url);
};
im.src = url;
```

## Step 5 - Save call
In your save JavaScript add `f01: chunkB64(patPhotoB64)` (see `snippets/save-dml.js`).

## Step 6 - Server process
Use `snippets/save-process.sql` in the Ajax Callback process. Ensure the insert/update keeps the old photo when the BLOB is NULL.

## Step 7 - Background removal files
1. On a computer with Node.js run `scripts/get-mediapipe.sh`.
2. Shared Components -> Static Application Files -> upload each file in `mediapipe/` named `mediapipe/<filename>` (skip the empty `.data` file if APEX refuses it).
3. The page loads them from `apex.env.APP_FILES + 'mediapipe/'`.

## Step 8 - Allow the camera on HTTP (local network only)
See README. Without it, `navigator.mediaDevices` is undefined on `http://<ip>`.

## Troubleshooting
| Symptom | Cause / fix |
|---------|-------------|
| "Camera is not available" | Insecure origin; apply the Chrome flag or use HTTPS |
| Dark band at bottom of saved photo | Photo sent through a page item (32K limit); use `f01` chunks |
| "Background change is not available" | MediaPipe files missing or misnamed; check the Network tab for 404s |
| Preview looks stretched | Use `renderPhoto` for every preview |
| Old photo replaced by blank | Procedure must keep the existing BLOB when the new one is NULL |
