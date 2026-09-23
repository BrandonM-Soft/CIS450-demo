# CIS450-demo
### Introduction
This repo illustrates best practice README file generation.
## Projects
OpenCV image processing demos.
## Recources
![Official OpenCV Logo](/assets/images/OpenCV_logo_black.svg)
<br>
[OpenCV](https://opencv.org/)
<br>
<br>
<br>
The OpenCV Logo is attributed to OpenCV and the OpenCV Team.

## Edge Detection
An 'edge' is defined as a boundry in which a sharp change in color or brightness occurrs between pixels in an image. It is determined by comparing the intensity of one pixel to its neighboring pixels.<br><br>
In the demonstration Python program `W5A.py`, it takes one of the specified images in the `edges` folder of the repo to create the 'edges' of said image. The result is a black & white image which displays the 'edges' of the image based on two perameters: 'thresh' and 'blur'. <br><br>
'thresh' determines which pixels could be considered 'edges' based on the sensitivity of change in color and/or brightness. <br><br>
'blur' adjusts the size of the 'edges' themselves. <br><br>
the 'blend' slider on the program, as it implies, blends the original image and the 'edges' of the image together, depending on the position of the slider. This is to show the 'edges' of the image in relation to the original. <br><br>
I have created 'edges' of the sample images located in the same folder, and used the following settings: <br>
art.png - blend:051/100, thresh:060/255, blur:09/31 <br>
frog.png - blend:036/100, thresh:024/255, blur:19/31 <br>
map.png - blend:067/100, thresh:048/255, blur:01/31 <br>
pokemon.png - blend:051/100, thresh:103/255, blur:05/31 <br>
sunset.png - blend:045/100, thresh:074/255, blur:11/31 <br>