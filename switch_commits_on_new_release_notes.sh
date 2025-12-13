#!/bin/bash

# Configure git settings for this repo
git config user.email "someone@example.com"
git config user.name "TeamCity server"
# Be sure that remote points out to repository trough the ssh
git remote set-url --push origin 'git@github.com:ILikeYourHat/example-maven-repository.git'

currentCommitSha=$(git rev-parse HEAD)
echo "Current commit: $currentCommitSha"
inputCommitSha="$1" || exit 0
echo "Input commit: $inputCommitSha"
if [ "$inputCommitSha" != "$currentCommitSha" ]; then
    git fetch origin || exit 1
    git checkout "$inputCommitSha" || exit 1
fi
