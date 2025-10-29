// feature/technician_app/settings/presentation/pages/settings_page.dart
import 'dart:async';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/auth/presentation/pages/login_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/landing_page_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/pages/AboutAppPage/about_app_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/pages/ContactSupportPage/contact_support_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/pages/MyAccountPage/my_account_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/pages/NotificationsPage/notifications_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/domain/repositories/settings_repository.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/controllers/settings_controller.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/pages/PrivacyPage/privacy_page.dart';
import 'package:ionhive_technician_app/utils/animation/animated_scale_button.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/pages/task_details_page.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/settings/presentation/pages/LeaveRequestPage/leave_request_page.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shimmer/shimmer.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  late TechnicianSettingsController settingsController;
  String appVersion = '1.0.0'; // Default version, will be updated dynamically
  Timer? _autoRetryTimer;

  @override
  void initState() {
    super.initState();

    // Fetch app version
    _fetchAppVersion();

    // Initialize TechnicianSettingsController
    if (Get.isRegistered<TechnicianSettingsController>()) {
      settingsController = Get.find<TechnicianSettingsController>();
    } else {
      settingsController = Get.put(TechnicianSettingsController(
        settingsRepository: SettingsRepository(),
      ));
    }

    // Fetch initial data
    settingsController.fetchTechnicianDetails();
    settingsController.loadTasks();

    // Set up auto-retry timer when there's an error
    _setupAutoRetry();
  }

  void _setupAutoRetry() {
    _autoRetryTimer?.cancel();
    _autoRetryTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (settingsController.errorMessage.value.isNotEmpty) {
        settingsController.errorMessage.value = '';
        settingsController.fetchTechnicianDetails();
        settingsController.loadTasks();
      }
    });
  }

  Future<void> _fetchAppVersion() async {
    try {
      PackageInfo packageInfo = await PackageInfo.fromPlatform();
      setState(() {
        appVersion = packageInfo.version;
      });
    } catch (e) {
      debugPrint('Error fetching app version: $e');
      setState(() {
        appVersion = 'Unknown';
      });
    }
  }

  @override
  void dispose() {
    _autoRetryTimer?.cancel();
    super.dispose();
  }

  void clearController() {
    if (Get.isRegistered<TechnicianSettingsController>()) {
      final controller = Get.find<TechnicianSettingsController>();
      controller.technicianData.value = null;
      controller.allTasks.clear();
      controller.filteredTasks.clear();
      controller.selectedStatusFilter.value = 'Pending';
      controller.errorMessage.value = '';
      controller.isRefreshing.value = false;
    }
  }

  void handleLogout() {
    final landingPageController = Get.find<TechnicianLandingPageController>();
    landingPageController.clearPageIndex();
    Get.find<SessionController>().clearSession();
    clearController();
    Get.offAll(
      () => TechnicianLoginPage(userrole: 2), // Assuming role 2 for technician
      transition: Transition.leftToRight,
      duration: const Duration(milliseconds: 300),
    );
  }

  Widget _buildShimmerLoading(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return SingleChildScrollView(
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.only(
              top: screenHeight * 0.07,
              left: screenWidth * 0.04,
              right: screenWidth * 0.04,
            ),
            child: Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: EdgeInsets.all(screenWidth * 0.04),
                  child: Row(
                    children: [
                      Container(
                        width: screenWidth * 0.2,
                        height: screenWidth * 0.2,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.grey,
                        ),
                      ),
                      SizedBox(width: screenWidth * 0.04),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: screenWidth * 0.4,
                              height: screenWidth * 0.05,
                              color: Colors.grey,
                            ),
                            const SizedBox(height: 4),
                            Container(
                              width: screenWidth * 0.3,
                              height: screenWidth * 0.035,
                              color: Colors.grey,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.symmetric(
              horizontal: screenWidth * 0.04,
              vertical: screenHeight * 0.02,
            ),
            child: Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: Container(
                height: screenHeight * 0.15,
                decoration: BoxDecoration(
                  color: Colors.grey,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.symmetric(
              horizontal: screenWidth * 0.04,
              vertical: screenHeight * 0.02,
            ),
            child: Column(
              children: List.generate(4, (index) {
                return Padding(
                  padding: EdgeInsets.only(bottom: screenWidth * 0.03),
                  child: Shimmer.fromColors(
                    baseColor: Colors.grey[300]!,
                    highlightColor: Colors.grey[100]!,
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: screenWidth * 0.04,
                        vertical: screenWidth * 0.03,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: screenWidth * 0.06,
                            height: screenWidth * 0.06,
                            color: Colors.grey,
                          ),
                          const SizedBox(width: 8),
                          Container(
                            width: screenWidth * 0.3,
                            height: screenWidth * 0.04,
                            color: Colors.grey,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  void _showEditDialog() {
    // Navigate to EditAccountPage instead of showing a dialog
    Get.to(
      () => EditAccountPage(),
      transition: Transition.rightToLeft,
      duration: const Duration(milliseconds: 300),
    );
  }

  Widget _buildTaskStatsBanner(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen =
        screenWidth < 600;

    final totalTasks = settingsController.allTasks.length;
    final completedTasks = settingsController.getTaskCount('Completed');
    final inProgressTasks = settingsController.getTaskCount('In Progress');
    final pendingTasks = settingsController.getTaskCount('Pending');
    final rejectedTasks = settingsController.getTaskCount('Rejected');

    final double completedPercent =
        totalTasks > 0 ? completedTasks / totalTasks : 0.0;
    final double inProgressPercent =
        totalTasks > 0 ? inProgressTasks / totalTasks : 0.0;
    final double pendingPercent =
        totalTasks > 0 ? pendingTasks / totalTasks : 0.0;
    final double rejectedPercent =
        totalTasks > 0 ? rejectedTasks / totalTasks : 0.0;

    final Color completedColor =
        completedPercent > 0.5 ? Colors.green : Colors.green[300]!;
    final Color inProgressColor =
        inProgressPercent > 0.3 ? Colors.amber[600]! : Colors.amber;
    final Color pendingColor =
        pendingPercent > 0.3 ? Colors.orange[700]! : Colors.orange;
    final Color rejectedColor = Colors.red[400]!;

    // Responsive padding and height based on screen size
    final double padding =
        isSmallScreen ? screenWidth * 0.03 : screenWidth * 0.02;
    final double bannerHeight =
        isSmallScreen ? screenHeight * 0.18 : screenHeight * 0.15;

    return Container(
        height: bannerHeight, // Responsive height
        margin: EdgeInsets.symmetric(
          horizontal: padding,
          vertical: padding,
        ),
        padding: EdgeInsets.all(padding),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.blue[300]!, Colors.blue[500]!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Task Statistics',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: isSmallScreen
                        ? screenWidth * 0.045
                        : screenWidth * 0.035,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Get.find<TechnicianLandingPageController>().pageIndex.value = 0;
                  },
                  child: Text(
                    'View All',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: isSmallScreen
                          ? screenWidth * 0.035
                          : screenWidth * 0.025,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (completedTasks > 0)
                  Flexible(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: completedColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'Completed $completedTasks',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.white,
                              fontSize: isSmallScreen
                                  ? screenWidth * 0.024
                                  : screenWidth * 0.02,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                if (inProgressTasks > 0)
                  Flexible(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: inProgressColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'In Progress $inProgressTasks',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.white,
                              fontSize: isSmallScreen
                                  ? screenWidth * 0.024
                                  : screenWidth * 0.02,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                if (pendingTasks > 0)
                  Flexible(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: pendingColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'Pending $pendingTasks',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.white,
                              fontSize: isSmallScreen
                                  ? screenWidth * 0.024
                                  : screenWidth * 0.02,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                if (rejectedTasks > 0)
                  Flexible(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: rejectedColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'Rejected $rejectedTasks',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.white,
                              fontSize: isSmallScreen
                                  ? screenWidth * 0.024
                                  : screenWidth * 0.02,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            // Use a constrained height for the progress bar
            Container(
              height:
                  isSmallScreen ? screenHeight * 0.025 : screenHeight * 0.02,
              constraints: BoxConstraints(maxHeight: screenHeight * 0.03),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  if (completedTasks > 0)
                    Flexible(
                      flex: completedTasks,
                      child: Container(
                        height: double.maxFinite,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              completedColor,
                              completedColor.withOpacity(0.7)
                            ],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(8),
                            bottomLeft: Radius.circular(8),
                          ),
                        ),
                      ),
                    ),
                  if (inProgressTasks > 0)
                    Flexible(
                      flex: inProgressTasks,
                      child: Container(
                        height: double.maxFinite,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [inProgressColor, inProgressColor.withOpacity(0.7)],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                        ),
                      ),
                    ),
                  if (pendingTasks > 0)
                    Flexible(
                      flex: pendingTasks,
                      child: Container(
                        height: double.maxFinite,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [pendingColor, pendingColor.withOpacity(0.7)],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                        ),
                      ),
                    ),
                  if (rejectedTasks > 0)
                    Flexible(
                      flex: rejectedTasks,
                      child: Container(
                        height: double.maxFinite,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [rejectedColor, rejectedColor.withOpacity(0.7)],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ),
                          borderRadius: BorderRadius.only(
                            topRight: Radius.circular(8),
                            bottomRight: Radius.circular(8),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (settingsController.isRefreshing.value)
              const SizedBox(height: 4),
            if (settingsController.isRefreshing.value)
              Center(
                child: SizedBox(
                  height: 2,
                  child: LinearProgressIndicator(
                    backgroundColor: Colors.transparent,
                    valueColor: AlwaysStoppedAnimation<Color>(
                        Colors.white.withOpacity(0.7)),
                  ),
                ),
              ),
          ],
        ));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Obx(() {
        if (settingsController.isRefreshing.value &&
            settingsController.technicianData.value == null &&
            settingsController.allTasks.isEmpty) {
          return _buildShimmerLoading(context);
        } else {
          settingsController.getTaskCount('Pending');
          settingsController.getTaskCount('Completed');

          return SingleChildScrollView(
            child: Column(
              children: [
                if (settingsController.errorMessage.value.isNotEmpty)
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.only(
                      top: MediaQuery.of(context).padding.top + 8,
                      bottom: 8,
                      left: 16,
                      right: 16,
                    ),
                    color: Colors.orange.withOpacity(0.8),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.white, size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            "Showing cached data. Tap to retry connection.",
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.refresh,
                              color: Colors.white, size: 16),
                          padding: EdgeInsets.zero,
                          constraints: BoxConstraints(),
                          onPressed: () {
                            settingsController.errorMessage.value = '';
                            settingsController.isRefreshing.value = true;
                            Future.delayed(const Duration(milliseconds: 100),
                                () {
                              settingsController.fetchTechnicianDetails();
                              settingsController.loadTasks();
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                Padding(
                  padding: EdgeInsets.only(
                    top: settingsController.errorMessage.value.isNotEmpty
                        ? screenHeight * 0.02
                        : screenHeight * 0.07,
                    left: screenWidth * 0.04,
                    right: screenWidth * 0.04,
                  ),
                  child: Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            theme.colorScheme.surface,
                            theme.colorScheme.primary.withOpacity(0.05),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: EdgeInsets.all(screenWidth * 0.04),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: screenWidth * 0.1,
                            backgroundColor:
                                theme.colorScheme.primary.withOpacity(0.3),
                            child: Icon(
                              Icons.person,
                              size: screenWidth * 0.1,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          SizedBox(width: screenWidth * 0.04),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${Get.find<SessionController>().technicianId}',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    color: theme.colorScheme.onSurface,
                                    fontWeight: FontWeight.bold,
                                    fontSize: screenWidth * 0.05,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  settingsController
                                          .technicianData.value?.email ??
                                      Get.find<SessionController>()
                                          .emailId
                                          .value,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: theme.colorScheme.onSurface
                                        .withOpacity(0.6),
                                    fontSize: screenWidth * 0.035,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit),
                            onPressed: _showEditDialog, // Updated to navigate
                            color: theme.colorScheme.primary,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                _buildTaskStatsBanner(context),
                Padding(
                  padding: EdgeInsets.only(
                    left: screenWidth * 0.04,
                    right: screenWidth * 0.04,
                    bottom: screenHeight * 0.02,
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildEnhancedButton(
                          context: context,
                          label: "View All Tasks",
                          icon: Icons.list,
                          onPressed: () {
                            Get.to(
                              () => TaskDetailsPage(),
                              transition: Transition.rightToLeft,
                              duration: const Duration(milliseconds: 300),
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _buildEnhancedButton(
                          context: context,
                          label: "Contact Us",
                          icon: Icons.contact_support,
                          onPressed: () {
                            Get.to(
                              () => const ContactSupportPage(),
                              transition: Transition.rightToLeft,
                              duration: const Duration(milliseconds: 300),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.04),
                  child: Column(
                    children: [
                      _buildListButton(
                        context: context,
                        label: "Notifications",
                        icon: Icons.notifications,
                        onPressed: () {
                          Get.to(
                            () => const NotificationsPage(),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        },
                      ),
                      SizedBox(height: screenHeight * 0.009),
                      _buildListButton(
                        context: context,
                        label: "Privacy & Policy",
                        icon: Icons.lock,
                        onPressed: () {
                          debugPrint("Privacy button pressed");
                          Get.to(
                            () => const PrivacyPage(),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        },
                      ),
                      SizedBox(height: screenHeight * 0.009),
                      _buildListButton(
                        context: context,
                        label: "About App",
                        icon: Icons.info,
                        onPressed: () {
                          Get.to(
                            () => const AboutAppPage(),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        },
                      ),
                      SizedBox(height: screenHeight * 0.009),
                      _buildListButton(
                        context: context,
                        label: "Request Leave",
                        icon: Icons.calendar_month,
                        onPressed: () {
                          Get.to(
                            () => const LeaveRequestPage(),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        },
                      ),
                      SizedBox(height: screenHeight * 0.009),
                      _buildListButton(
                        context: context,
                        label: "Logout",
                        icon: Icons.logout,
                        onPressed: () {
                          showGeneralDialog(
                            context: context,
                            barrierDismissible: true,
                            barrierLabel: "Dismiss",
                            barrierColor: Colors.black.withOpacity(0.5),
                            transitionDuration:
                                const Duration(milliseconds: 300),
                            pageBuilder: (context, anim1, anim2) {
                              return Container();
                            },
                            transitionBuilder: (context, anim1, anim2, child) {
                              return ScaleTransition(
                                scale:
                                    Tween<double>(begin: 0.8, end: 1.0).animate(
                                  CurvedAnimation(
                                    parent: anim1,
                                    curve: Curves.easeOutBack,
                                  ),
                                ),
                                child: FadeTransition(
                                  opacity: Tween<double>(begin: 0.0, end: 1.0)
                                      .animate(
                                    CurvedAnimation(
                                      parent: anim1,
                                      curve: Curves.easeIn,
                                    ),
                                  ),
                                  child: Dialog(
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    elevation: 8,
                                    backgroundColor: Colors.white,
                                    child: Container(
                                      padding: const EdgeInsets.all(20),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            Colors.white,
                                            Colors.white,
                                          ],
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                        ),
                                        borderRadius: BorderRadius.circular(20),
                                        boxShadow: [
                                          BoxShadow(
                                            color:
                                                Colors.black.withOpacity(0.2),
                                            blurRadius: 10,
                                            offset: const Offset(0, 4),
                                          ),
                                        ],
                                      ),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          CircleAvatar(
                                            radius: 30,
                                            backgroundColor:
                                                Colors.red.shade100,
                                            child: Icon(
                                              Icons.logout,
                                              color: Colors.red.shade600,
                                              size: 30,
                                            ),
                                          ),
                                          const SizedBox(height: 16),
                                          Text(
                                            "Logout",
                                            style: theme.textTheme.titleLarge
                                                ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                              color:
                                                  theme.colorScheme.onSurface,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            "Are you sure you want to logout?",
                                            style: theme.textTheme.bodyMedium
                                                ?.copyWith(
                                              color: theme.colorScheme.onSurface
                                                  .withOpacity(0.7),
                                              fontSize: 16,
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                          const SizedBox(height: 24),
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceEvenly,
                                            children: [
                                              AnimatedScaleButton(
                                                onTap: () =>
                                                    Navigator.pop(context),
                                                child: Container(
                                                  padding: const EdgeInsets
                                                      .symmetric(
                                                      horizontal: 24,
                                                      vertical: 12),
                                                  decoration: BoxDecoration(
                                                    gradient: LinearGradient(
                                                      colors: [
                                                        const Color.fromARGB(
                                                            255, 234, 234, 234),
                                                        const Color.fromARGB(
                                                            255, 234, 234, 234),
                                                      ],
                                                      begin: Alignment.topLeft,
                                                      end:
                                                          Alignment.bottomRight,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12),
                                                    boxShadow: [
                                                      BoxShadow(
                                                        color: Colors.black
                                                            .withOpacity(0.1),
                                                        blurRadius: 4,
                                                        offset:
                                                            const Offset(0, 2),
                                                      ),
                                                    ],
                                                  ),
                                                  child: Text(
                                                    "Cancel",
                                                    style: TextStyle(
                                                      color: Colors.black87,
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              AnimatedScaleButton(
                                                onTap: () {
                                                  Navigator.pop(context);
                                                  handleLogout();
                                                },
                                                child: Container(
                                                  padding: const EdgeInsets
                                                      .symmetric(
                                                      horizontal: 24,
                                                      vertical: 12),
                                                  decoration: BoxDecoration(
                                                    gradient: LinearGradient(
                                                      colors: [
                                                        Colors.red.shade500,
                                                        Colors.red.shade700,
                                                      ],
                                                      begin: Alignment.topLeft,
                                                      end:
                                                          Alignment.bottomRight,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12),
                                                    boxShadow: [
                                                      BoxShadow(
                                                        color: Colors.red
                                                            .withOpacity(0.3),
                                                        blurRadius: 4,
                                                        offset:
                                                            const Offset(0, 2),
                                                      ),
                                                    ],
                                                  ),
                                                  child: Text(
                                                    "Yes",
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            },
                          );
                        },
                      ),
                    ],
                  ),
                ),
                SizedBox(height: screenHeight * 0.02),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Powered by IonHive",
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: screenWidth * 0.04,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Version $appVersion",
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.6),
                        fontSize: screenWidth * 0.035,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
                SizedBox(height: screenHeight * 0.02),
              ],
            ),
          );
        }
      }),
    );
  }

  Widget _buildEnhancedButton({
    required BuildContext context,
    required String label,
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;

    return AnimatedOpacity(
      opacity: 1.0,
      duration: const Duration(milliseconds: 500),
      child: AnimatedScaleButton(
        onTap: onPressed,
        child: Container(
          padding: EdgeInsets.symmetric(
            horizontal: screenWidth * 0.02,
            vertical: screenWidth * 0.03,
          ),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.primary,
                theme.colorScheme.primary.withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: theme.colorScheme.onPrimary,
                size: screenWidth * 0.05,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    color: theme.colorScheme.onPrimary,
                    fontSize: screenWidth * 0.033,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.start,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildListButton({
    required BuildContext context,
    required String label,
    required IconData icon,
    required VoidCallback onPressed,
    List<Color>? gradientColors,
  }) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;

    final bool isLogout = label.toLowerCase() == 'logout';

    final Widget content = AnimatedScaleButton(
      onTap: onPressed,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: screenWidth * 0.04,
          vertical: screenWidth * 0.03,
        ),
        decoration: isLogout
            ? null
            : BoxDecoration(
                gradient: LinearGradient(
                  colors: gradientColors ??
                      [
                        const Color.fromARGB(255, 241, 240, 240),
                        const Color.fromARGB(255, 241, 240, 240),
                      ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
        child: Row(
          mainAxisSize: isLogout ? MainAxisSize.min : MainAxisSize.max,
          mainAxisAlignment:
              isLogout ? MainAxisAlignment.center : MainAxisAlignment.start,
          children: [
            Icon(
              icon,
              color: isLogout ? Colors.red : theme.colorScheme.primary,
              size: screenWidth * 0.06,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isLogout ? Colors.red : Colors.black,
                fontSize: screenWidth * 0.04,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (!isLogout) ...[
              const Spacer(),
              Icon(
                Icons.arrow_forward_ios,
                color: Colors.black.withOpacity(0.6),
                size: screenWidth * 0.04,
              ),
            ],
          ],
        ),
      ),
    );

    return Padding(
      padding: EdgeInsets.only(bottom: screenWidth * 0.03),
      child: isLogout ? Center(child: content) : content,
    );
  }
}
