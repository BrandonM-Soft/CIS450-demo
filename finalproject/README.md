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