# Memory Sharing App

## Project Overview
This application addresses privacy and psychological fatigue issues commonly found in large-scale social media platforms.
Instead of public sharing, users can create private groups where photos are shared only among invited members, enabling a secure and controlled environment for preserving personal memories.
The app also includes a comment feature within albums, allowing meaningful interaction without exposure to anonymous or harmful feedback.

## My Role
I was responsible for the front-end architecture and UI implementation of the application.
I designed and developed the album grid layout to allow users to quickly understand album themes at a glance.
For the album detail view, I implemented a masonry-style image layout to enhance visual engagement and prevent monotonous browsing experiences.
I closely collaborated with backend APIs to ensure efficient data fetching and smooth user interaction.

## Key Contributions
- Implemented authentication-related UI flows including login, sign-up, and tab-based navigation using React Native.
- Developed the album list screen and album detail screen, including grid-based album previews and masonry-style photo layouts.
- Designed and implemented an API endpoint to fetch all images belonging to an album, and integrated the API into the front-end with asynchronous data handling.

---

## Technical Overview

Memory Sharing is a group-based photo sharing mobile application built with React Native and a Cloudflare-native backend.
It allows users to create groups, share photo albums, and collaborate with invited members.
Each group can contain multiple albums, and each album can store images uploaded by group members based on their permissions.

This project was built as a portfolio project to demonstrate real-world frontend–backend integration, API-driven development, and mobile application architecture.

## Features
- Create and manage groups
- Update group information (name, description, emoji thumbnail)
- Create albums and attach them to groups
- Upload and view images within albums
- Long-press album actions (remove album from group)
- Responsive mobile UI with bottom sheet modals

## Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- expo-router
- nativewind (Tailwind CSS for React Native)
- @gorhom/bottom-sheet
- react-native-gesture-handler

### Backend
- Cloudflare Workers
- Hono
- Zod + OpenAPI
- Cloudflare D1 (SQL database)
- Cloudflare R2 (object storage for images)

### API & Tooling
- OpenAPI-driven API design
- openapi-typescript & openapi-fetch for type-safe API calls
- multipart/form-data handling for updates and uploads

## Architecture
The application follows a client–server architecture:

- The mobile client communicates with the backend through an OpenAPI-defined REST API.
- The backend is implemented using Hono and deployed on Cloudflare Workers.
- Group, album, image, and member relationships are managed through a relational database (D1).
- Images are stored in Cloudflare R2 and referenced via signed URLs.
