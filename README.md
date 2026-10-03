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

## AI Code Evaluation Assistance (Powered by Google Antigravity)
This section is dedicated to analyzing how the `matplotlib.pyplot` works, as demonstrated in `./matplotlib-antigravity-eval/plotter.py`. Google Antigravity was used to search through the codebase and analyze the functions of the library through deep analysis. Starting with:

* `plt.plot`: Maps coordinate pairs *x* and *y* into a 2D Cartesian plane and draws lines connecting those coordinates.

↓ Which calls ↓ 

* `gca().plot()`: Stands for "Get Current Axes". It inspects the current active figure from `gcf()` and returns its active `Axes` object instance. If it is not active, it will create a default figure and axes.

↓ Which calls ↓ 

* `Axes.plot`: the method that handles all of the logic behind the 2D Line and marker plotting. With `plt.plot()` acting as a wrapper for this object. It works in four stages:
    1) Parses arguements and variables from `plot()`
    2) Adds line styles and properties
    3) Creates a `Line2D` artist object and executes the `add_line()` function
    4) Autoscales the axes if the flags `scalex` and `scaley` are `True`
    5) Returns a Python list of `Line2D` instances.

↓ Which calls ↓ 

* `add_line`: Registers a `Line2D` artist within an `Axes` instance.