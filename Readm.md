# CrowdFund

A role-based crowdfunding web application built using Java, HTML, CSS, JavaScript, and Firebase.

## Live Demo

https://ayushhsengar.github.io/CrowdFunding_/

## Features

- User authentication
- Role-based access control
- Admin dashboard
- Creator dashboard
- Contributor dashboard
- Campaign creation
- Campaign approval and rejection
- Campaign contributions
- Contribution history
- User role management
- Real-time updates
- Loading indicators

## User Roles

### Admin
- Manage users
- Edit user roles
- Approve campaigns
- Reject campaigns
- Manage campaigns

### Creator
- Create campaigns
- View own campaigns
- Track campaign progress
- Check campaign status

### Contributor
- View approved campaigns
- Contribute to campaigns
- View contribution history
- See which campaign they contributed to

## Technologies Used

- Java
- HTML5
- CSS3
- JavaScript
- Firebase Authentication
- Firebase Firestore
- Git & GitHub
- GitHub Pages

## Project Setup

1. Download or clone the Crowd Funding_repository from GitHub to your local computer.

2. Extract the ZIP file if you downloaded the repository as a ZIP.

3. Open the extracted Crowd Funding_folder in VS Code.

4. Make sure Java JDK 8 or higher is installed on your computer.

5. Open a terminal and run java -version to check the Java installation.

6. Run javac -version to make sure the Java compiler is also installed.

7. Create or open the Firebase project used by the application.

8. Enable Firebase Authentication in the Firebase Console.

9. Enable the Email/Password sign-in method under Firebase Authentication.

10. Enable Cloud Firestore in the Firebase Console.

11. Create the required users in Firebase Authentication.

12. Create corresponding documents for these users in the Firestore users collection and assign ADMIN. CREATOR, or CONTRIBUTOR as their ROLE.

13. Open script.js in the project and make sure the Firebase configuration is correctly added.

14. Open the project folder in a terminal.

15. Compile the Java backend by running javac Backend_Logic.java.

16. If compilation is successful, start the backend by running java Backend_Logic.

17. Wait for the message Crowdfunding Backend Started and confirm that the server is running on http://localhost:8080

18. Keep the backend terminal open because the Java server must continue running while using the application.

19. Open a second terminal in the same project folder for the frontend.

20. Open the project in VS Code and make sure the Live Server extension is installed.

21. Right-click index.html and select Open with Live Server.

22. Live Server will start the frontend, usually at http://localhost: 5500/ or http://127.0.0.1:5500/.

23. Open the Live Server URL in your browser.

24. The frontend will connect to the Java backend running on http://localhost:8080 and Firebase for authentication and database operations.

25. Log in using a Firebase Authentication account.

26. The application will check the user's ROLE from Firestore and open the appropriate Admin, Creator, or Contributor Dashboard.

27. To stop the project, close the browser and stop both the Java backend and Live Server terminals.


## Project Structure

CrowdFunding_/
│
├── screenshots/
│   ├── Login.png
│   ├── admin-dashboard.png
│   ├── creator-dashboard.png
│   └── contributor-dashboard.png
│
├── index.html
├── Admin.html
├── script.js
├── style.css
├── Backend_Logic.java
└── README.md