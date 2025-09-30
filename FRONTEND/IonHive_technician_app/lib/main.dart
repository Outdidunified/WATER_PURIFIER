import 'package:ionhive_technician_app/feature/service_installation_app/auth/presentation/controllers/auth_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/landing_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/landing_page_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/repositories/home_repository.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/controllers/home_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_technician_app/core/View/NoInternetScreen.dart';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/core/services/notification_service.dart';
import 'package:ionhive_technician_app/core/splash_screen.dart';
import 'package:ionhive_technician_app/utils/theme/themes.dart';
import 'package:ionhive_technician_app/utils/theme/theme_controller.dart';
import 'package:ionhive_technician_app/core/controllers/connectivity_controller.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
// WebView imports
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
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

  // Lock the app to portrait mode
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

  // Initialize notification service
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

  // Initialize theme controller
  final themeController = Get.put(ThemeController());
  await themeController.loadThemePreferences();

  // Initialize controllers, with ConnectivityController first to ensure early connectivity monitoring
  Get.put(ConnectivityController(), permanent: true);
  Get.put(SessionController(), permanent: true);
  Get.put(TechnicianAuthController(), permanent: true);
  Get.put(TechnicianLandingPageController(), permanent: true);

  // Initialize task-related controllers
  Get.put(TaskRepository(), permanent: true);
  Get.put(TechnicianController(Get.find<TaskRepository>()), permanent: true);

  runApp(const AquaPulseTechnicianApp());
}

class AquaPulseTechnicianApp extends StatelessWidget {
  const AquaPulseTechnicianApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeController = Get.find<ThemeController>();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentMode = themeController.themeMode.value;
      themeController.changeThemeMode(currentMode);
    });

    return Obx(() => GetMaterialApp(
      title: 'AquaPulse Technician',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeController.themeMode.value,
      initialRoute: '/',
      getPages: [
        GetPage(name: '/', page: () => SplashScreen()),
        GetPage(
          name: '/technicianLanding',
          page: () => TechnicianLandingPage(),
          binding: BindingsBuilder(() {
            Get.put(TechnicianLandingPageController());
          }),
        ),
        GetPage(name: '/noInternet', page: () => NoInternetScreen()),
      ],
    ));
  }
}
