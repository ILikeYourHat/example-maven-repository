import jetbrains.buildServer.configs.kotlin.*
import jetbrains.buildServer.configs.kotlin.buildSteps.maven
import jetbrains.buildServer.configs.kotlin.buildSteps.script

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
            goals = "javadoc:javadoc"
        }
        script {
            name = "Zip JavaDocs"
            id = "Zip"
            scriptContent = """
                zip -roX apidocs.zip target/reports/apidocs
                touch -t 20000101000000 apidocs.zip
            """.trimIndent()
        }
    }

    artifactRules = "+:apidocs.zip"
})
