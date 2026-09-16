import cv2 as cv
import sys
import os

print("Current working directory:", os.getcwd())

for i in range(12):
    img = cv.imread(f"photos/{i+1}.JPEG")
    print(img.shape)

    if img is None:
        print(f"Could not read the image: {i+1}.JPEG")
        continue
    
    # Height was calculated by doing the following: (640 / 5184) * 3456
    resized_image = cv.resize(img, (640, 427), dst=None, fx=None, fy=None, interpolation=cv.INTER_LINEAR)
    filename = f"resolution/{i+1}-640x427.JPEG"
    cv.imwrite(filename, resized_image)
    print(f"Image saved to {filename}")