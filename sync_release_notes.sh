#!/bin/bash

# Configure git settings for this repo
git config user.email "someone@example.com"
git config user.name "TeamCity server"

git add releaseNotes

# Check if there is anything to commit
if ! git diff --cached --quiet; then
  git commit -m "Automatic sync: updated release notes" || exit 1
  git push || exit 1
else
  echo "No files to sync"
fi
