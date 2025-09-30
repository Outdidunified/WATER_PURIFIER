// feature/technician_app/settings/presentation/pages/privacy_page.dart
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
                            '• The IonHive Water Purifier Technician App is designed for technicians to manage installation, maintenance, and repair tasks for water purifiers.\n'
                            '• Technicians must adhere to company protocols and safety standards during service operations.\n'
                            '• Use of the app is restricted to authorized personnel only.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '2. Account Requirements:',
                        content:
                            '• Technicians must sign in using a valid email address provided by the employer.\n'
                            '• An OTP (One-Time Password) will be sent to the registered email for verification.\n'
                            '• Technicians are responsible for maintaining the security of their login credentials.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '3. Service Responsibilities:',
                        content:
                            '• Technicians are required to complete assigned tasks (e.g., installations, repairs) and submit accurate service reports.\n'
                            '• All work must comply with manufacturer guidelines and local regulations.\n'
                            '• Failure to meet service standards may result in account suspension.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '4. Permissions:',
                        content: '• The App may require access to:\n'
                            '  - Location services (to navigate to service locations).\n'
                            '  - Camera (to scan device QR codes or document repairs).\n'
                            '• Location and camera data are not stored or shared.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '5. App Updates & Termination:',
                        content:
                            '• The App may be updated to enhance functionality or address technical issues.\n'
                            '• Technicians must keep the app updated to access the latest features.\n'
                            '• The company reserves the right to terminate access without notice for policy violations.\n'
                            '• Upon termination, all usage rights will be revoked.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '6. Third-party Services & Disclaimers:',
                        content:
                            '• Some features may rely on third-party tools (e.g., Google Maps for navigation).\n'
                            '• The company is not liable for issues arising from third-party services.\n'
                            '• Technicians must ensure their devices are suitable for field operations.',
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
                            '• An OTP is sent to your email for secure authentication.\n'
                            '• No additional personal data is stored beyond what is required for employment.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '2. Service Data:',
                        content:
                            '• Data related to tasks and service reports is collected to track performance.\n'
                            '• This data is accessible only to authorized company personnel.\n'
                            '• No sensitive payment or financial data is processed.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '3. Location Data:',
                        content:
                            '• Location data may be used temporarily for navigation to service sites.\n'
                            '• This data is not stored or shared with third parties.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '4. Communication & Notifications:',
                        content:
                            '• Your email is used for task assignments, updates, and essential communications.\n'
                            '• No promotional or unsolicited messages will be sent.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '5. Data Protection:',
                        content:
                            '• We implement security measures to protect your data.\n'
                            '• Access to technician data is limited to authorized staff.\n'
                            '• Compromised devices (e.g., rooted/jailbroken) may affect app security.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '6. Data Retention & Deletion:',
                        content:
                            '• Your data is retained during your employment period.\n'
                            '• You may request data deletion by contacting support upon termination.\n'
                            '• All personal data will be removed upon deletion request.',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '7. User Rights:',
                        content:
                            '• You have the right to review, update, or request deletion of your account data.\n'
                            '• For assistance, contact: support@IonHive.com',
                      ),
                      SizedBox(height: screenHeight * 0.02),
                      _buildSection(
                        theme: theme,
                        title: '8. Updates to Privacy Policy:',
                        content: '• This policy may be updated periodically.\n'
                            '• Continued use of the app signifies acceptance of any changes.',
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
