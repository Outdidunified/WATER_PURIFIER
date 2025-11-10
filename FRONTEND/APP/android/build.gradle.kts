buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.google.gms:google-services:4.4.2")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory = rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

subprojects {
    plugins.withId("com.android.library") {
        configure<com.android.build.gradle.LibraryExtension> {
            compileSdk = 34
            if (namespace == null) {
                namespace = when (project.name) {
                    "flutter_bluetooth_serial" -> "io.github.edufolly.flutterbluetoothserial"
                    else -> "com.example.${project.name}"
                }
            }
            
            afterEvaluate {
                tasks.withType<com.android.build.gradle.tasks.ProcessLibraryManifest> {
                    doFirst {
                        val manifestFile = file("src/main/AndroidManifest.xml")
                        if (manifestFile.exists()) {
                            try {
                                val content = manifestFile.readText()
                                val modified = content.replace(Regex("""package="[^"]*"\s*"""), "")
                                manifestFile.writeText(modified)
                            } catch (e: Exception) {
                                logger.warn("Failed to patch manifest: ${e.message}")
                            }
                        }
                    }
                }
            }
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
