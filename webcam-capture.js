var patPhotoB64 = '';
var camStream = null;

// Split a base64 string into pieces that fit into one f01 array element
function chunkB64(s) {
    var parts = [];
    for (var i = 0; i < s.length; i += 30000) {
        parts.push(s.substr(i, 30000));
    }
    return parts;
}

// One renderer for every photo preview: whole image, centered, never cropped or stretched
function renderPhoto(src) {
    var canvas = document.getElementById('pat-image-preview');
    if (!canvas) { return; }

    var SIZE = 200;
    canvas.width  = SIZE;
    canvas.height = SIZE;

    canvas.style.background   = '#fff';
    canvas.style.borderRadius = '15px';
    canvas.style.border       = '1px solid #009688';
    canvas.style.padding      = '5px';
    canvas.style.width        = '100px';
    canvas.style.height       = '100px';

    var ctx = canvas.getContext('2d');
    var img = new Image();
    if (src.indexOf('data:') !== 0 && src.indexOf('blob:') !== 0) {
        img.crossOrigin = 'anonymous';
    }

    img.onload = function () {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, SIZE, SIZE);
        var s = Math.min(SIZE / img.width, SIZE / img.height);
        var w = img.width  * s;
        var h = img.height * s;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
    };
    img.onerror = function () {
        if (src.indexOf('no_photo.jpg') === -1) {
            renderPhoto(apex.env.APP_IMAGES + 'no_photo.jpg');
        }
    };
    img.src = src;
}

function drawToCanvas(imgElemId, canvasId) {
    function tryDraw(retries) {
        var imgElem = document.getElementById(imgElemId);
        var src = imgElem && imgElem.tagName === 'IMG'
                  ? imgElem.src
                  : imgElem && imgElem.querySelector('img')
                    ? imgElem.querySelector('img').src
                    : null;

        if (!src || src === window.location.href || src === '') {
            if (retries > 0) {
                setTimeout(function () { tryDraw(retries - 1); }, 300);
            } else {
                renderPhoto(apex.env.APP_IMAGES + 'no_photo.jpg');
            }
            return;
        }
        renderPhoto(src);
    }
    tryDraw(10);
}

function stopWebcam() {
    if (camStream) {
        camStream.getTracks().forEach(function (t) { t.stop(); });
        camStream = null;
    }
}

function closeWebcam() {
    stopWebcam();
    $('#cam-overlay').remove();
}

function openWebcam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        apex.message.alert('Camera is not available. Open this page from HTTPS or an allowed address and allow camera access.');
        return;
    }
    closeWebcam();

    var html =
      '<div id="cam-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);z-index:100000;display:flex;align-items:center;justify-content:center;">' +
        '<div style="background:#fff;border-radius:10px;padding:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.4);">' +
          '<h3 style="margin:0 0 10px 0;">Capture Patient Photo</h3>' +
          '<video id="cam-video" autoplay playsinline muted style="width:480px;max-width:90vw;background:#000;border-radius:8px;"></video>' +
          '<canvas id="cam-snap" style="display:none"></canvas>' +
          '<div id="cam-bg" style="margin-top:10px;font-size:14px;">Background: ' +
            '<label style="margin:0 8px;"><input type="radio" name="cam_bg" value="original" checked> Original</label>' +
            '<label style="margin:0 8px;"><input type="radio" name="cam_bg" value="#ffffff"> White</label>' +
            '<label style="margin:0 8px;"><input type="radio" name="cam_bg" value="#1e5bc6"> Blue</label>' +
          '</div>' +
          '<div style="margin-top:12px;">' +
            '<button type="button" id="cam-take" class="t-Button t-Button--hot">Take Photo</button> ' +
            '<button type="button" id="cam-cancel" class="t-Button">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    $('body').append(html);
    $('#cam-take').on('click', captureFromWebcam);
    $('#cam-cancel').on('click', closeWebcam);

    navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
        .then(function (stream) {
            var v = document.getElementById('cam-video');
            if (!v) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
            camStream = stream;
            v.srcObject = stream;
        })
        .catch(function (err) {
            closeWebcam();
            apex.message.alert('Cannot access camera: ' + err.message);
        });
}

var selfieSeg = null;
var SEG_BASE = apex.env.APP_FILES + 'mediapipe/';

function loadSegmenter(cb, fail) {
    if (selfieSeg) { cb(selfieSeg); return; }
    function init() {
        try {
            var seg = new SelfieSegmentation({ locateFile: function (f) { return SEG_BASE + f; } });
            seg.setOptions({ modelSelection: 1 });
            seg.initialize().then(function () { selfieSeg = seg; cb(seg); }).catch(fail);
        } catch (e) { fail(e); }
    }
    if (window.SelfieSegmentation) { init(); return; }
    var sc = document.createElement('script');
    sc.src = SEG_BASE + 'selfie_segmentation.js';
    sc.onload = init;
    sc.onerror = fail;
    document.head.appendChild(sc);
}

// Replace everything except the person with a solid colour
function applyBackground(snap, color, done) {
    loadSegmenter(function (seg) {
        seg.onResults(function (r) {
            var out = document.createElement('canvas');
            out.width = snap.width;
            out.height = snap.height;
            var cx = out.getContext('2d');
            cx.filter = 'blur(2px)';
            cx.drawImage(r.segmentationMask, 0, 0, out.width, out.height);
            cx.filter = 'none';
            cx.globalCompositeOperation = 'source-in';
            cx.drawImage(snap, 0, 0, out.width, out.height);
            cx.globalCompositeOperation = 'destination-over';
            cx.fillStyle = color;
            cx.fillRect(0, 0, out.width, out.height);
            done(out);
        });
        seg.send({ image: snap }).catch(function () { done(snap, true); });
    }, function () { done(snap, true); });
}

function finishCapture(canvas) {
    var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    patPhotoB64 = dataUrl.split(',')[1];
    renderPhoto(dataUrl);
    $('#P1024027_PAT_PHOTO').val('');
    closeWebcam();
}

function captureFromWebcam() {
    var video = document.getElementById('cam-video');
    if (!video || !video.videoWidth) {
        apex.message.alert('Camera is not ready yet. Please wait a moment and try again.');
        return;
    }

    var scale = Math.min(640 / video.videoWidth, 1);
    var snap  = document.getElementById('cam-snap');
    snap.width  = Math.round(video.videoWidth * scale);
    snap.height = Math.round(video.videoHeight * scale);
    snap.getContext('2d').drawImage(video, 0, 0, snap.width, snap.height);

    var bg = $('input[name="cam_bg"]:checked').val();
    if (bg === 'original') {
        finishCapture(snap);
        return;
    }

    $('#cam-take').prop('disabled', true).text('Processing...');
    applyBackground(snap, bg, function (result, failed) {
        if (failed) {
            apex.message.alert('Background change is not available (the segmentation library could not be loaded). The original photo was used.');
        }
        finishCapture(result);
    });
}
