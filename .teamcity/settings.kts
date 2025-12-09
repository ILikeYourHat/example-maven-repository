import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildFeatures.notifications
import jetbrains.buildServer.configs.kotlin.buildFeatures.sshAgent
import jetbrains.buildServer.configs.kotlin.buildSteps.maven
import jetbrains.buildServer.configs.kotlin.buildSteps.script
import jetbrains.buildServer.configs.kotlin.triggers.schedule
import jetbrains.buildServer.configs.kotlin.ui.add

version = "2025.11"

project {
    buildType(Build)
    buildType(SyncReleaseNotes)
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

object SyncReleaseNotes : BuildType({
    name = "Sync release notes"

    val releaseNotesPage = "https://docs.gradle.org/9.2.1/release-notes.html"

    triggers {
        schedule {
            schedulingPolicy = daily {
                hour = 6
            }
            triggerBuild = always()
            branchFilter = "+:<default>"
        }
    }

    vcs {
        root(DslContext.settingsRoot)
    }

    steps {
        script {
            name = "Download release notes"
            scriptContent = """
                wget -P releaseNotes --page-requisites --convert-links "$releaseNotesPage"
            """.trimIndent()
        }
        script {
            name = "Test Github connection"
            scriptContent = """
                git diff --name-only
                git pull
            """.trimIndent()
        }
    }

    features {
        add {
            sshAgent {
                teamcitySshKey = "GitHub push key"
            }
        }
    }

    artifactRules = "+:releaseNotes"
})
