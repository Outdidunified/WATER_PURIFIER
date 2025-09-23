import 'package:aquapulse_app/feature/end_user_app/analytics/domain/models/analytics_model.dart';
import 'package:aquapulse_app/feature/end_user_app/analytics/presentation/controllers/analytics_controller.dart';
import 'package:aquapulse_app/utils/widgets/error/error_display_widget.dart';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';

class AnalyticsPage extends StatefulWidget {
  const AnalyticsPage({super.key});

  @override
  _AnalyticsPageState createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  final AnalyticsController controller =
      Get.put(AnalyticsController(), permanent: true);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.fetchAnalytics();
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
          if (controller.isLoading.value) {
            return _buildShimmerLoading(theme, screenWidth, screenHeight);
          }

          if (controller.errorMessage.value.isNotEmpty &&
              controller.errorMessage.value !=
                  '🔍 Resource not found. The requested information is unavailable.') {
            return Center(
                child: ErrorDisplayWidget(
              errorMessage: controller.errorMessage.value,
              onRetry: () {
                controller.fetchAnalytics();
              },
            ));
          }
          final analyticsData = controller.analyticsResponse.value;
          if (analyticsData == null ||
              analyticsData.error ||
              analyticsData.data == null) {
            return Center(
                child: DisplayWidget(
              errorMessage: "No analytics data available.",
              assetPath:
                  'assets/icons/analysis_not_found.png', // Optional: Use a custom icon if available
            ));
          }
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
                        'Track your water consumption, bottles saved, and environmental impact over time.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.white70,
                          height: 1.3,
                          fontSize: screenWidth * 0.035,
                        ),
                      ),
                    ],
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
                _buildDashboardHeader(
                    theme, analyticsData.data!, screenWidth, screenHeight),
                SizedBox(height: screenHeight * 0.04),
                _buildChartCard(
                  title: "📅 Daily Usage",
                  data: analyticsData.data!.daily,
                  labelKey: "date",
                  valueKey: "total",
                  isBarChart: true,
                  color: Colors.blue.shade600,
                  screenWidth: screenWidth,
                  screenHeight: screenHeight,
                ),
                SizedBox(height: screenHeight * 0.04),
                _buildChartCard(
                  title: "📈 Weekly Usage",
                  data: analyticsData.data!.weekly,
                  labelKey: "week",
                  valueKey: "total",
                  isBarChart: false,
                  color: Colors.green.shade600,
                  screenWidth: screenWidth,
                  screenHeight: screenHeight,
                ),
                SizedBox(height: screenHeight * 0.04),
                _buildChartCard(
                  title: "📊 Monthly Usage",
                  data: analyticsData.data!.monthly,
                  labelKey: "month",
                  valueKey: "total",
                  isBarChart: true,
                  color: Colors.orange.shade600,
                  screenWidth: screenWidth,
                  screenHeight: screenHeight,
                ),
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
        baseColor: Colors.grey.shade300,
        highlightColor: Colors.grey.shade100,
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

  Widget _buildDashboardHeader(ThemeData theme, AnalyticsData analyticsData,
      double screenWidth, double screenHeight) {
    final summaries = [
      {
        "title": "Water Used",
        "value": "${analyticsData.totalWaterConsumed} L",
        "icon": Icons.water_drop,
        "color": Colors.blue.shade50,
      },
      {
        "title": "Bottles Saved",
        "value": "${analyticsData.plasticBottlesSaved}",
        "icon": Icons.local_drink,
        "color": Colors.green.shade50,
      },
      {
        "title": "CO₂ Saved",
        "value": "${analyticsData.carbonFootprintSavedKg} kg",
        "icon": Icons.eco,
        "color": Colors.brown.shade50,
      },
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
          double value;

          if (item is DailyData) {
            value = item.total.toDouble();
          } else if (item is WeeklyData) {
            value = item.total.toDouble();
          } else if (item is MonthlyData) {
            value = item.total.toDouble();
          } else {
            value = 0;
          }

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
                  String label;
                  if (data[index] is DailyData) {
                    label = (data[index] as DailyData).date.split('/')[0];
                  } else if (data[index] is WeeklyData) {
                    label = (data[index] as WeeklyData).week.split('-W')[1];
                  } else if (data[index] is MonthlyData) {
                    label = (data[index] as MonthlyData).month.split('/')[0];
                  } else {
                    label = '';
                  }
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
              double value;

              if (item is DailyData) {
                value = item.total.toDouble();
              } else if (item is WeeklyData) {
                value = item.total.toDouble();
              } else if (item is MonthlyData) {
                value = item.total.toDouble();
              } else {
                value = 0;
              }

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
                  String label;
                  if (data[index] is DailyData) {
                    label = (data[index] as DailyData).date.split('/')[0];
                  } else if (data[index] is WeeklyData) {
                    label = (data[index] as WeeklyData).week.split('-W')[1];
                  } else if (data[index] is MonthlyData) {
                    label = (data[index] as MonthlyData).month.split('/')[0];
                  } else {
                    label = '';
                  }
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
