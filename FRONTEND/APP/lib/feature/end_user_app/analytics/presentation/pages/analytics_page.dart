import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/models/telemetry_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/presentation/controllers/telemetry_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/presentation/controllers/active_subscription_controller.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/utils/widgets/error/error_display_widget.dart';
import 'package:material_design_icons_flutter/material_design_icons_flutter.dart';

import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';

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
  String selectedPeriod = 'weekly'; // Default to weekly

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

          // Get unique device ids
          final deviceIds = subscriptions.map((sub) => sub.wpDeviceId).where((id) => id.isNotEmpty).toSet().toList();

          if (deviceIds.isEmpty) {
            return Center(
              child: DisplayWidget(
                errorMessage: "No device IDs found.",
                assetPath: 'assets/icons/analysis_not_found.png',
              ),
            );
          }

          // Set default selected device if not set
          if (selectedDeviceId == null) {
            selectedDeviceId = deviceIds.first;
            telemetryController.fetchTelemetry(selectedDeviceId!);
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
                telemetryController.fetchTelemetry(selectedDeviceId!);
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
                // Device Selection Dropdown
                Container(
                  padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.04, vertical: screenWidth * 0.02),
                  margin: EdgeInsets.only(bottom: screenHeight * 0.02),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade300),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: DropdownButton<String>(
                    value: selectedDeviceId,
                    isExpanded: true,
                    hint: Text('Select Device'),
                    dropdownColor: Colors.white,
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: screenWidth * 0.04,
                    ),
                    items: deviceIds.map((deviceId) {
                      return DropdownMenuItem<String>(
                        value: deviceId,
                        child: Container(
                          padding: EdgeInsets.symmetric(vertical: screenHeight * 0.01),
                          child: Text(
                            'Device: $deviceId',
                            style: TextStyle(
                              color: Colors.black87,
                              fontSize: screenWidth * 0.04,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          selectedDeviceId = value;
                        });
                        telemetryController.fetchTelemetry(value);
                      }
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
                      fontSize: screenWidth * 0.06,
                    ),
                  ),
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
    final isSmallScreen = screenWidth < 600;

    return SingleChildScrollView(
      padding: EdgeInsets.all(screenWidth * 0.05),
      child: Shimmer.fromColors(
        baseColor: Colors.white,
        highlightColor: Colors.grey.shade200,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              height: screenHeight * 0.15,
              margin: EdgeInsets.only(bottom: screenHeight * 0.03),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            Container(
              width: screenWidth * 0.5,
              height: screenHeight * 0.035,
              margin: EdgeInsets.symmetric(vertical: screenHeight * 0.015),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            isSmallScreen
                ? Column(
                    children: List.generate(3, (_) {
                      return Container(
                        width: double.infinity,
                        height: screenHeight * 0.12,
                        margin: EdgeInsets.symmetric(
                            horizontal: screenWidth * 0.015,
                            vertical: screenHeight * 0.01),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                        ),
                      );
                    }),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: List.generate(3, (_) {
                      return Expanded(
                        child: Container(
                          height: screenHeight * 0.12,
                          margin: EdgeInsets.symmetric(
                              horizontal: screenWidth * 0.015),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      );
                    }),
                  ),
            SizedBox(height: screenHeight * 0.04),
            ...List.generate(3, (_) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: screenWidth * 0.4,
                    height: screenHeight * 0.025,
                    margin: EdgeInsets.only(bottom: screenHeight * 0.02),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    height: screenHeight * 0.3,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  SizedBox(height: screenHeight * 0.04),
                ],
              );
            }),
          ],
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
    final summaries = [
      {
        "title": "Total Water Used",
        "value": "${data.totalWaterUsed.toStringAsFixed(2)} L",
        "icon": Icons.water_drop,
        "color": Colors.blue.shade50,
      },
      {
        "title": "TDS In/Out",
        "value": "${data.tdsIn}/${data.tdsOut}",
        "icon": Icons.science,
        "color": Colors.green.shade50,
      },
   {
  "title": "Tank Level",
  "value": data.tankLevel,
  "icon": MdiIcons.barrel, // ✅ closest match to a water tank
"color": Colors.orange.shade50,},


    ];

    // Build a single card widget
    Widget buildCard(Map<String, dynamic> summary, double cardWidth) {
      return Container(
        width: cardWidth,
        padding: EdgeInsets.symmetric(
          vertical: screenHeight * 0.02,
          horizontal: screenWidth * 0.03,
        ),
        decoration: BoxDecoration(
          color: summary["color"] as Color?,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              summary["icon"] as IconData,
              size: screenWidth * 0.06,
              color: Colors.black87,
            ),
            SizedBox(height: screenHeight * 0.01),
            Text(
              summary["value"].toString(),
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.black87,
                fontSize: screenWidth * 0.045,
              ),
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
            ),
            SizedBox(height: screenHeight * 0.007),
            Text(
              summary["title"].toString(),
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.black54,
                fontSize: screenWidth * 0.03,
              ),
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      );
    }

    // Calculate the width for the cards in the first row
// Minimum width for each card
    final int cardsPerRowFirstRow = 2; // Fixed to 2 columns in the first row
    final double firstRowCardWidth = (screenWidth - (screenWidth * 0.09)) /
        cardsPerRowFirstRow; // Adjusted for padding and spacing

    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: screenWidth * 0.03,
        vertical: screenHeight * 0.015,
      ),
      child: Column(
        children: [
          // First Row: 2 columns
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: buildCard(summaries[0], firstRowCardWidth),
              ),
              SizedBox(
                  width: screenWidth * 0.03), // Spacing between the two cards
              Expanded(
                child: buildCard(summaries[1], firstRowCardWidth),
              ),
            ],
          ),
          SizedBox(
              height: screenHeight * 0.015), // Vertical spacing between rows
          // Second Row: 1 column spanning the width of the first row
          buildCard(summaries[2],
              screenWidth - (screenWidth * 0.06)), // Adjusted for padding
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
    bool isBarChart;

    switch (selectedPeriod) {
      case 'daily':
        data = telemetryData.data!.waterUsage.daily.records
            .map((record) => {'date': record.date, 'total': record.totalWaterUsed})
            .toList();
        title = "📅 Daily Usage";
        color = Colors.blue.shade600;
        isBarChart = true;
        break;
      case 'weekly':
        data = telemetryData.data!.waterUsage.weekly.records
            .map((record) => {'date': record.date, 'total': record.totalWaterUsed})
            .toList();
        title = "📈 Weekly Usage";
        color = Colors.green.shade600;
        isBarChart = true; // Changed to bar chart
        break;
      case 'monthly':
        data = telemetryData.data!.waterUsage.monthly.records
            .map((record) => {'date': record.date, 'total': record.totalWaterUsed})
            .toList();
        title = "📊 Monthly Usage";
        color = Colors.orange.shade600;
        isBarChart = true; // Changed to bar chart
        break;
      case 'yearly':
        data = telemetryData.data!.waterUsage.yearly.records
            .map((record) => {'date': record.date, 'total': record.totalWaterUsed})
            .toList();
        title = "📈 Yearly Usage";
        color = Colors.purple.shade600;
        isBarChart = true; // Changed to bar chart
        break;
      default:
        data = [];
        title = "Usage Data";
        color = Colors.blue.shade600;
        isBarChart = true;
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
              height: screenHeight * 0.3,
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
              height: screenHeight * 0.3,
              child: isBarChart
                  ? _buildBarChart(data, "date", "total", color, screenWidth)
                  : _buildLineChart(data, "date", "total", color, screenWidth),
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
              reservedSize: screenWidth * 0.08,
              interval: 50,
              getTitlesWidget: (value, _) => Text(
                value.toInt().toString(),
                style: TextStyle(fontSize: screenWidth * 0.025),
              ),
            ),
          ),
          topTitles: const AxisTitles(),
          rightTitles: const AxisTitles(),
        ),
        gridData: FlGridData(show: true, drawVerticalLine: false),
      ),
    );
  }

  Widget _buildLineChart(List data, String labelKey, String valueKey,
      Color color, double screenWidth) {
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
              show: true,
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
              reservedSize: screenWidth * 0.08,
              interval: 50,
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
        gridData: FlGridData(show: true, drawVerticalLine: false),
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
