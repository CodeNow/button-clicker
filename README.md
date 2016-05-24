# Runnable Button Clicker

_Chrome extension to automate Runnable management_

![Beary Good](icon_128.png)

### Setup

1. Clone repo locally
2. In Chrome go to "More Tools" > "Extenstion"
3. Click on "Developer Mode"
4. Click on "Load unpacked extension"
5. Selected the parent directory for the repo you previously cloned

### Actions

- `inject`: Use any service from Runnable Angular
- `getGithubOrgId`: Given the name of an org, get its ID from Github
- `deleteAllInvitations`: Delete all invitations for a current org
- `whiteListOrg`: Given an org name, whitelist an org
- `deWhitelistOrg`: Given an org name, dewhitelist an org
- `loginAsUser`: Given a GH access token, login to Runnable as that user
- `deleteInstances`: Delete all instances with a repo name and/or branch name
- `getInstances`: Get all instances with a repo name and/or branch name
- `getInstancesByRepoAndBranchName`: Get all instances with a repo name and/or branch name
- `getAllInstancesAndGroupByDockerHost`: Get all instances with a repo name and/or branch name
- `rebuildAllInstances`: WIP
- `getCurrentUserId`: Get Github ID for current org
