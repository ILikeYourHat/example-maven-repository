import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildFeatures.notifications
import jetbrains.buildServer.configs.kotlin.buildFeatures.sshAgent
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

    dependencies {
        snapshot(SyncReleaseNotes) {
            onDependencyFailure = FailureAction.IGNORE
        }
    }

    params {
        param("InputCommitSha", "%dep.ExampleMavenRepository_SyncReleaseNotes.OutputCommitSha%")
    }

    vcs {
        root(DslContext.settingsRoot)
    }

    steps {
        script {
            name = "Update HEAD if necessary"
            scriptContent = """
                ./.teamcity/scripts/switch_commits_on_new_release_notes.sh %InputCommitSha%
            """.trimIndent()
        }
        script {
            name = "Generate JavaDocs"
            scriptContent = """
                ./mvnw javadoc:javadoc assembly:single
            """.trimIndent()
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
            sshAgent {
                teamcitySshKey = "GitHub push key"
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
                rm -r releaseNotes
                wget -P releaseNotes --page-requisites --convert-links "$releaseNotesPage"
            """.trimIndent()
        }
        script {
            name = "Try to push release notes to repository"
            scriptContent = """
                ./.teamcity/scripts/sync_release_notes.sh
            """.trimIndent()
        }
    }

    outputParams {
        exposeAllParameters = false
        param("OutputCommitSha", "%CommitSha%")
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
