# Flick It Philly
 
**An AI-powered civic reporting platform that makes it effortless for Philadelphians to report non-emergency issues and track them in real time.**
 
Built in 36 hours at Philly Codefest (April 2026).
 
---
 
## Overview
 
Flick It Philly reimagines how residents interact with local government for everyday, non-emergency issues, potholes, broken streetlights, overflowing trash bins, graffiti, and other quality-of-life concerns that too often go unreported because the existing process is slow, confusing, or simply too much friction.
 
Instead of digging through a city website or filling out a lengthy form, users can "flick" a photo, describe the issue in their own words (or their own language), and let AI handle the rest, classification, routing, and tracking, while giving the whole community visibility into what's being fixed and where.
 
## The Problem
 
Non-emergency civic issue reporting in most cities suffers from the same pain points:
 
- **High friction** - multi-step forms, unclear categories, and no mobile-first experience discourage reporting.
- **No visibility** - residents have no way to see if an issue has already been reported or what's happening near them.
- **Language barriers** - non-English speakers are effectively locked out of the reporting process.
- **Opaque status tracking** - once submitted, a report disappears into a black box with no feedback loop.
Flick It Philly tackles all four by combining a lightweight mobile interface with AI-driven understanding and live, map-based tracking.
 
## Key Features
 
- **AI-Powered Image Recognition** - Snap a photo of the issue and the app automatically identifies and categorizes it (e.g., pothole, illegal dumping, broken signage) using the Gemini API.
- **Speech-to-Text Reporting** - Describe the issue by voice instead of typing, making reporting accessible on the go and for users who prefer speaking over typing.
- **Multilingual Support** - Reports can be submitted and processed in multiple languages, removing a major barrier for non-English-speaking residents.
- **Real-Time, Location-Based Tracking** - Every report is geotagged and plotted on a live map, so users can see the exact status and location of their submission.
- **Nearby Report Visibility** - Users can see other reports submitted near them, preventing duplicate submissions and building a shared sense of community accountability.
- **Cross-Platform Mobile Prototype** - Built with Expo Go for a seamless experience across both Android and iOS from a single codebase.
## Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend / Mobile | JavaScript, HTML, CSS, Expo Go |
| AI / ML | Google Gemini API (image recognition, multilingual NLP, speech-to-text) |
| Data | JSON |
| Dev Tooling | Cursor |
| Location Services | Geolocation APIs |
 
## How It Works
 
1. **Capture** - A user opens the app and snaps a photo or records a voice description of the issue.
2. **Understand** - The Gemini API processes the input: classifying the image, transcribing speech, and translating/interpreting the report regardless of the language it was submitted in.
3. **Geotag** - The user's location is captured via geolocation APIs and attached to the report.
4. **Publish** - The report is added to a live, map-based feed where it's visible to the user, nearby residents, and (in a production version) the relevant city department.
5. **Track** - Users can follow the status of their report and browse other nearby reports in real time.
## Getting Started
 
> This project was built as a hackathon prototype. Setup steps below reflect the Expo Go development workflow used during the build.
 
### Prerequisites
- Node.js and npm installed
- [Expo Go](https://expo.dev/client) installed on your iOS or Android device
- A Google Gemini API key
### Installation
 
```bash
# Clone the repository
git clone https://github.com/CoryPearl/flick-it-philly.git
cd flick-it-philly
 
# Install dependencies
npm install
 
# Add your Gemini API key to a .env file
echo "GEMINI_API_KEY=your_key_here" > .env
 
# Start the Expo development server
npx expo start
```
 
Once the server starts, scan the QR code with the Expo Go app on your phone to launch Flick It Philly on your device.
 
## Hackathon Context
 
Flick It Philly was built during **Philly Codefest**, a 36-hour civic-tech hackathon, focused on making local government more responsive and accessible through AI. The goal was to design and ship a working, cross-platform prototype, from concept to demo, in a single weekend.
 
## Future Roadmap
 
- Direct API integration with Philadelphia's 311 non-emergency service system
- Push notifications for status updates on submitted reports
- Admin dashboard for city departments to triage and resolve incoming reports
- Gamified community engagement (e.g., badges for verified reports, neighborhood leaderboards)
- Offline-first support for low-connectivity areas
