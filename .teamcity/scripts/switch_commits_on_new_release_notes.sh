#!/bin/bash

# Configure git settings for this repo
git config user.email "someone@example.com"
git config user.name "TeamCity server"
# Be sure that remote points out to repository trough the ssh
git remote set-url --push origin 'git@github.com:ILikeYourHat/example-maven-repository.git'

# Get the commit on which this build was invoked
currentCommitSha=$(git rev-parse HEAD)
# Try to get the updated commit we should target instead
inputCommitSha="$1" || exit 0

# Check if we should update current HEAD
if [ "$inputCommitSha" != "$currentCommitSha" ]; then
    # Update the current HEAD for next steps
    git fetch origin || exit 1
    git checkout "$inputCommitSha" || exit 1
fi
