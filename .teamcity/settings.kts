import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildFeatures.notifications
import jetbrains.buildServer.configs.kotlin.buildSteps.maven
import jetbrains.buildServer.configs.kotlin.ui.add

version = "2025.11"

project {
    buildType(Build)
}

object Build : BuildType({
    name = "Build"

    vcs {
        root(DslContext.settingsRoot)
    }

    steps {
        maven {
            name = "Generate JavaDocs"
            id = "Maven2"
            goals = "javadoc:javadoc assembly:single"
        }
    }

    features {
        add {
            notifications {
                notifierSettings = emailNotifier {
                    email = "marcin.laskowski.07@gmail.com"
                }
                buildFinishedSuccessfully = true
            }
        }
    }

    artifactRules = "+:target/apidocs.zip"
})
