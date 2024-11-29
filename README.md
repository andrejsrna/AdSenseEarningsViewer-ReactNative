AdSense Stats App
An AdSense Stats App built with React Native that allows you to easily track your Google AdSense earnings and performance data. Sign in with your Google account to view your earnings for the current month, last month, and the last 7 days.

Features
Google Sign-In Authentication: Securely sign in with your Google account.
AdSense Data Fetching: Retrieve earnings data from the Google AdSense API.
Earnings Overview:
This Month's Earnings with percentage change compared to last month.
Last Month's Earnings.
Last 7 Days Earnings, displaying each day's earnings separately.
Refresh Data: Manually refresh to get the latest earnings.
Responsive UI: Built using React Native Elements for a polished look and feel.
Environment Variables: Sensitive data like client IDs are managed through environment variables.
Prerequisites
Node.js: Make sure you have Node.js installed (version 12 or higher is recommended).

React Native CLI: Install the React Native CLI if you haven't already.

bash
Kopírovať kód
npm install -g react-native-cli
Google AdSense Account: You need an active Google AdSense account to fetch earnings data.

Google Cloud Project: Set up a project in the Google Cloud Console with the Google AdSense API enabled.

Getting Started
1. Clone the Repository
bash
Kopírovať kód
git clone https://github.com/yourusername/adsense-stats-app.git
cd adsense-stats-app
2. Install Dependencies
bash
Kopírovať kód
npm install
3. Set Up Environment Variables
Create a .env file in the root directory of your project:

bash
Kopírovať kód
touch .env
Add your Google OAuth client IDs to the .env file:

env
Kopírovať kód
IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
Important: Do not commit the .env file to version control. Ensure .env is listed in your .gitignore file.

4. Configure Google Sign-In
Ensure that your Google Cloud project has the OAuth consent screen configured and that you have created OAuth client IDs for both iOS and Web applications.

iOS Client ID: Used for Google Sign-In on iOS devices.
Web Client ID: Used for web authentication.
5. Enable Google AdSense API
In your Google Cloud Console:

Navigate to APIs & Services > Library.
Search for Google AdSense API.
Enable the API for your project.
6. Configure Babel
Ensure your babel.config.js is set up to use react-native-dotenv:

javascript
Kopírovať kód
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,
      },
    ],
  ],
};
7. Run the App
Start the Metro bundler and run the app on your desired platform.

For iOS:
bash
Kopírovať kód
npx react-native run-ios
For Android:
bash
Kopírovať kód
npx react-native run-android
8. Test the App
Sign In: On the homepage, click "Sign In with Google" and authenticate using your Google account.
View Data: After signing in, your AdSense earnings data should be displayed.
Refresh Data: Use the "Refresh Data" button to fetch the latest earnings.
Sign Out: Click "Sign Out" to log out of your account.
Project Structure
App.tsx: Main application file containing the app logic.
Components: Folder for any custom components used in the app.
Screens: Folder for different screen components if you expand the app.
Services: Folder for API services and network requests.
assets: Folder for images, fonts, and other static assets.
Dependencies
React Native: ^0.70.0
@rneui/themed: For UI components and theming.
@react-native-google-signin/google-signin: For Google Sign-In authentication.
axios: For making API requests to the AdSense API.
react-native-dotenv: For environment variable management.
Troubleshooting
Authentication Errors: Ensure your client IDs are correct and that the OAuth consent screen is properly configured in the Google Cloud Console.
API Errors: Verify that the AdSense API is enabled for your project and that your account has the necessary permissions.
Environment Variables Not Found: Make sure you've restarted the Metro bundler after adding the .env file and that it's not committed to version control.
Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

License
This project is licensed under the MIT License.

Contact
If you have any questions or need further assistance, please contact:

Your Name
Email: your.email@example.com
