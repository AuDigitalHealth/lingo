# Snomio configuration guide

## Purpose

This documentation covers the main configuration items, particularly those that may vary across
deployments and include instructions on how to determine the correct values. It is not necessarily
and exhaustive list of all configuration items, but rather a guide to the most important ones.

This is intended to aid organisations wishing to stand up their own instance of the software to
determine how to correctly configure it.

## Configuration Options

Most of the config options will be explained in deployment, and for testing/local will just explain where these need to be put.
### Deployment

All configuration options are set in application.properties (or you can pass them to the running container, however you like to do that. -D etc), some of the most important being ones that relate to snowstorm and specifically refer to the location of your authoring platform/snowstorm instance, what 'project' within the authoring platform that you will be working on,
and the cookie values that it will accept.

#### Necassary options
These all must be supplied or the application simply will not work.

    // the project key within the authoring platform
    ihtsdo.ap.projectKey=
    // the codesystem you intend to work on
    ihtsdo.ap.codeSystem=
    // a combination of the codesystem + project key, eg MAIN/MY_CODESYSTEM/MY_PROJECT
    ihtsdo.ap.defaultBranch=
    // the location of the auth provider you will be using, which is always the ihtsdo ims
    // so https://ims.ihtsdotools.org
    ihtsdo.ims.api.url=
    // the name of the cookie that will be used to authenticate the user, which changes per environment
    // so dev-ims-ihtsdo, or ims-ihtsdo
    ihtsdo.ims.api.cookie.name=
    // snowstorm and the authoring platform have different locations, as the authoring platform just talks to snowstorm but provides additional apis.
    // so set the base location of your snowstorm/ap instances
    ihtsdo.base.api.url=
    ihtsdo.ap.api.url=
    ihtsdo.snowstorm.api.url=
    // development username and password, this is used to cache calls to the authoring platform on the backend, so the frontend doesn't repeatedly ask for the same information if there's many users.
    ims-username=
    ims-password=

#### Additional Options
Potentional options you might be interested in supplying

    // These may speed up the performance of some of the create product api calls to snowstorm, but if not supplied will not break the application. CIS is the content identifier service and is used to get availible ids for created concepts before they are created.
    cis.api.url=
    cis.username=
    cis.password=
    // The location of where you want to save attachments that are saved to tickets, as they are not stored on disk.
    snomio.attachments.directory=
    // If you intend to have an external api to be called that supplies generated names for products, if this is not supplied the message 'Generated Name Unavailable' is given to each newly created product
    name.generator.api.url=


    


## Testing

Testing is very similar to the above, but -Dims-username and -Dims-password must be supplied.
## Local

When you run the application locally you would usually run the spring application and then serve the react application through npm run dev and point the react application at the spring application.

It is run like this as it is the simpliest way, as we can easily add to the .env in /ui to get it to serve as a reverse proxy, so you do not need to run your own.

As the cookies will only be shared over a .ihtsdotools domain, you will need to add an entry in your hosts file for local host, which is different depending on what machine you have. Create an entry that is WHATEVER_YOU_WANT.ihtsdotools.org -> localhost

add your values to ui/.env, these will map to what you would usually put in application.properties for the [Deployment Options](#deployment)

    // enter the actual values for these properties, not the name of the property in application.properties
    VITE_IMS_URL=ihtsdo.ims.api.url
    VITE_AP_URL=ihtsdo.ap.api.url
    VITE_SNOWSTORM_URL=ihtsdo.snowstorm.api.url
    // where you are serving your backend from
    VITE_SNOMIO_URL=http://snomio-api.ihtsdotools.org:8090
    // where you are running the front end (your host file entry)
    VITE_SNOMIO_UI_URL=https://snomio.ihtsdotools.org:5173

