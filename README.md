# APEX Webcam Photo Capture

Capture a photo from the webcam on an Oracle APEX page, pick a background (Original / White / Blue), preview it without cropping or stretching, and save the **whole** image to a BLOB column.

Built and tested against APEX 24.2 (patient photo on an OPD registration page), but nothing in it is specific to that app.

## What it does

- "Open Camera" button -> dialog with live video, Take Photo / Cancel
- Background option: Original, White or Blue (person segmentation in the browser, MediaPipe Selfie Segmentation)
- One renderer for every preview, so the image looks the same before and after save (contain-fit, never cropped or stretched)
- Photos are sent to the server in chunks, so they are not truncated by the ~32K page item limit
- Works with the normal file picker too (image is resized to max 800px JPEG)

## Files

| File | Purpose |
|------|---------|
| `webcam-capture.js` | Page-level JavaScript: camera dialog, capture, background change, preview |
| `snippets/open-camera-da.js` | Dynamic Action code for the camera button |
| `snippets/save-dml.js` | Add the chunked photo to your `apex.server.process` call |
| `snippets/save-process.sql` | PL/SQL that rebuilds the BLOB from `APEX_APPLICATION.G_F01` |
| `scripts/get-mediapipe.sh` | Downloads the MediaPipe files for self-hosting |
| `docs/SETUP.md` | Step-by-step APEX setup and troubleshooting |
| `docs/GITHUB_UPLOAD.md` | How to publish this project on GitHub |

## Setup

1. **Page JavaScript** - paste `webcam-capture.js` into *Function and Global Variable Declaration*. Replace `P1024027_PAT_PHOTO` and the canvas id `pat-image-preview` with your own file item and `<canvas>` id.
2. **Button** - create a button (action *Defined by Dynamic Action*) and a Dynamic Action on *Click* -> *Execute JavaScript Code*: `openWebcam();`
3. **Save** - in the JavaScript that calls your server process, add `f01: chunkB64(patPhotoB64)` next to `pageItems` (see `snippets/save-dml.js`).
4. **Server** - in the Ajax Callback process, use `snippets/save-process.sql` to rebuild the BLOB. Make sure your insert/update keeps the old photo when it is null.
5. **Background removal files** - run `scripts/get-mediapipe.sh`, then upload the files from `mediapipe/` to *Shared Components -> Static Application Files* as `mediapipe/<file>`. No CDN or internet is needed at runtime. If the files are missing, the original photo is saved and a message is shown.

## HTTP (non-SSL) origins

`getUserMedia` needs a secure context. On a plain `http://192.168.x.x:port` address the browser blocks the camera. For a local network without SSL, on each PC:

- Chrome/Edge: open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, enter the exact origin (for example `http://192.168.0.182:9091`), set it to **Enabled**, relaunch.
- Or deploy the `OverrideSecurityRestrictionsOnInsecureOrigin` browser policy. HTTPS is the proper long-term fix.

## Notes

- Background replacement is not perfect around hair; a plain wall and good light help.
- Segmentation applies to webcam captures only, not to files picked from disk.
- MediaPipe is Apache-2.0 licensed and is not bundled in this repo.

## License

MIT (this code). MediaPipe has its own license.
