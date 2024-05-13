# syncstream-firefox

Firefox Browser Extension client for SyncStream, built with Svlete and TypeScript 

## Golang Server
+ [syncstream-server](https://github.com/unknownblueguy6/syncstream-server)

## Prerequisites
Node.js v21+
## How to run
1. Clone the repository
2. In the root of the repo, run:
``` shell
npm install --legacy-peer-deps
npm run build
``` 
3. In the root of the repo, there should be a `dist` folder. This contains the `manifest.json`. Use this to add the extension to Firefox as a temporary add on.
4. Alternatively, you can run 
```shell
npm run start:firefoxdev
npm run start:firefoxdev2
```
To test the extension on Firefox Developer Edition (needs to be installed locally)
## Contributing
+ [pull_request_template.md](/docs/pull_request_template.md)
+ [issue_template.md](/docs/issue_template.md)

## Team Roles 
+ [TEAM.md](/docs/TEAM.md)