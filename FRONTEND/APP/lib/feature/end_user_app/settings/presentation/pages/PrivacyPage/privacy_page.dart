import 'package:flutter/material.dart';

class PrivacyPage extends StatelessWidget {
  const PrivacyPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Account & Privacy',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: Padding(
        padding: EdgeInsets.all(screenWidth * 0.04),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Terms & Conditions Section
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: EdgeInsets.all(screenWidth * 0.04),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Terms & Conditions',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.secondary,
                        ),
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '1. App Usage:',
                        content:
                            '• The IonHive Water Purifier App provides a platform to locate water purifier stations, schedule maintenance, and order purified water.\n'
                            '• Payment for services is facilitated through Razorpay, our integrated payment gateway.\n'
                            '• By using the App, users agree to comply with these terms and any local water purification regulations.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '2. Account Requirements:',
                        content:
                            '• Users must sign in using a valid email address.\n'
                            '• An OTP (One-Time Password) will be sent to the provided email for verification.\n'
                            '• Upon successful verification, users will be granted access to the application.\n'
                            '• Users are responsible for keeping their email account secure to prevent unauthorized access.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '3. Payments:',
                        content:
                            '• All payments for water purifier services and water orders are securely processed via Razorpay.\n'
                            '• We do not store any sensitive payment data like credit card or UPI information.\n'
                            '• Razorpay’s terms govern all payment-related activities and disputes.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '4. Permissions:',
                        content: '• The App may require access to:\n'
                            '  - Location services (for finding nearby water purifier stations via Google Maps).\n'
                            '  - Camera (to scan QR codes for service requests or water orders).\n'
                            '• We do not collect or store location data.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '5. App Updates & Termination:',
                        content:
                            '• The App may be updated to improve functionality or fix bugs.\n'
                            '• Users are responsible for keeping the App updated.\n'
                            '• We may discontinue the App at any time without notice.\n'
                            '• Upon termination, usage rights and licenses will be revoked.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '6. Third-party Services & Disclaimers:',
                        content:
                            '• Some features rely on third-party services (e.g., Razorpay, Google Maps).\n'
                            '• We are not liable for losses caused by these services.\n'
                            '• Users must ensure their devices are functional for scheduling and receiving water purifier services.',
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: screenHeight * 0.03),

              // Privacy Policy Section
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: EdgeInsets.all(screenWidth * 0.04),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Privacy Policy',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.secondary,
                        ),
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '1. Personal Information:',
                        content:
                            '• We collect your email address for account access and verification.\n'
                            '• An OTP is sent to your email to ensure secure authentication.\n'
                            '• No passwords are stored, as access is verified through OTP only.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '2. Payment Data:',
                        content:
                            '• We do not store or process sensitive payment data.\n'
                            '• All payments for water purifier services are handled securely by Razorpay.\n'
                            '• Users are subject to Razorpay\'s privacy policy.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '3. Location Data:',
                        content:
                            '• We do not collect or retain location data.\n'
                            '• Google Maps API is used solely to help locate nearby water purifier stations.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '4. Communication & Notifications:',
                        content:
                            '• Your contact info is used only for essential communication, such as service confirmations and water delivery updates.\n'
                            '• We do not send promotional messages.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '5. Data Protection:',
                        content:
                            '• We apply reasonable security practices to protect your data.\n'
                            '• Access to personal data is restricted to authorized personnel.\n'
                            '• Jailbreaking/rooting your device may compromise app functionality and security.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '6. Data Retention & Deletion:',
                        content:
                            '• Your data is retained as long as your account is active.\n'
                            '• You may request data deletion by contacting support.\n'
                            '• Upon deletion, all personal information will be permanently removed.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '7. User Rights:',
                        content:
                            '• You have the right to access, update, or delete your account information.\n'
                            '• For assistance, contact: support@IonHive.com',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '8. Updates to Privacy Policy:',
                        content: '• We may update this policy occasionally.\n'
                            '• Continued use of the App indicates acceptance of changes.',
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: screenHeight * 0.03),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection({
    required ThemeData theme,
    required String title,
    required String content,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.secondary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          content,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: Colors.black,
          ),
        ),
      ],
    );
  }
}
