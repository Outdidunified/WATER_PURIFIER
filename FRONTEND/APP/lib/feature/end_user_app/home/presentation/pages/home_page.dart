import 'package:aquapulse_app/core/controllers/session_controller.dart';
import 'package:aquapulse_app/feature/end_user_app/home/presentation/controllers/home_controller.dart';
import 'package:aquapulse_app/utils/widgets/webview_screen.dart';
import 'package:aquapulse_app/utils/widgets/card/water_usage_card.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import 'package:aquapulse_app/feature/end_user_app/home/domain/models/home_model.dart';
import 'package:aquapulse_app/feature/end_user_app/home/domain/models/device_model.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

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
            "AquaPulse",
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
          Icon(
            Icons.notifications_none,
            color: Colors.black,
            size: MediaQuery.of(context).size.width * 0.06,
          ),
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
        color: theme.colorScheme.primary.withOpacity(0.1),
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

class PlanDetails extends StatelessWidget {
  final Subscription? subscription;
  final DeviceData? deviceData;

  const PlanDetails({super.key, this.subscription, this.deviceData});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen = screenWidth < 600;

    final int waterUsed = deviceData?.waterConsumed ?? 90;
    final String capacityStr = subscription?.selectedPlan.capacity ?? "117";
    final int waterLimit =
        int.tryParse(capacityStr.replaceAll(RegExp(r'[^0-9]'), '')) ?? 117;

    final planName = subscription?.selectedPlan.label ?? "Silver";
    final model = subscription?.modelName ?? "Bolt";
    final planAmount = subscription != null
        ? "₹ ${subscription!.price.toStringAsFixed(0)}"
        : "₹ 425";
    final planStart = subscription != null
        ? _formatDate(subscription!.createdAt)
        : "25/08/2022";

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Plan Details",
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.primary,
            fontSize: screenWidth * 0.05,
          ),
        ),
        SizedBox(height: screenHeight * 0.015),
        Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: theme.colorScheme.primary.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Padding(
            padding: EdgeInsets.all(screenWidth * 0.04),
            child: isSmallScreen
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: EdgeInsets.all(screenWidth * 0.03),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildDetailRow(theme,
                                label: "Plan Name",
                                value: planName,
                                screenWidth: screenWidth),
                            SizedBox(height: screenHeight * 0.01),
                            _buildDetailRow(theme,
                                label: "Model",
                                value: model,
                                screenWidth: screenWidth),
                            SizedBox(height: screenHeight * 0.01),
                            _buildDetailRow(theme,
                                label: "Water Limit",
                                value: capacityStr,
                                screenWidth: screenWidth),
                            SizedBox(height: screenHeight * 0.01),
                            _buildDetailRow(theme,
                                label: "Plan Amount",
                                value: planAmount,
                                screenWidth: screenWidth),
                            SizedBox(height: screenHeight * 0.01),
                            _buildDetailRow(theme,
                                label: "Plan Start",
                                value: planStart,
                                screenWidth: screenWidth),
                          ],
                        ),
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      Center(
                        child: WaterUsageCard(
                          waterUsed: waterUsed,
                          waterLimit: waterLimit,
                          width: screenWidth *
                              0.8, // Adjusted width for small screens
                        ),
                      ),
                    ],
                  )
                : Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Container(
                          padding: EdgeInsets.all(screenWidth * 0.03),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildDetailRow(theme,
                                  label: "Plan Name",
                                  value: planName,
                                  screenWidth: screenWidth),
                              SizedBox(height: screenHeight * 0.01),
                              _buildDetailRow(theme,
                                  label: "Model",
                                  value: model,
                                  screenWidth: screenWidth),
                              SizedBox(height: screenHeight * 0.01),
                              _buildDetailRow(theme,
                                  label: "Water Limit",
                                  value: capacityStr,
                                  screenWidth: screenWidth),
                              SizedBox(height: screenHeight * 0.01),
                              _buildDetailRow(theme,
                                  label: "Plan Amount",
                                  value: planAmount,
                                  screenWidth: screenWidth),
                              SizedBox(height: screenHeight * 0.01),
                              _buildDetailRow(theme,
                                  label: "Plan Start",
                                  value: planStart,
                                  screenWidth: screenWidth),
                            ],
                          ),
                        ),
                      ),
                      Padding(
                        padding: EdgeInsets.only(left: screenWidth * 0.04),
                        child: WaterUsageCard(
                          waterUsed: waterUsed,
                          waterLimit: waterLimit,
                          width: screenWidth *
                              0.3, // Adjusted width for larger screens
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(ThemeData theme,
      {required String label,
      required String value,
      required double screenWidth}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "$label:",
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurface
                .withOpacity(0.5), // Neutral muted color
            fontSize: screenWidth * 0.035,
          ),
        ),
        SizedBox(width: screenWidth * 0.02),
        Flexible(
          fit: FlexFit.loose,
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface, // Default text color
              fontWeight: FontWeight.w500,
              fontSize: screenWidth * 0.035,
            ),
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

    final deviceId = widget.deviceData?.deviceId ?? "Unknown";
    final litresDispensed = widget.deviceData?.totalWaterUsed.toDouble() ?? 0.0;
    final tdsIn = widget.deviceData?.tdsIn ?? 0;
    final tdsOut = widget.deviceData?.tdsOut ?? 0;
    final tankLevelStatus = widget.deviceData?.tankLevel ?? "EMPTY";
    final tankLevel = widget.deviceData?.tankLevelValue ?? 0.0;
    final pressure = widget.deviceData?.pressure ?? 0.0;
    final temperature = widget.deviceData?.temperature ?? 0.0;

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
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
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
                SizedBox(width: screenWidth * 0.02),
                Expanded(
                  child: _buildStatItem(
                    theme,
                    icon: Icons.local_drink,
                    label: "Litres Dispensed",
                    value: "${litresDispensed.toStringAsFixed(1)} L",
                    screenWidth: screenWidth,
                    tooltip: "Total water dispensed by the device",
                  ),
                ),
              ],
            ),
            SizedBox(height: screenHeight * 0.02),
            Divider(
              color: theme.colorScheme.primary.withOpacity(0.2),
              thickness: 1,
            ),
            SizedBox(height: screenHeight * 0.02),
            Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildStatItem(
                    theme,
                    icon: Icons.water_drop,
                    label: "TDS Level",
                    value: "In: $tdsIn | Out: $tdsOut ppm",
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
            ),
            SizedBox(height: screenHeight * 0.02),
            Divider(
              color: theme.colorScheme.primary.withOpacity(0.2),
              thickness: 1,
            ),
            SizedBox(height: screenHeight * 0.02),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: _buildStatItem(
                    theme,
                    icon: Icons.thermostat,
                    label: "Temperature",
                    value: "${temperature.toStringAsFixed(1)}°C",
                    screenWidth: screenWidth,
                    statusColor:
                        temperature < 30 ? Colors.green : Colors.orange,
                    tooltip: "Current water temperature",
                  ),
                ),
                SizedBox(width: screenWidth * 0.02),
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
            ),
            SizedBox(height: screenHeight * 0.02),
            Divider(
              color: theme.colorScheme.primary.withOpacity(0.2),
              thickness: 1,
            ),
            SizedBox(height: screenHeight * 0.02),
            Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildStatItem(
                    theme,
                    icon: Icons.storage,
                    label: "Tank Level",
                    value:
                        "$tankLevelStatus (${tankLevel.toStringAsFixed(0)}%)",
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
            ),
            SizedBox(height: screenHeight * 0.02),
            Divider(
              color: theme.colorScheme.primary.withOpacity(0.2),
              thickness: 1,
            ),
            SizedBox(height: screenHeight * 0.02),
            Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildStatItem(
                    theme,
                    icon: Icons.speed,
                    label: "Flow Rate",
                    value:
                        "${widget.deviceData?.flowRate.toStringAsFixed(1) ?? '0.0'} L/min",
                    screenWidth: screenWidth,
                    statusColor: (widget.deviceData?.flowRate ?? 0.0) > 1.0
                        ? Colors.green
                        : Colors.orange,
                    tooltip: "Rate of water dispensing",
                  ),
                ),
              ],
            ),
          ],
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
          height: screenHeight * 0.14, // Slightly increased to avoid clipping
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
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: theme.colorScheme.primary.withOpacity(0.2),
          width: 1,
        ),
      ),
      color: color.withOpacity(0.1),
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: screenWidth * 0.015, // Further reduced from 0.02
          vertical: screenWidth * 0.015,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: color,
              size: screenWidth * 0.05, // Further reduced from 0.06
            ),
            SizedBox(width: screenWidth * 0.015), // Further reduced from 0.02
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                      fontSize:
                          screenWidth * 0.028, // Slightly reduced from 0.03
                      overflow:
                          TextOverflow.ellipsis, // Added to handle long text
                    ),
                    maxLines: 1,
                  ),
                  SizedBox(height: screenWidth * 0.005),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: color,
                      fontSize:
                          screenWidth * 0.022, // Slightly reduced from 0.025
                      overflow:
                          TextOverflow.ellipsis, // Added to handle long text
                    ),
                    maxLines: 1,
                  ),
                ],
              ),
            ),
          ],
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

    final currentDate = DateTime.now();
    final expiryDate = subscription != null
        ? DateTime.parse(subscription!.subscriptionExpiryDate)
        : DateTime(2022, 9, 25);
    final formattedExpiryDate = _formatDate(expiryDate);
    const changePlanMessage = "Get Unlimited water";

    final bool isExpired = currentDate.isAfter(expiryDate);

    Widget buildCard({
      required IconData icon,
      required String title,
      required String subtitle,
      required String buttonText,
      required VoidCallback? onPressed,
      String? tagText,
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
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Flexible(
                                child: Text(
                                  title,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: theme.colorScheme.primary,
                                    fontSize: screenWidth * 0.035,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  maxLines: 1,
                                ),
                              ),
                              if (tagText != null)
                                Container(
                                  constraints: BoxConstraints(
                                    maxWidth: screenWidth * 0.25,
                                  ),
                                  padding: EdgeInsets.symmetric(
                                    horizontal: screenWidth * 0.01,
                                    vertical: screenWidth * 0.005,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.orange,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    tagText,
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: screenWidth * 0.025,
                                      fontWeight: FontWeight.bold,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    maxLines: 1,
                                  ),
                                ),
                            ],
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

    return isSmallScreen
        ? Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              buildCard(
                icon: Icons.monetization_on_outlined,
                title: "Recharge Plan",
                subtitle: "Expires on: $formattedExpiryDate",
                buttonText: "Recharge",
                onPressed: isExpired
                    ? () {
                        Get.to(
                          () => WebViewScreen(
                            controller: webViewController,
                          ),
                          transition: Transition.rightToLeft,
                          duration: const Duration(milliseconds: 300),
                        );
                      }
                    : null,
              ),
              SizedBox(height: screenHeight * 0.015),
              buildCard(
                icon: Icons.sync_alt,
                title: "Change Plan",
                subtitle: changePlanMessage,
                buttonText: "Change Plan",
                onPressed: null, // Disabled as per "Coming Soon"
                tagText: "Coming Soon",
              ),
            ],
          )
        : Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: buildCard(
                  icon: Icons.monetization_on_outlined,
                  title: "Recharge Plan",
                  subtitle: "Expires on: $formattedExpiryDate",
                  buttonText: "Recharge",
                  onPressed: isExpired
                      ? () {
                          Get.to(
                            () => WebViewScreen(
                              controller: webViewController,
                            ),
                            transition: Transition.rightToLeft,
                            duration: const Duration(milliseconds: 300),
                          );
                        }
                      : null,
                ),
              ),
              SizedBox(width: screenWidth * 0.03),
              Expanded(
                child: buildCard(
                  icon: Icons.sync_alt,
                  title: "Change Plan",
                  subtitle: changePlanMessage,
                  buttonText: "Change Plan",
                  onPressed: null, // Disabled as per "Coming Soon"
                  tagText: "Coming Soon",
                ),
              ),
            ],
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
