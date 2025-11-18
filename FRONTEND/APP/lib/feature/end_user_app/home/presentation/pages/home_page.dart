import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/presentation/controllers/home_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/webview_screen.dart';
import 'package:ionhive_water_purifier/utils/widgets/card/water_usage_card.dart';
import 'dart:async';
import 'dart:math' as Math;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/home_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/device_model.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:ionhive_water_purifier/core/core.dart';

class CustomAppBar extends StatelessWidget {
  final DeviceData? deviceData;
  final bool isLoading;

  const CustomAppBar({
    super.key,
    this.deviceData,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: MediaQuery.of(context).size.width * 0.04,
        vertical: MediaQuery.of(context).size.height * 0.015,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 3,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Image.asset(
            'assets/Image/aquapulse_logo.png',
            width:
            MediaQuery.of(context).size.width * 0.07, // Smaller logo width
            height: 40,
            fit: BoxFit.contain,
          ),
          SizedBox(width: 4), // Reduced spacing between logo and text
          Text(
            "IonHive",
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.primary,
              fontWeight: FontWeight.bold,
              fontSize: MediaQuery.of(context).size.width * 0.04,
            ),
          ),
          const Spacer(),
          Icon(
            Icons.wifi,
            color: !isLoading && (deviceData?.wifi ?? false)
                ? Colors.green
                : Colors.grey,
            size: MediaQuery.of(context).size.width * 0.06,
          ),
          SizedBox(width: MediaQuery.of(context).size.width * 0.02),
          Icon(
            Icons.bluetooth,
            color: !isLoading && (deviceData?.bluetooth ?? false)
                ? Colors.blue
                : Colors.grey,
            size: MediaQuery.of(context).size.width * 0.06,
          ),
          SizedBox(width: MediaQuery.of(context).size.width * 0.02),
          // Icon(
          //   Icons.notifications_none,
          //   color: Colors.black,
          //   size: MediaQuery.of(context).size.width * 0.06,
          // ),
        ],
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late WebViewController _webViewController;

  @override
  void initState() {
    super.initState();

    final sessionController = Get.find<SessionController>();
    final token = sessionController.token.value;
    final userId = sessionController.userId.value;
    final emailId = sessionController.emailId.value;

    final baseUrl =
        dotenv.env['BASE_URL_WEBVIEW'] ?? 'http://192.168.1.222:5050/';

    // Build URL with query parameters
    final Uri urlWithParams = Uri.parse(baseUrl).replace(queryParameters: {
      'emailId': emailId,
      'userId': userId.toString(),
      'token': token,
    });

    debugPrint('🌐 WebView loading URL: $urlWithParams');

    // Configure WebViewController
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) => debugPrint('🔄 Page started loading: $url'),
          onPageFinished: (url) => debugPrint('✅ Page finished loading: $url'),
        ),
      )
      ..loadRequest(
        urlWithParams,
        method: LoadRequestMethod.get,
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!Get.isRegistered<SubscriptionController>()) {
      Get.put(SubscriptionController());
    }
    final homeController = Get.find<SubscriptionController>();
    debugPrint('Initial sync triggered: fetching active subscription');
    homeController.fetchActiveSubscription();
    debugPrint('Initial sync triggered: fetching latest feature values');
    homeController.fetchLatestFeatureValues();
    final theme = Theme.of(context);

    return WillPopScope(
      onWillPop: () async {
        debugPrint('Back navigation blocked');
        return false; // Prevent back navigation to avoid swipe-down bug
      },
      child: Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        body: Obx(() {
          if (homeController.isLoading.value) {
            return SafeArea(
              child: Column(
                children: [
                  CustomAppBar(isLoading: true),
                  Expanded(child: ShimmerLoading()),
                ],
              ),
            );
          }

          final subscription = homeController.activeSubscription.value;
          final deviceData = homeController.deviceData.value;

          return SafeArea(
            child: Column(
              children: [
                CustomAppBar(deviceData: deviceData),
                Expanded(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.all(
                        MediaQuery.of(context).size.width * 0.04),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ConnectionBanner(deviceData: deviceData),
                        SizedBox(height: MediaQuery.of(context).size.height * 0.02),
                        WaterPurifierShowcase(),
                        SizedBox(height: MediaQuery.of(context).size.height * 0.02),
                        FeatureCardsSection(),
                        SizedBox(
                            height: MediaQuery.of(context).size.height * 0.02),
                        DeviceSelector(),
                        SizedBox(
                            height: MediaQuery.of(context).size.height * 0.02),
                        PlanDetails(
                            subscription: subscription, deviceData: deviceData),
                        SizedBox(
                            height: MediaQuery.of(context).size.height * 0.02),
                        DeviceStatsSection(deviceData: deviceData),
                        SizedBox(
                            height: MediaQuery.of(context).size.height * 0.02),
                        SmartFeatureSection(deviceData: deviceData),
                        SizedBox(
                            height: MediaQuery.of(context).size.height * 0.02),
                        RechargeChangeSection(
                          subscription: subscription,
                          webViewController: _webViewController,
                        ),
                        SizedBox(
                            height: MediaQuery.of(context).size.height * 0.025),
                        // const ReferralBanner(),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class ShimmerLoading extends StatelessWidget {
  const ShimmerLoading({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return SingleChildScrollView(
      padding: EdgeInsets.all(screenWidth * 0.04),
      child: Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: screenHeight * 0.06,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            SizedBox(height: screenHeight * 0.02),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: screenHeight * 0.025,
                  width: screenWidth * 0.25,
                  color: Colors.white,
                ),
                SizedBox(height: screenHeight * 0.015),
                Container(
                  height: screenHeight * 0.2,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ],
            ),
            SizedBox(height: screenHeight * 0.02),
            Container(
              height: screenHeight * 0.15,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            SizedBox(height: screenHeight * 0.02),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: screenHeight * 0.025,
                  width: screenWidth * 0.25,
                  color: Colors.white,
                ),
                SizedBox(height: screenHeight * 0.015),
                Container(
                  height: screenHeight * 0.15,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ],
            ),
            SizedBox(height: screenHeight * 0.02),
            LayoutBuilder(
              builder: (context, constraints) {
                final isSmallScreen = screenWidth < 600;
                return isSmallScreen
                    ? Column(
                  children: [
                    Container(
                      height: screenHeight * 0.15,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    SizedBox(height: screenHeight * 0.015),
                    Container(
                      height: screenHeight * 0.15,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ],
                )
                    : Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: screenHeight * 0.15,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    SizedBox(width: screenWidth * 0.03),
                    Expanded(
                      child: Container(
                        height: screenHeight * 0.15,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
            SizedBox(height: screenHeight * 0.025),
            Container(
              height: screenHeight * 0.1,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ConnectionBanner extends StatelessWidget {
  final DeviceData? deviceData;

  const ConnectionBanner({super.key, this.deviceData});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final bool isConnected = deviceData?.status == "NORMAL";
    final homeController = Get.find<SubscriptionController>();

    return Container(
      padding: EdgeInsets.all(screenWidth * 0.035),
      decoration: BoxDecoration(
        color: const Color(0xFFE3F2FD).withOpacity(0.7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            Icons.phonelink_setup,
            color: isConnected ? theme.colorScheme.primary : Colors.grey,
            size: screenWidth * 0.06,
          ),
          SizedBox(width: screenWidth * 0.025),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isConnected
                      ? "Water purifier Synced with the updated data"
                      : "Water purifier not Synced",
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color:
                    isConnected ? theme.colorScheme.onSurface : Colors.grey,
                    fontSize: screenWidth * 0.035,
                    overflow: TextOverflow.ellipsis,
                  ),
                  maxLines: 1,
                ),
                if (deviceData != null)
                  Text(
                    "Last updated: ${_formatTimestamp(deviceData!.timestamp)}",
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                      fontSize: screenWidth * 0.03,
                      overflow: TextOverflow.ellipsis,
                    ),
                    maxLines: 1,
                  ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () {
              homeController.fetchActiveSubscription();
              homeController.fetchLatestFeatureValues();
            },
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: theme.colorScheme.primary),
              foregroundColor: theme.colorScheme.primary,
              padding: EdgeInsets.symmetric(
                horizontal: screenWidth * 0.02,
                vertical: screenWidth * 0.01,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.sync, size: screenWidth * 0.04),
                SizedBox(width: screenWidth * 0.01),
                Text(
                  "Sync",
                  style: TextStyle(
                    fontSize: screenWidth * 0.035,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimestamp(String timestamp) {
    try {
      final dateTime = DateTime.parse(timestamp).toLocal(); // Convert to IST
      return DateFormat('dd/MM/yyyy, HH:mm').format(dateTime);
    } catch (e) {
      return "Unknown";
    }
  }
}

class WaterPurifierShowcase extends StatefulWidget {
  const WaterPurifierShowcase({super.key});

  @override
  State<WaterPurifierShowcase> createState() => _WaterPurifierShowcaseState();
}

class _WaterPurifierShowcaseState extends State<WaterPurifierShowcase>
    with TickerProviderStateMixin {
  late AnimationController _floatController;
  late AnimationController _rotateController;
  late AnimationController _waveController;
  late Animation<double> _floatAnimation;
  late Animation<double> _rotateAnimation;
  late Animation<double> _waveAnimation;

  @override
  void initState() {
    super.initState();
    
    _floatController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat(reverse: true);

    _rotateController = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();

    _waveController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();

    _floatAnimation = Tween<double>(begin: -8, end: 8).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );

    _rotateAnimation = Tween<double>(begin: 0, end: 2 * 3.14159).animate(_rotateController);
    _waveAnimation = Tween<double>(begin: 0, end: 1).animate(_waveController);
  }

  @override
  void dispose() {
    _floatController.dispose();
    _rotateController.dispose();
    _waveController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Container(
      height: screenHeight * 0.28,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF1565C0), // Lighter dark blue (reduced intensity)
            Color(0xFF1976D2),
            Color(0xFF42A5F5),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.shade900.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Animated wave pattern background
          AnimatedBuilder(
            animation: _waveAnimation,
            builder: (context, child) {
              return CustomPaint(
                size: Size(screenWidth, screenHeight * 0.28),
                painter: WavePainter(_waveAnimation.value),
              );
            },
          ),

          // Main content
          Padding(
            padding: EdgeInsets.all(screenWidth * 0.05),
            child: Row(
              children: [
                // Left side - Text content
                Expanded(
                  flex: 3,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.water_drop,
                            color: Colors.white,
                            size: screenWidth * 0.08,
                          ),
                          SizedBox(width: screenWidth * 0.02),
                          Text(
                            'IonHive',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              fontSize: screenWidth * 0.05,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: screenHeight * 0.015),
                      Text(
                        'Smart Water\nPurification',
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: screenWidth * 0.05,
                          height: 1.2,
                          letterSpacing: 0.5,
                        ),
                      ),
                      SizedBox(height: screenHeight * 0.01),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: screenWidth * 0.03,
                          vertical: screenHeight * 0.008,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          '99.9% Pure Water',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.white,
                            fontSize: screenWidth * 0.028,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Right side - Additional features text
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildFeatureItem(
                        icon: Icons.filter_alt_outlined,
                        text: 'Advanced Filtration',
                        screenWidth: screenWidth,
                      ),
                      SizedBox(height: screenHeight * 0.012),
                      _buildFeatureItem(
                        icon: Icons.wifi,
                        text: 'IoT Enabled',
                        screenWidth: screenWidth,
                      ),
                      SizedBox(height: screenHeight * 0.012),
                      _buildFeatureItem(
                        icon: Icons.speed,
                        text: 'Real-time Monitoring',
                        screenWidth: screenWidth,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String text,
    required double screenWidth,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          color: Colors.white.withOpacity(0.9),
          size: screenWidth * 0.045,
        ),
        SizedBox(width: screenWidth * 0.02),
        Flexible(
          child: Text(
            text,
            style: TextStyle(
              color: Colors.white.withOpacity(0.95),
              fontSize: screenWidth * 0.032,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _build3DPurifier(double screenWidth, double screenHeight) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Outer glow effect
        Container(
          width: screenWidth * 0.4,
          height: screenWidth * 0.4,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                Colors.cyan.withOpacity(0.3),
                Colors.blue.withOpacity(0.1),
                Colors.transparent,
              ],
            ),
          ),
        ),

        // Main purifier with internal flowing water
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Top water tank with animated water inside
            Container(
              width: screenWidth * 0.2,
              height: screenHeight * 0.08,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white.withOpacity(0.9),
                    Colors.blue.shade50.withOpacity(0.8),
                    Colors.cyan.shade100.withOpacity(0.7),
                  ],
                ),
                borderRadius: BorderRadius.vertical(top: Radius.circular(15)),
                border: Border.all(color: Colors.white.withOpacity(0.6), width: 2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.15),
                    blurRadius: 12,
                    offset: Offset(4, 4),
                  ),
                  BoxShadow(
                    color: Colors.white.withOpacity(0.8),
                    blurRadius: 6,
                    offset: Offset(-2, -2),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Animated water level with wave effect
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: AnimatedBuilder(
                      animation: _waveAnimation,
                      builder: (context, child) {
                        return Container(
                          height: screenHeight * 0.05,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.blue.shade200.withOpacity(0.5),
                                Colors.blue.shade400.withOpacity(0.7),
                                Colors.cyan.shade300.withOpacity(0.8),
                              ],
                            ),
                          ),
                          child: Stack(
                            children: [
                              // Water particles/bubbles inside
                              ...List.generate(3, (index) {
                                double offset = (index * 0.33);
                                double animValue = (_waveAnimation.value + offset) % 1.0;
                                return Positioned(
                                  left: screenWidth * 0.03 + (index * screenWidth * 0.04),
                                  bottom: animValue * screenHeight * 0.03,
                                  child: Container(
                                    width: 3,
                                    height: 3,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Colors.white.withOpacity(0.7),
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  // Status LED
                  Positioned(
                    top: 6,
                    right: 6,
                    child: AnimatedBuilder(
                      animation: _waveAnimation,
                      builder: (context, child) {
                        return Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.green,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.green.withOpacity(0.6 + _waveAnimation.value * 0.4),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            // Middle filter chamber with water flowing through
            Container(
              width: screenWidth * 0.24,
              height: screenHeight * 0.09,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.grey.shade50.withOpacity(0.95),
                    Colors.white.withOpacity(0.9),
                    Colors.grey.shade100.withOpacity(0.95),
                  ],
                ),
                border: Border.all(color: Colors.blue.shade100, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 15,
                    offset: Offset(5, 5),
                  ),
                  BoxShadow(
                    color: Colors.white.withOpacity(0.9),
                    blurRadius: 8,
                    offset: Offset(-3, -3),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Animated water streams flowing through filter
                  AnimatedBuilder(
                    animation: _waveAnimation,
                    builder: (context, child) {
                      return Stack(
                        children: List.generate(4, (index) {
                          double offset = (index * 0.25);
                          double animValue = (_waveAnimation.value + offset) % 1.0;
                          return Positioned(
                            top: animValue * screenHeight * 0.09,
                            left: screenWidth * 0.04 + (index * screenWidth * 0.04),
                            child: Container(
                              width: 2,
                              height: screenHeight * 0.015,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.cyan.shade300.withOpacity(0.6),
                                    Colors.blue.shade400.withOpacity(0.8),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(1),
                              ),
                            ),
                          );
                        }),
                      );
                    },
                  ),
                  // Rotating filter icon
                  Center(
                    child: AnimatedBuilder(
                      animation: _rotateAnimation,
                      builder: (context, child) {
                        return Transform.rotate(
                          angle: _rotateAnimation.value,
                          child: Icon(
                            Icons.filter_alt_outlined,
                            color: Colors.blue.shade600.withOpacity(0.8),
                            size: screenWidth * 0.09,
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            // Bottom outlet/tap with water flowing out
            Container(
              width: screenWidth * 0.18,
              height: screenHeight * 0.045,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.blue.shade200,
                    Colors.blue.shade400,
                    Colors.blue.shade600,
                  ],
                ),
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(12)),
                border: Border.all(color: Colors.white.withOpacity(0.5), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 10,
                    offset: Offset(3, 5),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  // Water stream inside outlet
                  Center(
                    child: AnimatedBuilder(
                      animation: _waveAnimation,
                      builder: (context, child) {
                        return Container(
                          width: 3,
                          height: screenHeight * 0.03,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.cyan.shade200.withOpacity(0.8),
                                Colors.blue.shade300.withOpacity(0.9),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(1.5),
                          ),
                        );
                      },
                    ),
                  ),
                  // Tap icon
                  Center(
                    child: Icon(
                      Icons.water_drop_outlined,
                      color: Colors.white.withOpacity(0.9),
                      size: screenWidth * 0.06,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// Custom painter for wave effect
class WavePainter extends CustomPainter {
  final double animationValue;

  WavePainter(this.animationValue);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(0, size.height * 0.7);

    for (double i = 0; i < size.width; i++) {
      path.lineTo(
        i,
        size.height * 0.7 +
            20 * Math.sin((i / size.width * 2 * Math.pi) + (animationValue * 2 * Math.pi)),
      );
    }

    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(WavePainter oldDelegate) => true;
}

class AnimatedWaterDrop extends StatefulWidget {
  final double delay;
  final double left;
  final double top;

  const AnimatedWaterDrop({
    super.key,
    required this.delay,
    required this.left,
    required this.top,
  });

  @override
  State<AnimatedWaterDrop> createState() => _AnimatedWaterDropState();
}

class _AnimatedWaterDropState extends State<AnimatedWaterDrop>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );

    _animation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    Future.delayed(Duration(milliseconds: (widget.delay * 1000).toInt()), () {
      if (mounted) {
        _controller.repeat(reverse: true);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: widget.left,
      top: widget.top,
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, child) {
          return Opacity(
            opacity: 0.3 * _animation.value,
            child: Icon(
              Icons.water_drop,
              size: 20 + (10 * _animation.value),
              color: Colors.blue.shade300,
            ),
          );
        },
      ),
    );
  }
}


class FeatureCardsSection extends StatelessWidget {
  const FeatureCardsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery
        .of(context)
        .size
        .width;

    final List<Map<String, dynamic>> features = [
      {
        'icon': Icons.analytics_outlined,
        'title': 'Water Tracking',
        'image': 'assets/Image/g1.png',
      },
      {
        'icon': Icons.notifications_active_outlined,
        'title': 'Plans Starting ₹299/month',
        'image': 'assets/Image/Rupees.jpg',
      },
      {
        'icon': Icons.support_agent_outlined,
        'title': 'Priority Support',
        'image': 'assets/Image/g3.png',
      },
      {
        'icon': Icons.build_circle_outlined,
        'title': 'Lifetime Free Maintenance',
        'image': 'assets/Image/Wp.png',
      },
    ];


    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: screenWidth * 0.01,
        vertical: screenWidth * 0.02,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Services We Offer",
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
              fontSize: screenWidth * 0.035,
            ),
          ),
          SizedBox(height: screenWidth * 0.02),
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: screenWidth * 0.025,
            mainAxisSpacing: screenWidth * 0.025,
            childAspectRatio: 2.6,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: features.map((feature) {
              return _buildFeatureCard(
                context,
                icon: feature['icon'] as IconData,
                title: feature['title'] as String,
                imagePath: feature['image'] as String,
                theme: theme,
                fontSize: screenWidth * 0.03,
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard(
      BuildContext context, {
        required IconData icon,
        required String title,
        required String imagePath,
        required ThemeData theme,
        double fontSize = 14,
      }) {
    final screenWidth = MediaQuery.of(context).size.width;

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0, end: 1),
      duration: const Duration(milliseconds: 400),
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: child,
        );
      },
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: screenWidth * 0.025,
          vertical: screenWidth * 0.022,
        ),
        decoration: BoxDecoration(
          color: const Color(0xFFE3F2FD).withOpacity(0.7), // lighter/faded blue
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.06), // reduced opacity
              blurRadius: 4, // smaller blur
              offset: const Offset(0, 2), // subtle shadow
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: Colors.black87,
                  fontSize: fontSize,
                ),
              ),
            ),
            SizedBox(width: screenWidth * 0.02),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.asset(
                imagePath,
                height: screenWidth * 0.07,
                width: screenWidth * 0.07,
                fit: BoxFit.cover,
              ),
            ),
          ],
        ),
      ),
    );
  }

}

  class DeviceSelector extends StatelessWidget {
  const DeviceSelector({super.key});

  @override
  Widget build(BuildContext context) {
    final homeController = Get.find<SubscriptionController>();
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;

    return Obx(() {
      final orders = homeController.orders.cast<Subscription>().toList();
      final Subscription? activeSubscription = homeController.activeSubscription.value;

      final smartOrders = orders
          .where((subscription) => subscription.modelType?.toLowerCase() == 'smart')
          .toList();

      if (smartOrders.isEmpty || smartOrders.length <= 1) {
        return SizedBox.shrink();
      }

      final activeSmartOrder = smartOrders.firstWhere(
        (subscription) => subscription.id == activeSubscription?.id,
        orElse: () => smartOrders.first,
      );

      return Container(
        padding: EdgeInsets.all(screenWidth * 0.03),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.05), // lighter shadow
              spreadRadius: 0.5, // reduced spread
              blurRadius: 2, // reduced blur
              offset: const Offset(0, 1), // smaller offset
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Select Device to View Details",
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.primary,
                fontSize: screenWidth * 0.035,
              ),
            ),
            SizedBox(height: screenWidth * 0.02),
            DropdownButtonFormField<Subscription>(
              value: activeSmartOrder,
              dropdownColor: Colors.white,
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.03,
                  vertical: screenWidth * 0.015,
                ),
              ),
              items: smartOrders.map((subscription) {
                return DropdownMenuItem<Subscription>(
                  value: subscription,
                  child: Text(
                    "${subscription.modelName} (${subscription.wpDeviceId})",
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: screenWidth * 0.03,
                    ),
                  ),
                );
              }).toList(),
              onChanged: (selectedSubscription) {
                if (selectedSubscription != null) {
                  homeController.selectSubscription(selectedSubscription as Order);
                }
              },
            ),
          ],
        ),
      );
    });
  }
}




class PlanDetails extends StatefulWidget {
  final Subscription? subscription;
  final DeviceData? deviceData;

  const PlanDetails({super.key, this.subscription, this.deviceData});

  @override
  State<PlanDetails> createState() => _PlanDetailsState();
}

class _PlanDetailsState extends State<PlanDetails> {
  int currentPage = 0;
  Timer? _timer;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoSlide();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoSlide() {
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (mounted) {
        setState(() {
          // Calculate next page index
          final List<String> imageUrls = [];
          if (widget.subscription != null) {
            if (widget.subscription!.mainImage.isNotEmpty) {
              imageUrls.add('${Core.baseUrl}/upload/img/${widget.subscription!.mainImage}');
            }
            for (var subImg in widget.subscription!.subImages) {
              imageUrls.add('${Core.baseUrl}/upload/img/$subImg');
            }
          }

          if (imageUrls.length > 1) {
            currentPage = (currentPage + 1) % imageUrls.length;
            _pageController.animateToPage(
              currentPage,
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut,
            );
          }
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    final double waterUsed = widget.deviceData?.waterConsumed ?? 0.0;
    final int waterLimit = widget.subscription?.totalLitre ?? widget.deviceData?.totalWaterLimit ?? 500;
    final String capacityStr = "${waterLimit}L";
    final planName = widget.subscription?.selectedPlan.label ?? "Silver";
    final model = widget.subscription?.modelName ?? "Bolt";
    final planAmount =
    widget.subscription != null
        ? "₹ ${widget.subscription!.selectedPlan.price}"
        : "₹ 425";
    final planStart = widget.subscription != null
        ? (widget.subscription!.planConfig?.startDate != null
            ? _formatDate(widget.subscription!.planConfig!.startDate!)
            : "N/A")
        : "25/08/2022";

    // ---------------- Image URLs ----------------
    List<String> imageUrls = [];
    if (widget.subscription != null) {
      if (widget.subscription!.mainImage.isNotEmpty) {
        final mainImageUrl = '${Core.baseUrl}/upload/img/${widget.subscription!.mainImage}';
        imageUrls.add(mainImageUrl);
        debugPrint('🖼️ Main image URL: $mainImageUrl');
      }
      for (var subImg in widget.subscription!.subImages) {
        final subImageUrl = '${Core.baseUrl}/upload/img/$subImg';
        imageUrls.add(subImageUrl);
        debugPrint('🖼️ Sub image URL: $subImageUrl');
      }
      debugPrint('🖼️ Total images to display: ${imageUrls.length}');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ---------------- Image Slider ----------------
        if (imageUrls.isNotEmpty) ...[
          SizedBox(
            height: screenHeight * 0.3,
            child: PageView.builder(
              controller: _pageController,
              itemCount: imageUrls.length,
              onPageChanged: (index) => setState(() => currentPage = index),
              itemBuilder: (context, index) {
                String fullUrl = imageUrls[index];
                return ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Center(
                    child: AspectRatio(
                      aspectRatio: 4 / 3,
                      child: Image.network(
                        fullUrl,
                        fit: BoxFit.contain,
                        width: screenWidth * 0.9,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return const Center(child: CircularProgressIndicator());
                        },
                        errorBuilder: (context, error, stackTrace) {
                          debugPrint('❌ Image load error: $error');
                          return Container(
                            color: Colors.grey[200],
                            child: const Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.image_not_supported, size: 50, color: Colors.grey),
                                  SizedBox(height: 8),
                                  Text('Image not available', style: TextStyle(color: Colors.grey, fontSize: 12)),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              imageUrls.length,
                  (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: currentPage == index ? 8 : 6,
                height: currentPage == index ? 8 : 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: currentPage == index
                      ? theme.colorScheme.primary
                      : Colors.grey.withOpacity(0.5),
                ),
              ),
            ),
          ),
        ],

        SizedBox(height: screenHeight * 0.03),

        // ---------------- Plan Details Title ----------------
        Padding(
          padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.03),
          child: Text(
            "Plan Details",
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
              fontSize: screenWidth * 0.035,
            ),
          ),
        ),

        SizedBox(height: screenHeight * 0.015),

        // ---------------- Plan Details Card ----------------
        Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 5,
          shadowColor: Colors.blue.withOpacity(0.2),
          child: Container(
            width: double.infinity,
            padding: EdgeInsets.all(screenWidth * 0.05),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                colors: [
                  Color(0xFF1565C0), // Lighter dark blue (reduced intensity)
                  Color(0xFF1976D2), // Medium blue
                  Color(0xFF42A5F5), // Light blue
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Plan Name & Model
                Text(
                  planName,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: screenWidth * 0.05,
                  ),
                ),
                SizedBox(height: screenHeight * 0.005),
                Text(
                  model,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.white70,
                    fontSize: screenWidth * 0.035,
                  ),
                ),
                SizedBox(height: screenHeight * 0.02),

                // Water Limit & Plan Start
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Water Limit",
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.white70,
                            fontSize: screenWidth * 0.03,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          capacityStr,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: screenWidth * 0.035,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "Plan Start",
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.white70,
                            fontSize: screenWidth * 0.03,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          planStart,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: screenWidth * 0.035,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                SizedBox(height: screenHeight * 0.02),

                // Plan Amount
                Container(
                  padding: EdgeInsets.symmetric(
                      horizontal: screenWidth * 0.03, vertical: screenHeight * 0.008),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    planAmount,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: screenWidth * 0.04,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        SizedBox(height: screenHeight * 0.03),

        // ---------------- Water Usage Title ----------------
        Padding(
          padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.03),
          child: Text(
            "Water Usage",
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
              fontSize: screenWidth * 0.035,
            ),
          ),
        ),

        SizedBox(height: screenHeight * 0.015),

        // ---------------- Water Usage Card ----------------
        Center(
          child: WaterUsageCard(
            waterUsed: waterUsed,
            waterLimit: waterLimit,
            width: screenWidth * 0.95,
          ),
        ),
      ],
    );
  }

  String _formatDate(String isoDate) {
    final dateTime = DateTime.parse(isoDate);
    return "${dateTime.day}/${dateTime.month}/${dateTime.year}";
  }
}




class DeviceStatsSection extends StatefulWidget {
  final DeviceData? deviceData;

  const DeviceStatsSection({super.key, this.deviceData});

  @override
  State<DeviceStatsSection> createState() => _DeviceStatsSectionState();
}

class _DeviceStatsSectionState extends State<DeviceStatsSection>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    if (widget.deviceData == null || widget.deviceData?.deviceId == null) {
      return SizedBox.shrink();
    }

    final deviceId = widget.deviceData?.deviceId ?? "Unknown";
    final litresDispensed = widget.deviceData?.totalWaterUsed ?? 0.0;
    final tdsIn = widget.deviceData?.tdsIn ?? 0;
    final tdsOut = widget.deviceData?.tdsOut ?? 0;
    final tankLevelStatus = widget.deviceData?.tankLevel ?? "EMPTY";
    final tankLevel = widget.deviceData?.tankLevelValue ?? 0.0;
    final pressure = widget.deviceData?.pressure ?? 0.0;
    final temperature = widget.deviceData?.temperature ?? 0.0;
    final flowRate = widget.deviceData?.flowRate ?? 0.0;

    final hasDeviceId = deviceId != "Unknown";
    final hasLitresDispensed = litresDispensed > 0.0;
    final hasTds = tdsIn > 0 || tdsOut > 0;
    final hasTemperature = temperature > 0.0;
    final hasPressure = pressure > 0.0;
    final hasTankLevel = tankLevel > 0.0;
    final hasFlowRate = flowRate > 0.0;

    final hasAnyData = hasDeviceId || hasLitresDispensed || hasTds || hasTemperature || hasPressure || hasTankLevel || hasFlowRate;

    if (!hasAnyData) {
      return SizedBox.shrink();
    }

    final statRows = <Widget>[];

    if (hasDeviceId || hasLitresDispensed) {
      statRows.add(Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (hasDeviceId)
            Expanded(
              child: _buildStatItem(
                theme,
                icon: Icons.device_hub,
                label: "Device ID",
                value: deviceId,
                screenWidth: screenWidth,
                tooltip: "Unique identifier for the device",
              ),
            ),
          if (hasDeviceId && hasLitresDispensed) SizedBox(width: screenWidth * 0.02),
          if (hasLitresDispensed)
            Expanded(
              child: _buildStatItem(
                theme,
                icon: Icons.local_drink,
                label: "Litres Dispensed",
                value: litresDispensed < 1.0
                    ? "${(litresDispensed * 1000).toStringAsFixed(1)} ml"
                    : "${litresDispensed.toStringAsFixed(2)} L",
                screenWidth: screenWidth,
                tooltip: "Total water dispensed by the device",
              ),
            ),
        ],
      ));
    }

    if (hasTds) {
      if (statRows.isNotEmpty) {
        statRows.add(SizedBox(height: screenHeight * 0.02));
        statRows.add(Divider(
          color: theme.colorScheme.primary.withOpacity(0.2),
          thickness: 1,
        ));
      }
      statRows.add(SizedBox(height: screenHeight * 0.02));
      statRows.add(Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Expanded(
            child: _buildStatItem(
              theme,
              icon: Icons.water_drop,
              label: "TDS Level",
              value: "In: ${tdsIn == 0 ? '-' : tdsIn} | Out: ${tdsOut == 0 ? '-' : tdsOut} ppm",
              screenWidth: screenWidth,
              statusColor: tdsOut < 50
                  ? Colors.blue
                  : tdsOut < 150
                  ? Colors.yellow[700]
                  : Colors.red,
              tooltip: "Total Dissolved Solids (ideal: <50 ppm)",
            ),
          ),
        ],
      ));
    }

    if (hasTemperature || hasPressure) {
      if (statRows.isNotEmpty) {
        statRows.add(SizedBox(height: screenHeight * 0.02));
        statRows.add(Divider(
          color: theme.colorScheme.primary.withOpacity(0.2),
          thickness: 1,
        ));
      }
      statRows.add(SizedBox(height: screenHeight * 0.02));
      statRows.add(Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (hasTemperature)
            Expanded(
              child: _buildStatItem(
                theme,
                icon: Icons.thermostat,
                label: "Temperature",
                value: "${temperature.toStringAsFixed(1)}°C",
                screenWidth: screenWidth,
                statusColor: temperature < 30 ? Colors.green : Colors.orange,
                tooltip: "Current water temperature",
              ),
            ),
          if (hasTemperature && hasPressure) SizedBox(width: screenWidth * 0.02),
          if (hasPressure)
            Expanded(
              child: _buildStatItem(
                theme,
                icon: Icons.speed,
                label: "Pressure",
                value: "${pressure.toStringAsFixed(1)} bar",
                screenWidth: screenWidth,
                statusColor: pressure > 1.0 ? Colors.green : Colors.orange,
                tooltip: "Current water pressure",
              ),
            ),
        ],
      ));
    }

    if (hasTankLevel) {
      if (statRows.isNotEmpty) {
        statRows.add(SizedBox(height: screenHeight * 0.02));
        statRows.add(Divider(
          color: theme.colorScheme.primary.withOpacity(0.2),
          thickness: 1,
        ));
      }
      statRows.add(SizedBox(height: screenHeight * 0.02));
      statRows.add(Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Expanded(
            child: _buildStatItem(
              theme,
              icon: Icons.storage,
              label: "Tank Level",
              value: "$tankLevelStatus (${tankLevel.toStringAsFixed(0)}%)",
              screenWidth: screenWidth,
              statusColor: tankLevelStatus == "FULL"
                  ? Colors.green
                  : tankLevelStatus == "MEDIUM"
                  ? Colors.orange
                  : Colors.red,
              showProgress: true,
              progressValue: tankLevel / 100,
              tooltip: "Remaining water in the tank",
            ),
          ),
        ],
      ));
    }

    if (hasFlowRate) {
      if (statRows.isNotEmpty) {
        statRows.add(SizedBox(height: screenHeight * 0.02));
        statRows.add(Divider(
          color: theme.colorScheme.primary.withOpacity(0.2),
          thickness: 1,
        ));
      }
      statRows.add(SizedBox(height: screenHeight * 0.02));
      statRows.add(Row(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Expanded(
            child: _buildStatItem(
              theme,
              icon: Icons.speed,
              label: "Flow Rate",
              value: "${flowRate.toStringAsFixed(1)} L/min",
              screenWidth: screenWidth,
              statusColor: flowRate > 1.0 ? Colors.green : Colors.orange,
              tooltip: "Rate of water dispensing",
            ),
          ),
        ],
      ));
    }

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.fromBorderSide(
          BorderSide(
            color: theme.colorScheme.primary.withOpacity(0.3),
            width: 1,
          ),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(screenWidth * 0.04),
        child: Column(
          children: statRows,
        ),
      ),
    );
  }

  Widget _buildStatItem(ThemeData theme,
      {required IconData icon,
        required String label,
        required String value,
        required double screenWidth,
        Color? statusColor,
        bool showProgress = false,
        double? progressValue,
        String? tooltip}) {
    final gradientColors = statusColor != null
        ? [statusColor.withOpacity(0.2), statusColor.withOpacity(0.4)]
        : [
      theme.colorScheme.primary.withOpacity(0.2),
      theme.colorScheme.primary.withOpacity(0.4)
    ];

    return AnimatedOpacity(
      opacity: 1.0,
      duration: const Duration(milliseconds: 500),
      child: GestureDetector(
        onTap: () {
          _animationController.forward(from: 0);
        },
        child: Tooltip(
          message: tooltip ?? '',
          child: Row(
            children: [
              ScaleTransition(
                scale: _scaleAnimation,
                child: Container(
                  padding: EdgeInsets.all(screenWidth * 0.015),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: gradientColors,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Icon(
                    icon,
                    color: statusColor ?? theme.colorScheme.primary,
                    size: screenWidth * 0.05,
                  ),
                ),
              ),
              SizedBox(width: screenWidth * 0.02),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                        fontSize: screenWidth * 0.03,
                        fontWeight: FontWeight.w500,
                        overflow: TextOverflow.ellipsis, // Prevent overflow
                      ),
                      maxLines: 1,
                    ),
                    SizedBox(height: screenWidth * 0.005),
                    Row(
                      children: [
                        ScaleTransition(
                          scale: _scaleAnimation,
                          child: Text(
                            value,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: statusColor ?? theme.colorScheme.primary,
                              fontSize: screenWidth * 0.035,
                              overflow:
                              TextOverflow.ellipsis, // Prevent overflow
                            ),
                            maxLines: 1,
                          ),
                        ),
                        if (showProgress && progressValue != null) ...[
                          SizedBox(width: screenWidth * 0.02),
                          Expanded(
                            child: LinearProgressIndicator(
                              value: progressValue,
                              backgroundColor: theme.colorScheme.surface,
                              color: statusColor ?? theme.colorScheme.primary,
                              minHeight: screenWidth * 0.015,
                            ),
                          ),
                        ],
                      ],
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
}

class SmartFeatureSection extends StatefulWidget {
  final DeviceData? deviceData;

  const SmartFeatureSection({super.key, this.deviceData});

  @override
  State<SmartFeatureSection> createState() => _SmartFeatureSectionState();
}

class _SmartFeatureSectionState extends State<SmartFeatureSection> {
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController =
        PageController(viewportFraction: 0.7); // Reduced from 0.75
    _pageController.addListener(() {
      setState(() {
        _currentPage = _pageController.page!.round();
      });
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    if (widget.deviceData == null || widget.deviceData?.deviceId == null) {
      return SizedBox.shrink();
    }

    final filterStatus = widget.deviceData?.filterStatus ?? "Good";
    final uvStatus = widget.deviceData?.uvStatus ?? true;
    final faultedReason = widget.deviceData?.faultedReason ?? "None";
    final powerStatus = widget.deviceData?.powerStatus ?? "OFF";
    final valveStatus = widget.deviceData?.valveStatus ?? "CLOSED";

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Smart Feature",
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.primary,
            fontSize: screenWidth * 0.05,
            overflow: TextOverflow.ellipsis, // Prevent overflow
          ),
          maxLines: 1,
        ),
        SizedBox(height: screenHeight * 0.01),
        SizedBox(
          height: screenHeight * 0.12, // Reduced height for horizontal card layout
          child: Column(
            children: [
              Expanded(
                child: PageView(
                  controller: _pageController,
                  padEnds: false,
                  children: [
                    Padding(
                      padding: EdgeInsets.only(right: screenWidth * 0.015),
                      child: SmartFeatureCard(
                        icon: Icons.health_and_safety,
                        title: "Filter Health",
                        subtitle: filterStatus,
                        color: filterStatus.toLowerCase() == "good"
                            ? Colors.green
                            : Colors.orange,
                        screenWidth: screenWidth,
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.only(right: screenWidth * 0.015),
                      child: SmartFeatureCard(
                        icon: Icons.warning_amber_rounded,
                        title: "System Fault",
                        subtitle: faultedReason == "None"
                            ? "No Fault"
                            : faultedReason,
                        color: faultedReason == "None"
                            ? Colors.green
                            : Colors.orange,
                        screenWidth: screenWidth,
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.only(right: screenWidth * 0.015),
                      child: SmartFeatureCard(
                        icon: Icons.lightbulb,
                        title: "UV Sterilization",
                        subtitle: uvStatus ? "On" : "Off",
                        color: uvStatus ? Colors.pink : Colors.grey,
                        screenWidth: screenWidth,
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.only(right: screenWidth * 0.015),
                      child: SmartFeatureCard(
                        icon: Icons.power_settings_new,
                        title: "Power Status",
                        subtitle: powerStatus,
                        color: powerStatus == "ON" ? Colors.green : Colors.red,
                        screenWidth: screenWidth,
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.only(right: screenWidth * 0.015),
                      child: SmartFeatureCard(
                        icon: Icons.lock,
                        title: "Valve Status",
                        subtitle: valveStatus,
                        color:
                        valveStatus == "OPEN" ? Colors.blue : Colors.grey,
                        screenWidth: screenWidth,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: screenHeight * 0.005),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return Container(
                    margin:
                    EdgeInsets.symmetric(horizontal: screenWidth * 0.008),
                    width: _currentPage == index
                        ? screenWidth * 0.02
                        : screenWidth * 0.01,
                    height: screenWidth * 0.01,
                    decoration: BoxDecoration(
                      color: _currentPage == index
                          ? theme.colorScheme.primary
                          : theme.colorScheme.primary.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class SmartFeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final double screenWidth;

  const SmartFeatureCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.screenWidth,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      elevation: 2,
      shadowColor: color.withOpacity(0.2),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [
              color.withOpacity(0.08),
              color.withOpacity(0.04),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: EdgeInsets.all(screenWidth * 0.025),
          child: Row(
            children: [
              // Circular icon container with gradient
              Container(
                width: screenWidth * 0.08,
                height: screenWidth * 0.08,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      color.withOpacity(0.8),
                      color.withOpacity(0.6),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: color.withOpacity(0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: screenWidth * 0.04,
                ),
              ),
              SizedBox(width: screenWidth * 0.025),
              // Title and subtitle column
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      title,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface.withOpacity(0.9),
                        fontSize: screenWidth * 0.032,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: screenWidth * 0.005),
                    // Subtitle
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: screenWidth * 0.02,
                        vertical: screenWidth * 0.005,
                      ),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        subtitle,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: color,
                          fontWeight: FontWeight.w500,
                          fontSize: screenWidth * 0.025,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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
}

class RechargeChangeSection extends StatelessWidget {
  final Subscription? subscription;
  final WebViewController webViewController;

  const RechargeChangeSection({
    super.key,
    this.subscription,
    required this.webViewController,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen = screenWidth < 600;

    if (subscription == null || subscription!.subscriptionExpiryDate.isEmpty) {
      // Don't show anything until expiry date is available
      return SizedBox.shrink();
    }

    final currentDate = DateTime.now();
    final expiryDate = DateTime.parse(subscription!.subscriptionExpiryDate);
    final formattedExpiryDate = _formatDate(expiryDate);
    final bool isExpired = currentDate.isAfter(expiryDate);

    Widget buildCard({
      required IconData icon,
      required String title,
      required String subtitle,
      required String buttonText,
      required VoidCallback? onPressed,
    }) {
      return SizedBox(
        width: double.infinity,
        child: Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: theme.colorScheme.primary.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Padding(
            padding: EdgeInsets.all(screenWidth * 0.03),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      padding: EdgeInsets.all(screenWidth * 0.02),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        icon,
                        color: theme.colorScheme.primary,
                        size: screenWidth * 0.06,
                      ),
                    ),
                    SizedBox(width: screenWidth * 0.03),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            title,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.primary,
                              fontSize: screenWidth * 0.035,
                              overflow: TextOverflow.ellipsis,
                            ),
                            maxLines: 1,
                          ),
                          SizedBox(height: screenWidth * 0.005),
                          Text(
                            subtitle,
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontSize: screenWidth * 0.03,
                              color:
                              theme.colorScheme.onSurface.withOpacity(0.6),
                              overflow: TextOverflow.ellipsis,
                            ),
                            maxLines: 1,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: screenWidth * 0.02),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onPressed,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: onPressed == null
                          ? theme.colorScheme.primary.withOpacity(0.5)
                          : theme.colorScheme.primary,
                      foregroundColor: theme.colorScheme.onPrimary,
                      minimumSize: Size(0, screenWidth * 0.08),
                      padding: EdgeInsets.symmetric(
                        vertical: screenWidth * 0.015,
                        horizontal: screenWidth * 0.025,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    child: Text(
                      buttonText,
                      style: TextStyle(
                        fontSize: screenWidth * 0.03,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return buildCard(
      icon: Icons.monetization_on_outlined,
      title: "Recharge Plan",
      subtitle: "Expires on: $formattedExpiryDate",
      buttonText: "Recharge",
      onPressed: () {
        Get.to(
              () => WebViewScreen(
            controller: webViewController,
          ),
          transition: Transition.rightToLeft,
          duration: const Duration(milliseconds: 300),
        );
      },
    );
  }

  String _formatDate(DateTime dateTime) {
    return "${dateTime.day}/${dateTime.month}/${dateTime.year}";
  }
}


class ReferralBanner extends StatelessWidget {
  const ReferralBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      padding: EdgeInsets.all(screenWidth * 0.04),
      decoration: BoxDecoration(
        color: Colors.lightBlue.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Refer your friends",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: screenWidth * 0.04,
                  ),
                ),
                SizedBox(height: screenWidth * 0.015),
                Text(
                  "Earn ₹ 250 Amazon voucher on every successful referral, ₹ 100 OFF for availing subscription.",
                  style: TextStyle(fontSize: screenWidth * 0.035),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: theme.colorScheme.onPrimary,
              padding: EdgeInsets.symmetric(
                horizontal: screenWidth * 0.02,
                vertical: screenWidth * 0.01,
              ),
              textStyle: theme.textTheme.bodySmall?.copyWith(
                fontSize: screenWidth * 0.03,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            child: const Text("Share"),
          ),
        ],
      ),
    );
  }
}
