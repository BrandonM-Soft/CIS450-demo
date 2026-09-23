import cv2

filename = f"./edges/sunset.png"

outfile = f"./edges/outfile.png"

color = cv2.imread(filename)

gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)

cv2.namedWindow('image')

cv2.createTrackbar('blend', 'image', 0, 100, lambda x: None)
cv2.createTrackbar('thresh', 'image', 0, 255, lambda x: None)
cv2.createTrackbar('blur', 'image', 0, 31, lambda x: None)

while True:
    blend  = cv2.getTrackbarPos('blend', 'image')
    thresh = cv2.getTrackbarPos('thresh', 'image')
    k      = cv2.getTrackbarPos('blur', 'image')

    k = max(1,k)
    if k % 2 == 0:
        k += 1
    k = min(31,k)
    cv2.setTrackbarPos('blur', 'image', k)

    alpha = blend / 100.0
    beta = 1.0 - alpha

    blur = cv2.GaussianBlur(gray, (k,k), 0)

    dx = cv2.Sobel(blur, cv2.CV_64F, 1, 0, ksize=3)
    dy = cv2.Sobel(blur, cv2.CV_64F, 0, 1, ksize=3)
    mag = cv2.magnitude(dx, dy)
    grad = cv2.convertScaleAbs(mag)

    _,edges = cv2.threshold(grad, thresh, 255, cv2.THRESH_BINARY)

    edges_color = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

    blended = cv2.addWeighted(color, beta, edges_color, alpha, 0)

    cv2.imshow('image', blended)

    k = cv2.waitKey(1) & 0xFF
    if k == ord('q'):
        break

cv2.destroyAllWindows()
cv2.imwrite(outfile, blended)