import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutAppPage extends StatelessWidget {
  const AboutAppPage({super.key});

  // YouTube video URL and thumbnail
  static const String youtubeUrl =
      'https://youtu.be/BoHqbGw9W8I?si=l40FAFe9ALfCwXzG';
  static const String videoId = 'BoHqbGw9W8I';
  static const String thumbnailUrl =
      'https://img.youtube.com/vi/$videoId/hqdefault.jpg';

  // Function to launch the YouTube video
  Future<void> _launchYouTubeVideo() async {
    final Uri url = Uri.parse(youtubeUrl);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      throw 'Could not launch $youtubeUrl';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'About App',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: theme.colorScheme.primary,
        foregroundColor: theme.colorScheme.onPrimary,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Colors.white,
              Colors.white,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.all(screenWidth * 0.04),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // App Description
                Text(
                  'IonHive Water Purifier App',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.secondary,
                  ),
                ),
                SizedBox(height: screenHeight * 0.01),
                Text(
                  'The IonHive Water Purifier App empowers you to ensure clean and safe drinking water with ease. Key features include:\n'
                  '• Secure Login: Access the app using your username and password.\n'
                  '• Home Dashboard: View subscription details, modify plans, and monitor device status (TDS, UV, etc.) with indicators (Normal, Good, Bad).\n'
                  '• Analytics: Track usage (Daily, Monthly, Yearly) and environmental impact, including Plastic Bottles Saved and Carbon Footprint Reduction.\n'
                  '• Shop: Browse and purchase water purifier models through our online store.\n'
                  '• Settings: Update user details, manage notifications, delete your account, or log out.\n'
                  'Our goal is to promote sustainability and provide access to pure water for every household.',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.black87,
                    height: 1.5,
                  ),
                ),
                SizedBox(height: screenHeight * 0.03),

                // Video Frame with YouTube Thumbnail
                GestureDetector(
                  onTap: _launchYouTubeVideo,
                  child: Container(
                    width: double.infinity,
                    height: screenHeight * 0.25,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Video Thumbnail
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            thumbnailUrl,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const Center(
                                child: CircularProgressIndicator(),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: Colors.grey[300],
                                child: const Center(
                                  child: Icon(
                                    Icons.broken_image,
                                    size: 50,
                                    color: Colors.grey,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        // Gradient Overlay
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            gradient: LinearGradient(
                              colors: [
                                Colors.black.withOpacity(0.4),
                                Colors.transparent,
                              ],
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                            ),
                          ),
                        ),
                        // Play Button
                        CircleAvatar(
                          radius: 35,
                          backgroundColor:
                              theme.colorScheme.primary.withOpacity(0.9),
                          child: const Icon(
                            Icons.play_arrow,
                            color: Colors.white,
                            size: 50,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: screenHeight * 0.03),

                // Horizontal ScrollView for Banners
                Text(
                  'Explore Features',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: theme.colorScheme.secondary,
                  ),
                ),
                SizedBox(height: screenHeight * 0.01),
                SizedBox(
                  height: screenHeight * 0.22,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _buildBanner(
                        context: context,
                        title: 'Track Usage Analytics',
                        subtitle: 'Monitor daily, monthly, yearly usage.',
                        icon: Icons.analytics,
                        gradientColors: [Colors.blue, Colors.blueAccent],
                      ),
                      SizedBox(width: screenWidth * 0.03),
                      _buildBanner(
                        context: context,
                        title: 'Monitor Device Status',
                        subtitle: 'Check TDS, UV status (Normal, Good, Bad).',
                        icon: Icons.device_thermostat,
                        gradientColors: [Colors.green, Colors.greenAccent],
                      ),
                      SizedBox(width: screenWidth * 0.03),
                      _buildBanner(
                        context: context,
                        title: 'Shop for Devices',
                        subtitle: 'Browse water purifier models.',
                        icon: Icons.store,
                        gradientColors: [Colors.orange, Colors.deepOrange],
                      ),
                      SizedBox(width: screenWidth * 0.03),
                      _buildBanner(
                        context: context,
                        title: 'Environmental Impact',
                        subtitle: 'Track bottles saved & carbon reduction.',
                        icon: Icons.eco,
                        gradientColors: [Colors.purple, Colors.purpleAccent],
                      ),
                    ],
                  ),
                ),
                SizedBox(height: screenHeight * 0.03),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBanner({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Color> gradientColors,
  }) {
    final screenWidth = MediaQuery.of(context).size.width;
    return Container(
      width: screenWidth * 0.5,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.all(screenWidth * 0.04),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 40,
              color: Colors.white,
            ),
            SizedBox(height: 8),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
            ),
            SizedBox(height: 4),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.white.withOpacity(0.9),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
