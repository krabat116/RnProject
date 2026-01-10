# Memory Sharing App

A group-based photo sharing mobile application built with React Native and a Cloudflare-native backend.

## Overview

Memory Sharing is a mobile application that allows users to create groups, share photo albums, and collaborate with invited members.  
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

