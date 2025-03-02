#!/bin/bash

# Script to deploy Firebase Functions with proper API key configuration
# This helps solve the CORS issue by creating proxy endpoints for AI APIs

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Error: Firebase CLI is not installed. Please run 'npm install -g firebase-tools'"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "You need to log in to Firebase first. Running 'firebase login'..."
    firebase login
fi

# Prompt for API keys if not already configured
echo "Checking Firebase Functions configuration..."

# Check if OpenAI API key is configured
OPENAI_KEY=$(firebase functions:config:get openai.key 2>/dev/null)
if [ -z "$OPENAI_KEY" ] || [ "$OPENAI_KEY" == "undefined" ]; then
    echo "OpenAI API key not found in config."
    read -p "Enter your OpenAI API key: " OPENAI_API_KEY
    firebase functions:config:set openai.key="$OPENAI_API_KEY"
    echo "OpenAI API key configured."
else
    echo "OpenAI API key already configured."
fi

# Check if Anthropic API key is configured
ANTHROPIC_KEY=$(firebase functions:config:get anthropic.key 2>/dev/null)
if [ -z "$ANTHROPIC_KEY" ] || [ "$ANTHROPIC_KEY" == "undefined" ]; then
    echo "Anthropic API key not found in config."
    read -p "Enter your Anthropic API key: " ANTHROPIC_API_KEY
    firebase functions:config:set anthropic.key="$ANTHROPIC_API_KEY"
    echo "Anthropic API key configured."
else
    echo "Anthropic API key already configured."
fi

# Make sure CORS is installed in the functions package
echo "Installing CORS package for functions..."
cd functions
npm install cors --save
cd ..

# Deploy the functions
echo "Deploying Firebase Functions..."
firebase deploy --only functions

echo "Functions deployed successfully!"
echo ""
echo "Your app can now use these HTTP functions to proxy AI API calls:"
echo "- proxyOpenAI - for OpenAI API calls"
echo "- proxyAnthropic - for Anthropic API calls"
echo ""
echo "This solves the CORS issue by routing requests through Firebase Functions."