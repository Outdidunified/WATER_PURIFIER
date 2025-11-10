// feature/service_installation_app/landing_page.dart
import 'package:ionhive_technician_app/core/components/technicionfooter.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/pages/home_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/presentation/pages/device_setup_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/landing_page_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/pages/settings_page.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';

class TechnicianLandingPage extends StatefulWidget {
  const TechnicianLandingPage({super.key});

  @override
  _TechnicianLandingPageState createState() => _TechnicianLandingPageState();
}

class _TechnicianLandingPageState extends State<TechnicianLandingPage>
    with WidgetsBindingObserver {
  final TechnicianLandingPageController controller =
      Get.find<TechnicianLandingPageController>();
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
    return Scaffold(
      body: Obx(() {
        // Only build the current page — no state is preserved
        switch (controller.pageIndex.value) {
          case 0:
            return const TechnicianHomePage();
          case 1:
            return DeviceSetupPage();
          case 2:
            return const SettingsPage();
          default:
            return const Center(child: Text('Page not found'));
        }
      }),
      bottomNavigationBar: Obx(() {
        return TechnicianFooter(
          onTabChanged: (index) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              controller.changePage(index); // Navigate only if logged in
            });
          },
          currentIndex: controller.pageIndex.value,
        );
      }),
    );
  }
}
