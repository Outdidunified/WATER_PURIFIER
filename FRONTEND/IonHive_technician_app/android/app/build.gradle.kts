plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
//    id("com.google.gms.google-services")
}

dependencies {
//    implementation(platform("com.google.firebase:firebase-bom:33.13.0"))
//    implementation("com.google.firebase:firebase-analytics")
//    implementation("com.google.firebase:firebase-messaging")
//    implementation("androidx.startup:startup-runtime:1.1.1")
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
    implementation("androidx.multidex:multidex:2.0.1")
}

android {
    namespace = "com.outdid.ionhive_water_purifier"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
        isCoreLibraryDesugaringEnabled = true // Core library desugaring is already enabled
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "com.outdid.aquapulse_technician"
        minSdk = flutter.minSdkVersion // Updated to meet Firebase Auth requirements
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
    }

    signingConfigs {
        getByName("debug") {
            keyAlias = "androiddebugkey"
            keyPassword = "android"
            storeFile = file("C:/Users/LAPTOPS24/AndroidStudioProjects/WATER_PURIFIER/FRONTEND/APP/lib/utils/keystore/debug.keystore")
            storePassword = "android"
        }
        create("release") {
            keyAlias = "chelladurai"
            keyPassword = "Outdid@123"
            storeFile = file("my-release-key.keystore")
            storePassword = "Outdid@123"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
            isMinifyEnabled = false
            isShrinkResources = false
        }

        debug {
            signingConfig = signingConfigs.getByName("debug")
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }
}

flutter {
    source = "../.."
}
