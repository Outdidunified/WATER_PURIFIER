import 'package:flutter/material.dart';
// For SystemChrome
import 'package:webview_flutter/webview_flutter.dart';

class WebViewScreen extends StatefulWidget {
  final WebViewController controller;

  const WebViewScreen({super.key, required this.controller});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  // Hardcoded values for demonstration (replace with actual logic)
  final bool isLoading = false;
  final Map<String, bool> deviceData = {
    'wifi': true,
    'bluetooth': true,
  };

  Future<bool> _handleBackNavigation() async {
    // Check if the WebView can go back
    if (await widget.controller.canGoBack()) {
      widget.controller.goBack();
      return false; // Prevent screen from popping
    }
    return true; // Allow screen to pop
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return WillPopScope(
      onWillPop: _handleBackNavigation, // Handle system back button
      child: Scaffold(
        body: Column(
          children: [
            // Space above the Container
            const SizedBox(height: 23),
            // Custom header Container
            Container(
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
                  // Back button
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_back,
                      color: Color.fromARGB(255, 15, 49, 150),
                    ),
                    onPressed: () {
                      Navigator.pop(context); // Navigate back
                    },
                  ),
                  // Logo
                  Image.asset(
                    'assets/Image/aquapulse_logo.png',
                    width: MediaQuery.of(context).size.width * 0.07,
                    height: 40,
                    fit: BoxFit.contain,
                  ),
                  const SizedBox(width: 4),
                  // Title
                  Text(
                    "IonHive",
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: MediaQuery.of(context).size.width * 0.04,
                    ),
                  ),
                  const Spacer(),
                  // Wi-Fi Icon
                  Icon(
                    Icons.wifi,
                    color: !isLoading && (deviceData['wifi'] ?? false)
                        ? Colors.green
                        : Colors.grey,
                    size: MediaQuery.of(context).size.width * 0.06,
                  ),
                  SizedBox(width: MediaQuery.of(context).size.width * 0.02),
                  // Bluetooth Icon
                  Icon(
                    Icons.bluetooth,
                    color: !isLoading && (deviceData['bluetooth'] ?? false)
                        ? Colors.blue
                        : Colors.grey,
                    size: MediaQuery.of(context).size.width * 0.06,
                  ),
                  SizedBox(width: MediaQuery.of(context).size.width * 0.02),
                  // Notifications Icon
                  Icon(
                    Icons.notifications_none,
                    color: Colors.black,
                    size: MediaQuery.of(context).size.width * 0.06,
                  ),
                ],
              ),
            ),
            // Space below the Container
            const SizedBox(height: 8),
            // WebView takes up the remaining space
            Expanded(
              child: WebViewWidget(
                controller: widget.controller,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
