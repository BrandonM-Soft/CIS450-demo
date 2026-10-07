# Debugging AI - 
For this section, I used an AI chatbot to help create Python code. The code was to utilize OpenCV to create an algorithm meant to demonstrate image detection. <br>
In this case, it is meant to detect how many US coins are shown and what kind of coins they are in a set of provided images. <br>
The model I used was Caude Opus 4.6 via the Google Antigravity Extension on VS Code. This allows for Antigraviy to directly interact with my local codebase and make direct changes to any program.

### 1st Prompt
I started by giving Claude this prompt:
```
I have an empty Python program named `findcoins.py` located in the `coins` directory of the repository. Within that same directory are four PNG images of various US Coins. The goal is to create a program that uses OpenCV and has an algorithm in this empty Python file that can:
- Identify how many coins are present in each image
- Assign the type of US Coin for each coin identified (Quarter, Dime, Nickel, Penny)
- Count the monetary value of each coin and display a total value for all the coins displayed in each image.
The program would then need to create new images with markers that show the type of coin for each coin on each image, followed by the total monetary value of every coin in each image.
Could you generate Python code within this Python file that fulfils these requirements?
Any algorithm is acceptable for image detection, but it has to be somewhat efficient.
```
It took about 9 minutes for it to think, until it eventually resulted in it creating a 465-line Python program. <br>
Claude used a combination of hybrid contour and HoughCircles to achieve the image recognition algorithm. The proccess is broken up into five steps: <br>
    1)  Preprocessing <br>
    2)  Detection <br>
    3)  Deduplication <br>
    4)  Classification <br>
    5)  Annotation <br>

### Second Prompt
While the program it created acted as a great first start, I described what needed to be done next on my prompt:
```
This is a good start. The implementation of the `is_copper` function is especially reliable in identifying pennies.
However, there is still some room for improvement. Here are the two main issues that need to be addressed:
- There is plenty of visual clutter with the annotations, particularly for `coins4_result.png`. I suggest that the labels for each coin should instead be transformed to fit inside the colored circle that correlates to its identification.
- The algorithm has trouble correctly identifying the types of coins when they are shown to be nearly identical in size. (Example: the algorithm incorrectly assumed that the dime and nickel in `coins3.png` are quarters)
```
What resulted from this was a program that was slightly improved in detecting the types of coins being shown in each image. However, it's still far from perfect, which is why small steps are taken to get there.