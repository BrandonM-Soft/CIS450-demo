# Final Project
**Note:** This project is curently in the ideation phase, and details are subject to change.
## Description
This folder of the CIS450 Repository holds the final project for the class, in which a containerized application is developed to be deployed to a cloud-based environment. The application runs a Python Script that demonstrates Computer Vision using the *OpenCV* Python library. <br>

The plan for this project is to develop an application that uses *OpenCV* in collaboration with *DeepFace* to capture an image from the user's webcam, determine the emotions being shown from the user's face, and alter the image based on the analysis. <br>
### Examples of the Application's Functionality
- Altering the colors of the image to appear more vivid if the user appears to be smiling or happy.
- Lowering the saturation of the image if a person appears to be frowning or sad
- Increasing the contrast of the image if a person appears to be upset or angry.
- No changes are made if the user appears to have a neutral expression, which is determined if the facial recognition values are all below a pre-defined threshold.

### Restrictions
Due to the limited resource constraints of the project, the program does not perform any real-time continuous proccessing from the video feed of the user's webcam. The user is instructed to snap an image, which will be sent once to the server, and will return the resulting image after processing. The application will only accept one request at a time, and will deny any incoming requests until the application finishes processing and returns an altered image file back to the client. The application will also not support a queue-based system. The Web-UI will inform users when the server is ready to recieve requests, and when it is busy.

### Licencing
- [Python](https://www.python.org/): Python Software Foundation License Version 2, Copyright © 2001 Python Software Foundation; All Rights Reserved
- [OpenCV](https://opencv.org/): Apache License, Copyright © 2020, OpenCV team
- [Deepface](https://github.com/serengil/deepface): MIT License, Copyright © 2019, Sefik Ilkin Serengil

## Design


### Frontend
The Web-UI will be designed to look vibrant and attractive, with graphical elements and design harkening back to the design language often used in late 2000's and early 2010's software (Referred to as 'Frutiger Aero' by the community), such as the UIX of Windows Vista & Windows 7. <br>
On the top of the page, it will feature the name of the project in a stylized font, with a stylish gradient spanning across the top. <br>
At the center of the page, it will contain the following from top to bottom:
- A Status Indicator which tells the users when the service is ready to recieve input from clients (highlighted in green), and when it is currently busy with another job (highlighted in red).
- A live camera feed from the user's webcam.
- A large submit button which, when pressed, takes a still frame from the live camera feed at the time the button was pressed. That photo will then be submitted to the appropriate API endpoint, and it will then use the image that the server recieves for proccessing.
- A frame containing the resulting photo. Initially, this frame will be blank upon visiting the Web-UI until the client recieves an image from the server after processing the user's request. 

### Backend
Early implementations of the project idea will building off of an open-source project named *Facial-Emotion-Recognition-using-OpenCV-and-Deepface* by manish-9245 on GitHub. Credit will be given to the user for providing the project as a starting point. From there, its just about adapting the Python program to display all graphical elements on an HTML page instead of in a graphical window, as well as analyzing a still photo recieved by a client user instead of a live camera feed.

### AI Usage
Usage of AI coding agents will be used sparingly throughout the course of develeopment. For the most part, LLMs will be used for debugging. There will also be times in which AI is used to create ideas for software solutions.
The goal is to have most, if not all, lines of code to be human-made. At no point will LLMs be delegated to automating development. LLMs will also be prohibitted from making any commits to the repository. If LLMs perform any modification to the code of the repository, it will be noted in both the commits and a development log file.

### Resources
[Facial-Emotion-Recognition-using-OpenCV-and-Deepface](https://github.com/manish-9245/Facial-Emotion-Recognition-using-OpenCV-and-Deepface): The base for the project's backend, which will be modified to support displaying graphical elements on an HTML site. Credit to [manish-9245](https://github.com/manish-9245) for developing the codebase.