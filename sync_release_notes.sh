#!/bin/bash

# Configure git settings for this repo
git config user.email "someone@example.com"
git config user.name "TeamCity server"
# Be sure that remote points out to repository trough the ssh
git remote set-url --push origin 'git@github.com:ILikeYourHat/example-maven-repository.git'

# Add all files from the target folder
git add releaseNotes

# Check if there is anything to commit
if ! git diff --cached --quiet; then
  git commit -m "Automatic sync: updated release notes" || exit 1
  git push || exit 1
else
  echo "No files to sync"
fi

# Provide the current commit as output
echo "##teamcity[setParameter name='CommitSha' value='$(git rev-parse HEAD)']"
