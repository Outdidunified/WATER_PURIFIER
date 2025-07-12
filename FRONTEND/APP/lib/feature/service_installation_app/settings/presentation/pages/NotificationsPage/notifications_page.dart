import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart'; // For checking notification permission

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  bool isNotificationPermissionGranted = false;

  @override
  void initState() {
    super.initState();
    _checkNotificationPermission();
  }

  // Check notification permission status
  Future<void> _checkNotificationPermission() async {
    final status = await Permission.notification.status;
    setState(() {
      isNotificationPermissionGranted = status.isGranted;
    });
  }

  // Handle toggle change for push notifications
  Future<void> _handleNotificationToggle(bool value) async {
    if (value) {
      // Request permission to enable notifications
      final status = await Permission.notification.request();
      if (status.isGranted) {
        setState(() {
          isNotificationPermissionGranted = true;
        });
      } else if (status.isDenied) {
        // Show a dialog to inform the user and offer to open settings
        _showPermissionDeniedDialog();
      } else if (status.isPermanentlyDenied) {
        // Open settings directly if permanently denied
        await _openAppSettingsWithFeedback();
      }
    } else {
      // Disable notifications by opening settings (user can turn off manually)
      await _openAppSettingsWithFeedback();
      await _checkNotificationPermission(); // Re-check after settings change
    }
  }

  // Show dialog when permission is denied
  Future<void> _showPermissionDeniedDialog() async {
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white, // Set white background
        title: const Text('Permission Required'),
        content: const Text(
          'Notifications are disabled. Please enable them in settings to receive updates.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await _openAppSettingsWithFeedback();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  // Open app settings with feedback
  Future<void> _openAppSettingsWithFeedback() async {
    final opened = await openAppSettings();
    if (!opened) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to open settings.')),
      );
    }
    await _checkNotificationPermission(); // Update state after settings change
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(screenWidth * 0.05),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text(
              'Notification Settings',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.blue.shade800,
                fontSize: screenWidth * 0.06,
              ),
            ),
            SizedBox(height: screenHeight * 0.02),
            // Description
            Text(
              'Manage how you receive notifications from the app.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.black54,
                fontSize: screenWidth * 0.04,
              ),
            ),
            SizedBox(height: screenHeight * 0.03),
            // Notification Settings Card
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(screenWidth * 0.05),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.shade200,
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Push Notifications
                  Column(
                    children: [
                      _buildNotificationSetting(
                        theme: theme,
                        screenWidth: screenWidth,
                        title: 'Push Notifications',
                        subtitle:
                            'Receive notifications directly on your device.',
                        value: isNotificationPermissionGranted,
                        onChanged: _handleNotificationToggle,
                        isDisabled: false,
                      ),
                      if (!isNotificationPermissionGranted) ...[
                        SizedBox(height: screenHeight * 0.01),
                        GestureDetector(
                          onTap: () async {
                            await _handleNotificationToggle(true);
                          },
                          child: Text(
                            'Push notifications are disabled. Tap to enable in settings.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.red.shade600,
                              fontSize: screenWidth * 0.035,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  _buildDashedDivider(
                    color: theme.colorScheme.primary.withOpacity(0.3),
                    thickness: 1.5,
                    dashWidth: 5.0,
                    dashSpace: 3.0,
                    padding: const EdgeInsets.symmetric(vertical: 10.0),
                  ),
                  // WhatsApp Notifications with Coming Soon Banner
                  Stack(
                    children: [
                      _buildNotificationSetting(
                        theme: theme,
                        screenWidth: screenWidth,
                        title: 'WhatsApp Notifications',
                        subtitle: 'Receive notifications via WhatsApp.',
                        value: false,
                        onChanged: null,
                        isDisabled: true,
                      ),
                      Positioned(
                        top: 0,
                        right: 0,
                        child: _buildComingSoonBanner(
                          theme: theme,
                          screenWidth: screenWidth,
                          backgroundColor: Colors.orangeAccent,
                        ),
                      ),
                    ],
                  ),
                  _buildDashedDivider(
                    color: theme.colorScheme.primary.withOpacity(0.3),
                    thickness: 1.5,
                    dashWidth: 5.0,
                    dashSpace: 3.0,
                    padding: const EdgeInsets.symmetric(vertical: 10.0),
                  ),
                  // SMS Notifications with Coming Soon Banner
                  Stack(
                    children: [
                      _buildNotificationSetting(
                        theme: theme,
                        screenWidth: screenWidth,
                        title: 'SMS Notifications',
                        subtitle: 'Receive notifications via SMS.',
                        value: false,
                        onChanged: null,
                        isDisabled: true,
                      ),
                      Positioned(
                        top: 0,
                        right: 0,
                        child: _buildComingSoonBanner(
                          theme: theme,
                          screenWidth: screenWidth,
                          backgroundColor: Colors.orangeAccent,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationSetting({
    required ThemeData theme,
    required double screenWidth,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool>? onChanged,
    required bool isDisabled,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: screenWidth * 0.045,
                  color: isDisabled ? Colors.grey : null,
                ),
              ),
              SizedBox(height: 4),
              Text(
                subtitle,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDisabled ? Colors.grey : Colors.black54,
                  fontSize: screenWidth * 0.035,
                ),
              ),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: isDisabled ? null : onChanged,
          activeColor: theme.colorScheme.primary,
          inactiveThumbColor: Colors.grey,
          inactiveTrackColor: Colors.grey.shade300,
        ),
      ],
    );
  }

  Widget _buildComingSoonBanner({
    required ThemeData theme,
    required double screenWidth,
    required Color backgroundColor,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: screenWidth * 0.02,
        vertical: screenWidth * 0.005,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        'Coming Soon',
        style: TextStyle(
          color: Colors.white,
          fontSize: screenWidth * 0.03,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildDashedDivider({
    required Color color,
    required double thickness,
    required double dashWidth,
    required double dashSpace,
    required EdgeInsets padding,
  }) {
    return Padding(
      padding: padding,
      child: CustomPaint(
        painter: DashedLinePainter(
          color: color,
          strokeWidth: thickness,
          dashWidth: dashWidth,
          dashSpace: dashSpace,
        ),
        child: const SizedBox(
          height: 1,
          width: double.infinity,
        ),
      ),
    );
  }
}

class DashedLinePainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double dashWidth;
  final double dashSpace;

  DashedLinePainter({
    required this.color,
    required this.strokeWidth,
    required this.dashWidth,
    required this.dashSpace,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    double startX = 0;
    final y = size.height / 2;

    while (startX < size.width) {
      canvas.drawLine(
        Offset(startX, y),
        Offset(startX + dashWidth, y),
        paint,
      );
      startX += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
