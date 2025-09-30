import 'dart:async';
import 'package:ionhive_water_purifier/feature/end_user_app/auth/presentation/pages/login_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/landing_page_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/AboutAppPage/about_app_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/ContactSupportPage/contact_support_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/MyAccountPage/my_account_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/NotificationsPage/notifications_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/PaymentHistoryPage/payment_history_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/PrivacyPage/privacy_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/pages/SubscriptionPlanPage/subscription_plan_page.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/settings/presentation/controllers/settings_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/controllers/home_controller.dart'; // Contains SubscriptionController
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart'; // For SessionController

import 'package:ionhive_water_purifier/utils/animation/animated_scale_button.dart';
import 'package:ionhive_water_purifier/utils/widgets/card/water_usage_card.dart';
import 'package:ionhive_water_purifier/utils/widgets/error/error_display_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:package_info_plus/package_info_plus.dart'; // For fetching app version

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  late SettingsController settingsController;
  late SubscriptionController subscriptionController;
  String appVersion = '1.0.0'; // Default version, will be updated dynamically

  final PageController _pageController = PageController();
  Timer? _autoRetryTimer;

  @override
  void initState() {
    super.initState();

    // Fetch app version
    _fetchAppVersion();

    // Initialize SettingsController
    if (Get.isRegistered<SettingsController>()) {
      settingsController = Get.find<SettingsController>();
    } else {
      settingsController = Get.put(SettingsController());
    }

    // Initialize SubscriptionController
    if (Get.isRegistered<SubscriptionController>()) {
      subscriptionController = Get.find<SubscriptionController>();
    } else {
      subscriptionController = Get.put(SubscriptionController());
    }

    // Fetch initial data
    settingsController.fetchUserDetails();
    settingsController.fetchPaymentHistory();
    subscriptionController.fetchActiveSubscription();

    // Set up auto-retry timer when there's an error
    _setupAutoRetry();
  }

  void _setupAutoRetry() {
    // Cancel any existing timer
    _autoRetryTimer?.cancel();

    // Create a new timer that checks for errors and retries
    _autoRetryTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (settingsController.errorMessage.value.isNotEmpty) {
        // If there's an error, try to fetch data again
        settingsController.errorMessage.value = '';
        settingsController.fetchUserDetails();
        settingsController.fetchPaymentHistory();
        subscriptionController.fetchActiveSubscription();
      }
    });
  }

  // Fetch app version using package_info_plus
  Future<void> _fetchAppVersion() async {
    try {
      PackageInfo packageInfo = await PackageInfo.fromPlatform();
      setState(() {
        appVersion = packageInfo.version; // e.g., "1.0.0"
      });
    } catch (e) {
      debugPrint('Error fetching app version: $e');
      setState(() {
        appVersion = 'Unknown'; // Fallback if fetching fails
      });
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _autoRetryTimer?.cancel();
    super.dispose();
  }

  String _formatDate(DateTime date) {
    final months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  void clearAllControllers() {
    // Clear SettingsController
    if (Get.isRegistered<SettingsController>()) {
      final controller = Get.find<SettingsController>();
      controller.userData.value = null;
      controller.isLoading.value = true;
      controller.errorMessage.value = '';
      controller.isFormValid.value = false;
      controller.isEditLoading.value = false;
      controller.nameError.value = '';
      controller.phoneError.value = '';
      controller.cityError.value = '';
      controller.editNameController.clear();
      controller.editPhoneController.clear();
      controller.editCityController.clear();
    }

    // Clear SubscriptionController
    if (Get.isRegistered<SubscriptionController>()) {
      final subscriptionController = Get.find<SubscriptionController>();
      subscriptionController.deviceData.value = null;
      subscriptionController.activeSubscription.value = null;
    }
  }

  void handleLogout() {
    final landingPageController = Get.find<AppUserLandingPageController>();
    landingPageController.clearPageIndex();
    Get.find<SessionController>().clearSession();
    clearAllControllers();
    Get.offAll(
      () => AppUserLoginPage(userrole: 3),
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
                            const SizedBox(height: 4),
                            Container(
                              width: screenWidth * 0.2,
                              height: screenWidth * 0.03,
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
            padding: EdgeInsets.only(
              left: screenWidth * 0.04,
              right: screenWidth * 0.04,
              bottom: screenHeight * 0.02,
            ),
            child: GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: screenWidth * 0.04,
              mainAxisSpacing: screenHeight * 0.02,
              childAspectRatio: 3,
              children: List.generate(4, (index) {
                return Shimmer.fromColors(
                  baseColor: Colors.grey[300]!,
                  highlightColor: Colors.grey[100]!,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey,
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                );
              }),
            ),
          ),
          Padding(
            padding: EdgeInsets.only(
              left: screenWidth * 0.04,
              right: screenWidth * 0.04,
              bottom: screenHeight * 0.02,
            ),
            child: Column(
              children: [
                Shimmer.fromColors(
                  baseColor: Colors.grey[300]!,
                  highlightColor: Colors.grey[100]!,
                  child: Container(
                    height: screenWidth * 0.35,
                    width: screenWidth * 0.9,
                    decoration: BoxDecoration(
                      color: Colors.grey,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Shimmer.fromColors(
                  baseColor: Colors.grey[300]!,
                  highlightColor: Colors.grey[100]!,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      3,
                      (index) => Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.04),
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Obx(() {
        // Compute water usage and limit reactively inside Obx
        double waterUsed = 0.0;
        int waterLimit = 0;
        try {
          if (Get.isRegistered<SubscriptionController>()) {
            if (subscriptionController.deviceData.value != null) {
              waterUsed =
                  subscriptionController.deviceData.value?.waterConsumed ?? 0.0;
            }
            if (subscriptionController.activeSubscription.value != null) {
              final waterLimitStr = subscriptionController
                      .activeSubscription.value?.selectedPlan.capacity ??
                  "600";
              waterLimit = int.tryParse(
                      waterLimitStr.replaceAll(RegExp(r'[^0-9]'), '')) ??
                  0;
            }
          }
        } catch (e) {
          debugPrint('Error getting water usage data: $e');
        }

        // Only show loading shimmer on initial load, not on refresh attempts
        if (settingsController.isLoading.value &&
            settingsController.userData.value == null &&
            settingsController.paymentHistoryList.isEmpty) {
          return _buildShimmerLoading(context);
        } else if ((settingsController.errorMessage.value).isNotEmpty &&
            settingsController.userData.value == null &&
            settingsController.paymentHistoryList.isEmpty) {
          // Only show error widget if we have no cached data at all
          return ErrorDisplayWidget(
            errorMessage: settingsController.errorMessage.value,
            onRetry: () {
              // Reset error state before retrying
              settingsController.errorMessage.value = '';
              settingsController.isLoading.value = true;

              // Fetch data with a slight delay to ensure UI updates
              Future.delayed(const Duration(milliseconds: 100), () {
                settingsController.fetchUserDetails();
                settingsController.fetchPaymentHistory();
                subscriptionController.fetchActiveSubscription();
              });
            },
          );
        } else {
          // Show cached data even if there's an error
          // Fetch recent payment data
          final recentPayment = settingsController.paymentHistoryList.isNotEmpty
              ? () {
                  var completedPayments = settingsController.paymentHistoryList
                      .where((payment) => payment.paymentStatus == 'Completed')
                      .toList();
                  completedPayments
                      .sort((a, b) => b.createdAt.compareTo(a.createdAt));
                  return completedPayments;
                }()
              : null;

          final recentPaymentAmount =
              recentPayment != null && recentPayment.isNotEmpty
                  ? recentPayment.first.totalPrice
                  : 0.00;
          final recentPaymentDate =
              recentPayment != null && recentPayment.isNotEmpty
                  ? _formatDate(recentPayment.first.createdAt)
                  : " - ";
          final recentPaymentStatus =
              recentPayment != null && recentPayment.isNotEmpty
                  ? recentPayment.first.paymentStatus
                  : " - ";

          // Parse subscription expiry date
          String subscriptionEndDate = 'N/A';
          String planName = 'Premium Plan';
          String planDuration = '6 Months';
          if (subscriptionController.activeSubscription.value != null) {
            final expiryDateStr = subscriptionController
                .activeSubscription.value!.subscriptionExpiryDate;
            try {
              final expiryDate = DateTime.parse(expiryDateStr);
              subscriptionEndDate = _formatDate(expiryDate);
            } catch (e) {
              debugPrint('Error parsing subscription expiry date: $e');
              subscriptionEndDate = 'N/A';
            }
            planName = subscriptionController
                    .activeSubscription.value?.selectedPlan.label ??
                'Premium Plan';
            planDuration = subscriptionController.activeSubscription.value
                    ?.selectedDuration.durationTimeLimit ??
                '6 Months';
          }

          return SingleChildScrollView(
            child: Column(
              children: [
                // Show a small error banner if there's an error but we're showing cached data
                if (settingsController.errorMessage.value.isNotEmpty)
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.only(
                      top: MediaQuery.of(context).padding.top +
                          8, // Add status bar height
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
                            settingsController.isLoading.value = true;
                            Future.delayed(const Duration(milliseconds: 100),
                                () {
                              settingsController.fetchUserDetails();
                              settingsController.fetchPaymentHistory();
                              subscriptionController.fetchActiveSubscription();
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                Padding(
                  padding: EdgeInsets.only(
                    // Reduce top padding if error banner is shown
                    top: settingsController.errorMessage.value.isNotEmpty
                        ? screenHeight * 0.02
                        : screenHeight * 0.07,
                    left: screenWidth * 0.04,
                    right: screenWidth * 0.04,
                  ),
                  child: AnimatedOpacity(
                    opacity: 1.0,
                    duration: const Duration(milliseconds: 500),
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
                                    (settingsController.userData.value?.data
                                                    .name ??
                                                '')
                                            .isEmpty
                                        ? 'Complete your profile'
                                        : settingsController
                                            .userData.value!.data.name!,
                                    style:
                                        theme.textTheme.titleMedium?.copyWith(
                                      color: theme.colorScheme.onSurface,
                                      fontWeight: FontWeight.bold,
                                      fontSize: screenWidth * 0.05,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    settingsController
                                            .userData.value?.data.email ??
                                        'N/A',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      color: theme.colorScheme.onSurface
                                          .withOpacity(0.6),
                                      fontSize: screenWidth * 0.035,
                                    ),
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
                  padding: EdgeInsets.only(
                    left: screenWidth * 0.04,
                    right: screenWidth * 0.04,
                    bottom: screenHeight * 0.02,
                  ),
                  child: GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: screenWidth * 0.04,
                    mainAxisSpacing: screenHeight * 0.02,
                    childAspectRatio: 3,
                    children: [
                      _buildEnhancedButton(
                        context: context,
                        label: "My Account",
                        icon: Icons.account_circle,
                        onPressed: () {
                          debugPrint("My Account button pressed");
                          Get.to(
                            () => const EditAccountPage(),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        },
                      ),
                      _buildEnhancedButton(
                        context: context,
                        label: "Subscription",
                        icon: Icons.subscriptions,
                        onPressed: () {
                          debugPrint("Subscription Plan button pressed");
                          Get.to(
                            () => const SubscriptionPlanPage(),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        },
                      ),
                      _buildEnhancedButton(
                        context: context,
                        label: "Payment History",
                        icon: Icons.receipt,
                        onPressed: () {
                          debugPrint("Payment History button pressed");
                          Get.to(
                            () => const PaymentHistoryPage(),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        },
                      ),
                      _buildEnhancedButton(
                        context: context,
                        label: "Contact Us",
                        icon: Icons.support,
                        onPressed: () {
                          debugPrint("Contact Us button pressed");
                          Get.to(
                            () => ContactSupportPage(),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: EdgeInsets.only(
                    left: screenWidth * 0.04,
                    right: screenWidth * 0.04,
                    bottom: screenHeight * 0.02,
                  ),
                  child: Column(
                    children: [
                      SizedBox(
                        height: screenWidth * 0.35,
                        child: PageView(
                          controller: _pageController,
                          children: [
                            _buildCard(
                              context: context,
                              width: screenWidth * 0.8,
                              title: "Active Subscription Plan",
                              description:
                                  "Your plan is active until $subscriptionEndDate.",
                              leading: SizedBox(
                                height: screenWidth * 0.25,
                                width: screenWidth * 0.25,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.subscriptions,
                                      color: theme.colorScheme.primary,
                                      size: screenWidth * 0.1,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      planName,
                                      style:
                                          theme.textTheme.bodyMedium?.copyWith(
                                        color: theme.colorScheme.onSurface
                                            .withOpacity(0.8),
                                        fontSize: screenWidth * 0.03,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                    Text(
                                      planDuration,
                                      style:
                                          theme.textTheme.bodyMedium?.copyWith(
                                        color: theme.colorScheme.onSurface
                                            .withOpacity(0.8),
                                        fontSize: screenWidth * 0.03,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            WaterUsageCard(
                              waterUsed: waterUsed,
                              waterLimit: waterLimit,
                              width: screenWidth * 0.8,
                            ),
                            _buildCard(
                              context: context,
                              width: screenWidth * 0.8,
                              title: "Recent Payment",
                              description:
                                  "Your last payment of ₹${recentPaymentAmount?.toStringAsFixed(2)} was $recentPaymentStatus on $recentPaymentDate.",
                              leading: SizedBox(
                                height: screenWidth * 0.25,
                                width: screenWidth * 0.25,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.payment,
                                      color: theme.colorScheme.primary,
                                      size: screenWidth * 0.1,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      "₹${recentPaymentAmount?.toStringAsFixed(2)}",
                                      style:
                                          theme.textTheme.bodyMedium?.copyWith(
                                        color: theme.colorScheme.onSurface
                                            .withOpacity(0.8),
                                        fontSize: screenWidth * 0.03,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                    Text(
                                      recentPaymentStatus!,
                                      style:
                                          theme.textTheme.bodyMedium?.copyWith(
                                        color:
                                            recentPaymentStatus == "Completed"
                                                ? Colors.green.shade600
                                                : Colors.red.shade600,
                                        fontSize: screenWidth * 0.03,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      SmoothPageIndicator(
                        controller: _pageController,
                        count: 3,
                        effect: WormEffect(
                          dotHeight: 8,
                          dotWidth: 8,
                          activeDotColor: theme.colorScheme.primary,
                          dotColor:
                              theme.colorScheme.onSurface.withOpacity(0.3),
                          spacing: 4,
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
                          debugPrint("Notifications button pressed");
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
                          debugPrint("About App button pressed");
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
                        label: "Logout",
                        icon: Icons.logout,
                        onPressed: () {
                          debugPrint("Logout button pressed");
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
                                              // Cancel Button
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
                                              // Yes Button
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
                        gradientColors: [
                          Colors.red.shade400,
                          Colors.red.shade600,
                        ],
                      ),
                      SizedBox(height: screenHeight * 0.03),
                      // Powered by Aqua and Version
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
                              color:
                                  theme.colorScheme.onSurface.withOpacity(0.6),
                              fontSize: screenWidth * 0.035,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                      SizedBox(height: screenHeight * 0.03),
                    ],
                  ),
                ),
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
            horizontal: screenWidth * 0.03,
            vertical: screenWidth * 0.04,
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
                size: screenWidth * 0.06,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    color: theme.colorScheme.onPrimary,
                    fontSize: screenWidth * 0.035,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.start,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCard({
    required BuildContext context,
    required double width,
    required String title,
    required String description,
    required Widget leading,
  }) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;

    return AnimatedOpacity(
      opacity: 1.0,
      duration: const Duration(milliseconds: 500),
      child: Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 0,
        child: Container(
          width: width,
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
              leading,
              SizedBox(width: screenWidth * 0.04),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: screenWidth * 0.045,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      description,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.6),
                        fontSize: screenWidth * 0.035,
                      ),
                    ),
                  ],
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
