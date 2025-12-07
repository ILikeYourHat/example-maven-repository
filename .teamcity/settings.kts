import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildSteps.maven

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

    artifactRules = "+:target/apidocs.zip"
})
