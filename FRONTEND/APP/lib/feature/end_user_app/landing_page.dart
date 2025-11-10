// feature/end_user_app/landing_page.dart
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/presentation/pages/analytics_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/pages/home_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/pages/subscription_prompt_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/settings_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/orders/presentation/pages/device_setup_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/shop/presentation/pages/shop_page.dart';
import 'package:ionhive_water_purifier/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_water_purifier/core/components/appUserfooter.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/landing_page_controller.dart';

class AppUserLandingPage extends StatefulWidget {
  const AppUserLandingPage({super.key});

  @override
  _AppUserLandingPageState createState() => _AppUserLandingPageState();
}

class _AppUserLandingPageState extends State<AppUserLandingPage>
    with WidgetsBindingObserver {
  final AppUserLandingPageController controller =
      Get.find<AppUserLandingPageController>();
  final SessionController sessionController = Get.find<SessionController>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this); // Observe app lifecycle
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this); // Clean up observer
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Reset the page to the initial index (0) when resuming from an external page
      // controller.clearPageIndex();
      setState(() {}); // Trigger a rebuild to reflect the reset
    }
  }

  @override
  Widget build(BuildContext context) {
    // Check login status when the page is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!sessionController.isLoggedIn.value) {
        Get.offNamed('/login');
      }
    });

    return Scaffold(
      body: Obx(() {
        final isSubscribed = sessionController.isSubscribed.value;

        switch (controller.pageIndex.value) {
          case 0:
            // Show ShopPage instead of HomePage if user is not subscribed
            return isSubscribed
                ? const HomePage()
                : const SubscriptionPromptPage();
          case 1:
            return AnalyticsPage();
          case 2:
            return const ShopPage();
          case 3:
            return const DeviceSetupPage();
          case 4:
            return SettingsPage();
          default:
            return const Center(child: Text('Page not found'));
        }
      }),
      bottomNavigationBar: Obx(() {
        return Footer(
          onTabChanged: (index) {
            if (!sessionController.isLoggedIn.value) {
              CustomSnackbar.showPermissionRequest(
                message: 'You are not logged in. Please login to continue.',
                onOpenSettings: () {
                  Get.offNamed('/login');
                },
                duration: const Duration(seconds: 4),
              );
            } else {
              controller.changePage(index);
            }
          },
          currentIndex: controller.pageIndex.value,
        );
      }),
    );
  }
}
