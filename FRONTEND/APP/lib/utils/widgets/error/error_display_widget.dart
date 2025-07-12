import 'package:flutter/material.dart';

class ErrorDisplayWidget extends StatelessWidget {
  final String errorMessage;
  final VoidCallback onRetry;
  final String? assetPath;

  const ErrorDisplayWidget({
    super.key,
    required this.errorMessage,
    required this.onRetry,
    this.assetPath = 'assets/icons/server_issue1.png',
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.1),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              assetPath!,
              width: screenWidth * 0.35,
              height: screenWidth * 0.35,
            ),
            SizedBox(height: screenHeight * 0.03),
            Text(
              "Oops! Something went wrong.",
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: screenWidth * 0.045,
                color: Colors.red.shade700,
              ),
            ),
            SizedBox(height: screenHeight * 0.015),
            Text(
              "Please try again later.",
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.black54,
                fontSize: screenWidth * 0.04,
              ),
            ),
            SizedBox(height: screenHeight * 0.02),
            Container(
              padding: EdgeInsets.all(screenWidth * 0.035),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.shade100),
                boxShadow: [
                  BoxShadow(
                    color: Colors.red.shade100.withOpacity(0.5),
                    blurRadius: 5,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                children: [
                  SizedBox(height: screenHeight * 0.01),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(screenWidth * 0.03),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade100),
                    ),
                    child: Text(
                      errorMessage,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.red.shade700,
                        fontSize: screenWidth * 0.035,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: screenHeight * 0.03),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: Icon(Icons.refresh,
                  color: Colors.white, size: screenWidth * 0.05),
              label: Text(
                "Retry",
                style: TextStyle(
                  fontSize: screenWidth * 0.04,
                  fontWeight: FontWeight.bold,
                ),
              ),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(
                    vertical: screenHeight * 0.018,
                    horizontal: screenWidth * 0.08),
                backgroundColor: theme.colorScheme.primary,
                foregroundColor: Colors.white,
                elevation: 3,
                shadowColor: theme.colorScheme.primary.withOpacity(0.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DisplayWidget extends StatelessWidget {
  final String errorMessage;
  final String? assetPath;

  const DisplayWidget({
    super.key,
    required this.errorMessage,
    this.assetPath = 'assets/icons/server_issue1.png',
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.1),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              assetPath!,
              width: screenWidth * 0.35,
              height: screenWidth * 0.35,
            ),
            SizedBox(height: screenHeight * 0.03),
            Text(
              errorMessage,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: screenWidth * 0.045,
                color: Colors.red.shade700,
              ),
            ),
            SizedBox(height: screenHeight * 0.015),
            // Text(
            //   "Please try again later.",
            //   textAlign: TextAlign.center,
            //   style: theme.textTheme.bodyMedium?.copyWith(
            //     color: Colors.black54,
            //     fontSize: screenWidth * 0.04,
            //   ),
            // ),
            // SizedBox(height: screenHeight * 0.02),
            // Container(
            //   padding: EdgeInsets.all(screenWidth * 0.035),
            //   decoration: BoxDecoration(
            //     color: Colors.red.shade50,
            //     borderRadius: BorderRadius.circular(12),
            //     border: Border.all(color: Colors.red.shade100),
            //   ),
            //   child: Row(
            //     children: [
            //       Icon(Icons.info_outline,
            //           color: Colors.red, size: screenWidth * 0.05),
            //       SizedBox(width: screenWidth * 0.03),
            //       Expanded(
            //         child: Text(
            //           errorMessage,
            //           style: theme.textTheme.bodySmall?.copyWith(
            //             color: Colors.red.shade700,
            //             fontSize: screenWidth * 0.035,
            //           ),
            //         ),
            //       ),
            //     ],
            //   ),
            // ),
          ],
        ),
      ),
    );
  }
}

class DisplayWidgetForTechnician extends StatelessWidget {
  final String errorMessage;
  final String? assetPath;

  const DisplayWidgetForTechnician({
    super.key,
    required this.errorMessage,
    this.assetPath = 'assets/icons/server_issue1.png',
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.1),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              assetPath!,
              width: screenWidth * 0.35,
              height: screenWidth * 0.35,
            ),
            SizedBox(height: screenHeight * 0.03),
            Text(
              errorMessage,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: screenWidth * 0.045,
                color: Colors.red.shade700,
              ),
            ),

            // SizedBox(height: screenHeight * 0.02),
            // Container(
            //   padding: EdgeInsets.all(screenWidth * 0.035),
            //   decoration: BoxDecoration(
            //     color: Colors.red.shade50,
            //     borderRadius: BorderRadius.circular(12),
            //     border: Border.all(color: Colors.red.shade100),
            //   ),
            //   child: Row(
            //     children: [
            //       Icon(Icons.info_outline,
            //           color: Colors.red, size: screenWidth * 0.05),
            //       SizedBox(width: screenWidth * 0.03),
            //       Expanded(
            //         child: Text(
            //           errorMessage,
            //           style: theme.textTheme.bodySmall?.copyWith(
            //             color: Colors.red.shade700,
            //             fontSize: screenWidth * 0.035,
            //           ),
            //         ),
            //       ),
            //     ],
            //   ),
            // ),
          ],
        ),
      ),
    );
  }
}
