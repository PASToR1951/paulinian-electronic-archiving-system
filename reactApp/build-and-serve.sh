#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the React app
echo "Building the React app..."
npm run build

# Serve the built app
echo "Serving the React app..."
npm run serve 