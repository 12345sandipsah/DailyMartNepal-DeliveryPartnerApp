# Delivery partner push notifications

The app asks for device notification permission after the partner signs in. It uses Firebase Cloud Messaging (FCM) for remote delivery, creates an Android channel for essential alerts, displays foreground alerts in the operating system, and opens the related delivery or support ticket when an alert is tapped.

Push is reserved for new delivery offers, account deactivation, failed salary transfers, rejected documents, support requests waiting for a partner reply, and urgent safety/support responses. Routine updates and resolved tickets remain in the in-app notification center.

## Firebase project setup

1. Create or select the Firebase project and enable the Firebase Cloud Messaging API.
2. In Firebase, register the Android app with application ID `com.deliverypartnerapp` and place its `google-services.json` at `android/app/google-services.json`.
3. Set a permanent iOS bundle identifier in the Xcode target before registering the iOS app in Firebase. Add that app's `GoogleService-Info.plist` to the `DeliveryPartnerApp` target's Copy Bundle Resources.
4. For iOS, enable Push Notifications for the app identifier, configure an APNs authentication key in Firebase, and use a signing profile with the push entitlement.
5. Install native dependencies and rebuild: run `pod install` from `ios`, then build/install the Android or iOS app again. A Metro reload alone cannot add native notification modules.

## Backend sender credentials

Give the backend a Firebase Admin service account with permission to send FCM messages. Configure either:

- `FIREBASE_SERVICE_ACCOUNT_JSON` with the service account JSON as a secret environment value; or
- `GOOGLE_APPLICATION_CREDENTIALS` with a protected path to the service account file, plus `FIREBASE_PROJECT_ID` when project autodetection is unavailable.

Never commit a service account key or add it to the app bundle. The backend persists the notification first, so missing Firebase credentials do not prevent the in-app notification from being saved.

## Permission and registration behavior

The app presents a short explanation and then requests the operating system permission. Partners can enable it later from **Settings → Notifications → Device Alerts**. A permitted device registers its FCM token against the authenticated partner; logout removes that registration when the backend is reachable. Invalid or expired tokens are removed after FCM reports them.
