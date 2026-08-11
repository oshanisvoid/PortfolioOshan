# Google Guestbook Setup

The guestbook uses Google Sign-In through Firebase Authentication and stores
messages in Cloud Firestore.

1. Create a Firebase project.
2. Add a Web App under Project Settings.
3. Copy its web config into `firebase-config.js`.
4. Firebase Console → Authentication → Sign-in method → enable Google.
5. Add `localhost` and `127.0.0.1` to Authentication → Settings → Authorized domains.
6. Create a Firestore database.
7. Apply the rules in `firestore.rules`.
8. Add `oshanpaudel.com.np` to Firebase Authorized Domains before production.

After setup:
- Visitors click "Continue with Google".
- Their Google profile name/photo is shown.
- They can publish a message.
- Everyone can read the public guestbook messages.
- Users cannot edit/delete entries from the client.
