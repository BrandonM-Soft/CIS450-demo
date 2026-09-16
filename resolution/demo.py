import cv2 as cv
import sys
import os

print("Current working directory:", os.getcwd())

img = cv.imread("photos/1.JPEG")
print(img.shape)

if img is None:
    sys.exit("Could not read the image.")

cv.namedWindow("Display window", cv.WINDOW_NORMAL)
cv.resizeWindow("Display window", 800, 600)

cv.imshow("Display window", img)
k = cv.waitKey(0)


# Height was calculated by doing the following: (640 / 5184) * 3456
resized_image = cv.resize(img, (640, 427), dst=None, fx=None, fy=None, interpolation=cv.INTER_LINEAR)
filename = "photos/1-640x427.JPEG"
cv.imwrite(filename, resized_image)
print(f"Image saved to {filename}")