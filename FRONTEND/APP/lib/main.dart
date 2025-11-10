import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';

// Core
import 'package:ionhive_water_purifier/core/View/NoInternetScreen.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/core/services/notification_service.dart';
import 'package:ionhive_water_purifier/core/splash_screen.dart';
import 'package:ionhive_water_purifier/core/controllers/connectivity_controller.dart';

// End User
import 'package:ionhive_water_purifier/feature/end_user_app/auth/presentation/controllers/auth_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/landing_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/landing_page_controller.dart';
import 'package:ionhive_water_purifier/feature/GettingStarted%20page.dart';

// Theme
import 'package:ionhive_water_purifier/utils/theme/themes.dart';
import 'package:ionhive_water_purifier/utils/theme/theme_controller.dart';

// WebView
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await dotenv.load(fileName: ".env"); // Load .env file

  // Initialize WebView platform
  late final WebViewPlatform webViewPlatform;
  if (WebViewPlatform.instance == null) {
    if (defaultTargetPlatform == TargetPlatform.android) {
      webViewPlatform = AndroidWebViewPlatform();
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      webViewPlatform = WebKitWebViewPlatform();
    } else {
      webViewPlatform = WebKitWebViewPlatform();
    }
    WebViewPlatform.instance = webViewPlatform;
  }

  // Lock app to portrait mode
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );

  // Notification service
  NotificationService notificationService = NotificationService();
  Get.put(notificationService, permanent: true);

  WidgetsBinding.instance.addPostFrameCallback((_) async {
    try {
      await notificationService.init();
      await notificationService.requestPermissions();
      debugPrint('Notification service initialized successfully');
    } catch (e) {
      debugPrint('Error initializing notification service: $e');
    }
  });

  // Theme controller
  final themeController = Get.put(ThemeController());
  await themeController.loadThemePreferences();

  // Global controllers
  Get.put(ConnectivityController(), permanent: true);
  Get.put(SessionController(), permanent: true);
  Get.put(AppUserAuthController());
  Get.put(AppUserLandingPageController(), permanent: true);
  Get.put(SubscriptionController(), permanent: true);

  runApp(const AquaPulseApp());
}

class AquaPulseApp extends StatelessWidget {
  const AquaPulseApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeController = Get.find<ThemeController>();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentMode = themeController.themeMode.value;
      themeController.changeThemeMode(currentMode);
    });

    return Obx(() => GetMaterialApp(
      title: 'AquaPulse',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeController.themeMode.value,
      initialRoute: '/',
      getPages: [
        GetPage(name: '/', page: () => SplashScreen()),
        GetPage(
          name: '/landing',
          page: () => AppUserLandingPage(),
          binding: BindingsBuilder(() {
            Get.put(AppUserLandingPageController());
          }),
        ),
        GetPage(name: '/start', page: () => GetStartedPage()),
        GetPage(name: '/noInternet', page: () => NoInternetScreen()),
      ],
    ));
  }
}
