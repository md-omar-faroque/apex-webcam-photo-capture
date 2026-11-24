// Inside the function that saves the page
apex.server.process('YOUR_PROCESS', {
    pageItems: ["P1_ITEM1", "P1_ITEM2"],   // do NOT include a base64 photo item
    f01: chunkB64(patPhotoB64)             // photo goes as an array of 30,000 char chunks
}, {
    dataType: 'json',
    success: function (data) { /* ... */ }
});
