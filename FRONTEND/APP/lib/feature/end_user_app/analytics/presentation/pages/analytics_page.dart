import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/models/telemetry_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/presentation/controllers/telemetry_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/presentation/controllers/active_subscription_controller.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/error/error_display_widget.dart';
import 'package:material_design_icons_flutter/material_design_icons_flutter.dart';

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:get/get.dart';



class AnalyticsPage extends StatefulWidget {
  const AnalyticsPage({super.key});

  @override
  _AnalyticsPageState createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  final TelemetryController telemetryController =
      Get.put(TelemetryController(), permanent: true);
  final ActiveSubscriptionController activeSubscriptionController =
      Get.put(ActiveSubscriptionController(), permanent: true);
  final SessionController sessionController = Get.find<SessionController>();

  String? selectedDeviceId;
  String selectedPeriod = 'monthly'; // Default to weekly
  Timer? _telemetryTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      activeSubscriptionController.fetchActiveSubscriptions(
        sessionController.userId.value,
        sessionController.emailId.value,
      );
    });
  }

  @override
  void dispose() {
    _telemetryTimer?.cancel();
    super.dispose();
  }

  void _startTelemetryTimer() {
    _telemetryTimer?.cancel(); // Cancel existing timer if any
    _telemetryTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (selectedDeviceId != null && mounted) {
        telemetryController.fetchTelemetry(selectedDeviceId!, isInitialLoad: false);
      }
    });
  }

  void _stopTelemetryTimer() {
    _telemetryTimer?.cancel();
    _telemetryTimer = null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return SafeArea(
      child: Scaffold(
        body: Obx(() {
          // First check if subscriptions are loading
          if (activeSubscriptionController.isLoading.value) {
            return _buildShimmerLoading(theme, screenWidth, screenHeight);
          }

          if (activeSubscriptionController.errorMessage.isNotEmpty) {
            return Center(
              child: ErrorDisplayWidget(
                errorMessage: activeSubscriptionController.errorMessage.value,
                onRetry: () {
                  activeSubscriptionController.fetchActiveSubscriptions(
                    sessionController.userId.value,
                    sessionController.emailId.value,
                  );
                },
              ),
            );
          }

          final subscriptions = activeSubscriptionController.subscriptions;
          if (subscriptions.isEmpty) {
            return Center(
              child: DisplayWidget(
                errorMessage: "No analytics data available yet",
                assetPath: 'assets/icons/analysis_not_found.png',
              ),
            );
          }

          final smartSubscriptions = subscriptions
              .where((subscription) => subscription.modelType?.toLowerCase() == 'smart')
              .toList();

          if (smartSubscriptions.isEmpty) {
            return Center(
              child: DisplayWidget(
                errorMessage: "Smart device analytics not available.",
                assetPath: 'assets/icons/analysis_not_found.png',
              ),
            );
          }

          final deviceIds = smartSubscriptions
              .map((subscription) => subscription.wpDeviceId)
              .where((id) => id.isNotEmpty)
              .toSet()
              .toList();

          if (deviceIds.isEmpty) {
            return Center(
              child: DisplayWidget(
                errorMessage: "No device IDs found.",
                assetPath: 'assets/icons/analysis_not_found.png',
              ),
            );
          }

          if (selectedDeviceId == null) {
            selectedDeviceId = deviceIds.first;
            telemetryController.fetchTelemetry(selectedDeviceId!, isInitialLoad: true);
            _startTelemetryTimer();
          }

          if (selectedDeviceId != null && deviceIds.contains(selectedDeviceId)) {
            deviceIds.remove(selectedDeviceId);
            deviceIds.insert(0, selectedDeviceId!);
          }

          // Now check telemetry loading
          if (telemetryController.isLoading.value) {
            return _buildShimmerLoading(theme, screenWidth, screenHeight);
          }

          if (telemetryController.errorMessage.value.isNotEmpty &&
              telemetryController.errorMessage.value !=
                  '🔍 Resource not found. The requested information is unavailable.') {
            return Center(
                child: ErrorDisplayWidget(
              errorMessage: telemetryController.errorMessage.value,
              onRetry: () {
                telemetryController.fetchTelemetry(selectedDeviceId!, isInitialLoad: true);
              },
            ));
          }

          final telemetryData = telemetryController.telemetryResponse.value;

          return SingleChildScrollView(
            padding: EdgeInsets.all(screenWidth * 0.05),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(screenWidth * 0.06),
                  margin: EdgeInsets.only(bottom: screenHeight * 0.03),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue.shade700, Colors.blue.shade400],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.blue.shade200.withOpacity(0.5),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Text(
                              'Water Usage Analytics',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: screenWidth * 0.06,
                              ),
                            ),
                          ),
                          IconButton(
                            icon: Icon(
                              Icons.help_outline,
                              color: Colors.white,
                              size: screenWidth * 0.07,
                            ),
                            onPressed: () =>
                                _showAnalyticsInfoBottomSheet(context, theme),
                          ),
                        ],
                      ),
                      SizedBox(height: screenHeight * 0.01),
                      Text(
                        'Track your water consumption for device $selectedDeviceId.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white70,
                          height: 1.3,
                          fontSize: screenWidth * 0.035,
                        ),
                      ),
                    ],
                  ),
                ),
                // Device Selection Cards
                Container(
                  height: screenHeight * 0.06,
                  margin: EdgeInsets.only(bottom: screenHeight * 0.02),
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: deviceIds.length,
                    itemBuilder: (context, index) {
                      final deviceId = deviceIds[index];
                      final isSelected = selectedDeviceId == deviceId;
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            selectedDeviceId = deviceId;
                          });
                          telemetryController.fetchTelemetry(deviceId, isInitialLoad: true);
                          _startTelemetryTimer(); // Restart timer for new device
                        },
                        child: Container(
                          width: screenWidth * 0.3,
                          margin: EdgeInsets.only(right: screenWidth * 0.02),
                          padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.02, vertical: screenHeight * 0.005),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.blue.shade600 : Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: isSelected ? Colors.blue.shade600 : Colors.grey.shade400),
                            boxShadow: isSelected ? [
                              BoxShadow(
                                color: Colors.blue.shade200.withOpacity(0.3),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ] : null,
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.devices,
                                color: isSelected ? Colors.white : Colors.blue.shade600,
                                size: screenWidth * 0.04,
                              ),
                              SizedBox(height: screenHeight * 0.003),
                              Text(
                                deviceId,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : Colors.black87,
                                  fontSize: screenWidth * 0.025,
                                  fontWeight: FontWeight.w500,
                                ),
                                textAlign: TextAlign.center,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(vertical: screenHeight * 0.015),
                  child: Text(
                    'Your Water Usage Analytics',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade800,
                      fontSize: screenWidth * 0.05,
                    ),
                  ),
                ),
                Builder(
                  builder: (context) {
                    final modelName = telemetryData?.data?.modelName;
                    if (modelName != null && modelName.isNotEmpty) {
                      return Padding(
                        padding: EdgeInsets.only(bottom: screenHeight * 0.01),
                        child: Text(
                          'Model: $modelName',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.grey.shade600,
                            fontSize: screenWidth * 0.035,
                            fontWeight: FontWeight.w200,
                          ),
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                _buildTelemetryDashboardHeader(
                    theme, telemetryData, screenWidth, screenHeight),
                SizedBox(height: screenHeight * 0.04),
                _buildPeriodChart(telemetryData, screenWidth, screenHeight),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildShimmerLoading(
      ThemeData theme, double screenWidth, double screenHeight) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Container(
          padding: EdgeInsets.all(screenWidth * 0.08),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Water drop animation container
              Container(
                width: screenWidth * 0.25,
                height: screenWidth * 0.25,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Colors.blue.shade300, Colors.blue.shade600],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.shade200.withOpacity(0.3),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Icon(
                  Icons.water_drop,
                  color: Colors.white,
                  size: screenWidth * 0.12,
                ),
              ),
              SizedBox(height: screenHeight * 0.03),
              // Loading text
              Text(
                'Loading Analytics',
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: Colors.blue.shade800,
                  fontWeight: FontWeight.bold,
                  fontSize: screenWidth * 0.055,
                ),
              ),
              SizedBox(height: screenHeight * 0.015),
              // Subtitle
              Text(
                'Fetching your water usage data...',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade600,
                  fontSize: screenWidth * 0.04,
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: screenHeight * 0.04),
              // Progress indicator
              Container(
                width: screenWidth * 0.6,
                child: LinearProgressIndicator(
                  backgroundColor: Colors.blue.shade100,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.blue.shade600),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              SizedBox(height: screenHeight * 0.03),
              // Additional info
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: screenWidth * 0.04,
                  vertical: screenHeight * 0.015,
                ),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Colors.blue.shade600,
                      size: screenWidth * 0.045,
                    ),
                    SizedBox(width: screenWidth * 0.02),
                    Text(
                      'Please wait...',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.blue.shade700,
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

  Widget _buildTelemetryDashboardHeader(ThemeData theme, TelemetryResponse? telemetryData,
      double screenWidth, double screenHeight) {
    // If no telemetry data, return empty container or placeholder
    if (telemetryData == null || telemetryData.status != 'Success' || telemetryData.data == null) {
      return SizedBox.shrink(); // Hide the dashboard when no data
    }

    final data = telemetryData.data!;

    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: screenWidth * 0.01,
        vertical: screenHeight * 0.015,
      ),
      child: Column(
        children: [
          // Tank Level Status Bar
          _buildTankLevelBar(data, screenWidth, screenHeight),
          SizedBox(height: screenHeight * 0.02),
          
          // Water Usage Progress Bar
          _buildWaterUsageProgress(data, screenWidth, screenHeight),
          SizedBox(height: screenHeight * 0.02),
          
          // Telemetry Data Box (Home Page Style)
          Container(
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
                  // Row 1: TDS Level
                  Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      Expanded(
                        child: _buildStatItem(
                          theme,
                          icon: Icons.science,
                          label: "TDS Level",
                          value: "In: ${data.tdsIn} | Out: ${data.tdsOut} ppm",
                          screenWidth: screenWidth,
                          statusColor: data.tdsOut < 50
                              ? Colors.blue
                              : data.tdsOut < 150
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
                  
                  // Row 2: Pressure & Temperature
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: _buildStatItem(
                          theme,
                          icon: MdiIcons.gauge,
                          label: "Pressure",
                          value: "${data.pressure} bar",
                          screenWidth: screenWidth,
                          statusColor: Colors.deepOrange,
                          tooltip: "Water pressure",
                        ),
                      ),
                      SizedBox(width: screenWidth * 0.02),
                      Expanded(
                        child: _buildStatItem(
                          theme,
                          icon: Icons.thermostat,
                          label: "Temperature",
                          value: "${data.temperature} °C",
                          screenWidth: screenWidth,
                          statusColor: Colors.red,
                          tooltip: "Water temperature",
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
                  
                  // Row 3: Valve Status & Power Status
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: _buildStatItem(
                          theme,
                          icon: MdiIcons.valve,
                          label: "Valve Status",
                          value: data.valveStatus,
                          screenWidth: screenWidth,
                          statusColor: Colors.indigo,
                          tooltip: "Current valve state",
                        ),
                      ),
                      SizedBox(width: screenWidth * 0.02),
                      Expanded(
                        child: _buildStatItem(
                          theme,
                          icon: Icons.power,
                          label: "Power Status",
                          value: data.powerStatus,
                          screenWidth: screenWidth,
                          statusColor: Colors.amber[700],
                          tooltip: "Device power state",
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
                  
                  // Row 4: Voltage & Current
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: _buildStatItem(
                          theme,
                          icon: Icons.electric_bolt,
                          label: "Voltage",
                          value: "${data.voltage.toStringAsFixed(1)} V",
                          screenWidth: screenWidth,
                          statusColor: Colors.yellow[700],
                          tooltip: "Supply voltage",
                        ),
                      ),
                      SizedBox(width: screenWidth * 0.02),
                      Expanded(
                        child: _buildStatItem(
                          theme,
                          icon: MdiIcons.currentAc,
                          label: "Current",
                          value: "${data.current.toStringAsFixed(2)} A",
                          screenWidth: screenWidth,
                          statusColor: Colors.teal,
                          tooltip: "Current consumption",
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
                  
                  // Row 5: Filter Life & Leak Status
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: _buildStatItem(
                          theme,
                          icon: Icons.filter_alt,
                          label: "Filter Life Used",
                          value: "${(data.filterLifeUsed * 100).toStringAsFixed(1)}%",
                          screenWidth: screenWidth,
                          statusColor: Colors.pink,
                          tooltip: "Filter replacement indicator",
                        ),
                      ),
                      SizedBox(width: screenWidth * 0.02),
                      Expanded(
                        child: _buildStatItem(
                          theme,
                          icon: data.leakDetected ? Icons.warning : Icons.check_circle,
                          label: "Leak Status",
                          value: data.leakDetected ? "Detected" : "No Leak",
                          screenWidth: screenWidth,
                          statusColor: data.leakDetected ? Colors.red : Colors.lightGreen,
                          tooltip: "Leak detection status",
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(ThemeData theme,
      {required IconData icon,
        required String label,
        required String value,
        required double screenWidth,
        Color? statusColor,
        String? tooltip}) {
    final gradientColors = statusColor != null
        ? [statusColor.withOpacity(0.2), statusColor.withOpacity(0.4)]
        : [
      theme.colorScheme.primary.withOpacity(0.2),
      theme.colorScheme.primary.withOpacity(0.4)
    ];

    return Tooltip(
      message: tooltip ?? '',
      child: Row(
        children: [
          Container(
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
                    overflow: TextOverflow.ellipsis,
                  ),
                  maxLines: 1,
                ),
                SizedBox(height: screenWidth * 0.005),
                Text(
                  value,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: statusColor ?? theme.colorScheme.primary,
                    fontSize: screenWidth * 0.028,
                    overflow: TextOverflow.ellipsis,
                  ),
                  maxLines: 1,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Tank Level Status Bar Widget - Simplified
  Widget _buildTankLevelBar(dynamic data, double screenWidth, double screenHeight) {
    final tankLevel = data.tankLevel.toString().toUpperCase();
    Color levelColor;
    double fillPercentage;
    
    // Determine color and fill based on tank level
    switch (tankLevel) {
      case 'FULL':
        levelColor = Colors.green;
        fillPercentage = 1.0;
        break;
      case 'HALF':
        levelColor = Colors.orange;
        fillPercentage = 0.5;
        break;
      case 'LOW':
        levelColor = Colors.red;
        fillPercentage = 0.25;
        break;
      case 'EMPTY':
        levelColor = Colors.red.shade900;
        fillPercentage = 0.0;
        break;
      default:
        levelColor = Colors.grey;
        fillPercentage = 0.0;
    }

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: screenWidth * 0.04,
        vertical: screenHeight * 0.025,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title and Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    MdiIcons.barrel,
                    size: screenWidth * 0.04,
                    color: Colors.blue.shade600,
                  ),
                  SizedBox(width: screenWidth * 0.02),
                  Text(
                    'Tank Level',
                    style: TextStyle(
                      fontSize: screenWidth * 0.032,
                      color: Colors.blue.shade700,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Text(
                tankLevel,
                style: TextStyle(
                  fontSize: screenWidth * 0.032,
                  fontWeight: FontWeight.bold,
                  color: levelColor,
                ),
              ),
            ],
          ),
          SizedBox(height: screenHeight * 0.012),
          
          // Simple progress bar aligned to left
          Container(
            height: screenHeight * 0.008,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Align(
              alignment: Alignment.centerLeft,
              child: FractionallySizedBox(
                widthFactor: fillPercentage,
                child: Container(
                  decoration: BoxDecoration(
                    color: levelColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Water Usage Progress Bar Widget - Simplified
  Widget _buildWaterUsageProgress(dynamic data, double screenWidth, double screenHeight) {
    final double waterUsed = data.totalWaterUsed.toDouble();
    final double waterLimit = data.totalWaterLimit.toDouble();
    final double waterRemaining = waterLimit - waterUsed;
    final double usagePercentage = waterLimit > 0 ? (waterUsed / waterLimit).clamp(0.0, 1.0) : 0.0;
    
    // Determine color based on usage percentage
    Color progressColor;
    if (usagePercentage < 0.5) {
      progressColor = Colors.green;
    } else if (usagePercentage < 0.8) {
      progressColor = Colors.orange;
    } else {
      progressColor = Colors.red;
    }

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: screenWidth * 0.04,
        vertical: screenHeight * 0.015,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title and Percentage
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.water_drop,
                    size: screenWidth * 0.04,
                    color: Colors.blue.shade600,
                  ),
                  SizedBox(width: screenWidth * 0.02),
                  Text(
                    'Water Usage',
                    style: TextStyle(
                      fontSize: screenWidth * 0.032,
                      color: Colors.blue.shade700,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Text(
                '${(usagePercentage * 100).toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: screenWidth * 0.032,
                  fontWeight: FontWeight.bold,
                  color: progressColor,
                ),
              ),
            ],
          ),
          SizedBox(height: screenHeight * 0.012),
          
          // Usage Details - Simple 3 column layout
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Used
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Used',
                      style: TextStyle(
                        fontSize: screenWidth * 0.026,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    SizedBox(height: screenHeight * 0.003),
                    Text(
                      '${waterUsed.toStringAsFixed(2)} L',
                      style: TextStyle(
                        fontSize: screenWidth * 0.03,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Limit
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      'Limit',
                      style: TextStyle(
                        fontSize: screenWidth * 0.026,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    SizedBox(height: screenHeight * 0.003),
                    Text(
                      '${waterLimit.toStringAsFixed(0)} L',
                      style: TextStyle(
                        fontSize: screenWidth * 0.03,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Remaining
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Remaining',
                      style: TextStyle(
                        fontSize: screenWidth * 0.026,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    SizedBox(height: screenHeight * 0.003),
                    Text(
                      '${waterRemaining.toStringAsFixed(2)} L',
                      style: TextStyle(
                        fontSize: screenWidth * 0.03,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodChart(TelemetryResponse? telemetryData, double screenWidth, double screenHeight) {
    // Handle case where no telemetry data is available
    if (telemetryData == null || telemetryData.status != 'Success' || telemetryData.data == null) {
      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade300),
        ),
        padding: EdgeInsets.all(screenWidth * 0.04),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '📊 Water Usage Chart',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: screenWidth * 0.045,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: screenHeight * 0.02),
            SizedBox(
              height: screenHeight * 0.3,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.bar_chart,
                      size: screenWidth * 0.15,
                      color: Colors.grey.shade400,
                    ),
                    SizedBox(height: screenHeight * 0.01),
                    Text(
                      'No telemetry data available for this device',
                      style: TextStyle(
                        fontSize: screenWidth * 0.04,
                        color: Colors.grey,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }
    // Get data based on selected period
    List<Map<String, dynamic>> data;
    String title;
    Color color;
    String chartType; // Different chart types for each period

    switch (selectedPeriod) {
      case 'daily':
        data = telemetryData.data!.waterUsage.daily.records
            .map((record) => {'date': record.date, 'total': record.totalWaterUsed})
            .toList();
        title = "📅 Daily Usage";
        color = Colors.blue.shade600;
        chartType = 'bar'; // Bar chart for daily
        break;
      case 'weekly':
        data = telemetryData.data!.waterUsage.weekly.records
            .map((record) => {'date': record.date, 'total': record.totalWaterUsed})
            .toList();
        title = "📈 Weekly Usage";
        color = Colors.green.shade600;
        chartType = 'line_curved'; // Line chart for weekly
        break;
      case 'monthly':
        data = telemetryData.data!.waterUsage.monthly.records
            .map((record) => {'date': record.date, 'total': record.totalWaterUsed})
            .toList();
        title = "📊 Monthly Usage";
        color = Colors.orange.shade600;
        chartType = 'line_area'; // Area chart for monthly
        break;
      case 'yearly':
        data = telemetryData.data!.waterUsage.yearly.records
            .map((record) => {'date': record.date, 'total': record.totalWaterUsed})
            .toList();
        title = "📈 Yearly Usage";
        color = Colors.purple.shade600;
        chartType = 'line_gradient'; // Line chart with gradient for yearly
        break;
      default:
        data = [];
        title = "Usage Data";
        color = Colors.blue.shade600;
        chartType = 'line_curved';
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade300),
      ),
      padding: EdgeInsets.all(screenWidth * 0.04),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: screenWidth * 0.045,
                  color: Colors.black87,
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.02),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
             boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 2,
                      offset: Offset(0, 1),
                    ),
                  ],
                ),
                child: DropdownButton<String>(
                  value: selectedPeriod,
                  isDense: true,
                  underline: SizedBox(),
                  dropdownColor: Colors.white,
                  style: TextStyle(
                    color: Colors.black87,
                    fontSize: screenWidth * 0.035,
                  ),
                  items: [
                    DropdownMenuItem(
                      value: 'daily',
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: screenHeight * 0.005),
                        child: Text(
                          'Daily',
                          style: TextStyle(
                            color: Colors.black87,
                            fontSize: screenWidth * 0.035,
                          ),
                        ),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'weekly',
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: screenHeight * 0.005),
                        child: Text(
                          'Weekly',
                          style: TextStyle(
                            color: Colors.black87,
                            fontSize: screenWidth * 0.035,
                          ),
                        ),
                      ),
                    ),
                         DropdownMenuItem(
                      value: 'monthly',
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: screenHeight * 0.005),
                        child: Text(
                          'Monthly',
                          style: TextStyle(
                            color: Colors.black87,
                            fontSize: screenWidth * 0.035,
                          ),
                        ),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'yearly',
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: screenHeight * 0.005),
                        child: Text(
                          'Yearly',
                          style: TextStyle(
                            color: Colors.black87,
                            fontSize: screenWidth * 0.035,
                          ),
                        ),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        selectedPeriod = value;
                      });
                    }
                  },
                ),
              ),
            ],
          ),
          SizedBox(height: screenHeight * 0.02),
          if (data.isEmpty)
            SizedBox(
              height: screenHeight * 0.28,
              child: Center(
                child: Text(
                  'No ${selectedPeriod} data available for this device',
                  style: TextStyle(
                    fontSize: screenWidth * 0.04,
                    color: Colors.grey,
                  ),
                ),
              ),
            )
          else
            SizedBox(
              height: screenHeight * 0.28,
              child: chartType == 'bar' 
                  ? _buildBarChart(data, "date", "total", color, screenWidth)
                  : _buildCustomLineChart(data, "date", "total", color, screenWidth, chartType),
            ),
        ],
      ),
    );
  }

  Widget _buildChartCard({
    required String title,
    required List data,
    required String labelKey,
    required String valueKey,
    required bool isBarChart,
    required Color color,
    required double screenWidth,
    required double screenHeight,
  }) {
    if (data.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade300),
        ),
        padding: EdgeInsets.all(screenWidth * 0.04),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: screenWidth * 0.045,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: screenHeight * 0.02),
            SizedBox(
              height: screenHeight * 0.3,
              child: Center(
                child: Text(
                  'No data available',
                  style: TextStyle(
                      fontSize: screenWidth * 0.04, color: Colors.grey),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade300),
      ),
      padding: EdgeInsets.all(screenWidth * 0.04),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: screenWidth * 0.045,
              color: Colors.black87,
            ),
          ),
          SizedBox(height: screenHeight * 0.02),
          SizedBox(
            height: screenHeight * 0.3,
            child: isBarChart
                ? _buildBarChart(data, labelKey, valueKey, color, screenWidth)
                : _buildLineChart(data, labelKey, valueKey, color, screenWidth),
          ),
        ],
      ),
    );
  }

  Widget _buildBarChart(List data, String labelKey, String valueKey,
      Color color, double screenWidth) {
    return BarChart(
      BarChartData(
        barGroups: data.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          double value = (item[valueKey] as num?)?.toDouble() ?? 0.0;

          return BarChartGroupData(
            x: index,
            barRods: [
              BarChartRodData(
                toY: value,
                gradient: LinearGradient(
                  colors: [color.withOpacity(0.7), color],
                ),
                width: screenWidth * 0.035,
                borderRadius: BorderRadius.circular(8),
              ),
            ],
          );
        }).toList(),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: screenWidth * 0.07,
              getTitlesWidget: (value, _) {
                int index = value.toInt();
                if (index < data.length) {
                  final item = data[index];
                  String label = (item[labelKey] as String?)?.split('-')[2] ?? '';
                  return Text(
                    label,
                    style: TextStyle(fontSize: screenWidth * 0.025),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: screenWidth * 0.1,
              interval: null,
              getTitlesWidget: (value, _) => Text(
                value.toInt().toString(),
                style: TextStyle(fontSize: screenWidth * 0.025),
              ),
            ),
          ),
          topTitles: const AxisTitles(),
          rightTitles: const AxisTitles(),
        ),
        gridData: FlGridData(
          show: true, 
          drawVerticalLine: false,
          horizontalInterval: null,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: Colors.grey.withOpacity(0.2),
              strokeWidth: 1,
            );
          },
        ),
      ),
    );
  }

  Widget _buildLineChart(List data, String labelKey, String valueKey,
      Color color, double screenWidth, {bool showArea = true}) {
    return LineChart(
      LineChartData(
        minY: 0,
        lineBarsData: [
          LineChartBarData(
            isCurved: true,
            barWidth: screenWidth * 0.01,
            color: color,
            dotData: FlDotData(show: true),
            belowBarData: BarAreaData(
              show: showArea,
              gradient: LinearGradient(
                colors: [color.withOpacity(0.3), Colors.transparent],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            spots: data.asMap().entries.map((entry) {
              int index = entry.key;
              final item = entry.value;
              double value = (item[valueKey] as num?)?.toDouble() ?? 0.0;

              return FlSpot(index.toDouble(), value);
            }).toList(),
          ),
        ],
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: screenWidth * 0.07,
              getTitlesWidget: (value, _) {
                int index = value.toInt();
                if (index < data.length) {
                  final item = data[index];
                  String label = (item[labelKey] as String?)?.split('-')[2] ?? '';
                  return Text(
                    label,
                    style: TextStyle(fontSize: screenWidth * 0.025),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: screenWidth * 0.1,
              interval: null,
              getTitlesWidget: (value, _) => Text(
                value.toInt().toString(),
                style: TextStyle(fontSize: screenWidth * 0.025),
              ),
            ),
          ),
          topTitles: const AxisTitles(),
          rightTitles: const AxisTitles(),
        ),
        borderData: FlBorderData(show: false),
        gridData: FlGridData(
          show: true, 
          drawVerticalLine: false,
          horizontalInterval: null,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: Colors.grey.withOpacity(0.2),
              strokeWidth: 1,
            );
          },
        ),
      ),
    );
  }

  Widget _buildCustomLineChart(List data, String labelKey, String valueKey,
      Color color, double screenWidth, String chartType) {
    // Common spots data
    final spots = data.asMap().entries.map((entry) {
      int index = entry.key;
      final item = entry.value;
      double value = (item[valueKey] as num?)?.toDouble() ?? 0.0;
      return FlSpot(index.toDouble(), value);
    }).toList();

    // Different configurations based on chart type
    LineChartBarData lineBarData;
    switch (chartType) {
      case 'line_curved':
        lineBarData = LineChartBarData(
          isCurved: true,
          barWidth: screenWidth * 0.008,
          color: color,
          dotData: FlDotData(
            show: true,
            getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
              radius: screenWidth * 0.015,
              color: color,
              strokeWidth: screenWidth * 0.003,
              strokeColor: Colors.white,
            ),
          ),
          belowBarData: BarAreaData(show: false),
          spots: spots,
        );
        break;
      case 'line_area':
        lineBarData = LineChartBarData(
          isCurved: true,
          barWidth: screenWidth * 0.008,
          color: color,
          dotData: FlDotData(show: false),
          belowBarData: BarAreaData(
            show: true,
            gradient: LinearGradient(
              colors: [color.withOpacity(0.4), color.withOpacity(0.1), Colors.transparent],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          spots: spots,
        );
        break;
      case 'line_stepped':
        lineBarData = LineChartBarData(
          isCurved: false,
          barWidth: screenWidth * 0.008,
          color: color,
          dotData: FlDotData(
            show: true,
            getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
              radius: screenWidth * 0.012,
              color: Colors.white,
              strokeWidth: screenWidth * 0.003,
              strokeColor: color,
            ),
          ),
          belowBarData: BarAreaData(show: false),
          spots: spots,
        );
        break;
      case 'line_gradient':
        lineBarData = LineChartBarData(
          isCurved: true,
          barWidth: screenWidth * 0.01,
          gradient: LinearGradient(
            colors: [color.withOpacity(0.8), color, color.withOpacity(0.6)],
          ),
          dotData: FlDotData(
            show: true,
            getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
              radius: screenWidth * 0.018,
              color: color,
              strokeWidth: 0,
            ),
          ),
          belowBarData: BarAreaData(show: false),
          spots: spots,
        );
        break;
      default:
        lineBarData = LineChartBarData(
          isCurved: true,
          barWidth: screenWidth * 0.008,
          color: color,
          dotData: FlDotData(show: true),
          belowBarData: BarAreaData(show: false),
          spots: spots,
        );
    }

    return LineChart(
      LineChartData(
        minY: 0,
        lineBarsData: [lineBarData],
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: screenWidth * 0.07,
              getTitlesWidget: (value, _) {
                int index = value.toInt();
                if (index < data.length) {
                  final item = data[index];
                  String label = (item[labelKey] as String?)?.split('-')[2] ?? '';
                  return Text(
                    label,
                    style: TextStyle(fontSize: screenWidth * 0.025),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: screenWidth * 0.1,
              interval: null,
              getTitlesWidget: (value, _) => Text(
                value.toInt().toString(),
                style: TextStyle(fontSize: screenWidth * 0.025),
              ),
            ),
          ),
          topTitles: const AxisTitles(),
          rightTitles: const AxisTitles(),
        ),
        borderData: FlBorderData(show: false),
        gridData: FlGridData(
          show: true, 
          drawVerticalLine: false,
          horizontalInterval: null,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: Colors.grey.withOpacity(0.2),
              strokeWidth: 1,
            );
          },
        ),
      ),
    );
  }

  void _showAnalyticsInfoBottomSheet(BuildContext context, ThemeData theme) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.65,
          minChildSize: 0.35,
          maxChildSize: 0.95,
          builder: (BuildContext context, ScrollController scrollController) {
            return Container(
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(
                    color: theme.colorScheme.primary.withOpacity(0.2),
                    blurRadius: 16,
                    spreadRadius: 2,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: EdgeInsets.symmetric(
                          vertical: screenHeight * 0.02,
                          horizontal: screenWidth * 0.06,
                        ),
                        child: Column(
                          children: [
                            Center(
                              child: Container(
                                width: screenWidth * 0.2,
                                height: screenHeight * 0.008,
                                margin: EdgeInsets.symmetric(
                                    vertical: screenHeight * 0.01),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      theme.colorScheme.primary
                                          .withOpacity(0.5),
                                      theme.colorScheme.primary,
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.15),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            SizedBox(height: screenHeight * 0.025),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Analytics Help',
                                  style:
                                      theme.textTheme.headlineSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: theme.textTheme.bodyLarge?.color,
                                    fontSize: screenWidth * 0.06,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: SingleChildScrollView(
                          controller: scrollController,
                          padding: EdgeInsets.symmetric(
                            horizontal: screenWidth * 0.06,
                            vertical: screenHeight * 0.012,
                          ),
                          child: AnimatedOpacity(
                            opacity: 1.0,
                            duration: const Duration(milliseconds: 300),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildInfoSection(
                                  theme,
                                  'What is Water Usage Analytics?',
                                  'The analytics page tracks your water consumption from AquaPulse stations. It shows daily, weekly, and monthly usage, along with environmental impact metrics like plastic bottles saved and CO₂ emissions reduced.',
                                  icon: Icons.info_outline,
                                  screenWidth: screenWidth,
                                ),
                                _buildInfoSection(
                                  theme,
                                  'Understanding the Charts',
                                  '• Daily Usage: Bar chart showing water consumed each day (e.g., 30 L on 27/05/2025).\n'
                                      '• Weekly Usage: Line chart displaying total water usage per week (e.g., 190 L for Week 22).\n'
                                      '• Monthly Usage: Bar chart summarizing monthly consumption (e.g., 200 L for May 2025).',
                                  icon: Icons.bar_chart,
                                  screenWidth: screenWidth,
                                ),
                                _buildInfoSection(
                                  theme,
                                  'Dashboard Metrics',
                                  '• Water Used: Total liters consumed over time.\n'
                                      '• Bottles Saved: Number of plastic bottles avoided by using AquaPulse.\n'
                                      '• CO₂ Saved: Kilograms of CO₂ emissions reduced.\n'
                                      '• Pull down to refresh data or contact support for issues.',
                                  icon: Icons.dashboard,
                                  screenWidth: screenWidth,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildInfoSection(
    ThemeData theme,
    String title,
    String content, {
    IconData? icon,
    required double screenWidth,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: screenWidth * 0.04),
      child: Container(
        padding: EdgeInsets.all(screenWidth * 0.04),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.5),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.primary.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (icon != null)
              Padding(
                padding: EdgeInsets.only(right: screenWidth * 0.03),
                child: Icon(
                  icon,
                  color: theme.colorScheme.primary,
                  size: screenWidth * 0.07,
                ),
              ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.textTheme.bodyLarge?.color,
                      fontSize: screenWidth * 0.045,
                    ),
                  ),
                  SizedBox(height: screenWidth * 0.02),
                  Text(
                    content,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color:
                          theme.textTheme.bodyMedium?.color?.withOpacity(0.85),
                      height: 1.6,
                      fontSize: screenWidth * 0.035,
                    ),
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
