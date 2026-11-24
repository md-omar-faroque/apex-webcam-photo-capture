#!/bin/sh
# Downloads the MediaPipe Selfie Segmentation runtime for self-hosting.
set -e
mkdir -p mediapipe
cd mediapipe
npm pack @mediapipe/selfie_segmentation
tar xzf mediapipe-selfie_segmentation-*.tgz
cp package/selfie_segmentation* .
rm -rf package *.tgz
echo "Upload everything in ./mediapipe to Static Application Files as mediapipe/<file>"
