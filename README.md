# example-maven-repository

## Setting up the environment

In a real case scenario, this setup should be deployed . 

For running our server and agents instance, we will be using [Podman](https://podman.io/).

### Setting up TeamCity server instance

First of all, in the Podman's "Images" section click on the "Pull" button, type
`docker.io/jetbrains/teamcity-server:2025.11` and then click "Pull image". After downloading, click "Run image" button
to configure the container. For now no additional configuration is needed, you only need to remember on which port
the container will run (for the rest of guide, let's assume it's 8111, so TeamCity instance will be available under
http://localhost:8111). Click the "Start container" button and wait till it will boot up.

It's now time to perform the first configuration of the TeamCity instance. Go to http://localhost:8111 and wait till the
"TeamCity First Start" screen will appear. Click "Proceed" to initialize the data directory, then "Proceed" to use the
`Internal (HSQLDB)` database type (it's more than enough for our project). Next, agree to the Terms & Conditions by
clicking "Accept" at the bottom of the page. After some time, a login screen will appear. Click "Login as Super user",
then paste the "Super user authentication token" (it will appear under the "Tty" tab in the running container details
in Podman, if you can't see it just refresh the TC page). Now click the "Login" button. An empty TeamCity screen should
appear, congratulations!

### Connecting to the GitHub Project

On the main page of TeamCity instance, click on the "Create project..." button in the middle, and fill the form:
- Project name: `ExampleMavenRepository`
- Project ID: `ExampleMavenRepository`
- Project description: leave empty

Submit the form by clicking on the "Create" button. This project is hosted on GitHub, so expand this section and click
the "Add" button next to "GitHub.com" option. Register the TeamCity app through your GitHub account by clicking the
"register TeamCity" link. A form on GitHub should appear, fill it:
- Application name: whatever name you like, e.g. "TeamCity for ExampleMavenRepository"
- Homepage URL: copy it from TeamCity connection screen
- Description: leave empty
- Authorization callback URL: copy it from TeamCity connection screen

Click "Register application", a screen with GitHub application details should appear. Copy and paste client id into
the previous TeamCity connection screen. On the GitHub page click "Generate a new client secret", and also copy
and paste it into the TeamCity screen. Click the "Add" button on the connection screen to go to the last screen. On this
screen, click the "Log in" button to be able to select the desired repository, confirm the connection on GitHub. Then
type `ILikeYourHat/example-maven-repository` in the input field, leave the default settings and click the "Create"
button. Congratulations, the TC instance is connected to our project!

### Enabling Kotlin DSL for our project

Most of the CI logic for our repository is already defined in the VCS in the Kotlin format, so we must import them.
Follow the instructions under
[the official documentation](https://www.jetbrains.com/help/teamcity/kotlin-dsl.html#Getting+Started+with+Kotlin+DSL).
Your configuration should look like this:
![image](img/img_1.png)
After clicking "Apply", a popup titled "Existing Project Setting Detected". Click "Import settings from VCS" and wait
until the settings will be applied. At the left panel, you should see two build types: "Build" and "Sync release notes".

### Enabling e-mail notifications

To be able to send e-mail notifications (one of the requirements of this recruitment task), we must configure
the Email Notifier on the TeamCity instance. First and foremost, you should create an email account in some external
provider, I'm not going to cover this part because it varies between providers. The important thing is, you need all
the data to establish a connection through SMTP protocol. On my instance I've created an e-mail account
on https://poczta.wp.pl, a well known and free polish e-mail provider.

When you have the account and all the data for the SMTP connection, on the left menu in the TeamCity page click
the "Admin" button and then the "Email Notifier" section. Fill the form as follows:
- SMTP host, SMTP port, SMTP login, SMTP password, Secure connection: fill with the data from your e-mail provider
- Send email messages from: you must fill it with your e-mail address
- Notifications limit: for our purposes, set it to "1"
- Allowed addresses: `*@gmail.com` (we assume that my private e-mail is actually the QA teams' e-mail)

See the image below of how it can be filled. You can click the "Test connection" button to be sure that this
configuration works. When you are done, click the "Save" button.
![image](img/img_2.png)

### Setting up SSH keys

In our CI workflows we are using some commands that require pushing and pulling from git server. TeamCity provides no
way to do this besides the initial checkout, so we must set up our own SSH connectio to do this.

On the main page of TeamCity, select our project ("ExampleMavenProject") on the projects list, and then click "Settings"
button on the right top corner of the page. Navigate to the "SSH keys" section, and click "Generate SSH key" button.
Leave the default type, and call it "GitHub push key" (the name is important, because it's used in the CI scripts!).
Click the "Generate" button.
![image](img/img_3.png)

Copy the generated public key, and follow
[this tutorial](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys?versionId=free-pro-team%40latest&productId=authentication&restPage=connecting-to-github-with-ssh%2Cadding-a-new-ssh-key-to-your-github-account#set-up-deploy-keys)
to add this key to your project. Few important things:
- Don't generate a new key, just use the one you've just copied
- After pasting it, remove the comment at the end (in my case, the key was not working with it)
- Make sure to check the "Allow write access" box

Save this deploy key. We are now one step away from running our first CI build!

### Setting up TeamCity agent instance

We have now a fully configured TeamCity instance, but still no way to run our first workflow. To do this, we must
create and run our first TeamCity agent instance.

First of all, because of some external dependencies, we must build our own custom TeamCity agent image. To do this, open
Podman, click on the "Images" tab on the left, and then "Build" button on the top right. As the Containerfile path,
select the `TeamCityAgentDockerfile` located in the `.teamcity` directory. Pick the name you like,
e.g. `custom-teamcity-agent`, and click "Build" button. Wait till building the image will finish.
![image](img/img_4.png)

Now when the image is ready, run it. There are however two things to configure before it can be started:
- add the environment variable `SERVER_URL` with the TeamCity server instance address, in our case: http://localhost:8111
- on the "Networking" tab, under "Select container networking section", select the "Use another container networking
stack" and then point to the container with the TeamCity server instance.

![image](img/img_5.png)

After that, click the "Start container button". Then go to the TeamCity server page, and click the "Agents" button
in the left panel. Wait till the agent will be ready and connect to the server, click "Authorize..." and add it to
the default pool.

![image](img/img_6.png)

### Running our workflow

After everything is set up, it's time to test if everything was done correctly. On the left panel, click the "Build"
workflow and in the top right corner click the "Build" button. If everything was done correctly, the build should pass.

## CI workflow explained

## Reproducible builds config explained

